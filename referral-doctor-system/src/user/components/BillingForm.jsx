import React, { useMemo, useState } from 'react'
import TestMultiSelect, { splitTests } from './TestMultiSelect'

const today = () => new Date().toISOString().slice(0, 10)
const sanitizeMoneyInput = (value) => value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')

export default function BillingForm({ patients, doctors, bill, onSave, onCancel }) {
  const initialData = useMemo(() => ({
    billNo: bill?.billNo || '',
    patientId: bill?.patientId || (patients?.[0]?.id || ''),
    referralDoctorId: bill?.referralDoctorId || (doctors?.[0]?.id || ''),
    test: bill?.test || '',
    amount: bill?.amount ?? bill?.subtotal ?? 0,
    discount: bill?.discount ?? 0,
    paidAmount: bill?.paidAmount ?? 0,
    paymentMode: bill?.paymentMode || 'Cash',
    checkNo: bill?.checkNo || '',
    billDate: bill?.billDate ? String(bill.billDate).slice(0, 10) : today(),
  }), [bill, patients, doctors])

  const [formData, setFormData] = useState(initialData)
  const amount = Number(formData.amount) || 0
  const discount = Number(formData.discount) || 0
  const finalAmount = Math.max(0, amount - discount)
  const paidAmount = Math.min(finalAmount, Number(formData.paidAmount) || 0)
  const paymentStatus = paidAmount >= finalAmount ? 'Paid' : 'Pending'

  const handleChange = (e) => {
    const { name, value } = e.target
    const moneyFields = ['amount', 'discount', 'paidAmount']
    setFormData(prev => ({
      ...prev,
      [name]: moneyFields.includes(name) ? sanitizeMoneyInput(value) : value,
      ...(name === 'paymentMode' && value !== 'Cheque' ? { checkNo: '' } : {}),
    }))
  }

  const handleMoneyFocus = (e) => {
    const { name, value } = e.target
    if (['amount', 'discount', 'paidAmount'].includes(name) && Number(value) === 0) {
      setFormData(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleMoneyBlur = (e) => {
    const { name, value } = e.target
    if (['amount', 'discount', 'paidAmount'].includes(name) && value === '') {
      setFormData(prev => ({ ...prev, [name]: '0' }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.patientId) {
      alert('Please select a patient.')
      return
    }
    if (formData.billDate < today()) {
      alert('Backdated billing is not allowed.')
      return
    }
    if (amount <= 0) {
      alert('Amount must be greater than 0.')
      return
    }
    if (discount < 0 || paidAmount < 0) {
      alert('Negative values are not allowed.')
      return
    }
    if (discount > amount) {
      alert('Discount cannot be greater than amount.')
      return
    }
    if (Number(formData.paidAmount || 0) > finalAmount) {
      alert('Paid amount cannot be greater than final amount.')
      return
    }
    if (formData.paymentMode === 'Cheque' && !formData.checkNo.trim()) {
      alert('Check No is required for cheque payments.')
      return
    }
    if (paymentStatus === 'Paid' && !window.confirm('Mark this bill as Paid? Paid bills cannot be edited later.')) {
      return
    }
    onSave({
      billNo: formData.billNo,
      patientId: formData.patientId,
      referralDoctorId: formData.referralDoctorId || null,
      test: splitTests(formData.test).join(', '),
      amount,
      subtotal: amount,
      discount,
      finalAmount,
      total: finalAmount,
      paidAmount,
      dueAmount: Math.max(0, finalAmount - paidAmount),
      paymentMode: formData.paymentMode,
      checkNo: formData.paymentMode === 'Cheque' ? formData.checkNo.trim() : '',
      status: paymentStatus,
      paymentStatus,
      billDate: formData.billDate,
      items: [],
    })
  }

  const hasPatients = Array.isArray(patients) && patients.length > 0

  return (
    <div className="bg-white dark:bg-secondary rounded-lg shadow-2xl p-6 w-full">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {bill ? 'Edit Bill' : 'Create Bill'}
      </h2>

      {!hasPatients ? (
        <div className="text-center py-6">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-4">
            Add at least one patient before creating a bill.
          </p>
          <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
            Go Back
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bill No</label>
              <input
                name="billNo"
                value={formData.billNo}
                onChange={handleChange}
                placeholder="Auto if blank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date *</label>
              <input
                type="date"
                name="billDate"
                min={today()}
                value={formData.billDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Patient *</label>
              <select name="patientId" value={formData.patientId} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:border-gray-600 dark:text-white">
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.mobile || 'No Mobile'})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Referral Doctor</label>
              <select name="referralDoctorId" value={formData.referralDoctorId || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:border-gray-600 dark:text-white">
                <option value="">None</option>
                {(doctors || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Test</label>
              <TestMultiSelect
                value={formData.test}
                onChange={(test) => setFormData(prev => ({ ...prev, test }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:border-gray-600 dark:text-white">
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Cheque</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            {formData.paymentMode === 'Cheque' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Check No *</label>
                <input
                  name="checkNo"
                  value={formData.checkNo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Amount</label>
              <input type="text" inputMode="decimal" name="amount" value={formData.amount} onFocus={handleMoneyFocus} onBlur={handleMoneyBlur} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Discount</label>
              <input type="text" inputMode="decimal" name="discount" value={formData.discount} onFocus={handleMoneyFocus} onBlur={handleMoneyBlur} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Paid Amount</label>
              <input type="text" inputMode="decimal" name="paidAmount" value={formData.paidAmount} onFocus={handleMoneyFocus} onBlur={handleMoneyBlur} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <div className={`w-full px-4 py-2 border rounded-lg font-semibold ${
                paymentStatus === 'Paid'
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300'
                  : 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300'
              }`}>
                {paymentStatus}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-primary p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Final Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {finalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">Rs. {paidAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className={`text-2xl font-bold ${paymentStatus === 'Paid' ? 'text-green-600' : 'text-yellow-600'}`}>{paymentStatus}</p>
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-primary transition">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-semibold">
              {bill ? 'Update Bill' : 'Create Bill'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
