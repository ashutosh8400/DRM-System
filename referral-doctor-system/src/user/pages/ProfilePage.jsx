import React from 'react'
import { useAuth } from '../../context/AuthContext'

export default function ProfilePage() {
  const { currentUser: user } = useAuth()
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
    </div>
  )
}
