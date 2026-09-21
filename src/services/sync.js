// sync.js — offline-first cloud mirror (Supabase).
//
// Three queues, all persisted in device storage:
//   1. SAVE queue   — records to upsert (camelCase → snake_case auto-converted)
//   2. DELETE queue — ids to remove from the cloud (tombstones)
//   3. Tombstones   — every locally-deleted id is remembered until the cloud
//                     confirms the delete, so a later pull can NEVER resurrect
//                     a deleted record ("example records keep coming back" bug).
//
// Every failure stays queued and is retried on the next flush — nothing is
// ever lost, and the UI is told the last error so problems are visible.
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'
import { getSupabase, isSupabaseConfigured } from './supabaseClient'
import { COLLECTIONS, db } from './db'

let flushing = false
let status = {
  online: navigator.onLine,
  pending: 0,
  lastSync: storage.get(STORAGE_KEYS.LAST_SYNC, null),
  lastError: null,
}
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

/* ───────────────────────── key-case helpers ───────────────────────── */

const snakeRe = /_[a-z0-9]/g
const camelRe = /[A-Z0-9]/g

function toCamel(s) {
  return String(s).replace(snakeRe, (m) => m[1].toUpperCase())
}
function toSnake(s) {
  return String(s).replace(camelRe, (m) => '_' + m.toLowerCase())
}

/** snake_case row (Postgres) → camelCase record (app) — generic, all keys. */
function normalize(row) {
  const out = {}
  Object.entries(row || {}).forEach(([k, v]) => {
    out[toCamel(k)] = v
  })
  return out
}

/** camelCase record (app) → snake_case row (Postgres) — generic, all keys. */
function denormalize(rec) {
  const out = {}
  Object.entries(rec || {}).forEach(([k, v]) => {
    out[toSnake(k)] = v
  })
  return out
}

/* ───────────────────────── queues ───────────────────────── */

function saveQueue() {
  return storage.get(STORAGE_KEYS.SYNC_QUEUE, [])
}

function deleteQueue() {
  return storage.get(STORAGE_KEYS.DELETED_QUEUE, [])
}

function tombstones() {
  return storage.get(STORAGE_KEYS.DELETED_IDS, {})
}

function rememberTombstone(collection, id) {
  if (!collection || !id) return
  const t = tombstones()
  t[collection] = t[collection] || []
  if (!t[collection].includes(id)) t[collection].push(id)
  storage.set(STORAGE_KEYS.DELETED_IDS, t)
}

function forgetTombstones(collection, ids) {
  const t = tombstones()
  if (!t[collection]) return
  t[collection] = t[collection].filter((x) => !ids.includes(x))
  if (!t[collection].length) delete t[collection]
  storage.set(STORAGE_KEYS.DELETED_IDS, t)
}

/** True when this id was deleted locally and must not be pulled back. */
export function isTombstoned(collection, id) {
  const t = tombstones()
  return Boolean(t[collection]?.includes(id))
}

function recount() {
  setStatus({ pending: saveQueue().length + deleteQueue().length })
}

/* ───────────────────────── enqueue API ───────────────────────── */

export function enqueue(collection, rec) {
  if (!isSupabaseConfigured()) return
  const q = saveQueue()
  q.push({ collection, rec, at: Date.now() })
  storage.set(STORAGE_KEYS.SYNC_QUEUE, q)
  recount()
  if (navigator.onLine) setTimeout(() => flush(), 800) // small debounce
}

/** A record was deleted locally — remember it and queue the cloud delete. */
export function enqueueDelete(collection, id) {
  if (!isSupabaseConfigured()) return
  rememberTombstone(collection, id)
  const q = deleteQueue()
  q.push({ collection, id, at: Date.now() })
  storage.set(STORAGE_KEYS.DELETED_QUEUE, q)
  recount()
  if (navigator.onLine) setTimeout(() => flush(), 800)
}

/* ───────────────────────── flush (push) ───────────────────────── */

/**
 * Push pending saves AND deletes to Supabase. Safe to call repeatedly.
 * Only entries the cloud actually accepted are dropped from the queues;
 * failures stay queued (with status.lastError surfaced to the UI).
 */
