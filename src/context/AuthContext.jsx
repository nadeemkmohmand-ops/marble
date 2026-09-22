import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'
import APP_CONFIG from '../config/app.config'
import { verifyTotp } from '../utils/totp'
import { verifyFingerprint } from '../utils/webauthn'
import { auditLog } from '../utils/audit'

const AuthContext = createContext(null)

/**
 * Single-owner app: the owner account + any emails the owner grants
 * access to. Each granted email = one local user with a role + PIN.
 * Migration: pre-v2.4 devices only had name/role/pin — an email is
 * synthesized from the role so existing installs keep working.
 */
const DEFAULT_USERS = [
  { id: 'usr-owner', name: 'Owner / مالک', email: 'owner@factory.local', role: 'owner', pin: '1111' },
  { id: 'usr-manager', name: 'Manager / منیجر', email: 'manager@factory.local', role: 'manager', pin: '2222' },
  { id: 'usr-accountant', name: 'Accountant / اکاؤنٹنٹ', email: 'accounts@factory.local', role: 'accountant', pin: '3333' },
  { id: 'usr-supervisor', name: 'Supervisor / سپروائزر', email: 'supervisor@factory.local', role: 'supervisor', pin: '4444' },
]

export function defaultSecurity() {
  return {
    fingerprintEnabled: false,
    fingerprintCredentialId: null,
    fingerprintUserId: null,
    pinLockEnabled: false,
    autoLockMin: 0, // 0 = off; N = re-lock after N idle minutes
    sessionTimeoutMin: 0,
    totpEnabled: false,
    totpSecret: null,
    devices: [], // login history [{at, name, ua}]
  }
}

function migrateUsers(list) {
  if (!Array.isArray(list) || !list.length) return DEFAULT_USERS
  return list.map((u, i) => ({
    ...u,
    email: u.email || `${u.role || 'user'}${i === 0 ? '' : i}@factory.local`,
  }))
}

