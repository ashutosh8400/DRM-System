import React, { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, Send, MessageCircle } from 'lucide-react'
import api from '../../utils/api'

function dateKey(value) {
  return String(value || '').slice(0, 10)
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString()}`
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function includesName(query, name) {
  const q = normalize(query)
  const n = normalize(name)
  if (!q || !n) return false
  return q.includes(n) || n.split(' ').filter(Boolean).some(part => part.length > 2 && q.includes(part))
}

function getSearchText(query) {
  return normalize(query)
    .replace(/\b(patient|history|visit|visits|details|detail|record|records|ka|ki|ke|dr|doctor|wise|patients)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getFinalAmount(bill) {
  const amount = Number(bill.amount || bill.subtotal || 0)
  const discount = Number(bill.discount || 0)
  return Number(bill.finalAmount || bill.total || Math.max(0, amount - discount))
}

function isPaidBill(bill) {
  return ['Paid', 'completed'].includes(bill.status || bill.paymentStatus)
}

function getBillPaidAmount(bill) {
  return isPaidBill(bill) ? getFinalAmount(bill) : Number(bill.paidAmount || 0)
}

function getBillPendingAmount(bill) {
  if (isPaidBill(bill)) return 0
  return Number(bill.dueAmount ?? Math.max(0, getFinalAmount(bill) - Number(bill.paidAmount || 0)))
}

export default function ChatPage() {
  const messagesEndRef = useRef(null)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hello! I can answer from your actual doctors, patients, referrals, and bills data. Try: "doctor wise patients", "patient Amit history", "payment summary", or "today referrals".',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ doctors: [], patients: [], referrals: [], bills: [] })

  const loadData = async () => {
    try {
      setLoading(true)
      const [doctors, patients, referrals, bills] = await Promise.all([
        api.getDoctors(),
        api.getPatients(),
        api.getReferrals(),
        api.getBills(),
      ])
      setData({
        doctors: Array.isArray(doctors) ? doctors : [],
        patients: Array.isArray(patients) ? patients : [],
        referrals: Array.isArray(referrals) ? referrals : [],
        bills: Array.isArray(bills) ? bills : [],
      })
    } catch (error) {
      console.error('Failed to load chat data:', error)
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: 'Data load nahi ho pa raha. Please refresh karke try karein.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    const refresh = () => loadData()
    window.addEventListener('app:data-changed', refresh)
    window.addEventListener('billing:changed', refresh)
    return () => {
      window.removeEventListener('app:data-changed', refresh)
      window.removeEventListener('billing:changed', refresh)
    }
  }, [])

  const quickQuestions = useMemo(() => {
    const firstDoctor = data.doctors[0]?.name || 'doctor'
    const firstPatient = data.patients[0]?.name || 'patient'
    return [
      { title: 'Doctor Activity', subtitle: 'Doctor ke patients', text: `${firstDoctor} patients` },
      { title: 'Patient History', subtitle: 'Patient visit detail', text: `${firstPatient} history` },
      { title: 'Payment Summary', subtitle: 'Paid pending amount', text: 'payment summary' },
      { title: 'Today Referrals', subtitle: 'Aaj ka data', text: 'today referrals' },
    ]
  }, [data.doctors, data.patients])

  const getBillsForPatient = (patientId) => data.bills.filter(bill => bill.patientId === patientId)
  const getReferralsForPatient = (patientId) => data.referrals.filter(ref => ref.patientId === patientId)
  const getReferralsForDoctor = (doctorId) => data.referrals.filter(ref => ref.doctorId === doctorId)

  const summarizeBills = (bills) => {
    const finalAmount = bills.reduce((sum, bill) => sum + getFinalAmount(bill), 0)
    const paidAmount = bills.reduce((sum, bill) => sum + getBillPaidAmount(bill), 0)
    const pendingAmount = bills.reduce((sum, bill) => sum + getBillPendingAmount(bill), 0)
    return { finalAmount, paidAmount, pendingAmount }
  }

  const buildDoctorSummary = (query) => {
    const searchText = getSearchText(query)
    const matchedDoctor = data.doctors.find(doctor => includesName(query, doctor.name))
    if (!matchedDoctor && searchText && !['doctor', 'dr', 'doctor wise patients'].includes(normalize(query))) {
      return `Doctor "${searchText}" ka record nahi mila. Real data me jo doctor hai wahi exact naam/mobile se search karein.`
    }
    const doctorsToShow = matchedDoctor ? [matchedDoctor] : data.doctors

    if (doctorsToShow.length === 0) return 'Doctor data abhi available nahi hai.'

    return doctorsToShow.slice(0, 8).map(doctor => {
      const refs = getReferralsForDoctor(doctor.id)
      const patientIds = [...new Set(refs.map(ref => ref.patientId).filter(Boolean))]
      const patientNames = patientIds
        .map(id => data.patients.find(patient => patient.id === id)?.name)
        .filter(Boolean)
      const doctorBills = data.bills.filter(bill => bill.referralDoctorId === doctor.id || patientIds.includes(bill.patientId))
      const totals = summarizeBills(doctorBills)

      return [
        `Doctor: ${doctor.name}`,
        `Mobile: ${doctor.mobile || 'N/A'}`,
        `Total Referrals: ${refs.length}`,
        `Patients: ${patientNames.length ? patientNames.join(', ') : 'No patients found'}`,
        `Final: ${money(totals.finalAmount)} | Paid: ${money(totals.paidAmount)} | Pending: ${money(totals.pendingAmount)}`
      ].join('\n')
    }).join('\n\n')
  }

  const buildPatientSummary = (query) => {
    const searchText = getSearchText(query)
    const mobileText = query.replace(/\D/g, '')
    const matchedPatient = data.patients.find(patient => includesName(query, patient.name) || (mobileText.length >= 4 && String(patient.mobile || '').includes(mobileText)))

    if (data.patients.length === 0) return 'Patient data abhi available nahi hai.'
    if (!matchedPatient) {
      return searchText
        ? `Patient "${searchText}" ka record nahi mila. Real data me jo patient hai wahi exact naam/mobile se search karein.`
        : 'Patient ka naam ya mobile number likhein, jaise "Amit Agarwal history".'
    }

    return [matchedPatient].map(patient => {
      const refs = getReferralsForPatient(patient.id)
      const bills = getBillsForPatient(patient.id)
      const totals = summarizeBills(bills)
      const lastVisit = refs[0]?.referralDate || patient.visitDate || patient.createdAt
      const doctors = [...new Set(refs.map(ref => ref.doctorName || data.doctors.find(doc => doc.id === ref.doctorId)?.name).filter(Boolean))]
      const tests = [...new Set([
        ...refs.map(ref => ref.serviceType || ref.test),
        patient.test
      ].filter(Boolean))]

      return [
        `Patient: ${patient.name}`,
        `Mobile: ${patient.mobile || 'N/A'} | Age: ${patient.age || 'N/A'} | Gender: ${patient.gender || 'N/A'}`,
        `Visits/Referrals: ${refs.length}`,
        `Last Date: ${dateKey(lastVisit) || 'N/A'}`,
        `Referral Doctor: ${doctors.length ? doctors.join(', ') : 'N/A'}`,
        `Test: ${tests.length ? tests.join(', ') : 'N/A'}`,
        `Bills: ${bills.length} | Final: ${money(totals.finalAmount)} | Paid: ${money(totals.paidAmount)} | Pending: ${money(totals.pendingAmount)}`
      ].join('\n')
    }).join('\n\n')
  }

  const buildPaymentSummary = () => {
    const totals = summarizeBills(data.bills)
    const paidBills = data.bills.filter(isPaidBill).length
    const pendingBills = data.bills.length - paidBills

    return [
      'Payment Summary',
      `Total Bills: ${data.bills.length}`,
      `Paid Bills: ${paidBills}`,
      `Pending Bills: ${pendingBills}`,
      `Final Amount: ${money(totals.finalAmount)}`,
      `Paid Amount: ${money(totals.paidAmount)}`,
      `Pending Amount: ${money(totals.pendingAmount)}`
    ].join('\n')
  }

  const buildReferralSummary = (query) => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const onlyToday = normalize(query).includes('today') || normalize(query).includes('aaj')
    const refs = onlyToday ? data.referrals.filter(ref => dateKey(ref.referralDate) === todayStr) : data.referrals

    if (refs.length === 0) return onlyToday ? 'Aaj koi referral nahi mila.' : 'Referral data abhi available nahi hai.'

    const lines = refs.slice(0, 12).map(ref => {
      const patient = data.patients.find(item => item.id === ref.patientId)
      const doctor = data.doctors.find(item => item.id === ref.doctorId)
      return `${dateKey(ref.referralDate)} - ${patient?.name || ref.patientName || 'Unknown Patient'} referred by ${doctor?.name || ref.doctorName || 'Unknown Doctor'} for ${ref.serviceType || ref.test || 'N/A'}`
    })

    return [
      onlyToday ? 'Today Referrals' : 'Referral Summary',
      `Total: ${refs.length}`,
      ...lines
    ].join('\n')
  }

  const generateResponse = (query) => {
    const lowerQuery = normalize(query)

    if (loading) return 'Data load ho raha hai, ek second baad phir try karein.'
    if (data.doctors.length === 0 && data.patients.length === 0) {
      return 'Abhi doctors/patients data empty hai. Pehle records add karein, phir chat usi data se answer dega.'
    }

    if (lowerQuery.includes('payment') || lowerQuery.includes('paid') || lowerQuery.includes('pending') || lowerQuery.includes('bill')) {
      return buildPaymentSummary()
    }
    if (lowerQuery.includes('doctor') || lowerQuery.includes('dr') || data.doctors.some(doctor => includesName(query, doctor.name))) {
      return buildDoctorSummary(query)
    }
    if (lowerQuery.includes('patient') || lowerQuery.includes('history') || lowerQuery.includes('visit') || data.patients.some(patient => includesName(query, patient.name))) {
      return buildPatientSummary(query)
    }
    if (lowerQuery.includes('referral') || lowerQuery.includes('refer') || lowerQuery.includes('today') || lowerQuery.includes('aaj')) {
      return buildReferralSummary(query)
    }
    if (lowerQuery) {
      return `Record "${query}" nahi mila. Real data me available patient ya doctor ka exact naam/mobile search karein.`
    }

    return [
      'Aap is tarah puch sakte hain:',
      '"doctor wise patients"',
      '"Amit history"',
      '"payment summary"',
      '"today referrals"',
      '',
      `Current Data: ${data.doctors.length} doctors, ${data.patients.length} patients, ${data.referrals.length} referrals, ${data.bills.length} bills`
    ].join('\n')
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    const query = inputValue.trim()
    if (!query) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: generateResponse(query),
        timestamp: new Date()
      }])
    }, 250)
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Chat Assistant</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ask from current doctors, patients, referrals, and billing data
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex w-fit shrink-0 items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-primary transition"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg flex flex-col overflow-hidden h-[420px] lg:h-[460px]">
        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-3xl px-6 py-3 rounded-2xl whitespace-pre-wrap ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 dark:bg-primary text-gray-900 dark:text-white rounded-bl-none'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-primary">
          <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask: doctor wise patients, patient name history, payment summary..."
              className="min-w-0 flex-1 px-5 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-secondary dark:border-gray-600 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-full transition inline-flex items-center justify-center gap-2 font-semibold"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickQuestions.map(item => (
          <button
            key={item.title}
            onClick={() => setInputValue(item.text)}
            className="p-4 bg-white dark:bg-secondary rounded-lg shadow hover:shadow-lg transition text-left border border-gray-200 dark:border-gray-700"
          >
            <MessageCircle size={20} className="text-blue-600 mb-2" />
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{item.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
