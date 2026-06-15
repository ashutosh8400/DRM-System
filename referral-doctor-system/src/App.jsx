import React from 'react'
import { HashRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRouter from './routes'

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </Router>
  )
}
