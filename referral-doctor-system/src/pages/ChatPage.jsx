import React, { useState } from 'react'
import { Send, MessageCircle } from 'lucide-react'

export default function ChatPage({ user }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hello! 👋 I\'m your AI Assistant. I can help you with queries about doctors, patients, and referrals. Try asking me things like:\n• "Dr Sharma last 7 days patients"\n• "Ali Khan history"\n• "How many times patient visited"',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')

  const generateResponse = (query) => {
    const lowerQuery = query.toLowerCase()

    // Sample responses
    if (lowerQuery.includes('dr') || lowerQuery.includes('doctor')) {
      return `Dr. Sharma has had 24 referrals in the last 7 days with 15 unique patients. Total revenue from his referrals: ₹45,000.`
    }
    if (lowerQuery.includes('ali') || lowerQuery.includes('patient') || lowerQuery.includes('history')) {
      return `Patient: Ali Khan\n• Total Visits: 5\n• First Visit: 2023-06-15\n• Last Visit: 2024-01-15\n• Most visited service: Lab Test`
    }
    if (lowerQuery.includes('how many') || lowerQuery.includes('visit') || lowerQuery.includes('times')) {
      return `The selected patient has visited 5 times in total. Last visit was on 2024-01-15. Average time between visits: 15 days.`
    }
    if (lowerQuery.includes('referral')) {
      return `Total referrals in the system: 156\n• Completed: 145\n• Pending: 11\nTop referring doctor: Dr. Sharma with 24 referrals in last 7 days.`
    }
    return `I'm not sure about that query. Try asking me about specific doctors, patients, or referrals.`
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    }
    setMessages([...messages, newUserMessage])
    setInputValue('')

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        text: generateResponse(inputValue),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
    }, 500)
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Chat Assistant</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Ask questions about doctors, patients, and referrals</p>
      </div>

      {/* Chat Container */}
      <div className="bg-white dark:bg-secondary rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-6 py-3 rounded-2xl whitespace-pre-wrap ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 dark:bg-primary text-gray-900 dark:text-white rounded-bl-none'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-primary">
          <form onSubmit={handleSendMessage} className="flex gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-6 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-secondary dark:border-gray-600 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-full transition flex items-center gap-2 font-semibold"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setInputValue('Dr Sharma last 7 days patients')}
          className="p-4 bg-white dark:bg-secondary rounded-lg shadow hover:shadow-lg transition text-left border border-gray-200 dark:border-gray-700"
        >
          <MessageCircle size={20} className="text-blue-600 mb-2" />
          <p className="font-semibold text-gray-900 dark:text-white text-sm">Doctor Activity</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">View doctor referrals</p>
        </button>
        <button
          onClick={() => setInputValue('Ali Khan history')}
          className="p-4 bg-white dark:bg-secondary rounded-lg shadow hover:shadow-lg transition text-left border border-gray-200 dark:border-gray-700"
        >
          <MessageCircle size={20} className="text-green-600 mb-2" />
          <p className="font-semibold text-gray-900 dark:text-white text-sm">Patient History</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">View patient details</p>
        </button>
        <button
          onClick={() => setInputValue('How many times patient visited')}
          className="p-4 bg-white dark:bg-secondary rounded-lg shadow hover:shadow-lg transition text-left border border-gray-200 dark:border-gray-700"
        >
          <MessageCircle size={20} className="text-purple-600 mb-2" />
          <p className="font-semibold text-gray-900 dark:text-white text-sm">Visit Count</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total patient visits</p>
        </button>
        <button
          onClick={() => setInputValue('Referral statistics')}
          className="p-4 bg-white dark:bg-secondary rounded-lg shadow hover:shadow-lg transition text-left border border-gray-200 dark:border-gray-700"
        >
          <MessageCircle size={20} className="text-orange-600 mb-2" />
          <p className="font-semibold text-gray-900 dark:text-white text-sm">Statistics</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">System overview</p>
        </button>
      </div>
    </div>
  )
}
