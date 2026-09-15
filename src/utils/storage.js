/**
 * Safe localStorage JSON wrapper — replaces the try/catch blocks that were
 * previously duplicated inside AppUIContext / InstallPrompt.
 *
 * NOTE: lang & theme are stored RAW ({ json: false }) on purpose so the
 * inline script in index.html can read them before React boots.
 */
export function storageGet(key, fallback = null, { json = true } = {}) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined) return fallback
    if (!json) return raw
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  } catch {
    return fallback
  }
}

export function storageSet(key, value, { json = true } = {}) {
  try {
    localStorage.setItem(key, json ? JSON.stringify(value) : String(value))
    return true
  } catch {
    /* private mode / quota exceeded — fail silently */
    return false
  }
}

export function storageRemove(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}
