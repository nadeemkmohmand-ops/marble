// Central app configuration — reads env vars with sane defaults.
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {}

export const APP_CONFIG = {
  appName: env.VITE_COMPANY_NAME || 'Marble Manager',
  currency: env.VITE_CURRENCY || 'PKR',
  appUrl: env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
  requireAuth: String(env.VITE_REQUIRE_AUTH || 'false') === 'true',

  supabase: {
    url: env.VITE_SUPABASE_URL || '',
    anonKey: env.VITE_SUPABASE_ANON_KEY || '',
    get configured() {
      return Boolean(this.url && this.anonKey)
    },
  },

  // Editable defaults (Settings page can override; stored in STORAGE_KEYS.SETTINGS)
  defaults: {
    urduDigits: true,
    defaultWastagePct: 8, // % wastage on orders
    defaultMarginPct: 20,
    defaultTaxPct: 0,
    bladeThicknessMm: 6.5, // kerf loss per cut
    densityKgPerCft: 76, // marble ≈ 76 kg per cubic foot
    usdRate: 278, // PKR per USD — editable in Settings for imports
    lowStockAreaSqft: 300, // notification threshold
  },
}

export default APP_CONFIG
