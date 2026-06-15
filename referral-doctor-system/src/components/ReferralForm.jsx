import React, { useState } from 'react'

export default function ReferralForm({ doctors, patients, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    patientId: (Array.isArray(patients) && patients.length > 0) ? patients[0].id : '',
    doctorId: (Array.isArray(doctors) && doctors.length > 0) ? doctors[0].id : '',
    serviceType: 'X-Ray',
    notes: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.patientId || !formData.doctorId) {
      alert('Please select a valid patient and doctor.')
      return
    }
    onSave({
      patientId: formData.patientId,
      doctorId: formData.doctorId,
      serviceType: formData.serviceType,
      notes: formData.notes
    })
  }

  const services = ['X-Ray', 'Ultrasound', 'CT Scan', 'Lab Test', 'ECG', 'Blood Test', 'Consultation', 'Surgery']

  const hasData = (Array.isArray(patients) && patients.length > 0) && (Array.isArray(doctors) && doctors.length > 0)

  return (
    <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Referral</h2>

      {!hasData ? (
        <div className="text-center py-6">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-4">
            You must have at least one doctor and one patient in the database to create a referral.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Go Back
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Select Patient *
              </label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.mobile || 'No Mobile'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Select Doctor *
              </label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialization || 'General'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Service Type *
              </label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
              >
                {services.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Notes/Reason
              </label>
              <textarea
                name="notes"
                value={formData.notes}
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
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-semibold"
            >
              Create Referral
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
