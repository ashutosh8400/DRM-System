import React, { useEffect, useState } from 'react'
import api from '../../utils/api'

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    organizationName: 'Referral Doctor Management System',
    supportEmail: 'admin@referral.local',
    enableUserBilling: true,
    enableUserChat: true,
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.getSystemSettings().then((data) => {
      if (data) setSettings({ ...settings, ...data })
    })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = await api.updateSystemSettings(settings)
    setMessage(result?.success ? 'Settings saved.' : result?.message || 'Unable to save settings.')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure application-level options.</p>
      </div>

      {message && <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">{message}</div>}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-secondary rounded-lg shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Organization Name</label>
          <input className="w-full border rounded-lg px-3 py-2 dark:bg-primary dark:border-gray-700 dark:text-white" value={settings.organizationName} onChange={(event) => setSettings({ ...settings, organizationName: event.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Support Email</label>
          <input className="w-full border rounded-lg px-3 py-2 dark:bg-primary dark:border-gray-700 dark:text-white" value={settings.supportEmail} onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })} />
        </div>
        <label className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={settings.enableUserBilling} onChange={(event) => setSettings({ ...settings, enableUserBilling: event.target.checked })} />
          Enable billing in user application
        </label>
        <label className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={settings.enableUserChat} onChange={(event) => setSettings({ ...settings, enableUserChat: event.target.checked })} />
          Enable AI chat in user application
        </label>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">Save Settings</button>
      </form>
    </div>
  )
}
