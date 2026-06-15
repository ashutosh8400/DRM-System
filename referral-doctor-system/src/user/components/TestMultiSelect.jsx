import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

export const TEST_OPTIONS = [
  'X-Ray',
  'Ultrasound',
  'CT Scan',
  'MRI',
  'Lab Test',
  'Blood Test',
  'ECG',
  'Consultation',
  'Surgery',
]

export function splitTests(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export default function TestMultiSelect({ value, onChange, options = TEST_OPTIONS }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef(null)
  const selected = splitTests(value)
  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase()
    return options.filter(option => option.toLowerCase().includes(term))
  }, [options, query])

  const toggleOption = (option) => {
    const next = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option]
    onChange(next.join(', '))
  }

  const clearSelected = (event) => {
    event.stopPropagation()
    onChange('')
    setQuery('')
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`w-full min-h-[42px] px-3 py-2 border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:text-white transition ${
          open ? 'border-orange-500 ring-2 ring-orange-100 dark:ring-orange-900/40' : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="flex flex-wrap gap-1.5">
            {selected.length > 0 ? (
              selected.map(test => (
                <span key={test} className="inline-flex items-center rounded bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-xs font-semibold text-orange-800 dark:text-orange-200">
                  {test}
                </span>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400">Select tests</span>
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {selected.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={clearSelected}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') clearSelected(event)
                }}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                title="Clear tests"
              >
                <X size={14} />
              </span>
            )}
            <ChevronDown size={18} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary shadow-xl p-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search test..."
            className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-primary dark:border-gray-600 dark:text-white"
          />
          <div className="max-h-44 overflow-y-auto space-y-1">
            {filteredOptions.map(option => (
              <label key={option} className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer text-sm transition ${
                selected.includes(option)
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200'
                  : 'hover:bg-gray-100 dark:hover:bg-primary text-gray-700 dark:text-gray-200'
              }`}>
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="h-4 w-4"
                />
                <span>{option}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">No tests found</p>
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selected.length} selected
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-primary text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
