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
const Lots = lazy(() => import('./pages/Lots'))
const Offcuts = lazy(() => import('./pages/Offcuts'))
const StockMovements = lazy(() => import('./pages/StockMovements'))
const StockCount = lazy(() => import('./pages/StockCount'))
const Production = lazy(() => import('./pages/Production'))
const Machines = lazy(() => import('./pages/Machines'))
const Maintenance = lazy(() => import('./pages/Maintenance'))
const Consumables = lazy(() => import('./pages/Consumables'))
const Purchases = lazy(() => import('./pages/Purchases'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const Vehicles = lazy(() => import('./pages/Vehicles'))
const Customers = lazy(() => import('./pages/Customers'))
const Quotations = lazy(() => import('./pages/Quotations'))
const Orders = lazy(() => import('./pages/Orders'))
const WorkOrders = lazy(() => import('./pages/WorkOrders'))
const Agents = lazy(() => import('./pages/Agents'))
const PriceLists = lazy(() => import('./pages/PriceLists'))
const Installation = lazy(() => import('./pages/Installation'))
const GatePasses = lazy(() => import('./pages/GatePasses'))
const Receipts = lazy(() => import('./pages/Receipts'))
const Ledgers = lazy(() => import('./pages/Ledgers'))
const Accounting = lazy(() => import('./pages/Accounting'))
const Complaints = lazy(() => import('./pages/Complaints'))
const Workers = lazy(() => import('./pages/Workers'))
const Partners = lazy(() => import('./pages/Partners'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Payroll = lazy(() => import('./pages/Payroll'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Utilities = lazy(() => import('./pages/Utilities'))
const Reports = lazy(() => import('./pages/Reports'))
const ReportBuilder = lazy(() => import('./pages/ReportBuilder'))
const AuditLog = lazy(() => import('./pages/AuditLog'))
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
        {/* Inventory */}
        <Route path="/inventory" element={page(<Inventory />)} />
        <Route path="/blocks" element={page(<Blocks />)} />
        <Route path="/slabs" element={page(<Slabs />)} />
        <Route path="/lots" element={page(<Lots />)} />
        <Route path="/offcuts" element={page(<Offcuts />)} />
        <Route path="/movements" element={page(<StockMovements />)} />
        <Route path="/stock-count" element={page(<StockCount />)} />
        {/* Production */}
        <Route path="/production" element={page(<Production />)} />
        <Route path="/machines" element={page(<Machines />)} />
        <Route path="/maintenance" element={page(<Maintenance />)} />
        <Route path="/consumables" element={page(<Consumables />)} />
        {/* Purchases */}
        <Route path="/purchases" element={page(<Purchases />)} />
        <Route path="/suppliers" element={page(<Suppliers />)} />
        <Route path="/vehicles" element={page(<Vehicles />)} />
        <Route path="/partners" element={page(<Partners />)} />
        {/* Sales & documents */}
        <Route path="/customers" element={page(<Customers />)} />
        <Route path="/quotations" element={page(<Quotations />)} />
        <Route path="/orders" element={page(<Orders />)} />
        <Route path="/work-orders" element={page(<WorkOrders />)} />
        <Route path="/agents" element={page(<Agents />)} />
        <Route path="/price-lists" element={page(<PriceLists />)} />
        <Route path="/installation" element={page(<Installation />)} />
        <Route path="/receipts" element={page(<Receipts />)} />
        <Route path="/gate-passes" element={page(<GatePasses />)} />
        <Route path="/complaints" element={page(<Complaints />)} />
        {/* HR */}
        <Route path="/workers" element={page(<Workers />)} />
        <Route path="/attendance" element={page(<Attendance />)} />
        <Route path="/payroll" element={page(<Payroll />)} />
        {/* Finance */}
        <Route path="/expenses" element={page(<Expenses />)} />
        <Route path="/utilities" element={page(<Utilities />)} />
        <Route path="/ledgers" element={page(<Ledgers />)} />
        <Route path="/accounting" element={page(<Accounting />)} />
        <Route path="/reports" element={page(<Reports />)} />
        <Route path="/report-builder" element={page(<ReportBuilder />)} />
        {/* System */}
        <Route path="/notifications" element={page(<Notifications />)} />
        <Route path="/audit-log" element={page(<AuditLog />)} />
        <Route path="/print" element={page(<PrintPreview />)} />
        <Route path="/about" element={page(<About />)} />
        <Route path="/settings" element={page(<Settings />)} />
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
