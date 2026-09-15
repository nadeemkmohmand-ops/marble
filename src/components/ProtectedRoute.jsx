import { Outlet } from 'react-router-dom'

/**
 * ProtectedRoute — framework PLACEHOLDER for future authentication.
 * It currently renders its children unchanged; when real auth lands, swap
 * the body for something like:
 *
 *   const { user } = useAuth()
 *   const location = useLocation()
 *   if (!user) return <Navigate to="/login" replace state={{ from: location }} />
 *   return children ?? <Outlet />
 *
 * It wraps the Layout route in App.jsx so the seam already exists.
 */
export default function ProtectedRoute({ children }) {
  // TODO(auth): enforce session checks here — no auth logic in this skeleton.
  return children ?? <Outlet />
}
