import React, { useState } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import Toast from './Toast'

const SPECIALIZATION_OPTIONS = [
  'General',
  'X-Ray',
  'Cardiology',
  'Radiology',
  'Pathology / Lab Test',
  'Ultrasound',
  'CT Scan',
  'MRI',
  'ECG',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'Gynecology',
  'Neurology',
  'ENT',
  'Dental',
]

export default function DoctorForm({ doctor, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    doctor || {
      name: '',
      mobile: '',
      specialization: 'General',
      city: '',
      state: '',
      address: '',
      email: '',
    }
  )
  const [toast, setToast] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    const nextValue = name === 'mobile' ? value.replace(/\D/g, '').slice(0, 10) : value
    setFormData(prev => ({ ...prev, [name]: nextValue }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!/^\d{10}$/.test(String(formData.mobile || '').trim())) {
      setToast('Mobile number must be exactly 10 digits')
      return
    }
    onSave(formData)
  }

  return (
    <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6 max-w-2xl">
      <Toast message={toast} onClose={() => setToast('')} />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {doctor ? 'Edit Doctor' : 'Add New Doctor'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Mobile *
            </label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={10}
              pattern="\d{10}"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Specialist In
            </label>
            <select
              name="specialization"
              value={formData.specialization || 'General'}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            >
              {SPECIALIZATION_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              State
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            ></textarea>
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-primary transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
          >
            {doctor ? 'Update Doctor' : 'Add Doctor'}
          </button>
        </div>
      </form>
    </div>
  )
}
