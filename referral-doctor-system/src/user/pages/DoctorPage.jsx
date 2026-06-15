import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import DoctorForm from '../components/DoctorForm'
import DoctorTable from '../components/DoctorTable'

import api from '../../utils/api'

const MOCK_DOCTORS = []

export default function DoctorPage() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadDoctors = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getDoctors()
      setDoctors(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load doctors:', err)
      setError('Failed to fetch doctor records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors()
  }, [])

  const filteredDoctors = (Array.isArray(doctors) ? doctors : []).filter(doc =>
    (doc?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc?.mobile || '').includes(searchTerm)
  )

  const handleAddDoctor = async (formData) => {
    try {
      if (editingDoctor) {
        const result = await api.updateDoctor(editingDoctor.id, formData)
        if (result && result.success) {
          setEditingDoctor(null)
          setShowForm(false)
          loadDoctors()
        } else {
          alert(result?.message || 'Failed to update doctor')
        }
      } else {
        const result = await api.addDoctor(formData)
        if (result && result.success) {
          setShowForm(false)
          loadDoctors()
        } else {
          alert(result?.message || 'Failed to add doctor')
        }
      }
    } catch (err) {
      console.error('Error saving doctor:', err)
      alert(err.message || 'Error occurred while saving doctor')
    }
  }

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor)
    setShowForm(true)
  }

  const handleDeleteDoctor = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        const result = await api.deleteDoctor(id)
        if (result && result.success) {
          loadDoctors()
        } else {
          alert(result?.message || 'Failed to delete doctor')
        }
      } catch (err) {
        console.error('Error deleting doctor:', err)
        alert(err.message || 'Error occurred while deleting doctor')
      }
    }
  }

  const canEdit = true // all authenticated users in the user app can manage doctors

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading doctors...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="font-semibold mb-2">Error Loading Doctors</p>
        <p>{error}</p>
        <button
          onClick={loadDoctors}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Doctor Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track all doctors in the system</p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditingDoctor(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            <Plus size={20} />
            Add Doctor
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search doctors by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <DoctorForm
          doctor={editingDoctor}
          onSave={handleAddDoctor}
          onCancel={() => {
            setShowForm(false)
            setEditingDoctor(null)
          }}
        />
      )}

      {/* Doctors Table */}
      <DoctorTable
        doctors={filteredDoctors}
        onEdit={handleEditDoctor}
        onDelete={handleDeleteDoctor}
        canEdit={canEdit}
      />
    </div>
  )
}
