// Domain enums — single source of truth for statuses & options.
// Values are stable machine keys; labels come from i18n `enums.*`.

export const BLOCK_STATUS = ['available', 'cutting', 'reserved', 'sold', 'rejected']
export const SLAB_STATUS = ['available', 'reserved', 'sold', 'damaged', 'returned']
export const OFFCUT_STATUS = ['available', 'reserved', 'sold', 'wasted']
export const FINISHES = ['polished', 'honed', 'brushed', 'raw']
export const EDGES = ['none', 'chamfer', 'bevel', 'bullnose', 'ogee']
export const GRADES = ['A', 'B', 'C']
export const MOVEMENT_TYPES = [
  'purchase_in',
  'cutting_out',
  'transfer',
  'sale',
  'damage',
  'return',
  'adjustment',
]
export const ORDER_STATUS = [
  'pending',
  'confirmed',
  'cutting',
  'polishing',
  'ready',
  'delivered',
  'invoiced',
  'completed',
  'cancelled',
]
export const QUOTE_STATUS = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']
export const PAYMENT_STATUS = ['unpaid', 'partial', 'paid']
export const WORKER_SKILLS = ['cutter', 'polisher', 'loader', 'fitter', 'foreman', 'helper']
export const RATE_TYPES = ['daily', 'piece']
export const ATTENDANCE_STATUS = ['present', 'absent', 'half', 'leave']
export const MACHINE_TYPES = ['gang_saw', 'multi_wire', 'edge_cutter', 'polishing_line', 'crane', 'loader']
export const MACHINE_STATUS = ['running', 'idle', 'maintenance', 'broken']
export const MAINTENANCE_TYPES = ['blade_change', 'belt', 'bearing', 'electrical', 'oil', 'burn', 'other']
export const EXPENSE_CATEGORIES = [
  'electricity',
  'solar',
  'diesel',
  'rent',
  'transport',
  'tools',
  'blades',
  'tea',
  'food',
  'salaries',
  'repairs',
  'misc',
]
export const SUPPLIER_TYPES = ['quarry', 'import', 'local']
export const SELL_BY = ['sqft', 'running_ft', 'piece']
export const CURRENCIES = ['PKR', 'USD', 'EUR', 'AED', 'CNY']

// Partners — the rock business relations around the factory (manual register).
export const PARTNER_TYPES = [
  'raw_lend',      // gives raw rocks on credit (lend)
  'marble_borrow', // takes cut marble on credit (borrow)
  'custom_cut',    // brings own rock; factory cuts it for a fee
  'transport',     // brings rocks in their own vehicles
  'other',
]

// Utilities — electricity & solar billing (unit price is manual, it changes).
export const UTILITY_TYPES = ['electricity', 'solar']

// Badge color per status key (shared look across pages)
export const STATUS_TONE = {
  available: 'success',
  running: 'success',
  present: 'success',
  paid: 'success',
  accepted: 'success',
  completed: 'success',
  delivered: 'success',
  invoiced: 'info',
  sent: 'info',
  cutting: 'warning',
  polishing: 'warning',
  ready: 'info',
  pending: 'warning',
  partial: 'warning',
  reserved: 'info',
  idle: 'muted',
  draft: 'muted',
  leave: 'muted',
  half: 'warning',
  maintenance: 'warning',
  returned: 'warning',
  expired: 'muted',
  converted: 'info',
  transferred: 'info',
  custom_cut: 'info',
  transport: 'info',
  raw_lend: 'warning',
  marble_borrow: 'brand',
  electricity: 'warning',
  solar: 'success',
  sold: 'brand',
  confirmed: 'brand',
  absent: 'danger',
  damaged: 'danger',
  broken: 'danger',
  wasted: 'danger',
  rejected: 'danger',
  cancelled: 'danger',
  unpaid: 'danger',
}

export const statusTone = (key) => STATUS_TONE[key] || 'muted'
