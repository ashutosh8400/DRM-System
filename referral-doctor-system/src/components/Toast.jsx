import React, { useEffect } from 'react'

export default function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const styles = type === 'success'
    ? 'bg-green-600 border-green-700'
    : 'bg-red-600 border-red-700'

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm font-semibold text-white shadow-lg ${styles}`}>
      {message}
    </div>
  )
}
