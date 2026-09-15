import { lazy } from 'react'
import { PATHS } from './constants/routes.js'

/**
 * Central route table — pages are LAZY-LOADED (one chunk per page).
 * `title` ({ ur, en }) powers document.title via usePageTitle (Layout.jsx)
 * and the Breadcrumbs component. Navigation labels still come from i18n.
 */

const Home = lazy(() => import('./pages/Home.jsx'))
const Calculator = lazy(() => import('./pages/Calculator.jsx'))
const Inventory = lazy(() => import('./pages/Inventory.jsx'))
const Orders = lazy(() => import('./pages/Orders.jsx'))
const Reports = lazy(() => import('./pages/Reports.jsx'))
const Customers = lazy(() => import('./pages/Customers.jsx'))
const Workers = lazy(() => import('./pages/Workers.jsx'))
const Expenses = lazy(() => import('./pages/Expenses.jsx'))
const Notifications = lazy(() => import('./pages/Notifications.jsx'))
const PrintPreview = lazy(() => import('./pages/PrintPreview.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))

export const routes = [
  { path: PATHS.HOME, label: 'Home', element: <Home />, title: { ur: 'ہوم', en: 'Home' } },
  {
    path: PATHS.CALCULATOR,
    label: 'Calculator',
    element: <Calculator />,
    title: { ur: 'حساب کتاب', en: 'Calculator' },
  },
  {
    path: PATHS.INVENTORY,
    label: 'Inventory',
    element: <Inventory />,
    title: { ur: 'ذخیرہ', en: 'Inventory' },
  },
  { path: PATHS.ORDERS, label: 'Orders', element: <Orders />, title: { ur: 'آرڈرز', en: 'Orders' } },
  { path: PATHS.REPORTS, label: 'Reports', element: <Reports />, title: { ur: 'رپورٹس', en: 'Reports' } },
  {
    path: PATHS.CUSTOMERS,
    label: 'Customers',
    element: <Customers />,
    title: { ur: 'گاہک', en: 'Customers' },
  },
  {
    path: PATHS.WORKERS,
    label: 'Workers',
    element: <Workers />,
    title: { ur: 'ورکرز', en: 'Workers' },
  },
  {
    path: PATHS.EXPENSES,
    label: 'Expenses',
    element: <Expenses />,
    title: { ur: 'اخراجات', en: 'Expenses' },
  },
  {
    path: PATHS.NOTIFICATIONS,
    label: 'Notifications',
    element: <Notifications />,
    title: { ur: 'اطلاعات', en: 'Notifications' },
  },
  {
    path: PATHS.PRINT_PREVIEW,
    label: 'Print Preview',
    element: <PrintPreview />,
    title: { ur: 'پرنٹ پریویو', en: 'Print Preview' },
  },
  { path: PATHS.ABOUT, label: 'About', element: <About />, title: { ur: 'تعارف', en: 'About' } },
  {
    path: PATHS.SETTINGS,
    label: 'Settings',
    element: <Settings />,
    title: { ur: 'ترتیبات', en: 'Settings' },
  },
  { path: PATHS.LOGIN, label: 'Login', element: <Login />, title: { ur: 'لاگ ان', en: 'Login' } },
]
