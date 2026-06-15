import React, { useEffect, useState } from 'react'
import { Edit2, Plus, Search, Trash2 } from 'lucide-react'
import ReferralForm from '../components/ReferralForm'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

export default function ReferralPage({ user }) {
  const { currentUser } = useAuth()
  const activeUser = user || currentUser
  const [referrals, setReferrals] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingReferral, setEditingReferral] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [refData, docData, patData, billData] = await Promise.all([
        api.getReferrals(),
        api.getDoctors(),
        api.getPatients(),
        api.getBills(),
      ])
      setReferrals(Array.isArray(refData) ? refData : [])
      setDoctors(Array.isArray(docData) ? docData : [])
      setPatients(Array.isArray(patData) ? patData : [])
      setBills(Array.isArray(billData) ? billData : [])
    } catch (err) {
      console.error('Failed to load referrals:', err)
      setError('Failed to fetch referrals, doctors, or patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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

  const showPaymentBreakup = (referral, status) => {
    alert(
      `Patient: ${referral.patientName || 'Unknown Patient'}\n` +
      `Doctor: ${referral.doctorName || 'Unknown Doctor'}\n\n` +
      `Paid Bills: ${status.paid}\n` +
      `Pending Bills: ${status.pending}\n` +
      `Paid Amount: Rs. ${status.paidAmount.toLocaleString()}\n` +
      `Pending Amount: Rs. ${status.pendingAmount.toLocaleString()}`
    )
  }

  const handleSaveReferral = async (formData) => {
    try {
      const result = editingReferral
        ? await api.updateReferral(editingReferral.id, formData)
        : await api.addReferral(formData)
      if (result?.success) {
        setShowForm(false)
        setEditingReferral(null)
        window.dispatchEvent(new CustomEvent('app:data-changed'))
        loadData()
      } else {
        alert(result?.message || 'Failed to save referral')
      }
    } catch (err) {
      console.error('Error saving referral:', err)
      alert(err.message || 'Error saving referral')
    }
  }

  const handleDeleteReferral = async (id) => {
    if (!window.confirm('Delete this referral? This cannot be undone.')) return
    try {
      const result = await api.deleteReferral(id)
      if (result?.success) {
        window.dispatchEvent(new CustomEvent('app:data-changed'))
        loadData()
      } else {
        alert(result?.message || 'Failed to delete referral')
      }
    } catch (err) {
      console.error('Error deleting referral:', err)
      alert(err.message || 'Error deleting referral')
    }
  }

  const canCreateReferral = ['super_admin', 'admin', 'user'].includes(activeUser?.role)
  const canDelete = ['super_admin', 'admin'].includes(activeUser?.role)

  const filteredReferrals = referrals.filter(r =>
    (r?.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r?.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r?.serviceType || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading referrals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="font-semibold mb-2">Error Loading Referrals</p>
        <p>{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Referral Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{referrals.length} total referrals</p>
        </div>
        {canCreateReferral && (
          <button
            id="btn-new-referral"
            onClick={() => {
              setEditingReferral(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            <Plus size={20} />
            New Referral
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by patient, doctor, or test..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-primary dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {showForm && (
        <ReferralForm
          doctors={doctors}
          patients={patients}
          referral={editingReferral}
          onSave={handleSaveReferral}
          onCancel={() => {
            setShowForm(false)
            setEditingReferral(null)
          }}
        />
      )}

      <div className="bg-white dark:bg-secondary rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-primary border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Patient</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Doctor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Test</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReferrals.map((referral) => {
                const displayDate = referral?.referralDate || referral?.date
                const dateString = displayDate && !Number.isNaN(new Date(displayDate).getTime())
                  ? new Date(displayDate).toLocaleDateString()
                  : 'N/A'

                return (
                  <tr key={referral.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-primary/50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {referral?.patientName || 'Unknown Patient'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {referral?.doctorName || 'Unknown Doctor'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm">
                        {referral?.serviceType || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">{dateString}</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const paymentStatus = getPaymentStatus(referral?.patientId)
                        if (!paymentStatus) return <span className="text-gray-400 text-sm">No bills</span>
                        return (
                          <div className="flex gap-1">
                            {paymentStatus.paid > 0 && (
                              <button
                                type="button"
                                onClick={() => showPaymentBreakup(referral, paymentStatus)}
                                className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded hover:ring-2 hover:ring-green-300"
                              >
                                Paid: {paymentStatus.paid}
                              </button>
                            )}
                            {paymentStatus.pending > 0 && (
                              <button
                                type="button"
                                onClick={() => showPaymentBreakup(referral, paymentStatus)}
                                className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded hover:ring-2 hover:ring-yellow-300"
                              >
                                Pending: {paymentStatus.pending}
                              </button>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate text-sm">
                      {referral?.notes || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingReferral(referral)
                            setShowForm(true)
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                          title="Edit referral"
                        >
                          <Edit2 size={16} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteReferral(referral.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Delete referral"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredReferrals.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No referrals found</p>
          </div>
        )}
      </div>
    </div>
  )
}
