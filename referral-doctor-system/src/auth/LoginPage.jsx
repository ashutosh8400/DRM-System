import React, { useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('error')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!username.trim()) {
      setToastType('error')
      setToast('Please enter username')
      return
    }

    if (!password.trim()) {
      setToastType('error')
      setToast('Please enter password')
      return
    }

    setLoading(true)

    try {
      const result = await login(username.trim(), password)
      if (result.success) {
        setToastType('success')
        setToast('Login successful')
        return
      }
      const message = result.message || 'Invalid username or password'
      setError(message)
      setToastType('error')
      setToast(message)
    } catch (err) {
      const message = err.message || 'Unable to sign in'
      setError(message)
      setToastType('error')
      setToast(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <Toast message={toast} type={toastType} onClose={() => setToast('')} />
      <div className="flex gap-12 w-full max-w-5xl">
        <div className="hidden lg:flex flex-1 flex-col justify-center text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur">
              <span className="text-3xl font-bold">RD</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Referral Doctor Management System</h1>
            <p className="text-xl text-blue-100 mb-8">
              Secure access for administrators and staff with role-based routing.
            </p>
          </div>

          <div className="space-y-4">
            {['Separate admin and user workspaces', 'Protected desktop data access', 'Billing, referrals, patients, and analytics'].map((item) => (
              <div key={item} className="flex gap-3">
                <span className="text-2xl">+</span>
                <div>
                  <h3 className="font-semibold">{item}</h3>
                  <p className="text-blue-100 text-sm">Available according to your assigned role</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to continue</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
              <strong>Demo Credentials:</strong><br />
              Username: <code className="bg-blue-100 px-2 py-1 rounded">admin</code><br />
              Password: <code className="bg-blue-100 px-2 py-1 rounded">admin123</code>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-2 rounded-lg hover:shadow-lg transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
