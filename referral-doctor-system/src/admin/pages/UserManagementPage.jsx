import React, { useEffect, useState } from 'react'
import { Edit, KeyRound, Plus, PowerOff, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const emptyForm = {
  username: '',
  name: '',
  email: '',
  role: 'user',
  password: '',
  isActive: true,
}

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User / Staff',
}

export default function UserManagementPage() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingUser, setEditingUser] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState({ text: '', type: 'info' })

  const loadUsers = async () => {
    const data = await api.getUsers()
    setUsers(Array.isArray(data) ? data : [])
  }

  useEffect(() => { loadUsers() }, [])

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: 'info' }), 4000)
  }

  const clearForm = () => {
    setForm(emptyForm)
    setEditingUser(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    // Validation
    if (!form.username || !form.name || !form.role) {
      showMsg('Please fill all required fields.', 'error')
      return
    }
    
    if (!editingUser && !form.password) {
      showMsg('Password is required for new users.', 'error')
      return
    }
    
    if (form.password && form.password.length < 6) {
      showMsg('Password must be at least 6 characters long.', 'error')
      return
    }
    
    const payload = { ...form, isActive: form.isActive ? 1 : 0 }
    const result = editingUser
      ? await api.updateUser(editingUser.id, payload)
      : await api.createUser(payload)

    if (result?.success) {
      showMsg(editingUser ? 'User updated successfully.' : 'User created successfully.')
      clearForm()
      loadUsers()
    } else {
      showMsg(result?.message || 'Unable to save user.', 'error')
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setForm({
      username: user.username,
      name: user.name,
      email: user.email || '',
      role: user.role,
      password: '',
      isActive: user.isActive !== 0,
    })
  }

  const handleToggleActive = async (user) => {
    if (user.id === currentUser?.id) {
      showMsg('You cannot deactivate your own account.', 'error')
      return
    }
    const newActive = user.isActive === 0 ? 1 : 0
    const result = await api.updateUser(user.id, {
      username: user.username,
      name: user.name,
      email: user.email || '',
      role: user.role,
      isActive: newActive,
    })
    if (result?.success) {
      showMsg(`User ${newActive ? 'activated' : 'deactivated'} successfully.`)
      loadUsers()
    } else {
      showMsg(result?.message || 'Failed to update status.', 'error')
    }
  }

  const handleDelete = async (userId) => {
    if (userId === currentUser?.id) {
      showMsg('You cannot delete your own account.', 'error')
      return
    }
    if (!window.confirm('Permanently delete this user?')) return
    const result = await api.deleteUser(userId)
    if (result?.success) {
      showMsg('User deleted.')
      loadUsers()
    } else {
      showMsg(result?.message || 'Unable to delete user.', 'error')
    }
  }

  const handlePasswordReset = async (event) => {
    event.preventDefault()
    if (!resetUser) return
    
    if (!newPassword) {
      showMsg('Please enter a new password.', 'error')
      return
    }
    
    if (newPassword.length < 6) {
      showMsg('Password must be at least 6 characters long.', 'error')
      return
    }
    
    const result = await api.resetUserPassword(resetUser.id, newPassword)
    if (result?.success) {
      showMsg('Password reset successfully.')
      setResetUser(null)
      setNewPassword('')
    } else {
      showMsg(result?.message || 'Unable to reset password.', 'error')
    }
  }

  const msgClasses = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    error: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
        <p className="text-gray-600 dark:text-gray-400">Create, edit, activate/deactivate, and reset user accounts.</p>
      </div>

      {message.text && (
        <div className={`p-4 border rounded-lg font-medium ${msgClasses[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Create / Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {editingUser ? `Editing: ${editingUser.name}` : 'Create New User'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Username *</label>
            <input className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="username" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Full Name *</label>
            <input className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Email</label>
            <input className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email" placeholder="email@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Role *</label>
            <select className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="user">User / Staff</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Password {editingUser ? '(leave blank to keep)' : '*'}
            </label>
            <input className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password" placeholder={editingUser ? 'Leave blank to keep current' : 'Password'}
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              required={!editingUser} />
          </div>
          <div className="flex items-center gap-3 pt-5">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Active</span>
            <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`transition-colors ${form.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
              {form.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-5 pt-4 border-t dark:border-gray-700">
          <button type="submit" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition">
            {editingUser ? <Edit size={18} /> : <Plus size={18} />}
            {editingUser ? 'Update User' : 'Create User'}
          </button>
          {editingUser && (
            <button type="button" onClick={clearForm}
              className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-lg font-medium transition hover:bg-gray-50 dark:hover:bg-slate-700">
              <X size={18} /> Cancel
            </button>
          )}
        </div>
      </form>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b dark:border-gray-700">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Username</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {users.map(user => (
              <tr key={user.id} className={`transition-colors ${user.isActive === 0 ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.name}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-sm">{user.username}</td>
                <td className="px-6 py-4">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.isActive !== 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                      Deactivated
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1.5">
                    <button onClick={() => handleEdit(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition" title="Edit user">
                      <Edit size={17} />
                    </button>
                    <button onClick={() => setResetUser(user)}
                      className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition" title="Reset password">
                      <KeyRound size={17} />
                    </button>
                    <button onClick={() => handleToggleActive(user)}
                      className={`p-2 rounded-lg transition ${user.isActive !== 0 ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                      title={user.isActive !== 0 ? 'Deactivate user' : 'Activate user'}>
                      <PowerOff size={17} />
                    </button>
                    <button onClick={() => handleDelete(user.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Delete user">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Password Reset Modal */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handlePasswordReset}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Reset Password</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Setting new password for <strong>{resetUser.name}</strong>
            </p>
            <input
              className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password" placeholder="New password (min 6 chars)"
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
              required minLength={6} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setResetUser(null); setNewPassword('') }}
                className="px-4 py-2 border rounded-lg dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                Cancel
              </button>
              <button type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium">
                Reset Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
