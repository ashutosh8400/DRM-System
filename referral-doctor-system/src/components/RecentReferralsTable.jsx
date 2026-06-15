import React from 'react'
import { Calendar, User, Stethoscope } from 'lucide-react'

export default function RecentReferralsTable({ referrals }) {
  return (
    <div className="bg-white dark:bg-secondary rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Referrals</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Patient</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Doctor</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Service</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(referrals) ? referrals : []).map((referral) => {
              const displayDate = referral?.referralDate || referral?.date;
              let dateString = 'N/A';
              if (displayDate) {
                try {
                  const d = new Date(displayDate);
                  if (!isNaN(d.getTime())) {
                    dateString = d.toLocaleDateString();
                  }
                } catch (e) {}
              }
              return (
                <tr key={referral?.id || Math.random()} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-primary/50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{referral?.patientName || 'Unknown Patient'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope size={16} className="text-blue-600" />
                      <span className="text-gray-700 dark:text-gray-300">{referral?.doctorName || 'Unknown Doctor'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                      {referral?.serviceType || 'Unknown Service'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar size={16} />
                      <span className="text-sm">{dateString}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
