import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDefaultRouteForRole, normalizeRole } from './roles'

export default function ProtectedRoute({ allowedRoles }) {
  const { currentUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-600 dark:text-gray-300">Loading...</div>
  }

  if (!currentUser) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />
  }

  const userRole = normalizeRole(currentUser.role)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={getDefaultRouteForRole(userRole)} replace />
  }

  return <Outlet />
}
