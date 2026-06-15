import React from 'react'
import { Edit2, Trash2, Eye } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function DoctorTable({ doctors, onEdit, onDelete, canEdit }) {
  const navigate = useNavigate()
  const location = useLocation()
  const routeBase = location.pathname.startsWith('/admin') ? '/admin' : '/user'

  return (
    <div className="bg-white dark:bg-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-primary border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Mobile</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Clinic</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Address</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-primary/50 transition">
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900 dark:text-white">{doctor.name}</p>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{doctor.mobile}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                    {doctor.clinic || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">{doctor.address || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                  {doctor.doctorDate ? new Date(doctor.doctorDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">{doctor.notes || 'N/A'}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`${routeBase}/doctors/${doctor.id}`)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition text-blue-600"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => onEdit(doctor)}
                          className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition text-green-600"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(doctor.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {doctors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No doctors found</p>
        </div>
      )}
    </div>
  )
}
