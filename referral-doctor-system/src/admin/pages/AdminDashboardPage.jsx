import React, { useEffect, useState } from 'react'
import { Activity, CheckCircle, Shield, Users, XCircle } from 'lucide-react'
import api from '../../utils/api'

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex items-center gap-5">
      <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User / Staff',
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([])
  const [licenseStatus, setLicenseStatus] = useState(null)
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [usersData, licenseData, settingsData] = await Promise.all([
          api.getUsers(),
          api.validateLicense(),
          api.getSystemSettings(),
        ])
        setUsers(Array.isArray(usersData) ? usersData : [])
        setLicenseStatus(licenseData)
        setSettings(settingsData || {})
      } catch (err) {
        console.error('Failed to load admin dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalUsers = users.length
  const activeUsers = users.filter(u => u.isActive !== 0).length
  const deactivatedUsers = users.filter(u => u.isActive === 0).length

  const roleCounts = users.reduce((acc, u) => {
    const role = u.role || 'user'
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of system users, roles, and configuration.</p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={<Users size={28} className="text-white" />}
          color="bg-blue-600"
        />
        <StatCard
          title="Active Users"
          value={activeUsers}
          icon={<CheckCircle size={28} className="text-white" />}
          color="bg-emerald-600"
        />
        <StatCard
          title="Deactivated Users"
          value={deactivatedUsers}
          icon={<XCircle size={28} className="text-white" />}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-5">
            <Shield size={22} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Role Distribution</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                <span className="text-gray-700 dark:text-gray-300 font-medium capitalize">
                  {ROLE_LABELS[role] || role}
                </span>
                <span className="font-bold text-gray-900 dark:text-white bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-0.5 rounded-full text-sm">
                  {count}
                </span>
              </div>
            ))}
            {Object.keys(roleCounts).length === 0 && (
              <p className="text-gray-400 text-sm">No users found.</p>
            )}
          </div>
        </div>

        {/* System Configuration */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-5">
            <Activity size={22} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">System Configuration</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">Organization</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm truncate ml-4 max-w-[180px]">
                {settings.organizationName || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">Support Email</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {settings.supportEmail || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">Billing Module</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${settings.enableUserBilling ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                {settings.enableUserBilling ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700 dark:text-gray-300">AI Chat Module</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${settings.enableUserChat ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                {settings.enableUserChat ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* License Info */}
      <div className={`rounded-xl border p-5 flex items-start gap-4 ${
        licenseStatus?.valid
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
          : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      }`}>
        {licenseStatus?.valid
          ? <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={22} />
          : <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={22} />
        }
        <div>
          <p className={`font-semibold ${licenseStatus?.valid ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
            License Status: {licenseStatus?.valid ? 'Valid' : 'Invalid / Expired'}
          </p>
          <p className={`text-sm mt-0.5 ${licenseStatus?.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {licenseStatus?.message || (licenseStatus?.expiryDate ? `Expires: ${licenseStatus.expiryDate}` : 'No license registered — running in development mode.')}
          </p>
        </div>
      </div>
    </div>
  )
}
