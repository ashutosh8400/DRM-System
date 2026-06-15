import React, { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../utils/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ReportsPage({ user }) {
  const [reportType, setReportType] = useState('referral-report')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [doctorWise, setDoctorWise] = useState([])
  const [serviceWise, setServiceWise] = useState([])
  const [revenueTrends, setRevenueTrends] = useState([])
  const [dailyCollections, setDailyCollections] = useState([])
  const [referralReport, setReferralReport] = useState([])
  const [referralKpis, setReferralKpis] = useState({ total: 0, patients: 0, completed: 0 })

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [docData, serviceData, revData, billsData, refsData] = await Promise.all([
        api.getDoctorWiseReport(30),
        api.getServiceWiseReport(),
        api.getRevenueReport(30),
        api.getBills(),
        api.getReferrals()
      ])

      // 1. Doctor-wise
      const formattedDoc = (Array.isArray(docData) ? docData : []).map(d => ({
        name: d?.name || 'Unknown',
        referrals: d?.referralCount || 0,
        patients: d?.uniquePatients || 0,
        services: d?.serviceTypes || ''
      }))
      setDoctorWise(formattedDoc)

      // 2. Service-wise
      const formattedService = (Array.isArray(serviceData) ? serviceData : []).map(s => ({
        name: s?.serviceType || 'Unknown',
        value: s?.count || 0
      }))
      setServiceWise(formattedService)

      // 3. Revenue
      const formattedRev = (Array.isArray(revData) ? revData : []).map(r => ({
        date: r?.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
        revenue: r?.totalAmount || 0
      }))
      setRevenueTrends(formattedRev)

      // 4. Daily Collections by Payment Mode
      const collections = {}
      ;(Array.isArray(billsData) ? billsData : []).forEach(bill => {
        const displayStatus = bill?.paymentStatus || bill?.status
        if (displayStatus === 'completed' || displayStatus === 'Completed') {
          const dateStr = bill?.billDate ? new Date(bill.billDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'
          if (!collections[dateStr]) {
            collections[dateStr] = { date: dateStr, cash: 0, upi: 0, card: 0 }
          }
          const mode = (bill?.paymentMode || 'Cash').toLowerCase()
          if (mode === 'cash') collections[dateStr].cash += bill.total || 0
          else if (mode === 'upi') collections[dateStr].upi += bill.total || 0
          else if (mode === 'card') collections[dateStr].card += bill.total || 0
        }
      })
      // Take last 7 distinct dates
      setDailyCollections(Object.values(collections).slice(-7))

    } catch (err) {
      console.error('Failed to load reports data:', err)
      setError('Failed to fetch analytics records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [])

  const canViewReports = ['super_admin', 'admin'].includes(user?.role)

  if (!canViewReports) {
    return (
      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-lg">You don't have access to view reports</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="font-semibold mb-2">Error Loading Analytics</p>
        <p>{error}</p>
        <button
          onClick={loadReportData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  // Find max value in services for style calculation
  const maxServiceVal = serviceWise.reduce((max, s) => s.value > max ? s.value : max, 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive analytics and business insights</p>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-4">
        <div className="flex gap-4 flex-wrap">
          {[
            { value: 'doctor-wise', label: 'Doctor-Wise Report' },
            { value: 'service-wise', label: 'Service-Wise Report' },
            { value: 'revenue', label: 'Revenue Report' },
            { value: 'daily-collection', label: 'Daily Collection' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setReportType(option.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                reportType === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-primary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-secondary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor-Wise Report */}
      {reportType === 'doctor-wise' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Doctor Performance (Last 30 Days)</h2>
            {doctorWise.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={doctorWise}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="referrals" fill="#3b82f6" name="Referrals" />
                  <Bar dataKey="patients" fill="#10b981" name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No doctor wise data available
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Doctors</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {doctorWise.length > 0 ? (
                doctorWise.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-primary rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{doc.name}</p>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">#{idx + 1}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {doc.referrals} referrals • {doc.patients} patients
                    </p>
                    {doc.services && (
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 truncate">
                        Services: {doc.services}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No doctor data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Service-Wise Report */}
      {reportType === 'service-wise' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Service Distribution</h2>
            {serviceWise.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceWise}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceWise.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No service data available
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Most Used Services</h2>
            <div className="space-y-3">
              {serviceWise.length > 0 ? (
                serviceWise.map((service, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-primary rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-gray-900 dark:text-white">{service.name}</p>
                      <span className="font-bold text-blue-600">{service.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(service.value / maxServiceVal) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No service usage records found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Report */}
      {reportType === 'revenue' && (
        <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Monthly Revenue Trend</h2>
          {revenueTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Daily Revenue (₹)"
                  dot={{ fill: '#10b981', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              No revenue data recorded
            </div>
          )}
        </div>
      )}

      {/* Daily Collection Report */}
      {reportType === 'daily-collection' && (
        <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Daily Collection by Payment Mode (Last 7 Days)</h2>
          {dailyCollections.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dailyCollections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cash" fill="#3b82f6" name="Cash" />
                <Bar dataKey="upi" fill="#10b981" name="UPI" />
                <Bar dataKey="card" fill="#f59e0b" name="Card" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              No collection logs available
            </div>
          )}
        </div>
      )}
    </div>
  )
}
