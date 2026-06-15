import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, Activity, TrendingUp,
  Clock, CheckCircle, XCircle, CalendarCheck,
  Plus, FileText, DollarSign, BarChart3,
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import StatCard from '../components/StatCard'
import RecentReferralsTable from '../components/RecentReferralsTable'
import api from '../utils/api'

export default function DashboardPage({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const routeBase = location.pathname.startsWith('/admin') ? '/admin' : '/user'

  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const [stats, setStats] = useState({
    totalDoctors:   0,
    totalPatients:  0,
    todayVisits:    0,
    todayRevenue:   0,
    totalReferrals: 0,
    pendingCount:   0,
    confirmedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
  })

  const [recentReferrals,    setRecentReferrals]    = useState([])
  const [topDoctors,         setTopDoctors]         = useState([])
  const [revenueData,        setRevenueData]        = useState([])
  const [serviceDistribution, setServiceDistribution] = useState([])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        statsData,
        recentRefData,
        topDoctorsData,
        revReportData,
        serviceData,
      ] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentReferrals(),
        api.getTopDoctors(),
        api.getRevenueReport(7),
        api.getServiceWiseReport(),
      ])

      console.log('Dashboard loaded:', { statsData, recentRefData, topDoctorsData, revReportData, serviceData })

      // Stats cards
      setStats({
        totalDoctors:   statsData?.totalDoctors   || 0,
        totalPatients:  statsData?.totalPatients  || 0,
        todayVisits:    statsData?.todayVisits    || 0,
        todayRevenue:   statsData?.todayRevenue   || 0,
        totalReferrals: statsData?.totalReferrals || 0,
        pendingCount:   statsData?.pendingCount   || 0,
        confirmedCount: statsData?.confirmedCount || 0,
        completedCount: statsData?.completedCount || 0,
        cancelledCount: statsData?.cancelledCount || 0,
      })

      setRecentReferrals(Array.isArray(recentRefData) ? recentRefData : [])

      const formattedTopDoctors = (Array.isArray(topDoctorsData) ? topDoctorsData : []).map(d => ({
        name:      d?.name           || 'Unknown Doctor',
        referrals: d?.referralCount  || 0,
      }))
      setTopDoctors(formattedTopDoctors)

      const formattedRevenueData = (Array.isArray(revReportData) ? revReportData : []).map(item => {
        let dateStr = 'Unknown'
        if (item?.date) {
          try {
            const d = new Date(item.date)
            if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('en-US', { weekday: 'short' })
          } catch (_) {}
        }
        return { date: dateStr, amount: item?.totalAmount || 0 }
      })
      setRevenueData(formattedRevenueData)

      const formattedServiceData = (Array.isArray(serviceData) ? serviceData : []).map(s => ({
        name:  s?.serviceType || 'Unknown',
        value: s?.count       || 0,
      }))
      setServiceDistribution(formattedServiceData)

    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="font-semibold mb-2">Error Loading Dashboard</p>
        <p>{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-1">Welcome back, {user?.name || 'Admin'}! 👋</h1>
        <p className="text-blue-100">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon={<Users size={32} className="text-blue-600" />}
          trend="From database"
          trendUp={true}
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<UserCheck size={32} className="text-green-600" />}
          trend="From database"
          trendUp={true}
        />
        <StatCard
          title="Today's Visits"
          value={stats.todayVisits}
          icon={<Activity size={32} className="text-purple-600" />}
          trend="Referrals today"
          trendUp={true}
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${(stats.todayRevenue || 0).toLocaleString()}`}
          icon={<TrendingUp size={32} className="text-orange-600" />}
          trend="Completed bills"
          trendUp={true}
        />
      </div>

      {/* Appointment Status Breakdown */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          Referral Status Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Pending */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={22} className="text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Pending</span>
            </div>
            <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pendingCount}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Awaiting confirmation</p>
          </div>

          {/* Confirmed */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CalendarCheck size={22} className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Confirmed</span>
            </div>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.confirmedCount}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Appointment confirmed</p>
          </div>

          {/* Completed */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle size={22} className="text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-800 dark:text-green-300">Completed</span>
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.completedCount}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Visit completed</p>
          </div>

          {/* Cancelled */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <XCircle size={22} className="text-red-600 dark:text-red-400" />
              <span className="text-sm font-semibold text-red-800 dark:text-red-300">Cancelled</span>
            </div>
            <p className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.cancelledCount}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Referral cancelled</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-secondary rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Weekly Revenue</h2>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="amount" fill="#3b82f6" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 flex-col gap-2">
              <BarChart3 size={40} className="opacity-30" />
              <p>No revenue data yet</p>
              <p className="text-xs">Create completed bills to see revenue</p>
            </div>
          )}
        </div>

        {/* Service Distribution */}
        <div className="bg-white dark:bg-secondary rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Service Distribution</h2>
          {serviceDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={serviceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 flex-col gap-2">
              <Activity size={40} className="opacity-30" />
              <p>No service data yet</p>
              <p className="text-xs">Add referrals to see distribution</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Doctors + Recent Referrals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Doctors */}
        <div className="bg-white dark:bg-secondary rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Referring Doctors</h2>
          <div className="space-y-3">
            {topDoctors.length > 0 ? (
              topDoctors.map((doctor, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-primary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-blue-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{doctor.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{doctor.referrals} referrals</p>
                    </div>
                  </div>
                  <p className="font-bold text-blue-600 dark:text-blue-400">{doctor.referrals}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No referral data yet</p>
            )}
          </div>
        </div>

        {/* Recent Referrals */}
        <div className="lg:col-span-2">
          <RecentReferralsTable referrals={recentReferrals} onRefresh={loadDashboardData} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-secondary rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            id="quick-action-add-doctor"
            onClick={() => navigate(`${routeBase}/doctors`)}
            className="group p-4 border-2 border-blue-100 dark:border-blue-900 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all text-center"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Users size={22} className="text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Doctors</p>
          </button>

          <button
            id="quick-action-add-patient"
            onClick={() => navigate(`${routeBase}/patients`)}
            className="group p-4 border-2 border-green-100 dark:border-green-900 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400 transition-all text-center"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <UserCheck size={22} className="text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Patients</p>
          </button>

          <button
            id="quick-action-new-referral"
            onClick={() => navigate(`${routeBase}/referrals`)}
            className="group p-4 border-2 border-purple-100 dark:border-purple-900 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 transition-all text-center"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <FileText size={22} className="text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Referrals</p>
          </button>

          <button
            id="quick-action-billing"
            onClick={() => navigate(`${routeBase}/billing`)}
            className="group p-4 border-2 border-orange-100 dark:border-orange-900 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-400 transition-all text-center"
          >
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <DollarSign size={22} className="text-orange-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Billing</p>
          </button>

          <button
            id="quick-action-reports"
            onClick={() => navigate(`${routeBase}/reports`)}
            className="group p-4 border-2 border-indigo-100 dark:border-indigo-900 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-400 transition-all text-center"
          >
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <BarChart3 size={22} className="text-indigo-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Reports</p>
          </button>
        </div>
      </div>
    </div>
  )
}
