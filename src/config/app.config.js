/**
 * App configuration — single place reading import.meta.env.
 * Copy .env.example → .env and adjust; every value has a safe fallback
 * so the app runs without a .env file at all.
 */
const env = import.meta.env || {}

const DATA_SOURCES = ['mock', 'local', 'api']

export const appConfig = Object.freeze({
  /** Display name (English reference — on-screen labels come from i18n) */
  name: env.VITE_APP_NAME || 'Marble Factory Management',
  version: env.VITE_APP_VERSION || '1.1.0',
  /** 'ur' (RTL default) | 'en' */
  defaultLang: env.VITE_DEFAULT_LANG === 'en' ? 'en' : 'ur',
  /** 'mock' | 'local' | 'api' — see .env.example */
  dataSource: DATA_SOURCES.includes(env.VITE_DATA_SOURCE) ? env.VITE_DATA_SOURCE : 'mock',
  /** Base URL for src/services/apiClient.js (empty until a backend exists) */
  apiBaseUrl: env.VITE_API_BASE_URL || '',
  isDev: Boolean(env.DEV),
  isProd: Boolean(env.PROD),
})

export default appConfig
