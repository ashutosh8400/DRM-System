import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  FileText,
  DollarSign,
  BarChart3,
  MessageSquare,
  LogOut,
  ChevronDown,
} from 'lucide-react'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Super Admin', 'Receptionist', 'Doctor', 'Accountant'] },
  { id: 'doctors', label: 'Doctors', path: '/doctors', icon: Users, roles: ['Super Admin', 'Receptionist'] },
  { id: 'patients', label: 'Patients', path: '/patients', icon: UserCircle, roles: ['Super Admin', 'Receptionist', 'Doctor'] },
  { id: 'referrals', label: 'Referrals', path: '/referrals', icon: FileText, roles: ['Super Admin', 'Receptionist', 'Doctor'] },
  { id: 'billing', label: 'Billing', path: '/billing', icon: DollarSign, roles: ['Super Admin', 'Receptionist', 'Accountant'] },
  { id: 'reports', label: 'Reports', path: '/reports', icon: BarChart3, roles: ['Super Admin', 'Accountant'] },
  { id: 'chat', label: 'AI Chat', path: '/chat', icon: MessageSquare, roles: ['Super Admin', 'Receptionist', 'Doctor', 'Accountant'] },
]

export default function Sidebar({ isOpen, user, onLogout }) {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = React.useState('dashboard')

  const accessibleItems = menuItems.filter(item => item.roles.includes(user?.role))

  return (
    <aside className={`
      w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300
      ${!isOpen ? '-translate-x-full fixed' : ''} h-screen overflow-y-auto
    `}>
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white">
            RD
          </div>
          <div>
            <h1 className="text-lg font-bold">Referral Doctor</h1>
            <p className="text-xs text-gray-400">Management System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700 bg-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-gray-300">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {accessibleItems.map(item => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveMenu(item.id)
                    navigate(item.path)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeMenu === item.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
