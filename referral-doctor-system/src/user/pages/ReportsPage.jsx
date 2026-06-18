import React, { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

const RANGE_OPTIONS = [
  { label: 'Today', days: 1 },
  { label: '7 Days', days: 7 },
  { label: '15 Days', days: 15 },
  { label: '30 Days', days: 30 },
  { label: '45 Days', days: 45 },
  { label: '60 Days', days: 60 },
  { label: '75 Days', days: 75 },
  { label: '90 Days', days: 90 },
]

const BASE_COLUMNS = [
  { key: 'visitDate', label: 'Date' },
  { key: 'patientName', label: 'Patient' },
  { key: 'patientMobile', label: 'Mobile' },
  { key: 'patientAge', label: 'Age' },
  { key: 'patientGender', label: 'Gender' },
  { key: 'doctorName', label: 'Referral Doctor' },
  { key: 'doctorMobile', label: 'Doctor Mobile' },
  { key: 'test', label: 'Test / Reason' },
  { key: 'billNos', label: 'Bill No' },
  { key: 'amount', label: 'Referral Amount' },
  { key: 'discount', label: 'Discount' },
  { key: 'finalAmount', label: 'Final Amount' },
  { key: 'paidAmount', label: 'Paid Amount' },
  { key: 'pendingAmount', label: 'Pending Amount' },
  { key: 'paymentModes', label: 'Payment Mode' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'referralNotes', label: 'Notes' },
]

function numberValue(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatMoney(value) {
  return `Rs. ${numberValue(value).toLocaleString()}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getCellValue(row, key) {
  if (['amount', 'discount', 'finalAmount', 'paidAmount', 'pendingAmount'].includes(key)) {
    return numberValue(row[key])
  }
  return row[key] ?? ''
}

export default function ReportsPage() {
  const { currentUser } = useAuth()
  const [selectedDays, setSelectedDays] = useState(1)
  const [reportCategory, setReportCategory] = useState('all')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const canViewReports = ['super_admin', 'admin', 'user'].includes(currentUser?.role)
  const selectedRange = RANGE_OPTIONS.find(option => option.days === selectedDays) || RANGE_OPTIONS[0]
  const selectedCategoryLabel = reportCategory === 'referral'
    ? 'Referral'
    : reportCategory === 'nonReferral'
      ? 'Non-Referral'
      : 'All Bills'
  const amountLabel = reportCategory === 'referral'
    ? 'Referral Amount'
    : reportCategory === 'nonReferral'
      ? 'Non-Referral Amount'
      : 'Bill Amount'
  const columns = useMemo(() => BASE_COLUMNS.map(column => (
    column.key === 'amount' ? { ...column, label: amountLabel } : column
  )), [amountLabel])

  const filteredRows = useMemo(() => rows.filter(row => {
    const hasReferralDoctor = Boolean(row.doctorName)
    if (reportCategory === 'referral') return hasReferralDoctor
    if (reportCategory === 'nonReferral') return !hasReferralDoctor
    return true
  }), [rows, reportCategory])

  const totals = useMemo(() => filteredRows.reduce((summary, row) => ({
      patients: summary.patients + 1,
      amount: summary.amount + numberValue(row.amount),
      discount: summary.discount + numberValue(row.discount),
      finalAmount: summary.finalAmount + numberValue(row.finalAmount),
      paidAmount: summary.paidAmount + numberValue(row.paidAmount),
      pendingAmount: summary.pendingAmount + numberValue(row.pendingAmount),
  }), { patients: 0, amount: 0, discount: 0, finalAmount: 0, paidAmount: 0, pendingAmount: 0 }), [filteredRows])

  const loadReportData = async (days = selectedDays) => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getReferralPaymentReport(days)
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load referral payment report:', err)
      setError('Failed to fetch report records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData(selectedDays)
  }, [selectedDays])

  useEffect(() => {
    const refresh = () => loadReportData(selectedDays)
    window.addEventListener('app:data-changed', refresh)
    window.addEventListener('billing:changed', refresh)
    return () => {
      window.removeEventListener('app:data-changed', refresh)
      window.removeEventListener('billing:changed', refresh)
    }
  }, [selectedDays])

  const downloadExcel = () => {
    const generatedAt = new Date().toLocaleString()
    const headerHtml = columns.map(column => `<th>${escapeHtml(column.label)}</th>`).join('')
    const rowHtml = filteredRows.map(row => (
      `<tr>${columns.map(column => `<td>${escapeHtml(getCellValue(row, column.key))}</td>`).join('')}</tr>`
    )).join('')

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #999; padding: 6px; text-align: left; }
            th { background: #e8f0fe; font-weight: 700; }
          </style>
        </head>
        <body>
          <h2>Billing Payment Report - ${escapeHtml(selectedRange.label)} - ${escapeHtml(selectedCategoryLabel)}</h2>
          <p>Generated: ${escapeHtml(generatedAt)}</p>
          <table>
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${rowHtml}</tbody>
          </table>
        </body>
      </html>
    `

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `referral-payment-report-${selectedDays}-days.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!canViewReports) {
    return (
      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-lg">You don't have access to view reports</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">All bill and payment report for Excel download</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => loadReportData(selectedDays)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-primary transition"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            type="button"
            onClick={downloadExcel}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Download size={18} />
            Download Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">Bills</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totals.patients}</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">{amountLabel}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{formatMoney(totals.amount)}</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">Discount</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{formatMoney(totals.discount)}</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">Final Amount</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{formatMoney(totals.finalAmount)}</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">Paid Amount</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{formatMoney(totals.paidAmount)}</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending Amount</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{formatMoney(totals.pendingAmount)}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={22} className="text-green-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing Payment Report</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRange.label} - {selectedCategoryLabel} data preview</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <select
              value={selectedDays}
              onChange={(event) => setSelectedDays(Number(event.target.value))}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-primary text-gray-700 dark:text-gray-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RANGE_OPTIONS.map(option => (
                <option key={option.days} value={option.days}>{option.label}</option>
              ))}
            </select>
            <select
              value={reportCategory}
              onChange={(event) => setReportCategory(event.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-primary text-gray-700 dark:text-gray-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Bills</option>
              <option value="referral">Referral</option>
              <option value="nonReferral">Non-Referral</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-primary border-b border-gray-200 dark:border-gray-700">
                {columns.map(column => (
                  <th key={column.key} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Loading report...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No {selectedCategoryLabel.toLowerCase()} report records found for {selectedRange.label}
                  </td>
                </tr>
              ) : (
                filteredRows.map(row => (
                  <tr key={row.referralId} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-primary/50 transition">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{row.visitDate || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{row.patientName || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{row.patientMobile || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.patientAge || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.patientGender || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{row.doctorName || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{row.doctorMobile || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 min-w-[180px]">{row.test || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{row.billNos || 'No Bill'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatMoney(row.amount)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatMoney(row.discount)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatMoney(row.finalAmount)}</td>
                    <td className="px-4 py-3 text-green-700 dark:text-green-300 whitespace-nowrap">{formatMoney(row.paidAmount)}</td>
                    <td className="px-4 py-3 text-orange-700 dark:text-orange-300 whitespace-nowrap">{formatMoney(row.pendingAmount)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{row.paymentModes || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        row.paymentStatus === 'Paid'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : row.paymentStatus === 'No Bill'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {row.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 min-w-[180px]">{row.referralNotes || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
