// ─────────────────────────────────────────────────────────────────
// db.js — THE data layer of the app.
// Offline-first: device storage (localStorage) is the source of
// truth, so the app ALWAYS works in the yard without internet.
// If Supabase env vars exist, every change is queued and pushed to
// the cloud; remote rows are pulled and merged on startup/online.
// UI never talks to Supabase directly — only through this module.
// ─────────────────────────────────────────────────────────────────
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'
import { uid } from '../utils/id'
import { isSupabaseConfigured } from './supabaseClient'
import { syncNow, enqueueDelete } from './sync'
import { auditLog, setAuditEmitter } from '../utils/audit'

/** Next human serial for a collection, e.g. BLK-0007 (max existing + 1). */
function nextIdFor(collection, rows) {
  const prefix = uid.prefixFor(collection)
  let max = 0
  rows.forEach((r) => {
    const m = typeof r.id === 'string' && r.id.match(new RegExp('^' + prefix + '-(\\d+)$'))
    if (m) max = Math.max(max, parseInt(m[1], 10))
  })
  let id = `${prefix}-${String(max + 1).padStart(4, '0')}`
  const ids = new Set(rows.map((r) => r.id))
  while (ids.has(id)) id = uid(collection) // collision fallback
  return id
}

const listeners = new Set()

export const COLLECTIONS = {
  blocks: STORAGE_KEYS.BLOCKS,
  slabs: STORAGE_KEYS.SLABS,
  offcuts: STORAGE_KEYS.OFFCUTS,
  movements: STORAGE_KEYS.MOVEMENTS,
  cuttingPlans: STORAGE_KEYS.CUTTING_PLANS,
  jobCards: STORAGE_KEYS.JOB_CARDS,
  machines: STORAGE_KEYS.MACHINES,
  maintenance: STORAGE_KEYS.MAINTENANCE,
  purchases: STORAGE_KEYS.PURCHASES,
  suppliers: STORAGE_KEYS.SUPPLIERS,
  customers: STORAGE_KEYS.CUSTOMERS,
  quotations: STORAGE_KEYS.QUOTATIONS,
  orders: STORAGE_KEYS.ORDERS,
  workers: STORAGE_KEYS.WORKERS,
  attendance: STORAGE_KEYS.ATTENDANCE,
  piecework: STORAGE_KEYS.PIECEWORK,
  payroll: STORAGE_KEYS.PAYROLL,
  expenses: STORAGE_KEYS.EXPENSES,
  partners: STORAGE_KEYS.PARTNERS,
  utilities: STORAGE_KEYS.UTILITIES,
  notifications: STORAGE_KEYS.NOTIFICATIONS,

  // ── v2.4 expansion ──
  workOrders: STORAGE_KEYS.WORK_ORDERS,
  gatePasses: STORAGE_KEYS.GATE_PASSES,
  receipts: STORAGE_KEYS.RECEIPTS,
  ledgerEntries: STORAGE_KEYS.LEDGER_ENTRIES,
  accounts: STORAGE_KEYS.ACCOUNTS,
  vouchers: STORAGE_KEYS.VOUCHERS,
  creditNotes: STORAGE_KEYS.CREDIT_NOTES,
  debitNotes: STORAGE_KEYS.DEBIT_NOTES,
  vehicles: STORAGE_KEYS.VEHICLES,
  trips: STORAGE_KEYS.TRIPS,
  consumables: STORAGE_KEYS.CONSUMABLES,
  consumableMoves: STORAGE_KEYS.CONSUMABLE_MOVES,
  agents: STORAGE_KEYS.AGENTS,
  commissions: STORAGE_KEYS.COMMISSIONS,
  priceLists: STORAGE_KEYS.PRICE_LISTS,
  complaints: STORAGE_KEYS.COMPLAINTS,
  returns: STORAGE_KEYS.RETURNS,
  grn: STORAGE_KEYS.GRN,
  installationJobs: STORAGE_KEYS.INSTALLATION_JOBS,
  stockCounts: STORAGE_KEYS.STOCK_COUNTS,
  auditLog: STORAGE_KEYS.AUDIT_LOG,
  followups: STORAGE_KEYS.FOLLOWUPS,
  branches: STORAGE_KEYS.BRANCHES,
  lots: STORAGE_KEYS.LOTS,
}

function keyOf(collection) {
  const key = COLLECTIONS[collection]
  if (!key) throw new Error(`Unknown collection: ${collection}`)
  return key
}

function emit(collection) {
  listeners.forEach((cb) => {
    try { cb(collection) } catch { /* keep other listeners alive */ }
  })
}

// audit.js pushes events through this bus without importing db.js
// (which would create a cycle) — see setAuditEmitter below.
setAuditEmitter(emit)

export const db = {
  onChange(cb) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },

  /** All records of a collection (newest first by createdAt). */
  list(collection) {
    const rows = storage.get(keyOf(collection), [])
    return [...rows].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  },

  get(collection, id) {
    return this.list(collection).find((r) => r.id === id) || null
  },

  /** Insert or update. Returns the saved record. */
  save(collection, data) {
    const rows = storage.get(keyOf(collection), [])
    const now = new Date().toISOString()
    let rec
    const idx = rows.findIndex((r) => r.id === data.id)
    if (idx >= 0) {
      const before = { ...rows[idx] }
      rec = { ...rows[idx], ...data, id: rows[idx].id, updatedAt: now }
      rows[idx] = rec
      storage.set(keyOf(collection), rows)
      emit(collection)
      if (collection !== 'auditLog') auditLog('save', collection, { recordId: rec.id, before, after: rec })
    } else {
      rec = {
        ...data,
        id: data.id || nextIdFor(collection, rows),
        createdAt: data.createdAt || now,
        updatedAt: now,
      }
      rows.unshift(rec)
      storage.set(keyOf(collection), rows)
      emit(collection)
      if (collection !== 'auditLog') auditLog('save', collection, { recordId: rec.id, after: rec })
    }
    syncNow(collection, rec) // fire & forget cloud mirror
    return rec
  },

  /**
   * Delete a record. Local removal is instant; the cloud delete is
   * queued (tombstoned) so it retries until Supabase confirms — a
   * failed cloud delete can never resurrect the record on next pull.
   */
  remove(collection, id) {
    const rows = storage.get(keyOf(collection), [])
    const removed = rows.find((r) => r.id === id) || null
    const next = rows.filter((r) => r.id !== id)
    storage.set(keyOf(collection), next)
    emit(collection)
    if (collection !== 'auditLog') auditLog('delete', collection, { recordId: id, before: removed })
    if (isSupabaseConfigured()) {
      enqueueDelete(collection, id)
    }
  },

  /** Bulk replace (restore backup / import). */
  replaceAll(collection, items) {
    storage.set(keyOf(collection), items)
    emit(collection)
  },

  /** Replace every collection at once (backup restore). */
  restoreAll(dataObj) {
    Object.entries(dataObj).forEach(([col, items]) => {
      if (COLLECTIONS[col]) storage.set(COLLECTIONS[col], items)
    })
    Object.keys(COLLECTIONS).forEach(emit)
  },

  dumpAll() {
    const out = {}
    Object.entries(COLLECTIONS).forEach(([col, key]) => {
      out[col] = storage.get(key, [])
    })
    return out
  },

  /** Next human friendly serial like BLK-0007 / SLB-0042. */
  nextSerial(collection, prefix) {
    const rows = storage.get(keyOf(collection), [])
    return uid.serial(prefix, rows.length)
  },
}

export default db
