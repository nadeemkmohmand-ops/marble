import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ROUTES from '../constants/routes'
import LockScreen from './LockScreen'

/**
 * Auth gate, two layers:
 *  1. VITE_REQUIRE_AUTH=true → unauthenticated users are redirected to /login.
 *  2. PIN/fingerprint lock (Settings → Security) → the LockScreen overlay
 *     appears above the app until the session is unlocked.
 */
export default function ProtectedRoute({ children }) {
  const { user, required, locked } = useAuth()
  const location = useLocation()

  if (required && !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />
  }
  if (locked) {
    return (
      <>
        {children}
        <LockScreen />
      </>
    )
  }
  return children
}
