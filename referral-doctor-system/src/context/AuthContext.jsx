import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'
import { normalizeRole } from '../auth/roles'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Load session & dark mode on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem('currentUser')
      const savedDarkMode = localStorage.getItem('darkMode')

      if (savedDarkMode) {
        setDarkMode(JSON.parse(savedDarkMode))
      }

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          const result = await api.restoreSession(parsedUser.id)
          if (result?.success && result.user) {
            setCurrentUser(result.user)
            localStorage.setItem('currentUser', JSON.stringify(result.user))
          } else {
            setCurrentUser(null)
            localStorage.removeItem('currentUser')
          }
        } catch (error) {
          console.error('[AuthContext] Failed to restore session', error)
          setCurrentUser(null)
          localStorage.removeItem('currentUser')
        }
      }
      setLoading(false)
    }

    restoreSession()
  }, [])

  // Sync dark mode class on html tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  const login = async (username, password) => {
    try {
      const result = await api.login(username, password)
      if (result.success && result.user) {
        const normalizedUser = { ...result.user, role: normalizeRole(result.user.role) }
        setCurrentUser(normalizedUser)
        localStorage.setItem('currentUser', JSON.stringify(normalizedUser))
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Login failed' }
      }
    } catch (error) {
      console.error('[AuthContext] Login error', error)
      return { success: false, message: error.message || 'An error occurred during login' }
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await api.logout()
    } catch (error) {
      console.error('[AuthContext] Logout error', error)
    } finally {
      setCurrentUser(null)
      localStorage.removeItem('currentUser')
      setLoading(false)
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev)
  }

  const value = {
    currentUser,
    loading,
    darkMode,
    login,
    logout,
    toggleDarkMode
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
