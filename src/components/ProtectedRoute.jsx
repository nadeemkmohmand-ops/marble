import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ROUTES from '../constants/routes'

/**
 * Auth gate. When VITE_REQUIRE_AUTH=false (default) the app stays open
 * for yard use — login only personalises the dashboard. When true,
 * unauthenticated users are redirected to /login.
 */
export default function ProtectedRoute({ children }) {
  const { user, required } = useAuth()
  const location = useLocation()

  if (required && !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />
  }
  return children
}
