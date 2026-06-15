import React, { useEffect, useState } from 'react'
import { CalendarCheck, Receipt, UserCircle } from 'lucide-react'
import api from '../../utils/api'
import StatCard from '../components/StatCard'
import RecentReferralsTable from '../components/RecentReferralsTable'

export default function UserDashboardPage() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayVisits: 0,
    todayRevenue: 0,
  })
  const [recentReferrals, setRecentReferrals] = useState([])

  useEffect(() => {
    const loadDashboard = async () => {
      const [statsData, referralsData] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentReferrals(),
      ])

      setStats({
        totalPatients: statsData?.totalPatients || 0,
        todayVisits: statsData?.todayVisits || 0,
        todayRevenue: statsData?.todayRevenue || 0,
      })
      setRecentReferrals(Array.isArray(referralsData) ? referralsData : [])
    }

    loadDashboard()
    const handleVisibility = () => {
      if (!document.hidden) loadDashboard()
    }
    window.addEventListener('app:data-changed', loadDashboard)
    window.addEventListener('billing:changed', loadDashboard)
    window.addEventListener('focus', loadDashboard)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('app:data-changed', loadDashboard)
      window.removeEventListener('billing:changed', loadDashboard)
      window.removeEventListener('focus', loadDashboard)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">Your daily patient, referral, and billing activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Patients" value={stats.totalPatients} icon={<UserCircle size={28} className="text-emerald-600" />} trend="Current total" trendUp />
        <StatCard title="Today Visits" value={stats.todayVisits} icon={<CalendarCheck size={28} className="text-blue-600" />} trend="Scheduled today" trendUp />
        <StatCard title="Today Revenue" value={`Rs. ${stats.todayRevenue.toLocaleString()}`} icon={<Receipt size={28} className="text-purple-600" />} trend="Paid bills" trendUp />
      </div>

      <RecentReferralsTable referrals={recentReferrals} />
    </div>
  )
}
