import {
  LayoutDashboard, Boxes, Package, Scissors, ShoppingCart, Users, HardHat,
  Receipt, BarChart3, Calculator, Settings, Info, Bell, Truck, Wrench,
  PackageCheck, ArrowLeftRight, FileText, UserCog, LogIn, Handshake, Zap,
  ClipboardList, DoorOpen, Wallet, BookOpen, Car, Package2, UserCheck,
  Tags, LifeBuoy, Ruler, ClipboardCheck, History, SlidersHorizontal, Layers,
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
      { to: ROUTES.LOTS, key: 'nav.lots', icon: Layers },
      { to: ROUTES.OFFCUTS, key: 'nav.offcuts', icon: Scissors },
      { to: ROUTES.MOVEMENTS, key: 'nav.movements', icon: ArrowLeftRight },
      { to: ROUTES.STOCK_COUNT, key: 'nav.stockCount', icon: ClipboardCheck },
    ],
  },
  {
    id: 'production',
    items: [
      { to: ROUTES.PRODUCTION, key: 'nav.production', icon: Wrench },
      { to: ROUTES.MACHINES, key: 'nav.machines', icon: Settings },
      { to: ROUTES.MAINTENANCE, key: 'nav.maintenance', icon: Wrench },
      { to: ROUTES.CONSUMABLES, key: 'nav.consumables', icon: Package2 },
    ],
  },
  {
    id: 'purchases',
    items: [
      { to: ROUTES.PURCHASES, key: 'nav.purchases', icon: ShoppingCart },
      { to: ROUTES.SUPPLIERS, key: 'nav.suppliers', icon: Truck },
      { to: ROUTES.PARTNERS, key: 'nav.partners', icon: Handshake },
      { to: ROUTES.VEHICLES, key: 'nav.vehicles', icon: Car },
    ],
  },
  {
    id: 'sales',
    items: [
      { to: ROUTES.CUSTOMERS, key: 'nav.customers', icon: Users },
      { to: ROUTES.QUOTATIONS, key: 'nav.quotations', icon: FileText },
      { to: ROUTES.ORDERS, key: 'nav.orders', icon: Receipt },
      { to: ROUTES.WORK_ORDERS, key: 'nav.workOrders', icon: ClipboardList },
      { to: ROUTES.AGENTS, key: 'nav.agents', icon: UserCheck },
      { to: ROUTES.PRICE_LISTS, key: 'nav.priceLists', icon: Tags },
      { to: ROUTES.INSTALLATION, key: 'nav.installation', icon: Ruler },
    ],
  },
  {
    id: 'documents',
    items: [
      { to: ROUTES.RECEIPTS, key: 'nav.receipts', icon: Wallet },
      { to: ROUTES.GATE_PASSES, key: 'nav.gatePasses', icon: DoorOpen },
      { to: ROUTES.COMPLAINTS, key: 'nav.complaints', icon: LifeBuoy },
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
      { to: ROUTES.LEDGERS, key: 'nav.ledgers', icon: BookOpen },
      { to: ROUTES.ACCOUNTING, key: 'nav.accounting', icon: BookOpen },
      { to: ROUTES.REPORTS, key: 'nav.reports', icon: BarChart3, roles: ['owner', 'accountant', 'manager'] },
      { to: ROUTES.REPORT_BUILDER, key: 'nav.reportBuilder', icon: SlidersHorizontal, roles: ['owner', 'accountant', 'manager'] },
    ],
  },
  {
    id: 'system',
    items: [
      { to: ROUTES.NOTIFICATIONS, key: 'nav.notifications', icon: Bell },
      { to: ROUTES.AUDIT_LOG, key: 'nav.auditLog', icon: History, roles: ['owner'] },
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
