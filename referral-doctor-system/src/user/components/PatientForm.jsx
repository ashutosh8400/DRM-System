import React, { useMemo, useState } from 'react'
import TestMultiSelect, { splitTests } from './TestMultiSelect'

const today = () => new Date().toISOString().slice(0, 10)

export default function PatientForm({ patient, onSave, onCancel }) {
  const initialData = useMemo(() => ({
    name: '',
    mobile: '',
    age: '',
    gender: 'Male',
    address: '',
    test: '',
    notes: '',
    ...(patient || {}),
    visitDate: patient?.visitDate || patient?.date || today(),
  }), [patient])

  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.name.trim()) nextErrors.name = 'Name is required'
    if (!/^\d{10}$/.test(String(formData.mobile || '').trim())) {
      nextErrors.mobile = 'Mobile number must be exactly 10 digits'
    }
    if (formData.visitDate < today()) {
      nextErrors.visitDate = 'Backdated patient entries are not allowed'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
      age: formData.age,
      gender: formData.gender,
      address: formData.address,
      test: splitTests(formData.test).join(', '),
      visitDate: formData.visitDate,
      notes: formData.notes,
    })
  }

  return (
    <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {patient ? 'Edit Patient' : 'Add Patient'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['name', 'Name *', 'text'],
            ['mobile', 'Mobile *', 'tel'],
            ['age', 'Age', 'number'],
          ].map(([name, label, type]) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
              <input
                type={type}
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                min={name === 'age' ? '0' : undefined}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-primary dark:text-white ${
                  errors[name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors[name] && <p className="text-red-500 text-xs mt-1 font-medium">{errors[name]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Test</label>
            <TestMultiSelect
              value={formData.test}
              onChange={(test) => setFormData(prev => ({ ...prev, test }))}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date *</label>
            <input
              type="date"
              name="visitDate"
              min={today()}
              value={formData.visitDate || today()}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-primary dark:text-white ${
                errors.visitDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.visitDate && <p className="text-red-500 text-xs mt-1 font-medium">{errors.visitDate}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-4">
          <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-primary transition">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold">
            {patient ? 'Update Patient' : 'Add Patient'}
          </button>
        </div>
      </form>
    </div>
  )
}
