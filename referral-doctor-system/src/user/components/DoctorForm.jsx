import React, { useMemo, useState } from 'react'
import Toast from '../../components/Toast'

const today = () => new Date().toISOString().slice(0, 10)
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
  const initialData = useMemo(() => ({
    name: '',
    mobile: '',
    specialization: 'General',
    clinic: '',
    address: '',
    notes: '',
    ...(doctor || {}),
    doctorDate: doctor?.doctorDate || doctor?.date || today(),
  }), [doctor])
  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    const nextValue = name === 'mobile' ? value.replace(/\D/g, '').slice(0, 10) : value
    setFormData(prev => ({ ...prev, [name]: nextValue }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.name.trim()) nextErrors.name = 'Doctor name is required'
    if (!/^\d{10}$/.test(String(formData.mobile || '').trim())) {
      nextErrors.mobile = 'Mobile number must be exactly 10 digits'
    }
    if (formData.doctorDate < today()) {
      nextErrors.doctorDate = 'Backdated doctor entries are not allowed'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setToast(Object.values(nextErrors)[0])
    }
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
      specialization: formData.specialization,
      clinic: formData.clinic,
      address: formData.address,
      doctorDate: formData.doctorDate,
      notes: formData.notes,
    })
  }

  return (
    <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6 max-w-4xl mb-6">
      <Toast message={toast} onClose={() => setToast('')} />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {doctor ? 'Edit Referral Doctor' : 'Add Referral Doctor'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['name', 'Doctor Name *', 'text'],
            ['mobile', 'Mobile *', 'tel'],
            ['clinic', 'Clinic', 'text'],
          ].map(([name, label, type]) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
              <input
                type={type}
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                inputMode={name === 'mobile' ? 'numeric' : undefined}
                maxLength={name === 'mobile' ? 10 : undefined}
                pattern={name === 'mobile' ? '\\d{10}' : undefined}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:text-white ${
                  errors[name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors[name] && <p className="text-red-500 text-xs mt-1 font-medium">{errors[name]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Specialist In</label>
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date *</label>
            <input
              type="date"
              name="doctorDate"
              min={today()}
              value={formData.doctorDate || today()}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:text-white ${
                errors.doctorDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.doctorDate && <p className="text-red-500 text-xs mt-1 font-medium">{errors.doctorDate}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-4">
          <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-primary transition">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold">
            {doctor ? 'Update Doctor' : 'Add Doctor'}
          </button>
        </div>
      </form>
    </div>
  )
}
