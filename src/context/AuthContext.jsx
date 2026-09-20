import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'
import APP_CONFIG from '../config/app.config'

const AuthContext = createContext(null)

const DEFAULT_USERS = [
  { id: 'usr-owner', name: 'Owner / مالک', role: 'owner', pin: '1111' },
  { id: 'usr-manager', name: 'Manager / منیجر', role: 'manager', pin: '2222' },
  { id: 'usr-accountant', name: 'Accountant / اکاؤنٹنٹ', role: 'accountant', pin: '3333' },
  { id: 'usr-supervisor', name: 'Supervisor / سپروائزر', role: 'supervisor', pin: '4444' },
]

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => storage.get(STORAGE_KEYS.USERS, DEFAULT_USERS))
  const [user, setUser] = useState(() => storage.get(STORAGE_KEYS.AUTH, null))

  useEffect(() => {
    storage.set(STORAGE_KEYS.USERS, users)
  }, [users])
  useEffect(() => {
    storage.set(STORAGE_KEYS.AUTH, user)
  }, [user])

  const login = useCallback(
    (userId, pin) => {
      const found = users.find((u) => u.id === userId)
      if (!found) return { ok: false, error: 'user_not_found' }
      if (String(found.pin) !== String(pin)) return { ok: false, error: 'wrong_pin' }
      setUser({ id: found.id, name: found.name, role: found.role })
      return { ok: true }
    },
    [users],
  )

  const logout = useCallback(() => setUser(null), [])

  const addUser = useCallback((u) => {
    setUsers((list) => [...list, { ...u, id: `usr-${Date.now().toString(36)}` }])
  }, [])

  const removeUser = useCallback((id) => {
    setUsers((list) => list.filter((u) => u.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      user,
      users,
      login,
      logout,
      addUser,
      removeUser,
      required: APP_CONFIG.requireAuth,
      canSee: (roles) => !roles || !user || roles.includes(user.role),
    }),
    [user, users, login, logout, addUser, removeUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
