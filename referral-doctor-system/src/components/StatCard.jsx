import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, icon, trend, trendUp }) {
  return (
    <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {trendUp ? (
          <TrendingUp size={16} className="text-green-600" />
        ) : (
          <TrendingDown size={16} className="text-red-600" />
        )}
        <span className={trendUp ? 'text-green-600' : 'text-red-600'}>
          {trend}
        </span>
      </div>
    </div>
  )
}
