// sync.js — offline-first cloud mirror.
// Every db.save() enqueues the record; when the device is online and
// Supabase is configured the queue is flushed (upsert per collection).
// Failures stay queued — nothing is ever lost.
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'
import { getSupabase, isSupabaseConfigured } from './supabaseClient'

let flushing = false
let status = { online: navigator.onLine, pending: 0, lastSync: storage.get(STORAGE_KEYS.LAST_SYNC, null) }
const statusListeners = new Set()

export function onSyncStatus(cb) {
  statusListeners.add(cb)
  cb(status)
  return () => statusListeners.delete(cb)
}

function setStatus(patch) {
  status = { ...status, ...patch }
  statusListeners.forEach((cb) => cb(status))
}

function queue() {
  return storage.get(STORAGE_KEYS.SYNC_QUEUE, [])
}

export function enqueue(collection, rec) {
  if (!isSupabaseConfigured()) return
  const q = queue()
  q.push({ collection, rec, at: Date.now() })
  storage.set(STORAGE_KEYS.SYNC_QUEUE, q)
  setStatus({ pending: q.length })
  if (navigator.onLine) setTimeout(() => flush(), 800) // small debounce
}

/** Push pending queue to Supabase. Safe to call repeatedly. */
export async function flush() {
  if (flushing || !isSupabaseConfigured() || !navigator.onLine) return
  flushing = true
  try {
    const sb = getSupabase()
    const q = queue()
    if (!q.length) return
    // group by collection → one upsert per table
    const grouped = {}
    const keep = []
    q.forEach((item) => {
      if (!item?.collection || !item?.rec?.id) return
      grouped[item.collection] = grouped[item.collection] || []
      grouped[item.collection].push(item.rec)
      keep.push(item)
    })
    let failed = false
    for (const [table, rows] of Object.entries(grouped)) {
      const { error } = await sb.from(table).upsert(rows, { onConflict: 'id' })
      if (error) { failed = true; console.warn('[sync]', table, error.message) }
    }
    if (!failed) {
      storage.set(STORAGE_KEYS.SYNC_QUEUE, [])
      setStatus({ pending: 0, lastSync: new Date().toISOString() })
      storage.set(STORAGE_KEYS.LAST_SYNC, status.lastSync)
    } else {
      setStatus({ pending: queue().length })
    }
  } finally {
    flushing = false
  }
}

/**
 * Pull remote tables and merge into local (remote wins on conflict by
 * updatedAt). Called once at app start when cloud is configured.
 */
export async function pullRemote(db) {
  if (!isSupabaseConfigured() || !navigator.onLine) return
  try {
    const sb = getSupabase()
    const tables = ['blocks', 'slabs', 'offcuts', 'movements', 'machines', 'maintenance', 'purchases',
      'suppliers', 'customers', 'quotations', 'orders', 'workers', 'attendance', 'piecework',
      'payroll', 'expenses']
    for (const table of tables) {
      const { data, error } = await sb.from(table).select('*').order('updated_at', { ascending: false })
      if (error || !data) continue
      const local = db.list(table)
      const map = new Map(local.map((r) => [r.id, r]))
      data.forEach((remote) => {
        const norm = normalize(remote)
        const cur = map.get(norm.id)
        if (!cur || (norm.updatedAt || '') > (cur.updatedAt || '')) map.set(norm.id, norm)
      })
      db.replaceAll(table, [...map.values()])
    }
    setStatus({ lastSync: new Date().toISOString() })
    storage.set(STORAGE_KEYS.LAST_SYNC, status.lastSync)
  } catch (e) {
    console.warn('[pullRemote]', e?.message)
  }
}

function normalize(row) {
  // snake_case (SQL) → camelCase (app)
  const out = { ...row }
  const remap = {
    block_no: 'blockNo', lot_no: 'lotNo', parent_block: 'parentBlock', parent_slab: 'parentSlab',
    slab_id: 'slabId', bundle_id: 'bundleId', updated_at: 'updatedAt', created_at: 'createdAt',
    order_id: 'orderId', customer_id: 'customerId', worker_id: 'workerId', machine_id: 'machineId',
    supplier_id: 'supplierId', due_date: 'dueDate', next_due: 'nextDue', down_hours: 'downHours',
    daily_rate: 'dailyRate', rate_type: 'rateType', piece_rate: 'pieceRate', phone: 'phone',
    total_amount: 'totalAmount', paid_amount: 'paidAmount', purchase_cost: 'purchaseCost',
  }
  Object.entries(remap).forEach(([snake, camel]) => {
    if (snake in out && !(camel in out)) out[camel] = out[snake]
  })
  return out
}

// Network listeners
window.addEventListener('online', () => { setStatus({ online: true }); flush() })
window.addEventListener('offline', () => setStatus({ online: false }))

export { enqueue as syncNow }
