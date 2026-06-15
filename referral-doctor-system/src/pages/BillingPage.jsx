import React, { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Eye } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import BillingForm from '../components/BillingForm'
import api from '../utils/api'

export default function BillingPage({ user }) {
  const location = useLocation()
  const routeBase = location.pathname.startsWith('/admin') ? '/admin' : '/user'
  const [bills, setBills] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [billsData, patientsData] = await Promise.all([
        api.getBills(),
        api.getPatients()
      ])
      setBills(Array.isArray(billsData) ? billsData : [])
      setPatients(Array.isArray(patientsData) ? patientsData : [])
    } catch (err) {
      console.error('Failed to load billing data:', err)
      setError('Failed to fetch billing or patient records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddBill = async (formData) => {
    try {
      const result = await api.addBill(formData)
      if (result && result.success) {
        setShowForm(false)
        loadData()
      } else {
        alert(result?.message || 'Failed to create bill')
      }
    } catch (err) {
      console.error('Error creating bill:', err)
      alert(err.message || 'Error occurred while creating bill')
    }
  }

  const filteredBills = (Array.isArray(bills) ? bills : []).filter(bill =>
    (bill?.patientName || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const canCreateBill = ['super_admin', 'admin', 'user'].includes(user?.role)

  const totalRevenue = filteredBills
    .filter(b => b.paymentStatus === 'completed' || b.status === 'Completed' || b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + (b.total || 0), 0)

  const pendingCount = filteredBills.filter(b => b.paymentStatus === 'pending' || b.status === 'Pending' || b.paymentStatus === 'Pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading billing data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="font-semibold mb-2">Error Loading Billing</p>
        <p>{error}</p>
        <button
          onClick={loadData}
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage patient invoices and payments</p>
        </div>
        {canCreateBill && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            <Plus size={20} />
            New Invoice
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Bills</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{filteredBills.length}</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600 mt-2">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Pending Payments</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{pendingCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <BillingForm
          patients={patients}
          onSave={handleAddBill}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Bills Table */}
      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-primary border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Patient</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Subtotal</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Discount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Mode</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => {
                const displayDate = bill?.billDate || bill?.date
                let dateString = 'N/A'
                if (displayDate) {
                  try {
                    const d = new Date(displayDate)
                    if (!isNaN(d.getTime())) {
                      dateString = d.toLocaleDateString()
                    }
                  } catch (e) {}
                }
                const displayStatus = bill?.paymentStatus || bill?.status || 'Pending'
                const displayMode = bill?.paymentMode || 'Cash'

                return (
                  <tr key={bill.id || Math.random()} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-primary/50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{bill?.patientName || 'Unknown Patient'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{dateString}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">₹{(bill?.subtotal || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">₹{(bill?.discount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">₹{(bill?.total || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{displayMode}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        displayStatus === 'completed' || displayStatus === 'Completed' || displayStatus === 'Paid'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`${routeBase}/billing/${bill.id}`}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-bold transition"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredBills.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No bills found</p>
          </div>
        )}
      </div>
    </div>
  )
}
