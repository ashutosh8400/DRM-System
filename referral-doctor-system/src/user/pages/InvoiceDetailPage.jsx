import React, { useEffect, useState } from 'react'
import { ArrowLeft, Printer } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../../utils/api'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const routeBase = location.pathname.startsWith('/admin') ? '/admin' : '/user'
  const [bill, setBill] = useState(null)
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadInvoiceData = async () => {
    try {
      setLoading(true)
      setError(null)
      const billData = await api.getBillById(id)
      if (!billData) {
        setError('Bill not found')
        return
      }
      setBill(billData)
      if (billData.patientId) {
        const patientData = await api.getPatientById(billData.patientId)
        setPatient(patientData)
      }
    } catch (err) {
      console.error('Failed to load bill details:', err)
      setError('Error retrieving bill details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoiceData()
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading bill details...</p>
        </div>
      </div>
    )
  }

  if (error || !bill) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-xl mx-auto mt-12">
        <p className="font-semibold mb-2">Error Loading Bill</p>
        <p>{error || 'Bill details not found'}</p>
        <button
          onClick={() => navigate(`${routeBase}/billing`)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
        >
          Back to Billing
        </button>
      </div>
    )
  }

  const amount = Number(bill.amount || bill.subtotal || 0)
  const discount = Number(bill.discount || 0)
  const finalAmount = Number(bill.finalAmount || bill.total || Math.max(0, amount - discount))
  const status = bill.status || bill.paymentStatus || 'Pending'
  const savedPaidAmount = Number(bill.paidAmount || 0)
  const isPaid = ['Paid', 'completed'].includes(status) || savedPaidAmount >= finalAmount
  const paidAmount = isPaid ? finalAmount : savedPaidAmount

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          aside, header, nav, button, .no-print { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .print-card { box-shadow: none !important; border: none !important; }
        }
      `}} />

      <div className="flex justify-between items-center no-print">
        <button
          onClick={() => navigate(`${routeBase}/billing`)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
        >
          <ArrowLeft size={18} />
          Back to Billing
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          <Printer size={18} />
          Print Bill
        </button>
      </div>

      <div className="bg-white dark:bg-secondary rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 print-card">
        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-6 mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <span className="bg-orange-600 text-white p-1 rounded font-black text-xl">R</span>
              Referral Doctor System
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Medical Referral & Billing
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-extrabold text-gray-950 dark:text-white uppercase tracking-tight">BILL</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mt-1">Bill No: {bill.billNo || bill.id}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Date: {bill.billDate ? String(bill.billDate).slice(0, 10) : 'N/A'}</p>
            <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isPaid
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
            }`}>
              {isPaid ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 dark:bg-primary/40 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{bill.patientName || patient?.name || 'Unknown Patient'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Mobile: {patient?.mobile || 'N/A'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Address: {patient?.address || 'N/A'}</p>
          </div>

          <div className="bg-gray-50 dark:bg-primary/40 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Referral Doctor</h3>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{bill.referralDoctorName || 'N/A'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Payment Mode: {bill.paymentMode || 'N/A'}</p>
            {bill.paymentMode === 'Cheque' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">Check No: {bill.checkNo || 'N/A'}</p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400">
                <th className="py-3">Test</th>
                <th className="py-3 text-right">Amount</th>
                <th className="py-3 text-right">Discount</th>
                <th className="py-3 text-right">Final Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-300">
                <td className="py-4 font-semibold text-gray-900 dark:text-white">{bill.test || 'N/A'}</td>
                <td className="py-4 text-right">{money(amount)}</td>
                <td className="py-4 text-right text-red-600">{money(discount)}</td>
                <td className="py-4 text-right font-bold text-gray-900 dark:text-white">{money(finalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Amount:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{money(amount)}</span>
            </div>
            <div className="flex justify-between text-red-600 dark:text-red-400">
              <span>Discount:</span>
              <span className="font-semibold">-{money(discount)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300 font-bold border-t border-gray-200 dark:border-gray-800 pt-3">
              <span className="text-lg">Final Amount:</span>
              <span className="text-2xl text-orange-600">{money(finalAmount)}</span>
            </div>
            <div className="flex justify-between text-green-700 dark:text-green-300 font-semibold">
              <span>Paid Amount:</span>
              <span>{money(paidAmount)}</span>
            </div>
            <p className="text-[11px] text-gray-400 text-right">Payment via {bill.paymentMode || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
