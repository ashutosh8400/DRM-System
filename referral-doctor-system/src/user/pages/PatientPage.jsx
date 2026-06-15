import React, { useState, useEffect } from 'react'
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import PatientForm from '../components/PatientForm'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const MOCK_PATIENTS = []

export default function PatientPage({ user }) {
  const { currentUser } = useAuth()
  const activeUser = user || currentUser
  const [patients, setPatients] = useState([])
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const routeBase = location.pathname.startsWith('/admin') ? '/admin' : '/user'

  const loadPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      const [patientsData, billsData] = await Promise.all([
        api.getPatients(),
        api.getBills()
      ])
      setPatients(Array.isArray(patientsData) ? patientsData : [])
      setBills(Array.isArray(billsData) ? billsData : [])
    } catch (err) {
      console.error('Failed to load patients:', err)
      setError('Failed to fetch patient records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  const getPaymentStatus = (patientId) => {
    const patientBills = bills.filter(b => b.patientId === patientId)
    if (patientBills.length === 0) return null
    
    const isPaidBill = (bill) => ['completed', 'Paid'].includes(bill.status || bill.paymentStatus)
    const getFinalAmount = (bill) => Number(bill.finalAmount || bill.total || 0)
    const paidBills = patientBills.filter(isPaidBill)
    const pendingBills = patientBills.filter(bill => !isPaidBill(bill))
    const paidAmount = patientBills.reduce((sum, bill) => sum + Number(bill.paidAmount || (isPaidBill(bill) ? getFinalAmount(bill) : 0)), 0)
    const pendingAmount = patientBills.reduce((sum, bill) => {
      if (isPaidBill(bill)) return sum
      const fallbackDue = Math.max(0, getFinalAmount(bill) - Number(bill.paidAmount || 0))
      return sum + Number(bill.dueAmount ?? fallbackDue)
    }, 0)
    
    return {
      total: patientBills.length,
      paid: paidBills.length,
      pending: pendingBills.length,
      paidAmount,
      pendingAmount,
    }
  }

  const showPaymentBreakup = (patient, status) => {
    alert(
      `Patient: ${patient.name}\n\n` +
      `Paid Bills: ${status.paid}\n` +
      `Pending Bills: ${status.pending}\n` +
      `Paid Amount: Rs. ${status.paidAmount.toLocaleString()}\n` +
      `Pending Amount: Rs. ${status.pendingAmount.toLocaleString()}`
    )
  }

  const filteredPatients = (Array.isArray(patients) ? patients : []).filter(pat =>
    (pat?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pat?.mobile || '').includes(searchTerm)
  )

  const handleAddPatient = async (formData) => {
    try {
      if (editingPatient) {
        const result = await api.updatePatient(editingPatient.id, formData)
        if (result && result.success) {
          setEditingPatient(null)
          setShowForm(false)
          window.dispatchEvent(new CustomEvent('app:data-changed'))
          loadPatients()
        } else {
          alert(result?.message || 'Failed to update patient')
        }
      } else {
        const result = await api.addPatient(formData)
        if (result && result.success) {
          setShowForm(false)
          window.dispatchEvent(new CustomEvent('app:data-changed'))
          loadPatients()
        } else {
          alert(result?.message || 'Failed to add patient')
        }
      }
    } catch (err) {
      console.error('Error saving patient:', err)
      alert(err.message || 'Error occurred while saving patient')
    }
  }

  const handleDeletePatient = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        const result = await api.deletePatient(id)
        if (result && result.success) {
          window.dispatchEvent(new CustomEvent('app:data-changed'))
          loadPatients()
        } else {
          alert(result?.message || 'Failed to delete patient')
        }
      } catch (err) {
        console.error('Error deleting patient:', err)
        alert(err.message || 'Error occurred while deleting patient')
      }
    }
  }

  const canEdit = ['super_admin', 'admin', 'user'].includes(activeUser?.role)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading patients...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="font-semibold mb-2">Error Loading Patients</p>
        <p>{error}</p>
        <button
          onClick={loadPatients}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patient Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track all patients in the system</p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditingPatient(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            <Plus size={20} />
            Add Patient
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search patients by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <PatientForm
          patient={editingPatient}
          onSave={handleAddPatient}
          onCancel={() => {
            setShowForm(false)
            setEditingPatient(null)
          }}
        />
      )}

      {/* Patients Table */}
      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-primary border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Mobile</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Age</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Gender</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Address</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Test</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => {
                const status = getPaymentStatus(patient.id)
                return (
                  <tr key={patient.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-primary/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{patient.name}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{patient.mobile}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{patient.age} years</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        patient.gender === 'Male' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                          : 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300'
                      }`}>
                        {patient.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">{patient.address || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{patient.test || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {patient.visitDate ? new Date(patient.visitDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">{patient.notes || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {status ? (
                        <div className="flex gap-1">
                          {status.paid > 0 && (
                            <button
                              type="button"
                              onClick={() => showPaymentBreakup(patient, status)}
                              className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded hover:ring-2 hover:ring-green-300"
                            >
                              Paid: {status.paid}
                            </button>
                          )}
                          {status.pending > 0 && (
                            <button
                              type="button"
                              onClick={() => showPaymentBreakup(patient, status)}
                              className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded hover:ring-2 hover:ring-yellow-300"
                            >
                              Pending: {status.pending}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No bills</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`${routeBase}/patients/${patient.id}`)}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition text-blue-600"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => {
                                setEditingPatient(patient)
                                setShowForm(true)
                              }}
                              className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition text-green-600"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeletePatient(patient.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No patients found</p>
          </div>
        )}
      </div>
    </div>
  )
}
