import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

export default function ProfilePage() {
  const { currentUser: user } = useAuth()
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setMessage('')
    setMessageType('')
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage('Please fill all password fields.')
      setMessageType('error')
      return
    }
    if (formData.newPassword.length < 6) {
      setMessage('New password must be at least 6 characters.')
      setMessageType('error')
      return
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New password and confirm password do not match.')
      setMessageType('error')
      return
    }

    try {
      setSaving(true)
      const result = await api.changePassword(formData.oldPassword, formData.newPassword)
      if (result?.success) {
        setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' })
        setMessage('Password updated successfully.')
        setMessageType('success')
      } else {
        setMessage(result?.message || 'Unable to update password.')
        setMessageType('error')
      }
    } catch (error) {
      setMessage(error.message || 'Unable to update password.')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
        <p className="text-gray-600 dark:text-gray-400">Your application account details.</p>
      </div>

      <div className="bg-white dark:bg-secondary rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h3>
            <p className="text-gray-600 dark:text-gray-400">{user?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
            <p className="font-semibold text-gray-900 dark:text-white">{user?.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
            <p className="font-semibold text-gray-900 dark:text-white">{user?.email || 'Not provided'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-secondary rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Change Password</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-5">Enter your old password to set a new one.</p>

        {message && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${
            messageType === 'success'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Old Password</label>
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-primary dark:border-gray-600 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title={showNewPassword ? 'Hide password' : 'Show password'}
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-primary dark:border-gray-600 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
