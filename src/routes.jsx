import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import PageLoader from './components/States/PageLoader'

// Route-level code splitting keeps the first paint fast on yard tablets.
const Home = lazy(() => import('./pages/Home'))
const Calculator = lazy(() => import('./pages/Calculator'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Blocks = lazy(() => import('./pages/Blocks'))
const Slabs = lazy(() => import('./pages/Slabs'))
const Offcuts = lazy(() => import('./pages/Offcuts'))
const StockMovements = lazy(() => import('./pages/StockMovements'))
const Production = lazy(() => import('./pages/Production'))
const Machines = lazy(() => import('./pages/Machines'))
const Maintenance = lazy(() => import('./pages/Maintenance'))
const Purchases = lazy(() => import('./pages/Purchases'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const Customers = lazy(() => import('./pages/Customers'))
const Quotations = lazy(() => import('./pages/Quotations'))
const Orders = lazy(() => import('./pages/Orders'))
const Workers = lazy(() => import('./pages/Workers'))
const Partners = lazy(() => import('./pages/Partners'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Payroll = lazy(() => import('./pages/Payroll'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Utilities = lazy(() => import('./pages/Utilities'))
const Reports = lazy(() => import('./pages/Reports'))
const Notifications = lazy(() => import('./pages/Notifications'))
const PrintPreview = lazy(() => import('./pages/PrintPreview'))
const About = lazy(() => import('./pages/About'))
const Settings = lazy(() => import('./pages/Settings'))
const Login = lazy(() => import('./pages/Login'))

const page = (el) => <ProtectedRoute><Suspense fallback={<PageLoader />}>{el}</Suspense></ProtectedRoute>

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={page(<Home />)} />
        <Route path="/calculator" element={page(<Calculator />)} />
        <Route path="/inventory" element={page(<Inventory />)} />
        <Route path="/blocks" element={page(<Blocks />)} />
        <Route path="/slabs" element={page(<Slabs />)} />
        <Route path="/offcuts" element={page(<Offcuts />)} />
        <Route path="/movements" element={page(<StockMovements />)} />
        <Route path="/production" element={page(<Production />)} />
        <Route path="/machines" element={page(<Machines />)} />
        <Route path="/maintenance" element={page(<Maintenance />)} />
        <Route path="/purchases" element={page(<Purchases />)} />
        <Route path="/suppliers" element={page(<Suppliers />)} />
        <Route path="/customers" element={page(<Customers />)} />
        <Route path="/quotations" element={page(<Quotations />)} />
        <Route path="/orders" element={page(<Orders />)} />
        <Route path="/workers" element={page(<Workers />)} />
        <Route path="/partners" element={page(<Partners />)} />
        <Route path="/attendance" element={page(<Attendance />)} />
        <Route path="/payroll" element={page(<Payroll />)} />
        <Route path="/expenses" element={page(<Expenses />)} />
        <Route path="/utilities" element={page(<Utilities />)} />
        <Route path="/reports" element={page(<Reports />)} />
        <Route path="/notifications" element={page(<Notifications />)} />
        <Route path="/print" element={page(<PrintPreview />)} />
        <Route path="/about" element={page(<About />)} />
        <Route path="/settings" element={page(<Settings />)} />
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
