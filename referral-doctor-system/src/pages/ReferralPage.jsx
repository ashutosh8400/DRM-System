import React, { useState, useEffect } from 'react'
import { Plus, Search, Trash2, ChevronDown } from 'lucide-react'
import ReferralForm from '../components/ReferralForm'
import api from '../utils/api'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
}

const ALLOWED_TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export default function ReferralPage({ user }) {
  const [referrals, setReferrals] = useState([])
  const [doctors,   setDoctors]   = useState([])
  const [patients,  setPatients]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [showForm,  setShowForm]  = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [refData, docData, patData] = await Promise.all([
        api.getReferrals(),
        api.getDoctors(),
        api.getPatients(),
      ])
      setReferrals(Array.isArray(refData) ? refData : [])
      setDoctors(Array.isArray(docData) ? docData : [])
      setPatients(Array.isArray(patData) ? patData : [])
    } catch (err) {
      console.error('Failed to load referrals:', err)
      setError('Failed to fetch referrals, doctors, or patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleAddReferral = async (formData) => {
    try {
      const result = await api.addReferral(formData)
      if (result?.success) {
        setShowForm(false)
        loadData()
      } else {
        alert(result?.message || 'Failed to add referral')
      }
    } catch (err) {
      console.error('Error saving referral:', err)
      alert(err.message || 'Error saving referral')
    }
  }

  const handleStatusChange = async (referralId, currentStatus, newStatus) => {
    if (!newStatus || newStatus === currentStatus) return
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || []
    if (!allowed.includes(newStatus)) {
      alert(`Cannot change status from "${currentStatus}" to "${newStatus}"`)
      return
    }
    if (!window.confirm(`Change status to "${newStatus}"?`)) return
    setUpdatingId(referralId)
    try {
      const result = await api.updateReferral(referralId, { status: newStatus })
      if (result?.success) {
        // Optimistic update — reflect immediately then reload for stats sync
        setReferrals(prev =>
          prev.map(r => r.id === referralId ? { ...r, status: newStatus } : r)
        )
        loadData() // resync with DB (updates dashboard counts too on next visit)
      } else {
        alert(result?.message || 'Failed to update status')
      }
    } catch (err) {
      console.error('Error updating status:', err)
      alert(err.message || 'Error updating status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteReferral = async (id) => {
    if (!window.confirm('Delete this referral? This cannot be undone.')) return
    try {
      const result = await api.deleteReferral(id)
      if (result?.success) {
        loadData()
      } else {
        alert(result?.message || 'Failed to delete referral')
      }
    } catch (err) {
      console.error('Error deleting referral:', err)
      alert(err.message || 'Error deleting referral')
    }
  }

  const canCreateReferral = ['super_admin', 'admin', 'user'].includes(user?.role)
  const canDelete         = ['super_admin', 'admin'].includes(user?.role)

  const filteredReferrals = (Array.isArray(referrals) ? referrals : []).filter(r => {
    const matchesSearch =
      (r?.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r?.doctorName  || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r?.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Counts for filter bar
  const counts = {
    all:       referrals.length,
    pending:   referrals.filter(r => r.status === 'pending').length,
    confirmed: referrals.filter(r => r.status === 'confirmed').length,
    completed: referrals.filter(r => r.status === 'completed').length,
    cancelled: referrals.filter(r => r.status === 'cancelled').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading referrals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="font-semibold mb-2">Error Loading Referrals</p>
        <p>{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Referral Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {referrals.length} total referrals — create and manage appointment status
          </p>
        </div>
        {canCreateReferral && (
          <button
            id="btn-new-referral"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            <Plus size={20} />
            New Referral
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition capitalize ${
              statusFilter === tab
                ? 'bg-purple-600 text-white shadow'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab] ?? 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by patient or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-primary dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <ReferralForm
          doctors={doctors}
          patients={patients}
          onSave={handleAddReferral}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Referrals Table */}
      <div className="bg-white dark:bg-secondary rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-primary border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Patient</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Doctor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Service</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</th>
                {canDelete && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredReferrals.map((referral) => {
                const displayDate = referral?.referralDate || referral?.date
                let dateString = 'N/A'
                if (displayDate) {
                  try {
                    const d = new Date(displayDate)
                    if (!isNaN(d.getTime())) dateString = d.toLocaleDateString()
                  } catch (_) {}
                }
                const status = (referral?.status || 'pending').toLowerCase()
                const nextStatuses = ALLOWED_TRANSITIONS[status] || []
                const isUpdating = updatingId === referral.id

                return (
                  <tr
                    key={referral.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-primary/50 transition"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {referral?.patientName || 'Unknown Patient'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {referral?.doctorName || 'Unknown Doctor'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm">
                        {referral?.serviceType || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">{dateString}</td>
                    <td className="px-6 py-4">
                      {nextStatuses.length > 0 ? (
                        <div className="relative inline-block">
                          <select
                            value={status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(referral.id, status, e.target.value)}
                            className={`appearance-none pr-8 pl-3 py-1 rounded-full text-sm font-semibold cursor-pointer border-0 outline-none ${STATUS_COLORS[status]} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <option value={status} disabled>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                            {nextStatuses.map(s => (
                              <option key={s} value={s}>
                                → {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-2 pointer-events-none" />
                        </div>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[status]}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate text-sm">
                      {referral?.notes || '—'}
                    </td>
                    {canDelete && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteReferral(referral.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="Delete referral"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredReferrals.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No referrals found</p>
            {statusFilter !== 'all' && (
              <p className="text-gray-400 text-sm mt-1">
                Try switching to "All" or create a new referral
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
