import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LogIn, Mail, KeyRound, Fingerprint, ShieldCheck, Languages, ArrowRight,
  Gem, Loader2, CheckCircle2,
} from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import ROUTES from '../constants/routes'
import APP_INFO from '../constants/appInfo'
import { webauthnAvailable } from '../utils/webauthn'

/**
 * Login v2 — the front door of the factory.
 * Animated aurora + floating 3D marble objects (pure CSS, GPU only),
 * glassmorphism card, email + PIN (+ TOTP second factor when enabled)
 * and one-tap fingerprint unlock when the device is enrolled.
 */
export default function Login() {
  const { t, lang, toggleLang } = useLang()
  const { users, login, unlockWithFingerprint, security, required, pending } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const remembered = useMemo(() => localStorage.getItem('marble.lastEmail') || '', [])
  const [form, setForm] = useState({ email: remembered, pin: '', totp: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [fpBusy, setFpBusy] = useState(false)
  const [fpOk, setFpOk] = useState(false)

  const fpAvailable = useMemo(() => webauthnAvailable(), [])
  const fpEnrolled = Boolean(security?.fingerprintEnabled && security?.fingerprintCredentialId)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await login(form.email, form.pin, form.totp || undefined)
    setBusy(false)
    if (res.ok) {
      localStorage.setItem('marble.lastEmail', form.email)
      navigate(location.state?.from || ROUTES.HOME)
    } else if (res.needTotp) {
      setError(lang === 'ur' ? 'دو مرحلہ کوڈ درکار ہے' : 'Enter your 2-factor code')
    } else {
      setError(
        res.error === 'wrong_pin'
          ? (lang === 'ur' ? 'PIN غلط ہے' : t('login.wrongPin'))
          : res.error === 'wrong_totp'
            ? (lang === 'ur' ? 'دو مرحلہ کوڈ غلط ہے' : 'Wrong 2FA code')
            : (lang === 'ur' ? 'یہ ای میل اجازت شدہ نہیں ہے' : t('login.userNotFound')),
      )
    }
  }

  const tryFingerprint = async () => {
    setFpBusy(true)
    setError('')
    const res = await unlockWithFingerprint()
    setFpBusy(false)
    if (res.ok) {
      setFpOk(true)
      setTimeout(() => navigate(location.state?.from || ROUTES.HOME), 450)
    } else {
      setError(lang === 'ur' ? 'فنگر پرنٹ سے پہچان نہیں ہوئی' : 'Fingerprint not recognised — use email & PIN')
    }
  }

  /* Pointer parallax — one rAF-throttled handler moves every object. */
  const stageRef = useRef(null)
  const onPointerMove = useCallback((e) => {
    const el = stageRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.innerWidth < 768) return // phones stay still → battery friendly
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect()
      const px = ((e.clientX - r.left) / r.width - 0.5) * 2
      const py = ((e.clientY - r.top) / r.height - 0.5) * 2
      el.style.setProperty('--px', px.toFixed(3))
      el.style.setProperty('--py', py.toFixed(3))
    })
  }, [])

  useEffect(() => () => stageRef.current?.removeProperty('--px'), [])

  const ur = lang === 'ur'

  return (
    <div ref={stageRef} className="login-page grid place-items-center p-4" onPointerMove={onPointerMove}>
      {/* ── animated background ── */}
      <div className="login-aurora" aria-hidden="true" />
      <div className="login-dots" aria-hidden="true" />

      {/* ── floating 3D objects ── */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Marble slab, top-left */}
        <div className="parallax shape3d" style={{ top: '12%', insetInlineStart: '7%', '--depth': '18px' }}>
          <div className="slab3d" style={{ '--w': '7rem', '--h': '4.6rem', '--d': '1.4rem', width: '7rem', height: '4.6rem' }}>
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>
        {/* Spinning gradient cube, right */}
        <div className="parallax shape3d" style={{ top: '20%', insetInlineEnd: '9%', '--depth': '26px' }}>
          <div className="cube3d cube3d-lg">
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>
        {/* Glass sphere */}
        <div className="parallax shape3d" style={{ bottom: '16%', insetInlineStart: '10%', '--depth': '22px' }}>
          <span className="shape3d-sphere" style={{ display: 'block', width: '4.6rem', height: '4.6rem' }} />
        </div>
        {/* Gyroscope ring */}
        <div className="parallax shape3d" style={{ bottom: '22%', insetInlineEnd: '7%', '--depth': '30px' }}>
          <span className="shape3d-ring" style={{ display: 'block', width: '6.4rem', height: '6.4rem' }} />
        </div>
        {/* Gem */}
        <div className="parallax shape3d" style={{ top: '44%', insetInlineStart: '3%', '--depth': '14px' }}>
          <span className="shape3d-gem" style={{ display: 'block', width: '2.8rem', height: '3.1rem' }} />
        </div>
        {/* Tiny marble slab, bottom right */}
        <div className="parallax shape3d" style={{ bottom: '8%', insetInlineEnd: '26%', '--depth': '10px' }}>
          <div className="slab3d" style={{ '--w': '4.4rem', '--h': '2.9rem', '--d': '0.9rem', width: '4.4rem', height: '2.9rem', animationDuration: '22s' }}>
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>
        {/* Colorful orbs */}
        <div className="parallax orb animate-floatSlow" style={{ top: '30%', insetInlineStart: '22%', width: 22, height: 22, '--depth': '34px', '--orb-bg': 'linear-gradient(135deg,#fbbf24,#d97706)', '--orb-shadow': 'rgba(217,119,6,.55)' }} />
        <div className="parallax orb animate-floatSlower" style={{ bottom: '30%', insetInlineEnd: '20%', width: 16, height: 16, '--depth': '40px', '--orb-bg': 'linear-gradient(135deg,#34d399,#059669)', '--orb-shadow': 'rgba(5,150,105,.5)', animationDelay: '-3s' }} />
        <div className="parallax orb animate-floatSlow" style={{ top: '64%', insetInlineStart: '30%', width: 12, height: 12, '--depth': '46px', '--orb-bg': 'linear-gradient(135deg,#60a5fa,#2563eb)', '--orb-shadow': 'rgba(37,99,235,.5)', animationDelay: '-7s' }} />
      </div>

      {/* ── language switch ── */}
      <button
        type="button"
        onClick={toggleLang}
        className="absolute top-4 end-4 z-10 btn btn-secondary h-10 px-3 text-sm items-center gap-2 login-card !bg-none"
        aria-label="Language"
      >
        <Languages size={15} />
        {ur ? 'English' : 'اردو'}
      </button>

      {/* ── glass card ── */}
      <div className="relative w-full max-w-sm z-10 float3d">
        <div className="login-card p-6 sm:p-7">
          <div className="text-center mb-5">
            <div className="relative mx-auto h-16 w-16">
              <div className="logo-halo" aria-hidden="true" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-flame-400 via-flame-500 to-flame-600 shadow-[0_10px_28px_-8px_rgba(249,115,22,0.65)] grid place-items-center text-white">
                <Gem size={28} />
              </div>
            </div>
            <h1 className="mt-3 font-bold text-xl leading-urdu no-clip">
              <span className="text-gradient-flame">{ur ? APP_INFO.nameUr : APP_INFO.name}</span>
            </h1>
            <p className="text-xs text-[var(--muted)] leading-urdu no-clip">{t('login.subtitle')}</p>
          </div>

          {fpOk ? (
            <div className="py-8 text-center text-emerald-500">
              <CheckCircle2 size={44} className="mx-auto mb-2" />
              <p className="text-sm font-semibold">{ur ? 'خوش آمدید!' : 'Welcome back!'}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3" autoComplete="on">
              <div className="login-field">
                <Mail size={16} />
                <input
                  className="input min-h-11"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  placeholder={ur ? 'ای میل' : 'Email'}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="login-field">
                <KeyRound size={16} />
                <input
                  className="input min-h-11"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder={ur ? 'PIN' : 'PIN'}
                  value={form.pin}
                  onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
                  required
                />
              </div>
              {pending?.reason === 'totp' && (
                <div className="login-field">
                  <ShieldCheck size={16} />
                  <input
                    className="input min-h-11 tracking-[0.4em] text-center"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={form.totp}
                    onChange={(e) => setForm((f) => ({ ...f, totp: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
              )}

              {error && <p className="text-xs text-red-500 font-medium text-center leading-urdu no-clip">{error}</p>}

              <button type="submit" disabled={busy} className="btn-shine w-full min-h-12 rounded-xl grid grid-flow-col justify-center items-center gap-2 text-sm disabled:opacity-70">
                {busy ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
                {ur ? 'سائن ان کریں' : t('login.signIn')}
              </button>

              {fpAvailable && fpEnrolled && (
                <>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="h-px flex-1 bg-[var(--border)]" />
                    <span className="text-[11px] text-[var(--muted)]">{ur ? 'یا' : 'or'}</span>
                    <span className="h-px flex-1 bg-[var(--border)]" />
                  </div>
                  <button
                    type="button"
                    onClick={tryFingerprint}
                    disabled={fpBusy}
                    className="fp-btn mx-auto h-16 w-16 mt-1 disabled:opacity-60"
                    aria-label={ur ? 'فنگر پرنٹ سے کھولیں' : 'Unlock with fingerprint'}
                  >
                    <span className="fp-ring" aria-hidden="true" />
                    <span className="fp-ring" aria-hidden="true" />
                    {fpBusy ? <Loader2 size={26} className="animate-spin" /> : <Fingerprint size={30} />}
                  </button>
                  <p className="text-center text-[11px] text-[var(--muted)] -mt-1">
                    {ur ? 'فنگر پرنٹ سے کھولیں' : 'One-tap fingerprint unlock'}
                  </p>
                </>
              )}
            </form>
          )}

          {!required && !fpOk && (
            <button
              className="btn btn-ghost w-full min-h-10 text-sm mt-3 text-[var(--muted)]"
              onClick={() => navigate(ROUTES.HOME)}
            >
              {t('login.continueGuest')}
              <ArrowRight size={15} className="flip-rtl" />
            </button>
          )}

          {users.length > 1 && (
            <p className="text-[10px] text-[var(--muted)] text-center mt-2 leading-urdu no-clip">
              {ur ? 'اجازت شدہ ای میلز ہی لاگ اِن کر سکتی ہیں' : 'Only emails granted access by the owner can sign in'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
