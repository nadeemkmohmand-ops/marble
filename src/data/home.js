/** Static dashboard placeholder data — no logic, no persistence. */
import {
  AlertTriangle,
  Boxes,
  Calculator,
  ClipboardList,
  Layers,
  Plus,
  Scissors,
  TrendingUp,
  Truck,
} from 'lucide-react'

export const homeStats = [
  {
    labelKey: 'home.totalSlabs',
    value: '248',
    icon: Layers,
    iconClass: 'bg-primary-50 text-primary dark:bg-primary/25 dark:text-primary-light',
  },
  {
    labelKey: 'home.todaysProduction',
    value: '32',
    icon: TrendingUp,
    iconClass: 'bg-success/10 text-success',
  },
  {
    labelKey: 'home.pendingOrders',
    value: '14',
    icon: ClipboardList,
    iconClass: 'bg-warning/15 text-warning-dark dark:text-warning',
  },
  {
    labelKey: 'home.lowStockAlerts',
    value: '5',
    icon: AlertTriangle,
    iconClass: 'bg-error/10 text-error',
  },
]

export const quickActions = [
  {
    to: '/calculator',
    labelKey: 'home.newCalculation',
    icon: Calculator,
    cls: 'bg-accent text-white hover:bg-accent-light',
  },
  {
    to: '/inventory',
    labelKey: 'home.viewInventory',
    icon: Boxes,
    cls: 'border border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:border-accent hover:text-accent dark:text-[var(--text)]',
  },
  {
    to: '/reports',
    labelKey: 'home.generateReport',
    icon: TrendingUp,
    cls: 'bg-primary text-white hover:bg-primary-light',
  },
]

export const recentActivities = [
  {
    id: 1,
    title: { ur: 'نیا سلیب گودام میں شامل ہوا', en: 'New slab added to warehouse' },
    detail: { ur: '8 × 4 فٹ — گودام اے', en: '8 × 4 ft — Warehouse A' },
    time: { ur: '10 منٹ پہلے', en: '10 minutes ago' },
    icon: Plus,
    iconClass: 'bg-success/10 text-success',
  },
  {
    id: 2,
    title: { ur: 'آرڈر نمبر 124 کی کٹنگ مکمل', en: 'Cutting completed for Order #124' },
    detail: { ur: '24 ٹکڑے — 12 × 12 سائز', en: '24 pieces — 12 × 12 size' },
    time: { ur: '2 گھنٹے پہلے', en: '2 hours ago' },
    icon: Scissors,
    iconClass: 'bg-primary-50 text-primary dark:bg-primary/25 dark:text-primary-light',
  },
  {
    id: 3,
    title: { ur: 'سلیب MB-003 کا ذخیرہ کم', en: 'Low stock for slab MB-003' },
    detail: { ur: 'صرف 4 سلیبز باقی', en: 'Only 4 slabs remaining' },
    time: { ur: '3 گھنٹے پہلے', en: '3 hours ago' },
    icon: AlertTriangle,
    iconClass: 'bg-warning/15 text-warning-dark dark:text-warning',
  },
  {
    id: 4,
    title: { ur: '12 سلیبز روانہ کر دیے گئے', en: '12 slabs dispatched' },
    detail: { ur: 'آرڈر 122 — لڈنگ زون', en: 'Order 122 — Loading zone' },
    time: { ur: 'کل، شام 5:00', en: 'Yesterday, 5:00 PM' },
    icon: Truck,
    iconClass: 'bg-primary-50 text-primary dark:bg-primary/25 dark:text-primary-light',
  },
]
