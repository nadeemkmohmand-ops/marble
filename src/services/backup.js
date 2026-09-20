// backup.js — full JSON backup / restore of every collection + settings.
import { db } from './db'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'

export function createBackup() {
  const payload = {
    app: 'marble-manager',
    version: 2,
    exportedAt: new Date().toISOString(),
    data: db.dumpAll(),
    settings: {
      company: storage.get(STORAGE_KEYS.COMPANY, null),
      settings: storage.get(STORAGE_KEYS.SETTINGS, null),
      users: storage.get(STORAGE_KEYS.USERS, null),
    },
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `marble-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function restoreBackup(file, db) {
  const text = await file.text()
  const parsed = JSON.parse(text)
  if (!parsed?.data) throw new Error('Invalid backup file')
  db.restoreAll(parsed.data)
  if (parsed.settings?.company) storage.set(STORAGE_KEYS.COMPANY, parsed.settings.company)
  if (parsed.settings?.settings) storage.set(STORAGE_KEYS.SETTINGS, parsed.settings.settings)
  if (parsed.settings?.users) storage.set(STORAGE_KEYS.USERS, parsed.settings.users)
  return true
}
