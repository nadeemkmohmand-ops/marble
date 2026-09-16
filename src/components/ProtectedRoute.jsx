import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PageLoader from './States/PageLoader.jsx'
import { PATHS } from '../constants/routes.js'
import { useAuth } from '../context/index.jsx'

/**
 * ProtectedRoute — real Supabase session check.
 *
 *  - while the session is being restored → full-area loader
 *  - no session → redirect to /login (remembering where the user wanted to
 *    go, so Login can send them back after signing in)
 *  - session present → render the app shell
 */
export default function ProtectedRoute({ children }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <PageLoader />

  if (status !== 'authenticated') {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location.pathname }} />
  }

  return children ?? <Outlet />
}
