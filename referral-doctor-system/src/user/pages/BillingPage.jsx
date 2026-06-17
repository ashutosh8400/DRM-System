import React, { useEffect, useState } from 'react'
import { Edit2, Eye, Plus, Printer, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import BillingForm from '../components/BillingForm'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

export default function BillingPage({ user }) {
  const { currentUser } = useAuth()
  const activeUser = user || currentUser
  const location = useLocation()
  const routeBase = location.pathname.startsWith('/admin') ? '/admin' : '/user'
  const [bills, setBills] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [billsData, patientsData, doctorsData] = await Promise.all([
        api.getBills(),
        api.getPatients(),
        api.getDoctors(),
      ])
      setBills(Array.isArray(billsData) ? billsData : [])
      setPatients(Array.isArray(patientsData) ? patientsData : [])
      setDoctors(Array.isArray(doctorsData) ? doctorsData : [])
    } catch (err) {
      console.error('Failed to load billing data:', err)
      setError('Failed to fetch billing records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveBill = async (formData) => {
    try {
      const result = editingBill
        ? await api.updateBill(editingBill.id, formData)
        : await api.addBill(formData)
      if (result?.success) {
        setShowForm(false)
        setEditingBill(null)
        window.dispatchEvent(new CustomEvent('app:data-changed'))
        window.dispatchEvent(new CustomEvent('billing:changed'))
        loadData()
      } else {
        alert(result?.message || 'Failed to save bill')
      }
    } catch (err) {
      console.error('Error saving bill:', err)
      alert(err.message || 'Error occurred while saving bill')
    }
  }

  const getDisplayAmounts = (bill) => {
    const status = bill.status || bill.paymentStatus || 'Pending'
    const amount = Number(bill.amount || bill.subtotal || 0)
    const discount = Number(bill.discount || 0)
    const finalAmount = Number(bill.finalAmount || bill.total || Math.max(0, amount - discount))
    const savedPaidAmount = Number(bill.paidAmount || 0)
    const isPaid = ['Paid', 'completed'].includes(status) || savedPaidAmount >= finalAmount
    const paidAmount = isPaid ? finalAmount : savedPaidAmount
    const dueAmount = isPaid ? 0 : Number(bill.dueAmount ?? Math.max(0, finalAmount - paidAmount))
    return { amount, discount, finalAmount, paidAmount, dueAmount, status, isPaid }
  }

  const handlePrintBill = async (bill) => {
    const fullBill = await api.getBillById(bill.id)
    const display = getDisplayAmounts(fullBill)
    const popup = window.open('', '_blank', 'width=900,height=700')
    if (!popup) return
    popup.document.write(`
      <html>
        <head>
          <title>${fullBill.billNo || 'Bill'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { margin: 0 0 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            td, th { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Referral Doctor Management System</h1>
          <p>Bill No: ${fullBill.billNo || fullBill.id}</p>
          <p>Date: ${String(fullBill.billDate || '').slice(0, 10)}</p>
          <p>Patient: ${fullBill.patientName || ''}</p>
          <p>Referral Doctor: ${fullBill.referralDoctorName || 'N/A'}</p>
          <table>
            <tbody>
              <tr><th>Test</th><td>${fullBill.test || ''}</td></tr>
              <tr><th>Amount</th><td class="right">Rs. ${display.amount.toLocaleString()}</td></tr>
              <tr><th>Discount</th><td class="right">Rs. ${display.discount.toLocaleString()}</td></tr>
              <tr><th>Final Amount</th><td class="right">Rs. ${display.finalAmount.toLocaleString()}</td></tr>
              <tr><th>Paid Amount</th><td class="right">Rs. ${display.paidAmount.toLocaleString()}</td></tr>
              <tr><th>Payment Mode</th><td>${fullBill.paymentMode || ''}</td></tr>
              ${fullBill.paymentMode === 'Cheque' ? `<tr><th>Check No</th><td>${fullBill.checkNo || ''}</td></tr>` : ''}
              <tr><th>Status</th><td>${display.isPaid ? 'Paid' : 'Pending'}</td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  const showPaymentBreakup = (bill) => {
    const { paidAmount, dueAmount } = getDisplayAmounts(bill)
    alert(
      `Bill: ${bill.billNo || bill.id}\n` +
      `Patient: ${bill.patientName || 'Unknown Patient'}\n\n` +
      `Paid Amount: Rs. ${paidAmount.toLocaleString()}\n` +
      `Pending Amount: Rs. ${dueAmount.toLocaleString()}`
    )
  }

  const filteredBills = bills.filter(bill => {
    const term = searchTerm.toLowerCase()
    return (
      (bill.patientName || '').toLowerCase().includes(term) ||
      (bill.billNo || '').toLowerCase().includes(term) ||
      (bill.referralDoctorName || '').toLowerCase().includes(term)
    )
  })

  const canCreateBill = ['super_admin', 'admin', 'user'].includes(activeUser?.role)
  const totalRevenue = filteredBills
    .filter(b => getDisplayAmounts(b).isPaid)
    .reduce((sum, b) => sum + getDisplayAmounts(b).finalAmount, 0)
  const pendingCount = filteredBills.filter(b => !getDisplayAmounts(b).isPaid).length

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create, edit, print, and track bill payments</p>
        </div>
        {canCreateBill && (
          <button
            onClick={() => {
              setEditingBill(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            <Plus size={20} />
            New Bill
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Bills</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{filteredBills.length}</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Paid Revenue</p>
          <p className="text-3xl font-bold text-green-600 mt-2">Rs. {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Pending Payments</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by bill no, patient, or referral doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-8">
            <BillingForm
              patients={patients}
              doctors={doctors}
              bill={editingBill}
              onSave={handleSaveBill}
              onCancel={() => {
                setShowForm(false)
                setEditingBill(null)
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-primary border-b border-gray-200 dark:border-gray-700">
                {['Bill No', 'Patient', 'Referral Doctor', 'Test', 'Date', 'Amount', 'Discount', 'Pending Amount', 'Paid', 'Mode', 'Status', 'Actions'].map(header => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => {
                const { amount, discount, dueAmount, paidAmount, isPaid } = getDisplayAmounts(bill)
                return (
                  <tr key={bill.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-primary/50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{bill.billNo || bill.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{bill.patientName || 'Unknown Patient'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{bill.referralDoctorName || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{bill.test || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{String(bill.billDate || '').slice(0, 10) || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Rs. {amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Rs. {discount.toLocaleString()}</td>
                    <td className="px-6 py-4 font-semibold text-orange-600">Rs. {dueAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Rs. {paidAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{bill.paymentMode || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => showPaymentBreakup(bill)}
                        title="Click to view paid and pending amount"
                        className={`px-3 py-1 rounded-full text-sm font-medium hover:ring-2 hover:ring-offset-1 transition ${
                        isPaid
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {isPaid ? 'Paid' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`${routeBase}/billing/${bill.id}`} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="View">
                          <Eye size={16} />
                        </Link>
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBill(bill)
                              setShowForm(true)
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button type="button" onClick={() => handlePrintBill(bill)} className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" title="Print Bill">
                          <Printer size={16} />
                        </button>
                      </div>
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