function currentSettings() {
  return storage.get(STORAGE_KEYS.SETTINGS, APP_CONFIG.defaults) || {}
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => migrateUsers(storage.get(STORAGE_KEYS.USERS, DEFAULT_USERS)))
  const [user, setUser] = useState(() => storage.get(STORAGE_KEYS.AUTH, null))
  // Re-opened the app with PIN-lock on? Start locked (fingerprint/PIN re-entry).
  const [locked, setLocked] = useState(() => {
    const saved = storage.get(STORAGE_KEYS.AUTH, null)
    if (!saved) return false
    const sec = (storage.get(STORAGE_KEYS.SETTINGS, {}) || {}).security || {}
    return Boolean(sec.pinLockEnabled)
  })
  const [pending, setPending] = useState(null) // { user, reason: 'totp' } mid-2FA
  const [loginError, setLoginError] = useState('')
  const [settingsVersion, setSettingsVersion] = useState(0)

  // Settings → Security saves dispatch this event so timers/flags refresh live.
  useEffect(() => {
    const bump = () => setSettingsVersion((v) => v + 1)
    window.addEventListener('settings:changed', bump)
    return () => window.removeEventListener('settings:changed', bump)
  }, [])

  useEffect(() => { storage.set(STORAGE_KEYS.USERS, users) }, [users])
  useEffect(() => { storage.set(STORAGE_KEYS.AUTH, user) }, [user])

  const security = useMemo(() => {
    void settingsVersion
    return currentSettings().security || defaultSecurity()
  }, [settingsVersion])

  const recordDevice = useCallback((name) => {
    const s = currentSettings()
    const sec = { ...defaultSecurity(), ...(s.security || {}) }
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    sec.devices = [{ at: new Date().toISOString(), name, ua }, ...(sec.devices || [])].slice(0, 20)
    storage.set(STORAGE_KEYS.SETTINGS, { ...s, security: sec })
  }, [])

  const applyLogin = useCallback((found) => {
    const slim = { id: found.id, name: found.name, email: found.email, role: found.role, at: Date.now() }
    setUser(slim)
    setPending(null)
    setLoginError('')
    setLocked(false)
    recordDevice(found.name)
    auditLog('login', 'auth', { recordId: found.id, after: slim })
    return { ok: true }
  }, [recordDevice])

  /** Email + PIN login, with optional TOTP second factor. */
  const login = useCallback(
    async (email, pin, totpToken) => {
      const found = users.find((u) => String(u.email || '').toLowerCase() === String(email || '').trim().toLowerCase())
      if (!found) return { ok: false, error: 'user_not_found' }
      if (String(found.pin) !== String(pin)) {
        auditLog('security', 'auth', { recordId: found.id, meta: 'wrong PIN' })
        return { ok: false, error: 'wrong_pin' }
      }
      const sec = { ...defaultSecurity(), ...(currentSettings().security || {}) }
      if (sec.totpEnabled && sec.totpSecret) {
        if (!totpToken) {
          setPending({ user: found, reason: 'totp' })
          return { ok: false, needTotp: true }
        }
        const valid = await verifyTotp(sec.totpSecret, totpToken)
        if (!valid) {
          auditLog('security', 'auth', { recordId: found.id, meta: 'wrong 2FA code' })
          return { ok: false, error: 'wrong_totp' }
        }
      }
      return applyLogin(found)
    },
    [users, applyLogin],
  )

  /** Fingerprint quick-unlock (login page + lock screen). */
  const unlockWithFingerprint = useCallback(async () => {
    const sec = { ...defaultSecurity(), ...(currentSettings().security || {}) }
    if (!sec.fingerprintEnabled || !sec.fingerprintCredentialId) return { ok: false, error: 'not_enrolled' }
    const ok = await verifyFingerprint(sec.fingerprintCredentialId)
    if (!ok) return { ok: false, error: 'fingerprint_failed' }
    if (user) {
      setLocked(false)
      auditLog('security', 'auth', { recordId: user.id, meta: 'fingerprint unlock' })
      return { ok: true }
    }
    const found = users.find((u) => u.id === sec.fingerprintUserId) || users.find((u) => u.role === 'owner')
    if (!found) return { ok: false, error: 'user_not_found' }
    return applyLogin(found)
  }, [user, users, applyLogin])

  /** PIN re-entry for the lock screen (already authenticated user). */
  const unlockWithPin = useCallback(
    (pin) => {
      if (!user) return { ok: false, error: 'no_session' }
      const found = users.find((u) => u.id === user.id)
      if (!found || String(found.pin) !== String(pin)) return { ok: false, error: 'wrong_pin' }
      setLocked(false)
      return { ok: true }
    },
    [user, users],
  )

  const logout = useCallback(() => {
    auditLog('security', 'auth', { recordId: user?.id, meta: 'logout' })
    setUser(null)
    setLocked(false)
    setPending(null)
  }, [user])

  /* ── user administration (owner) ── */
  const addUser = useCallback((u) => {
    setUsers((list) => [...list, { ...u, id: `usr-${Date.now().toString(36)}` }])
  }, [])

  const updateUser = useCallback((id, patch) => {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const removeUser = useCallback((id) => {
    setUsers((list) => list.filter((u) => u.id !== id))
  }, [])

  const setLockedState = useCallback((v) => setLocked(Boolean(v)), [])

  /* ── idle auto-lock + session timeout (single watcher) ── */
  useEffect(() => {
    const sec = { ...defaultSecurity(), ...(currentSettings().security || {}) }
    const idleMin = user ? sec.autoLockMin || 0 : 0
    const sessionMin = user ? sec.sessionTimeoutMin || 0 : 0
    if (!idleMin && !sessionMin) return undefined

    let lastActivity = Date.now()
    const onActivity = () => { lastActivity = Date.now() }
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart']
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))

    const timer = setInterval(() => {
      const idleFor = (Date.now() - lastActivity) / 60000
      const sinceLogin = (Date.now() - new Date(storage.get(STORAGE_KEYS.AUTH, {})?.at || Date.now()).getTime()) / 60000
      if (idleMin && idleFor >= idleMin && !locked) {
        auditLog('security', 'auth', { recordId: user?.id, meta: `auto-lock after ${idleMin} min idle` })
        setLocked(true)
      } else if (sessionMin && sinceLogin >= sessionMin) {
        auditLog('security', 'auth', { recordId: user?.id, meta: `session timeout ${sessionMin} min` })
        setUser(null)
      }
    }, 20000)

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity))
      clearInterval(timer)
    }
  }, [user, locked, settingsVersion])

  const value = useMemo(
    () => ({
      user,
      users,
      pending,
      locked,
      loginError,
      setLoginError,
      login,
      logout,
      unlockWithFingerprint,
      unlockWithPin,
      setLocked: setLockedState,
      addUser,
      updateUser,
      removeUser,
      required: APP_CONFIG.requireAuth,
      security,
      canSee: (roles) => !roles || !user || roles.includes(user.role),
    }),
    [user, users, pending, locked, loginError, login, logout, unlockWithFingerprint, unlockWithPin, setLockedState, addUser, updateUser, removeUser, security],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
