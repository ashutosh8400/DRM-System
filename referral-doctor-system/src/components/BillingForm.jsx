import React, { useState, useEffect } from 'react'
import api from '../utils/api'

const SERVICES = ['X-Ray', 'Ultrasound', 'CT Scan', 'Lab Test', 'ECG', 'Blood Test', 'Consultation']
const SERVICE_PRICES = {
  'X-Ray': 500,
  'Ultrasound': 800,
  'CT Scan': 2000,
  'Lab Test': 600,
  'ECG': 400,
  'Blood Test': 300,
  'Consultation': 200,
}

export default function BillingForm({ patients, onSave, onCancel }) {
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({
    patientId: (Array.isArray(patients) && patients.length > 0) ? patients[0].id : '',
    items: [{ itemType: 'service', serviceType: 'X-Ray', productId: '', quantity: 1, price: 500 }],
    discount: 0,
    paymentMode: 'Cash',
    paymentStatus: 'Pending',
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const prodData = await api.getProducts()
        setProducts(Array.isArray(prodData) ? prodData : [])
      } catch (err) {
        console.error('Failed to load products:', err)
      }
    }
    fetchProducts()
  }, [])

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemType: 'service', serviceType: 'X-Ray', productId: '', quantity: 1, price: 500 }]
    }))
  }

  const handleItemChange = (idx, field, value) => {
    const newItems = [...formData.items]
    newItems[idx][field] = value

    if (field === 'itemType') {
      if (value === 'service') {
        newItems[idx].serviceType = 'X-Ray'
        newItems[idx].price = SERVICE_PRICES['X-Ray']
        newItems[idx].productId = ''
      } else {
        const firstProd = products[0]
        newItems[idx].serviceType = firstProd ? firstProd.name : ''
        newItems[idx].price = firstProd ? firstProd.price : 0
        newItems[idx].productId = firstProd ? firstProd.id : ''
      }
    } else if (field === 'serviceType' && newItems[idx].itemType === 'service') {
      newItems[idx].price = SERVICE_PRICES[value] || 0
    } else if (field === 'productId' && newItems[idx].itemType === 'product') {
      const selectedProd = products.find(p => p.id === value)
      if (selectedProd) {
        newItems[idx].serviceType = selectedProd.name
        newItems[idx].price = selectedProd.price
      }
    }

    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const handleRemoveItem = (idx) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }))
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0
      return sum + (price * item.quantity)
    }, 0)
  }

  const subtotal = calculateSubtotal()
  const total = Math.max(0, subtotal - formData.discount)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.patientId) {
      alert('Please select a valid patient.')
      return
    }

    // Validate quantities against product stock
    for (const item of formData.items) {
      if (item.itemType === 'product' && item.productId) {
        const prod = products.find(p => p.id === item.productId)
        if (prod && item.quantity > prod.stock) {
          alert(`Insufficient stock for ${prod.name}. Available stock: ${prod.stock}`)
          return
        }
      }
    }

    // format items with description and price for the database schema
    const formattedItems = formData.items.map(item => ({
      serviceType: item.serviceType,
      description: item.itemType === 'product' ? `Product: ${item.serviceType}` : `${item.serviceType} Service`,
      quantity: item.quantity,
      price: parseFloat(item.price) || 0,
      amount: (parseFloat(item.price) || 0) * item.quantity,
      itemType: item.itemType,
      productId: item.productId || null
    }))

    onSave({
      patientId: formData.patientId,
      subtotal,
      discount: formData.discount,
      total,
      paymentMode: formData.paymentMode,
      paymentStatus: formData.paymentStatus,
      items: formattedItems,
    })
  }

  const hasPatients = Array.isArray(patients) && patients.length > 0

  return (
    <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Invoice</h2>

      {!hasPatients ? (
        <div className="text-center py-6">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-4">
            You must have at least one patient in the database to create an invoice.
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Select Patient *
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.mobile || 'No Mobile'})</option>
              ))}
            </select>
          </div>

          {/* Services */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Services</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                + Add Service
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, idx) => {
                const isProduct = item.itemType === 'product';
                const selectedProd = isProduct && products.find(p => p.id === item.productId);
                const maxQty = selectedProd ? selectedProd.stock : undefined;

                return (
                  <div key={idx} className="flex gap-4 items-end flex-wrap md:flex-nowrap border-b border-gray-100 dark:border-gray-700 pb-3 md:pb-0 md:border-b-0">
                    <div className="w-full md:w-32">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Type</label>
                      <select
                        value={item.itemType || 'service'}
                        onChange={(e) => handleItemChange(idx, 'itemType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-primary dark:border-gray-600 dark:text-white"
                      >
                        <option value="service">Service</option>
                        <option value="product">Product</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {isProduct ? 'Product Name' : 'Service Type'}
                      </label>
                      {isProduct ? (
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-primary dark:border-gray-600 dark:text-white"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={item.serviceType || 'X-Ray'}
                          onChange={(e) => handleItemChange(idx, 'serviceType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-primary dark:border-gray-600 dark:text-white"
                        >
                          {SERVICES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="w-full md:w-28">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-primary dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="w-full md:w-20">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        min="1"
                        max={maxQty}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-primary dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="w-full md:w-32">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Amount</label>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-primary rounded-lg text-gray-900 dark:text-white font-semibold">
                        ₹{((parseFloat(item.price) || 0) * item.quantity).toLocaleString()}
                      </div>
                    </div>

                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Discount Amount (₹)
            </label>
            <input
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData(prev => ({ ...prev, discount: parseInt(e.target.value) || 0 }))}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Payment Mode
            </label>
            <select
              value={formData.paymentMode}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Cheque</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Payment Status
            </label>
            <select
              value={formData.paymentStatus}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-primary dark:border-gray-600 dark:text-white"
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 dark:bg-primary p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
              <span className="font-semibold text-gray-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Discount:</span>
              <span className="font-semibold text-red-600">-₹{formData.discount.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between">
              <span className="font-bold text-gray-900 dark:text-white">Total:</span>
              <span className="text-2xl font-bold text-green-600">₹{total.toLocaleString()}</span>
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
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-semibold"
            >
              Create Invoice
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
