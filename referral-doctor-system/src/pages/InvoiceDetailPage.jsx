import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, CheckCircle, Clock, RotateCcw, AlertTriangle } from 'lucide-react'
import api from '../utils/api'

export default function InvoiceDetailPage({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const routeBase = location.pathname.startsWith('/admin') ? '/admin' : '/user'

  const [bill, setBill] = useState(null)
  const [patient, setPatient] = useState(null)
  const [products, setProducts] = useState([])
  const [returnsList, setReturnsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Return/Exchange modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [returnQty, setReturnQty] = useState(1)
  const [returnType, setReturnType] = useState('Refund') // Refund or Exchange
  const [exchangeProdId, setExchangeProdId] = useState('')
  const [exchangeQty, setExchangeQty] = useState(1)
  const [submittingReturn, setSubmittingReturn] = useState(false)

  const loadInvoiceData = async () => {
    try {
      setLoading(true)
      setError(null)
      const billData = await api.getBillById(id)
      if (billData) {
        setBill(billData)
        
        // Fetch patient
        if (billData.patientId) {
          const patData = await api.getPatientById(billData.patientId)
          setPatient(patData)
        }

        // Fetch returns
        const retData = await api.getReturnsByBill(id)
        setReturnsList(Array.isArray(retData) ? retData : [])

        // Fetch products for exchange options
        const prodData = await api.getProducts()
        const prodList = Array.isArray(prodData) ? prodData : []
        setProducts(prodList)
        if (prodList.length > 0) {
          setExchangeProdId(prodList[0].id)
        }
      } else {
        setError('Invoice not found')
      }
    } catch (err) {
      console.error('Failed to load invoice details:', err)
      setError('Error retrieving invoice details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoiceData()
  }, [id])

  const togglePaymentStatus = async () => {
    if (!bill) return
    const newStatus = bill.paymentStatus === 'Paid' ? 'Pending' : 'Paid'
    try {
      const res = await api.updateBill(bill.id, { paymentStatus: newStatus })
      if (res && res.success) {
        setBill(prev => ({ ...prev, paymentStatus: newStatus }))
      } else {
        alert(res?.message || 'Failed to update payment status')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating payment status')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const openReturnModal = (item) => {
    // Find already returned quantity for this item
    const alreadyReturned = returnsList
      .filter(r => r.itemId === item.productId)
      .reduce((sum, r) => sum + r.qty, 0)

    const remainingQty = (item.quantity || 1) - alreadyReturned

    if (remainingQty <= 0) {
      alert('All items of this product have already been returned.')
      return
    }

    setSelectedItem({ ...item, remainingQty })
    setReturnQty(1)
    setReturnType('Refund')
    setExchangeQty(1)
    setShowModal(true)
  }

  const handleReturnSubmit = async (e) => {
    e.preventDefault()
    if (!selectedItem || !bill) return

    if (returnQty > selectedItem.remainingQty) {
      alert(`Cannot return more than purchased or remaining quantity. Max: ${selectedItem.remainingQty}`)
      return
    }

    setSubmittingReturn(true)
    try {
      let refundAmount = 0
      let exchangeItemId = null
      let priceDifference = 0

      if (returnType === 'Refund') {
        refundAmount = selectedItem.price * returnQty
      } else {
        // Exchange
        const exProd = products.find(p => p.id === exchangeProdId)
        if (!exProd) {
          alert('Please select a valid exchange product.')
          setSubmittingReturn(false)
          return
        }
        if (exProd.stock < exchangeQty) {
          alert(`Insufficient stock for exchange product ${exProd.name}. Available: ${exProd.stock}`)
          setSubmittingReturn(false)
          return
        }
        exchangeItemId = exchangeProdId
        priceDifference = (exProd.price * exchangeQty) - (selectedItem.price * returnQty)
      }

      const returnData = {
        billId: bill.id,
        itemId: selectedItem.productId,
        type: returnType,
        qty: returnQty,
        refundAmount,
        exchangeItemId,
        exchangeQty: returnType === 'Exchange' ? exchangeQty : 0,
        priceDifference
      }

      const res = await api.addReturn(returnData)
      if (res && res.success) {
        setShowModal(false)
        await loadInvoiceData() // Refresh details, stocks, and adjustments
        alert('Return transaction registered successfully!')
      } else {
        alert(res?.message || 'Failed to submit return request')
      }
    } catch (err) {
      console.error(err)
      alert('Error occurred while registering return')
    } finally {
      setSubmittingReturn(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (error || !bill) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-xl mx-auto mt-12">
        <p className="font-semibold mb-2">Error Loading Invoice</p>
        <p>{error || 'Invoice details not found'}</p>
        <button
          onClick={() => navigate(`${routeBase}/billing`)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
        >
          Back to Billing list
        </button>
      </div>
    )
  }

  const selectedExchangeProduct = returnType === 'Exchange' && products.find(p => p.id === exchangeProdId)
  const calcDiff = selectedExchangeProduct 
    ? (selectedExchangeProduct.price * exchangeQty) - (selectedItem?.price * returnQty) 
    : 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      {/* Print-only CSS style injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, header, nav, button, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
        }
      `}} />

      {/* Header Actions */}
      <div className="flex justify-between items-center no-print">
        <button
          onClick={() => navigate(`${routeBase}/billing`)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
        >
          <ArrowLeft size={18} />
          Back to Invoices
        </button>
        <div className="flex gap-3">
          <button
            onClick={togglePaymentStatus}
            className={`flex items-center gap-2 font-bold py-2 px-4 rounded-lg transition ${
              bill.paymentStatus === 'Paid'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {bill.paymentStatus === 'Paid' ? 'Mark as Pending' : 'Mark as Paid'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            <Printer size={18} />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="bg-white dark:bg-secondary rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 print-card">
        {/* Invoice Header */}
        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-6 mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <span className="bg-orange-600 text-white p-1 rounded font-black text-xl">R</span>
              Referral Doctor System
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Premium Medical Referral & Billing Center<br />
              100 Health Park Street, Suite A<br />
              Phone: +91 98765 43210
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-extrabold text-gray-950 dark:text-white uppercase tracking-tight">INVOICE</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mt-1">Invoice ID: #{bill.id?.slice(0, 8) || 'N/A'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Date: {bill.billDate ? new Date(bill.billDate).toLocaleDateString() : 'N/A'}</p>
            <div className="mt-3 inline-block">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                bill.paymentStatus === 'Paid'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
              }`}>
                {bill.paymentStatus || 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Client details */}
        <div className="mb-8 bg-gray-50 dark:bg-primary/40 p-4 rounded-lg">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
          {patient ? (
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{patient.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Mobile: {patient.mobile}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Address: {patient.address || 'N/A'}, {patient.city || 'N/A'}</p>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">Loading patient details...</p>
          )}
        </div>

        {/* Invoice Items */}
        <div className="overflow-x-auto">
          <table className="w-full mb-6 text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400">
                <th className="py-3">Type</th>
                <th className="py-3">Description</th>
                <th className="py-3 text-right">Unit Price</th>
                <th className="py-3 text-right">Qty</th>
                <th className="py-3 text-right">Amount</th>
                <th className="py-3 text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {bill.items && bill.items.length > 0 ? (
                bill.items.map((item, idx) => {
                  const isProduct = item.itemType === 'product';
                  const returnCount = returnsList
                    .filter(r => r.itemId === item.productId)
                    .reduce((sum, r) => sum + r.qty, 0);

                  return (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-primary/20 transition">
                      <td className="py-4 font-semibold text-xs">
                        <span className={`px-2 py-0.5 rounded uppercase ${
                          isProduct 
                            ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        }`}>
                          {item.itemType || 'Service'}
                        </span>
                      </td>
                      <td className="py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{item.serviceType}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                        {returnCount > 0 && (
                          <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                            Returned: {returnCount} qty
                          </p>
                        )}
                      </td>
                      <td className="py-4 text-right">₹{(item.price || 0).toLocaleString()}</td>
                      <td className="py-4 text-right">{item.quantity}</td>
                      <td className="py-4 text-right font-semibold text-gray-900 dark:text-white">₹{(item.amount || 0).toLocaleString()}</td>
                      <td className="py-4 text-center no-print">
                        {isProduct && item.productId && (
                          <button
                            onClick={() => openReturnModal(item)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold flex items-center gap-1 mx-auto"
                          >
                            <RotateCcw size={12} />
                            Return/Exchange
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">No items found in this invoice</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="w-80 space-y-3">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-gray-900 dark:text-white">₹{(bill.subtotal || 0).toLocaleString()}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Discount:</span>
                <span className="font-semibold">-₹{(bill.discount || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700 dark:text-gray-300 font-bold border-t border-gray-200 dark:border-gray-800 pt-3">
              <span className="text-lg">Grand Total:</span>
              <span className="text-2xl text-orange-600">₹{(bill.total || 0).toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-gray-400 text-right">Payment via {bill.paymentMode || 'Cash'}</p>
          </div>
        </div>

        {/* Returns & Exchanges log Section */}
        {returnsList.length > 0 && (
          <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
              <RotateCcw size={18} />
              Returns & Exchanges History Log
            </h3>
            <div className="bg-red-50/50 dark:bg-primary/20 rounded-lg overflow-hidden border border-red-100 dark:border-red-950">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 font-semibold border-b border-red-100 dark:border-red-950">
                    <th className="p-3">Date</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Exchange For</th>
                    <th className="p-3 text-right">Adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {returnsList.map((ret, idx) => (
                    <tr key={idx} className="border-b border-red-50 dark:border-red-950/20 text-gray-700 dark:text-gray-300">
                      <td className="p-3 text-xs">{new Date(ret.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 font-medium">{ret.productName || 'Unknown Product'}</td>
                      <td className="p-3">{ret.qty}</td>
                      <td className="p-3 font-semibold text-xs">
                        <span className={`px-2 py-0.5 rounded ${
                          ret.type === 'Exchange'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {ret.type}
                        </span>
                      </td>
                      <td className="p-3">
                        {ret.type === 'Exchange' 
                          ? `${ret.exchangeProductName || 'Unknown'} (${ret.exchangeQty} qty)` 
                          : '-'
                        }
                      </td>
                      <td className="p-3 text-right font-bold">
                        {ret.type === 'Exchange' 
                          ? (ret.priceDifference >= 0 ? `+₹${ret.priceDifference}` : `-₹${Math.abs(ret.priceDifference)}`)
                          : `-₹${ret.refundAmount}`
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Return/Exchange Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-secondary rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-700 animate-slideUp">
            <div className="bg-red-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <RotateCcw size={20} />
                Return/Exchange Product
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200 text-xl font-bold">×</button>
            </div>
            
            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-primary/40 p-3 rounded-lg text-sm">
                <p className="text-gray-600 dark:text-gray-400">Product: <span className="font-bold text-gray-900 dark:text-white">{selectedItem.serviceType}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Unit Price: <span className="font-bold text-gray-900 dark:text-white">₹{selectedItem.price}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Purchased Qty: <span className="font-bold text-gray-900 dark:text-white">{selectedItem.quantity}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Max Returnable: <span className="font-bold text-red-600">{selectedItem.remainingQty}</span></p>
              </div>

              {/* Quantity to Return */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Quantity to Return</label>
                <input
                  type="number"
                  value={returnQty}
                  onChange={(e) => setReturnQty(Math.min(selectedItem.remainingQty, Math.max(1, parseInt(e.target.value) || 1)))}
                  min="1"
                  max={selectedItem.remainingQty}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-primary dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Action Type: Refund or Exchange */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resolution Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="returnType"
                      checked={returnType === 'Refund'}
                      onChange={() => setReturnType('Refund')}
                      className="text-red-600"
                    />
                    Refund (Cash Back)
                  </label>
                  <label className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="returnType"
                      checked={returnType === 'Exchange'}
                      onChange={() => setReturnType('Exchange')}
                      className="text-red-600"
                    />
                    Exchange Product
                  </label>
                </div>
              </div>

              {/* Exchange Select fields */}
              {returnType === 'Exchange' && (
                <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Exchange For Product</label>
                    <select
                      value={exchangeProdId}
                      onChange={(e) => setExchangeProdId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-primary dark:border-gray-600 dark:text-white"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Price: ₹{p.price}, Stock: {p.stock})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Exchange Qty</label>
                    <input
                      type="number"
                      value={exchangeQty}
                      onChange={(e) => setExchangeQty(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-primary dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {selectedExchangeProduct && (
                    <div className="p-3 bg-blue-50 dark:bg-primary/30 rounded-lg text-sm">
                      <div className="flex justify-between font-semibold">
                        <span>Exchanged Item Value:</span>
                        <span>₹{selectedExchangeProduct.price * exchangeQty}</span>
                      </div>
                      <div className="flex justify-between font-semibold mt-1">
                        <span>Returned Item Value:</span>
                        <span>-₹{selectedItem.price * returnQty}</span>
                      </div>
                      <div className="border-t border-blue-200 dark:border-blue-800 mt-2 pt-1 flex justify-between font-bold text-blue-800 dark:text-blue-300">
                        <span>Adjustment Price Diff:</span>
                        <span>
                          {calcDiff >= 0 ? `+₹${calcDiff} (Patient owes)` : `₹${calcDiff} (Refund patient)`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                >
                  {submittingReturn ? 'Registering...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
