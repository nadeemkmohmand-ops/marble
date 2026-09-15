/**
 * Every localStorage key in one place (previously hardcoded in 2+ files).
 * NOTE: `mfa-lang` / `mfa-theme` are stored as RAW strings (not JSON) because
 * the inline script in index.html reads them directly before first paint.
 */
export const STORAGE_PREFIX = 'mfa-'

export const STORAGE_KEYS = {
  LANG: 'mfa-lang',
  THEME: 'mfa-theme',
  INSTALL_DISMISSED: 'mfa-install-dismissed',
  USER: 'mfa-user',
  AUTH: 'mfa-auth',
}

/** Build a namespaced key: storageKey('draft') → 'mfa-draft' */
export const storageKey = (name) => `${STORAGE_PREFIX}${name}`
