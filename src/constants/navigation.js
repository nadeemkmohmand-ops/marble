import {
  LayoutDashboard, Boxes, Package, Scissors, ShoppingCart, Users, HardHat,
  Receipt, BarChart3, Calculator, Settings, Info, Bell, Truck, Wrench,
  PackageCheck, ArrowLeftRight, FileText, UserCog, LogIn, Handshake, Zap,
} from 'lucide-react'

import ROUTES from './routes'

// Grouped navigation — used by Sidebar, BottomNav & role filtering.
// roles: undefined = everyone. roles: ['owner','accountant'] = filtered by AuthContext.
export const NAV_GROUPS = [
  {
    id: 'main',
    items: [
      { to: ROUTES.HOME, key: 'nav.home', icon: LayoutDashboard },
      { to: ROUTES.CALCULATOR, key: 'nav.calculator', icon: Calculator },
    ],
  },
  {
    id: 'inventory',
    items: [
      { to: ROUTES.INVENTORY, key: 'nav.inventory', icon: Boxes },
      { to: ROUTES.BLOCKS, key: 'nav.blocks', icon: Package },
      { to: ROUTES.SLABS, key: 'nav.slabs', icon: PackageCheck },
      { to: ROUTES.OFFCUTS, key: 'nav.offcuts', icon: Scissors },
      { to: ROUTES.MOVEMENTS, key: 'nav.movements', icon: ArrowLeftRight },
    ],
  },
  {
    id: 'production',
    items: [
      { to: ROUTES.PRODUCTION, key: 'nav.production', icon: Wrench },
      { to: ROUTES.MACHINES, key: 'nav.machines', icon: Settings },
      { to: ROUTES.MAINTENANCE, key: 'nav.maintenance', icon: Wrench },
    ],
  },
  {
    id: 'purchases',
    items: [
      { to: ROUTES.PURCHASES, key: 'nav.purchases', icon: ShoppingCart },
      { to: ROUTES.SUPPLIERS, key: 'nav.suppliers', icon: Truck },
      { to: ROUTES.PARTNERS, key: 'nav.partners', icon: Handshake },
    ],
  },
  {
    id: 'sales',
    items: [
      { to: ROUTES.CUSTOMERS, key: 'nav.customers', icon: Users },
      { to: ROUTES.QUOTATIONS, key: 'nav.quotations', icon: FileText },
      { to: ROUTES.ORDERS, key: 'nav.orders', icon: Receipt },
    ],
  },
  {
    id: 'hr',
    items: [
      { to: ROUTES.WORKERS, key: 'nav.workers', icon: HardHat },
      { to: ROUTES.ATTENDANCE, key: 'nav.attendance', icon: UserCog },
      { to: ROUTES.PAYROLL, key: 'nav.payroll', icon: Receipt },
    ],
  },
  {
    id: 'finance',
    items: [
      { to: ROUTES.EXPENSES, key: 'nav.expenses', icon: Receipt },
      { to: ROUTES.UTILITIES, key: 'nav.utilities', icon: Zap },
      { to: ROUTES.REPORTS, key: 'nav.reports', icon: BarChart3, roles: ['owner', 'accountant', 'manager'] },
    ],
  },
  {
    id: 'system',
    items: [
      { to: ROUTES.NOTIFICATIONS, key: 'nav.notifications', icon: Bell },
      { to: ROUTES.SETTINGS, key: 'nav.settings', icon: Settings },
      { to: ROUTES.ABOUT, key: 'nav.about', icon: Info },
      { to: ROUTES.LOGIN, key: 'nav.login', icon: LogIn },
    ],
  },
]

export const BOTTOM_NAV_ITEMS = [
  { to: ROUTES.HOME, key: 'nav.home', icon: LayoutDashboard },
  { to: ROUTES.SLABS, key: 'nav.slabs', icon: PackageCheck },
  { to: ROUTES.ORDERS, key: 'nav.orders', icon: Receipt },
  { to: ROUTES.WORKERS, key: 'nav.workers', icon: HardHat },
  { to: ROUTES.REPORTS, key: 'nav.reports', icon: BarChart3 },
]
