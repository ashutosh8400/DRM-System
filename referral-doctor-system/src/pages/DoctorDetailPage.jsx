import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Users, Award, Phone, Mail } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../utils/api'

const MOCK_DOCTOR_DETAILS = {
  '1': {
    id: '1',
    name: 'Dr. Rajesh Sharma',
    mobile: '9876543210',
    email: 'dr.sharma@hospital.com',
    specialization: 'Cardiology',
    city: 'Delhi',
    address: 'Main Road, Delhi',
    totalReferrals: 245,
    last7DaysReferrals: 24,
    totalPatients: 156,
    serviceTypes: ['ECG', 'Stress Test', 'Echocardiogram', 'Consultation'],
    recentActivity: [
      { date: '2024-01-15', patientName: 'Rajesh Kumar', service: 'X-Ray', status: 'Completed' },
      { date: '2024-01-14', patientName: 'Priya Singh', service: 'Ultrasound', status: 'Completed' },
      { date: '2024-01-13', patientName: 'Amit Verma', service: 'ECG', status: 'Completed' },
      { date: '2024-01-12', patientName: 'Neha Agarwal', service: 'Consultation', status: 'Pending' },
      { date: '2024-01-11', patientName: 'Vikram Singh', service: 'Lab Test', status: 'Completed' },
    ],
    weeklyData: [
      { day: 'Mon', referrals: 5 },
      { day: 'Tue', referrals: 7 },
      { day: 'Wed', referrals: 4 },
      { day: 'Thu', referrals: 6 },
      { day: 'Fri', referrals: 2 },
    ]
  }
}

export default function DoctorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const routeBase = location.pathname.startsWith('/admin') ? '/admin' : '/user'
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDoctorDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const docData = await api.getDoctorById(id)
      if (docData) {
        // Fetch referrals to calculate stats and recent activity
        const referrals = await api.getRecentReferralsByDoctor(id, 30)
        const allReferrals = await api.getRecentReferralsByDoctor(id, 365)
        
        // Calculate weekly data (last 7 days)
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const weeklyCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }
        
        const cutoff7Days = new Date()
        cutoff7Days.setDate(cutoff7Days.getDate() - 7)
        
        const last7DaysRefs = (referrals || []).filter(r => new Date(r.referralDate) >= cutoff7Days)
        
        last7DaysRefs.forEach(r => {
          const dayName = daysOfWeek[new Date(r.referralDate).getDay()]
          weeklyCounts[dayName]++
        })
        
        const weeklyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
          day,
          referrals: weeklyCounts[day] || 0
        }))

        // Unique patients
        const uniquePatients = new Set((allReferrals || []).map(r => r.patientId)).size

        setDoctor({
          id: docData.id,
          name: docData.name,
          mobile: docData.mobile || 'N/A',
          email: docData.email || 'N/A',
          specialization: docData.specialization || 'General',
          city: docData.city || 'N/A',
          address: docData.address || 'N/A',
          totalReferrals: (allReferrals || []).length,
          last7DaysReferrals: last7DaysRefs.length,
          totalPatients: uniquePatients,
          serviceTypes: [...new Set((allReferrals || []).map(r => r.serviceType))].slice(0, 5),
          recentActivity: (referrals || []).slice(0, 5).map(r => {
            let dateStr = 'N/A'
            if (r.referralDate) {
              try {
                dateStr = new Date(r.referralDate).toLocaleDateString()
              } catch (e) {}
            }
            return {
              date: dateStr,
              patientName: r.patientName || 'Unknown Patient',
              service: r.serviceType,
              status: r.status === 'completed' ? 'Completed' : 'Pending'
            }
          }),
          weeklyData
        })
      } else {
        setError('Doctor not found')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch doctor details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctorDetails()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading doctor details...</p>
        </div>
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="font-semibold mb-2">Error Loading Doctor</p>
        <p>{error || 'Doctor not found'}</p>
        <button
          onClick={() => navigate(`${routeBase}/doctors`)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Back to Doctors
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(`${routeBase}/doctors`)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
      >
        <ArrowLeft size={20} />
        Back to Doctors
      </button>

      {/* Doctor Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{doctor.name}</h1>
            <p className="text-blue-100 text-xl mb-2">{doctor.specialization}</p>
            <p className="text-blue-100">{doctor.city}, {doctor.address}</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-6">
            <Award className="mb-2" size={32} />
            <p className="text-sm text-blue-100">Expert Doctor</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Referrals</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{doctor.totalReferrals}</p>
          <p className="text-xs text-green-600 mt-1">All time</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Last 7 Days</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{doctor.last7DaysReferrals}</p>
          <p className="text-xs text-blue-600 mt-1">referrals</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Patients</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{doctor.totalPatients}</p>
          <p className="text-xs text-purple-600 mt-1">unique</p>
        </div>
        <div className="bg-white dark:bg-secondary rounded-lg shadow p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Contact</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white mt-2">{doctor.mobile}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{doctor.email}</p>
        </div>
      </div>

      {/* Chart and Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Weekly Activity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={doctor.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="referrals" fill="#3b82f6" name="Referrals" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Types */}
        <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Services Offered</h2>
          <div className="space-y-2">
            {doctor.serviceTypes.map((service, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-primary rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-900 dark:text-white">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Last 7 Days Activity</h2>
        <div className="space-y-3">
          {doctor.recentActivity.map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-primary/50 transition">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{activity.patientName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.service}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  activity.status === 'Completed'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {activity.status}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
