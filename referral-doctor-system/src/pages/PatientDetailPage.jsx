import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Stethoscope, MapPin, Phone } from 'lucide-react'
import api from '../utils/api'

const MOCK_PATIENT_DETAILS = {
  '1': {
    id: '1',
    name: 'Rajesh Kumar',
    mobile: '8765432101',
    age: 45,
    gender: 'Male',
    city: 'Delhi',
    address: 'Main Road, Delhi',
    email: 'rajesh.kumar@email.com',
    firstVisit: '2023-06-15',
    lastVisit: '2024-01-15',
    totalVisits: 12,
    visits: [
      { id: 1, date: '2024-01-15', doctor: 'Dr. Sharma', service: 'X-Ray', reason: 'Chest pain' },
      { id: 2, date: '2024-01-10', doctor: 'Dr. Patel', service: 'ECG', reason: 'Routine checkup' },
      { id: 3, date: '2024-01-05', doctor: 'Dr. Gupta', service: 'Blood Test', reason: 'Diabetes screening' },
      { id: 4, date: '2023-12-20', doctor: 'Dr. Singh', service: 'CT Scan', reason: 'Follow-up' },
      { id: 5, date: '2023-12-10', doctor: 'Dr. Sharma', service: 'Ultrasound', reason: 'Abdominal pain' },
      { id: 6, date: '2023-11-28', doctor: 'Dr. Kumar', service: 'Lab Test', reason: 'General checkup' },
    ]
  }
}

export default function PatientDetailPage({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const routeBase = location.pathname.startsWith('/admin') ? '/admin' : '/user'
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadPatientDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const patData = await api.getPatientById(id)
      if (patData) {
        const visits = await api.getPatientVisitHistory(id)
        
        let firstVisit = 'N/A'
        let lastVisit = 'N/A'
        if (Array.isArray(visits) && visits.length > 0) {
          lastVisit = visits[0].visitDate
          firstVisit = visits[visits.length - 1].visitDate
        }

        setPatient({
          id: patData.id,
          name: patData.name,
          mobile: patData.mobile || 'N/A',
          age: patData.age || 'N/A',
          gender: patData.gender || 'N/A',
          city: patData.city || 'N/A',
          address: patData.address || 'N/A',
          email: patData.email || 'N/A',
          visitDate: patData.visitDate || null,
          firstVisit: firstVisit !== 'N/A' ? firstVisit : new Date().toISOString(),
          lastVisit: lastVisit !== 'N/A' ? lastVisit : new Date().toISOString(),
          totalVisits: (visits || []).length,
          visits: (visits || []).map(v => ({
            id: v.id,
            date: v.visitDate,
            doctor: v.doctorName,
            service: v.serviceType,
            reason: v.notes || 'No notes'
          }))
        })
      } else {
        setError('Patient not found')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch patient details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatientDetails()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading patient details...</p>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="font-semibold mb-2">Error Loading Patient</p>
        <p>{error || 'Patient not found'}</p>
        <button
          onClick={() => navigate(`${routeBase}/patients`)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Back to Patients
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(`${routeBase}/patients`)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
      >
        <ArrowLeft size={20} />
        Back to Patients
      </button>

      {/* Patient Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-8 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{patient.name}</h1>
            <p className="text-green-100 text-lg">{patient.age} years • {patient.gender}</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-6 text-right">
            <p className="text-sm text-green-100 mb-1">Member Since</p>
            <p className="text-2xl font-bold">{new Date(patient.firstVisit).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Visits</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{patient.totalVisits}</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">First Visit</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
            {new Date(patient.firstVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Last Visit</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
            {new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Next Visit Date</p>
          <p className="text-lg font-bold text-green-600 mt-2">
            {patient.visitDate ? new Date(patient.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not Scheduled'}
          </p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Mobile</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">{patient.mobile}</p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                <p className="font-semibold text-gray-900 dark:text-white">{patient.mobile}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="text-blue-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                <p className="font-semibold text-gray-900 dark:text-white">{patient.address}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{patient.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visit Statistics */}
        <div className="lg:col-span-2 bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Visit Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-primary rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Average Days Between Visits</span>
              <span className="font-bold text-gray-900 dark:text-white">~15 days</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-primary rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Most Visited Doctor</span>
              <span className="font-bold text-gray-900 dark:text-white">Dr. Sharma</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-primary rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Most Used Service</span>
              <span className="font-bold text-gray-900 dark:text-white">Lab Test</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visit History Timeline - CRITICAL FEATURE */}
      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Visit History Timeline</h2>
        
        {patient.visits && patient.visits.length > 0 ? (
          <div className="relative">
            {/* Timeline */}
            <div className="space-y-0">
              {patient.visits.map((visit, idx) => (
                <div key={visit.id} className="relative">
                  {/* Timeline connector */}
                  {idx < patient.visits.length - 1 && (
                    <div className="absolute left-6 top-16 w-0.5 h-12 bg-gray-200 dark:bg-gray-700"></div>
                  )}
                  
                  {/* Timeline item */}
                  <div className="flex gap-6 pb-6">
                    {/* Timeline dot */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-secondary">
                        <Calendar size={20} className="text-blue-600" />
                      </div>
                    </div>
                    
                    {/* Visit details */}
                    <div className="flex-1 pt-1">
                      <div className="bg-gray-50 dark:bg-primary rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                              {new Date(visit.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(visit.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
                            {visit.service}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Stethoscope size={16} className="text-blue-600" />
                            <span className="font-semibold text-gray-900 dark:text-white">{visit.doctor}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-gray-600 dark:text-gray-400 text-sm">Reason:</span>
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{visit.reason}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No visits recorded yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
