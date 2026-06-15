import React from 'react'
import { Menu, Moon, Sun, Bell, Settings } from 'lucide-react'

export default function Header({ user, darkMode, onToggleDarkMode, onToggleSidebar, onLogout }) {
  return (
    <header className="bg-white dark:bg-secondary border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <Menu size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white hidden sm:block">
          {user?.role === 'Super Admin' && 'Administration Panel'}
          {user?.role === 'Receptionist' && 'Receptionist Dashboard'}
          {user?.role === 'Doctor' && 'Doctor Portal'}
          {user?.role === 'Accountant' && 'Accounting Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition relative">
          <Bell size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          {darkMode ? (
            <Sun size={20} className="text-gray-600 dark:text-gray-400" />
          ) : (
            <Moon size={20} className="text-gray-600" />
          )}
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <Settings size={20} className="text-gray-600 dark:text-gray-400" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
          </div>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
