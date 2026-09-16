import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PageLoader from './components/States/PageLoader.jsx'
import { PATHS } from './constants/routes.js'
import { routes } from './routes.jsx'

const NotFound = lazy(() => import('./pages/NotFound.jsx'))

/**
 * Route tree:
 *  - /login is PUBLIC (and redirects home when already signed in)
 *  - everything else sits behind ProtectedRoute, which checks the real
 *    Supabase session and redirects to /login when there is none
 */
export default function App() {
  const Login = routes.find((route) => route.path === PATHS.LOGIN).element

  return (
    <Routes>
      {/* public route */}
      <Route
        path={PATHS.LOGIN}
        element={
          <Suspense fallback={<PageLoader />}>{Login}</Suspense>
        }
      />

      {/* protected app shell */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {routes
          .filter((route) => route.path !== PATHS.LOGIN)
          .map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        {/* Dedicated bilingual 404 (previously a silent redirect to /) */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
