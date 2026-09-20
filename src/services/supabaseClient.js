import { createClient } from '@supabase/supabase-js'
import APP_CONFIG from '../config/app.config'

let client = null

export function getSupabase() {
  if (!APP_CONFIG.supabase.configured) return null
  if (!client) {
    client = createClient(APP_CONFIG.supabase.url, APP_CONFIG.supabase.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return client
}

export function isSupabaseConfigured() {
  return APP_CONFIG.supabase.configured
}

// Quick connectivity probe used by Settings → "Test connection"
export async function testConnection() {
  const sb = getSupabase()
  if (!sb) return { ok: false, reason: 'not_configured' }
  try {
    const { error } = await sb.from('blocks').select('id', { count: 'exact', head: true })
    return { ok: !error, reason: error?.message }
  } catch (e) {
    return { ok: false, reason: e?.message || 'network_error' }
  }
}
