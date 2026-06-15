import React from 'react'
import { CheckCircle2, Shield } from 'lucide-react'

const roles = [
  { name: 'super_admin', permissions: ['Full administration', 'User management', 'Role management', 'System settings', 'Analytics', 'All app features'] },
  { name: 'admin', permissions: ['User management', 'Password reset', 'System settings', 'Analytics', 'All app features'] },
  { name: 'user', permissions: ['User dashboard', 'Profile management', 'Patient workflow', 'Referral workflow', 'Billing workflow', 'AI chat'] },
]

export default function RoleManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h2>
        <p className="text-gray-600 dark:text-gray-400">RBAC roles used by routing and Electron IPC authorization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.name} className="bg-white dark:bg-secondary rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                <Shield size={22} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{role.name}</h3>
            </div>
            <ul className="space-y-3">
              {role.permissions.map((permission) => (
                <li key={permission} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  {permission}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
