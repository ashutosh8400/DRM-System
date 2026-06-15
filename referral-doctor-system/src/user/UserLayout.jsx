import React, { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { FileText, LayoutDashboard, LogOut, Menu, MessageSquare, Moon, Receipt, Sun, UserCircle } from 'lucide-react'

const userMenuItems = [
  { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
  { label: 'Profile', path: '/user/profile', icon: UserCircle },
  { label: 'Patients', path: '/user/patients', icon: UserCircle },
  { label: 'Referrals', path: '/user/referrals', icon: FileText },
  { label: 'Billing', path: '/user/billing', icon: Receipt },
  { label: 'AI Chat', path: '/user/chat', icon: MessageSquare },
]

export default function UserLayout({ user, darkMode, onToggleDarkMode, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className={`h-screen flex transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <aside className={`w-64 bg-white dark:bg-secondary border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${!sidebarOpen ? '-translate-x-full fixed' : ''} h-screen overflow-y-auto`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white">U</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">User App</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Referral Doctor</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {userMenuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-primary">
        <header className="bg-white dark:bg-secondary border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" aria-label="Toggle user navigation">
              <Menu size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white hidden sm:block">User Application</h1>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onToggleDarkMode} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" aria-label="Toggle dark mode">
              {darkMode ? <Sun size={20} className="text-gray-600 dark:text-gray-400" /> : <Moon size={20} className="text-gray-600" />}
            </button>
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
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
