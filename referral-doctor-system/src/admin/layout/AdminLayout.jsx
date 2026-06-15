import React, { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const adminMenuItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Management', path: '/admin/users', icon: Users },
  { label: 'Role Management', path: '/admin/roles', icon: Shield },
  { label: 'System Settings', path: '/admin/settings', icon: Settings },
]

export default function AdminLayout() {
  const { currentUser: user, darkMode, toggleDarkMode, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className={`h-screen flex transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <aside className={`w-64 bg-slate-950 text-white transition-all duration-300 ${!sidebarOpen ? '-translate-x-full fixed' : ''} h-screen overflow-y-auto`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
            <div>
              <h1 className="text-lg font-bold">Admin Panel</h1>
              <p className="text-xs text-gray-400">Referral Doctor</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-900">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {adminMenuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-primary">
        <header className="bg-white dark:bg-secondary border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" aria-label="Toggle admin navigation">
              <Menu size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white hidden sm:block">Administration Panel</h1>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" aria-label="Toggle dark mode">
              {darkMode ? <Sun size={20} className="text-gray-600 dark:text-gray-400" /> : <Moon size={20} className="text-gray-600" />}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
