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
import { isSupabaseConfigured, getSupabase } from './supabaseClient'
import { syncNow } from './sync'

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
  notifications: STORAGE_KEYS.NOTIFICATIONS,
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
      rec = { ...rows[idx], ...data, id: rows[idx].id, updatedAt: now }
      rows[idx] = rec
    } else {
      rec = {
        ...data,
        id: data.id || nextIdFor(collection, rows),
        createdAt: data.createdAt || now,
        updatedAt: now,
      }
      rows.unshift(rec)
    }
    storage.set(keyOf(collection), rows)
    emit(collection)
    syncNow(collection, rec) // fire & forget cloud mirror
    return rec
  },

  remove(collection, id) {
    const rows = storage.get(keyOf(collection), [])
    const next = rows.filter((r) => r.id !== id)
    storage.set(keyOf(collection), next)
    emit(collection)
    if (isSupabaseConfigured()) {
      getSupabase()?.from(collection).delete().eq('id', id).then(() => {}, () => {})
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
