import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LanguageProvider, useLanguage } from './LanguageContext.jsx'
import { ThemeProvider, useTheme } from './ThemeContext.jsx'
import { SidebarProvider, useSidebar } from './SidebarContext.jsx'
import { ToastProvider, useToast } from './ToastContext.jsx'
import {
  isSupabaseConfigured,
  NOT_CONFIGURED_MESSAGE,
  supabase,
} from '../services/apiClient.js'

/**
 * AppProviders — composes every app-level provider in one wrapper,
 * so main.jsx stays a one-liner:
 *
 *   <HashRouter><AppProviders><App /></AppProviders></HashRouter>
 *
 * Order matters only for providers that read each other. AuthProvider
 * wraps everything (ProtectedRoute + Login use useAuth). SidebarProvider
 * must stay INSIDE the Router (it uses useLocation).
 */

/* ==========================================================================
 * AUTH — real Supabase Auth (email/password).
 * (AuthContext.jsx was merged into this file so the app needs no extra
 * file — the same reason the Supabase client lives in services/apiClient.js.)
 *
 *  - Restores the session on load (supabase-js persists it in localStorage,
 *    so refreshing the page keeps you signed in)
 *  - Keeps the session fresh via onAuthStateChange
 *  - Loads the user's profiles row (role: 'admin' | 'staff')
 *  - Exposes signIn() / signOut()
 *
 * When Supabase env vars are missing the context falls back to 'guest'
 * status, signIn() returns a clear error, and the Login page shows a
 * setup banner.
 * ======================================================================== */

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'authenticated' | 'guest'

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('guest')
      return undefined
    }

    let mounted = true

    /** Load the profiles row for the signed-in user. */
    async function loadProfile(sessionUser) {
      if (!sessionUser) {
        setProfile(null)
        return
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', sessionUser.id)
          .single()
        if (error) throw error
        if (mounted) setProfile(data)
      } catch {
        // profile missing (e.g. user created before schema ran) — non-fatal
        if (mounted) setProfile(null)
      }
    }

    function applySession(session) {
      if (!mounted) return
      if (session?.user) {
        setUser(session.user)
        setStatus('authenticated')
        loadProfile(session.user)
      } else {
        setUser(null)
        setProfile(null)
        setStatus('guest')
      }
    }

    // restore the existing session first…
    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch(() => {
        if (mounted) setStatus('guest')
      })

    // …then stay in sync with sign-in / sign-out / token refresh
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      mounted = false
      subscription?.subscription?.unsubscribe()
    }
  }, [])

  /** Email + password sign-in. Returns { error } (Supabase convention). */
  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) return { error: new Error(NOT_CONFIGURED_MESSAGE) }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setStatus('guest')
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      role: profile?.role ?? null,
      isAdmin: profile?.role === 'admin',
      status,
      loading: status === 'loading',
      signIn,
      signOut,
    }),
    [user, profile, status, signIn, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/* ========================================================================== */

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export {
  LanguageProvider,
  useLanguage,
  ThemeProvider,
  useTheme,
  SidebarProvider,
  useSidebar,
  ToastProvider,
  useToast,
  AuthProvider,
  useAuth,
}
