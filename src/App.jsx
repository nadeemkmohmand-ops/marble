import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { routes } from './routes.jsx'

const NotFound = lazy(() => import('./pages/NotFound.jsx'))

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        {/* Dedicated bilingual 404 (previously a silent redirect to /) */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
