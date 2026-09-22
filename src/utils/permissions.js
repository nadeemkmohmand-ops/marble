// ─────────────────────────────────────────────────────────────────
// permissions.js — granular per-module permissions + approval rules.
//
// Matrix shape (stored under STORAGE_KEYS.SETTINGS → .permissions):
//   { [role]: { [moduleKey]: { view, add, edit, delete, export } } }
// Owner always has everything (hard-coded, never editable).
// Approval rules (SETTINGS → .approvals):
//   { discountPct: 10, bigReceipt: 100000 } — non-owner roles are
//   blocked at save time with an "owner approval required" reason.
// ─────────────────────────────────────────────────────────────────
import { storage } from './storage'
import { STORAGE_KEYS } from '../constants/storageKeys'

export const MODULES = [
  'home', 'calculator', 'inventory', 'blocks', 'slabs', 'lots', 'offcuts',
  'movements', 'stockCount', 'production', 'machines', 'maintenance',
  'consumables', 'purchases', 'suppliers', 'partners', 'vehicles',
  'customers', 'quotations', 'orders', 'workOrders', 'agents',
  'priceLists', 'installation', 'receipts', 'gatePasses', 'complaints',
  'workers', 'attendance', 'payroll', 'expenses', 'utilities',
  'ledgers', 'accounting', 'reports', 'reportBuilder', 'notifications',
  'auditLog', 'settings', 'about',
]

export const ACTIONS = ['view', 'add', 'edit', 'delete', 'export']

const full = () => ACTIONS.reduce((m, a) => ({ ...m, [a]: true }), {})

/** Default: everyone can view everything; only owner+manager can edit production/finance masters. */
export function defaultPermissions() {
  const roles = ['owner', 'manager', 'accountant', 'supervisor']
  const matrix = {}
  roles.forEach((role) => {
    const perModule = {}
    MODULES.forEach((mod) => {
      const base = { view: true, add: true, edit: true, delete: true, export: true }
      if (role === 'supervisor') {
        // supervisors run the yard: no finance, no deleting masters
        base.delete = !['orders', 'customers', 'quotations'].includes(mod) ? false : true
        base.view = !['accounting', 'ledgers', 'reports', 'reportBuilder', 'auditLog', 'payroll'].includes(mod)
        if (!base.view) { base.add = false; base.edit = false; base.delete = false; base.export = false }
      }
      if (role === 'accountant') {
        base.view = !['production', 'attendance', 'maintenance', 'auditLog'].includes(mod)
      }
      perModule[mod] = base
    })
    matrix[role] = perModule
  })
  return matrix
}

export function getPermissions(settings) {
  return settings?.permissions || defaultPermissions()
}

/** Owner bypasses everything; otherwise consult the matrix (default allow). */
export function can(user, settings, moduleKey, action = 'view') {
  if (!user) return true // open-yard mode when auth not required
  if (user.role === 'owner') return true
  const matrix = getPermissions(settings)
  const cell = matrix[user.role]?.[moduleKey]
  if (!cell) return true
  return Boolean(cell[action])
}

/**
 * Amount-based approval gate — called before saving orders,
 * quotations and receipts. Returns { ok, reason }.
 */
export function checkApprovals(form, settings, user) {
  if (!user || user.role === 'owner') return { ok: true }
  const rules = settings?.approvals || {}
  const discountPct = Number(form?.discountPct ?? (form?.discount && form?.itemsTotal ? (form.discount / form.itemsTotal) * 100 : 0)) || 0
  if (rules.discountPct > 0 && discountPct > rules.discountPct) {
    return { ok: false, reason: `Discount ${discountPct.toFixed(1)}% exceeds the ${rules.discountPct}% limit — owner approval required` }
  }
  const amount = Number(form?.amount ?? form?.total ?? 0) || 0
  if (rules.bigReceipt > 0 && amount > rules.bigReceipt && form?.direction) {
    return { ok: false, reason: `Amount ${amount} exceeds the ${rules.bigReceipt} approval limit — owner approval required` }
  }
  return { ok: true }
}

/** Owner-only helpers used across settings & audit pages. */
export function isOwner(user) {
  return user?.role === 'owner'
}
