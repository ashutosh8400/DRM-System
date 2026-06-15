import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDefaultRouteForRole, ROLES } from '../auth/roles'
import ProtectedRoute from '../auth/ProtectedRoute'

// Layouts
import AdminLayout from '../admin/layout/AdminLayout'
import UserLayout from '../user/layout/UserLayout'

// Auth Pages
import LoginPage from '../auth/LoginPage'

// Admin Pages
import AdminDashboardPage from '../admin/pages/AdminDashboardPage'
import UserManagementPage from '../admin/pages/UserManagementPage'
import RoleManagementPage from '../admin/pages/RoleManagementPage'
import SystemSettingsPage from '../admin/pages/SystemSettingsPage'

// User (Clinical) Pages
import UserDashboardPage from '../user/pages/UserDashboardPage'
import ProfilePage from '../user/pages/ProfilePage'
import DoctorPage from '../user/pages/DoctorPage'
import DoctorDetailPage from '../user/pages/DoctorDetailPage'
import PatientPage from '../user/pages/PatientPage'
import PatientDetailPage from '../user/pages/PatientDetailPage'
import ReferralPage from '../user/pages/ReferralPage'
import BillingPage from '../user/pages/BillingPage'
import InvoiceDetailPage from '../user/pages/InvoiceDetailPage'
import ReportsPage from '../user/pages/ReportsPage'
import ChatPage from '../user/pages/ChatPage'

const adminRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN]
const userRoles = [ROLES.USER]

export default function AppRouter() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-600 dark:text-gray-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-semibold">Loading Session...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/auth/login"
        element={
          currentUser ? (
            <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={adminRoles} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="roles" element={<RoleManagementPage />} />
          <Route path="settings" element={<SystemSettingsPage />} />
        </Route>
      </Route>

      {/* User Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={userRoles} />}>
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Navigate to="/user/dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          
          {/* Clinical Workflows */}
          <Route path="doctors" element={<DoctorPage />} />
          <Route path="doctors/:id" element={<DoctorDetailPage />} />
          <Route path="patients" element={<PatientPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
          <Route path="referrals" element={<ReferralPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="billing/:id" element={<InvoiceDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
      </Route>

      {/* Redirects */}
      <Route
        path="/"
        element={
          <Navigate
            to={currentUser ? getDefaultRouteForRole(currentUser.role) : '/auth/login'}
            replace
          />
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            to={currentUser ? getDefaultRouteForRole(currentUser.role) : '/auth/login'}
            replace
          />
        }
      />
    </Routes>
  )
}
