// ─────────────────────────────────────────────────────────────────
// audit.js — who changed what, before → after, when.
// Entries land in the `auditLog` collection (append-only in the UI,
// RLS-protected append-only table in Supabase). Called automatically
// from db.save / db.remove — pages never log by hand.
// NOTE: imports storage only (never db.js) — db.js imports THIS file,
// and a cycle here would break the whole data layer.
// ─────────────────────────────────────────────────────────────────
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from './storage'

const MAX_ENTRIES = 500

/* db.js registers its event-bus emitter here at startup so audit
   writes surface reactively in useCollection('auditLog') without a
   circular import (audit ← db would be a cycle). */
let emitter = null
export function setAuditEmitter(fn) {
  emitter = fn
}

function currentUser() {
  const u = storage.get(STORAGE_KEYS.AUTH, null)
  return u ? u.name : 'system'
}

/** Field-level diff between two records (timestamps excluded). */
export function diffRecords(before, after) {
  const changes = []
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
  keys.forEach((k) => {
    if (k === 'updatedAt' || k === 'createdAt') return
    const a = before?.[k]
    const b = after?.[k]
    const same = JSON.stringify(a) === JSON.stringify(b)
    if (!same) changes.push({ field: k, before: a ?? null, after: b ?? null })
  })
  return changes
}

/** Read all entries (newest first). */
export function readAuditLog() {
  return storage.get(STORAGE_KEYS.AUDIT_LOG, [])
}

/**
 * Append one audit event. Never throws — auditing must not break saves.
 * Emits the same event-bus notification pattern through a CustomEvent
 * that AuditLog.jsx listens for, and mirrors to the cloud queue.
 */
export function auditLog(action, collection, { recordId, before = null, after = null, meta = null } = {}) {
  try {
    const entry = {
      id: `AUD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      at: new Date().toISOString(),
      user: currentUser(),
      action, // 'save' | 'delete' | 'login' | 'security' | 'export' | 'clear'
      collection: collection || null,
      recordId: recordId || after?.id || before?.id || null,
      changes: action === 'save' && before ? diffRecords(before, after) : undefined,
      after: after ? compact(after) : null,
      before: before ? compact(before) : null,
      meta,
    }
    const rows = storage.get(STORAGE_KEYS.AUDIT_LOG, [])
    rows.unshift(entry)
    if (rows.length > MAX_ENTRIES) rows.length = MAX_ENTRIES
    storage.set(STORAGE_KEYS.AUDIT_LOG, rows)
    if (emitter) emitter('auditLog')
    window.dispatchEvent(new CustomEvent('auditlog:changed', { detail: entry }))
    try {
      import('../services/sync').then((m) => m.syncNow && m.syncNow('auditLog', entry)).catch(() => {})
    } catch { /* no cloud configured */ }
    return entry
  } catch { /* auditing must never crash the app */ }
  return null
}

/** Wipe the log (owner-only action, itself audited as 'clear'). */
export function clearAuditLog() {
  auditLog('clear', 'auditLog', { meta: 'log cleared by owner' })
  storage.set(STORAGE_KEYS.AUDIT_LOG, [])
}

/** Trim bulky payloads (photos/signatures, big arrays) out of the log. */
function compact(rec) {
  const out = {}
  Object.entries(rec || {}).forEach(([k, v]) => {
    if (typeof v === 'string' && v.length > 300) out[k] = `<${Math.round(v.length / 1024)}KB>`
    else if (Array.isArray(v) && v.length > 10) out[k] = `<array:${v.length}>`
    else out[k] = v
  })
  return out
}

export default auditLog