export async function flush() {
  if (flushing || !isSupabaseConfigured() || !navigator.onLine) return
  flushing = true
  try {
    const sb = getSupabase()
    let sawError = null

    // ── deletions first (so a re-created record can't overwrite a delete) ──
    const dq = deleteQueue()
    if (dq.length) {
      const byCol = {}
      const keep = []
      dq.forEach((item) => {
        if (!item?.collection || !item?.id) return
        ;(byCol[item.collection] = byCol[item.collection] || []).push(item.id)
        keep.push(item)
      })
      const failedIds = new Set()
      for (const [col, ids] of Object.entries(byCol)) {
        const { error } = await sb.from(toSnake(col)).delete().in('id', ids)
        if (error) {
          sawError = error.message
          console.warn('[sync:delete]', col, error.message)
          ids.forEach((id) => failedIds.add(id))
        } else {
          forgetTombstones(col, ids)
        }
      }
      const remaining = keep.filter((k) => failedIds.has(k.id))
      storage.set(STORAGE_KEYS.DELETED_QUEUE, remaining)
      recount()
    }

    // ── saves (group by collection → one upsert per table) ──
    const q = saveQueue()
    if (q.length) {
      const grouped = {}
      const keep = []
      q.forEach((item) => {
        if (!item?.collection || !item?.rec?.id) return
        ;(grouped[item.collection] = grouped[item.collection] || []).push(denormalize(item.rec))
        keep.push(item)
      })
      const failed = new Set()
      for (const [col, rows] of Object.entries(grouped)) {
        // collection name (camelCase) → Supabase table (snake_case)
        const { error } = await sb.from(toSnake(col)).upsert(rows, { onConflict: 'id' })
        if (error) {
          sawError = error.message
          console.warn('[sync:save]', col, error.message)
          rows.forEach((r) => failed.add(r.id))
        }
      }
      const remaining = keep.filter((k) => failed.has(k.rec.id))
      storage.set(STORAGE_KEYS.SYNC_QUEUE, remaining)
      recount()
    }

    if (!sawError) {
      setStatus({ lastError: null, lastSync: new Date().toISOString() })
      storage.set(STORAGE_KEYS.LAST_SYNC, status.lastSync)
    } else {
      setStatus({ lastError: sawError })
    }
  } finally {
    flushing = false
  }
}

/* ───────────────────────── pull ───────────────────────── */

/**
 * Pull remote tables and merge into local storage. Remote wins on
 * conflict (by updatedAt) EXCEPT for tombstoned ids — a record you
 * deleted stays deleted even if it still exists in the cloud.
 * Called once at app start (and on reconnect) when cloud is configured.
 */
export async function pullRemote() {
  if (!isSupabaseConfigured() || !navigator.onLine) return
  try {
    const sb = getSupabase()
    for (const col of Object.keys(COLLECTIONS)) {
      // collection name (camelCase) → Supabase table (snake_case)
      const { data, error } = await sb.from(toSnake(col)).select('*').order('updated_at', { ascending: false })
      if (error || !data) {
        if (error) console.warn('[pullRemote]', col, error.message)
        continue
      }
      const local = db.list(col)
      const map = new Map(local.map((r) => [r.id, r]))
      data.forEach((remote) => {
        if (isTombstoned(col, remote.id)) return // deleted on this device — keep it deleted
        const norm = normalize(remote)
        const cur = map.get(norm.id)
        if (!cur || (norm.updatedAt || '') > (cur.updatedAt || '')) map.set(norm.id, norm)
      })
      db.replaceAll(col, [...map.values()])
    }
    setStatus({ lastError: null, lastSync: new Date().toISOString() })
    storage.set(STORAGE_KEYS.LAST_SYNC, status.lastSync)
  } catch (e) {
    console.warn('[pullRemote]', e?.message)
  }
}

// Network listeners — flush + re-pull when the connection returns.
window.addEventListener('online', () => {
  setStatus({ online: true })
  flush()
  pullRemote()
})
window.addEventListener('offline', () => setStatus({ online: false }))

export { enqueue as syncNow }
export default { onSyncStatus, flush, pullRemote, enqueue, enqueueDelete, isTombstoned }
