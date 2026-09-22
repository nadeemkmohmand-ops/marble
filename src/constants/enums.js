// Domain enums — single source of truth for statuses & options.
// Values are stable machine keys; labels come from i18n `enums.*`.

export const BLOCK_STATUS = ['available', 'cutting', 'reserved', 'sold', 'rejected']
export const SLAB_STATUS = ['available', 'reserved', 'sold', 'damaged', 'returned', 'held']
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

// ── v2.4 expansion — documents, finance & operations enums ──
export const WORK_ORDER_STATUS = ['draft', 'issued', 'in_progress', 'paused', 'done', 'cancelled']
export const JOB_TYPES = ['cutting', 'polishing', 'edge', 'chamfer']
export const JOB_STATUS = ['pending', 'running', 'paused', 'done', 'cancelled']
export const PAYMENT_METHODS = ['cash', 'bank', 'cheque', 'online', 'other']
export const GATE_PASS_TYPES = ['delivery', 'return', 'transfer', 'waste']
export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense']
export const VOUCHER_TYPES = ['journal', 'payment', 'receipt']
export const VEHICLE_TYPES = ['truck', 'trailer', 'pickup', 'trailer_truck', 'other']
export const TRIP_STATUS = ['planned', 'loaded', 'in_transit', 'delivered', 'cancelled']
export const CONSUMABLE_TYPES = ['blade', 'belt', 'bearing', 'chemical', 'abrasive', 'fuel', 'spare', 'other']
export const COMPLAINT_STATUS = ['open', 'investigating', 'resolved', 'rejected', 'compensated']
export const RETURN_STATUS = ['requested', 'received', 'restocked', 'scrapped', 'credited']
export const GRN_STATUS = ['draft', 'received', 'verified', 'discrepancy']
export const INSTALL_STATUS = ['scheduled', 'measured', 'in_progress', 'done', 'signed_off']
export const COMMISSION_STATUS = ['earned', 'approved', 'paid']
export const AGENT_TYPES = ['salesman', 'broker', 'contractor']
export const CUSTOMER_TYPES = ['retail', 'wholesale', 'builder', 'government']
export const COUNT_STATUS = ['open', 'counting', 'review', 'closed']
export const STOCK_COUNT_SCOPE = ['slabs', 'blocks', 'offcuts', 'consumables']
export const WHT_TYPES = ['none', 'goods_1p5', 'services_10', 'custom']

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
  // v2.4
  held: 'muted',
  issued: 'info',
  in_progress: 'warning',
  paused: 'muted',
  done: 'success',
  cash: 'success',
  bank: 'info',
  cheque: 'warning',
  online: 'brand',
  delivery: 'info',
  waste: 'danger',
  asset: 'info',
  liability: 'warning',
  equity: 'brand',
  income: 'success',
  expense: 'danger',
  journal: 'muted',
  payment: 'warning',
  loaded: 'info',
  in_transit: 'warning',
  planned: 'muted',
  investigating: 'info',
  resolved: 'success',
  compensated: 'brand',
  requested: 'warning',
  restocked: 'success',
  scrapped: 'danger',
  credited: 'brand',
  verified: 'success',
  discrepancy: 'danger',
  measured: 'info',
  signed_off: 'success',
  scheduled: 'muted',
  earned: 'warning',
  approved: 'info',
  retail: 'info',
  wholesale: 'brand',
  builder: 'warning',
  government: 'muted',
  counting: 'info',
  review: 'warning',
  closed: 'success',
}

export const statusTone = (key) => STATUS_TONE[key] || 'muted'
