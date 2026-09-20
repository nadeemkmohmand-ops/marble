// All localStorage keys in one place — never scatter raw strings around the app.
const NS = 'marble'

const k = (name) => `${NS}.${name}`

export const STORAGE_KEYS = {
  LANG: k('lang'),
  THEME: k('theme'),
  URDU_DIGITS: k('urduDigits'),
  SIDEBAR: k('sidebar'),
  AUTH: k('auth'),
  USERS: k('users'),
  SETTINGS: k('settings'),
  COMPANY: k('company'),
  SYNC_QUEUE: k('syncQueue'),
  LAST_SYNC: k('lastSync'),
  SEED_DONE: k('seedDone'),
  PRINT_REQUEST: k('printRequest'),

  // data collections
  BLOCKS: k('blocks'),
  SLABS: k('slabs'),
  OFFCUTS: k('offcuts'),
  MOVEMENTS: k('movements'),
  CUTTING_PLANS: k('cuttingPlans'),
  JOB_CARDS: k('jobCards'),
  MACHINES: k('machines'),
  MAINTENANCE: k('maintenance'),
  PURCHASES: k('purchases'),
  SUPPLIERS: k('suppliers'),
  CUSTOMERS: k('customers'),
  QUOTATIONS: k('quotations'),
  ORDERS: k('orders'),
  WORKERS: k('workers'),
  ATTENDANCE: k('attendance'),
  PIECEWORK: k('piecework'),
  PAYROLL: k('payroll'),
  EXPENSES: k('expenses'),
  NOTIFICATIONS: k('notifications'),
}

export default STORAGE_KEYS
