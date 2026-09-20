// Safe localStorage JSON helpers (never throw in private mode / quota).
const memory = new Map()

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return memory.has(key) ? memory.get(key) : fallback
      return JSON.parse(raw)
    } catch {
      return memory.has(key) ? memory.get(key) : fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      memory.delete(key)
      return true
    } catch {
      memory.set(key, value) // quota exceeded → keep in memory for this session
      return false
    }
  },
  remove(key) {
    try { localStorage.removeItem(key) } catch { /* noop */ }
    memory.delete(key)
  },
}
