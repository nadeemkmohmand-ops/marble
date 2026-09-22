import React, { useEffect, useState } from 'react'
import { Fingerprint, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { webauthnAvailable } from '../utils/webauthn'
import BackgroundFX from './Layout/BackgroundFX'
import APP_INFO from '../constants/appInfo'

/**
 * LockScreen — full-screen gate shown when the session is locked
 * (idle auto-lock) or when the app is re-opened with PIN-lock on.
 * Unlocks with the enrolled fingerprint or the current user's PIN.
 */
export default function LockScreen() {
  const { t, lang } = useLang()
  const { user, unlockWithPin, unlockWithFingerprint, setLocked, logout } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [fpAvailable] = useState(() => webauthnAvailable())

  useEffect(() => {
    setPin('')
    setError('')
  }, [])

  const tryPin = (e) => {
    e.preventDefault()
    const res = unlockWithPin(pin)
    if (!res.ok) setError(res.error === 'wrong_pin' ? (lang === 'ur' ? 'غالب PIN غلط ہے' : 'Wrong PIN') : res.error)
    else setPin('')
  }

  const tryFp = async () => {
    setBusy(true)
    setError('')
    const res = await unlockWithFingerprint()
    setBusy(false)
    if (!res.ok) setError(lang === 'ur' ? 'فنگر پرنٹ ناکام' : 'Fingerprint failed — try your PIN')
  }

  const exitLock = () => setLocked(false)

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4 overflow-hidden">
      <BackgroundFX />
      <div className="absolute inset-0 backdrop-blur-xl bg-black/40" />

      <div className="relative w-full max-w-sm float3d">
        <div className="card top-hairline shadow-lift p-6 text-center">
          <div className="relative mx-auto h-16 w-16 mb-3">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-flame-400 via-flame-500 to-flame-600 shadow-[0_10px_28px_-8px_rgba(249,115,22,0.65)] grid place-items-center text-white">
              <LockKeyhole size={26} />
            </div>
          </div>
          <h1 className="font-bold text-lg text-gradient-flame">{lang === 'ur' ? 'ایپ مقفل ہے' : 'App locked'}</h1>
          <p className="text-xs text-[var(--muted)] mt-1 leading-urdu no-clip">
            {user ? `${lang === 'ur' ? 'خوش آمدید' : 'Welcome back'}, ${user.name}` : APP_INFO.name}
          </p>

          {fpAvailable && (
            <button
              type="button"
              onClick={tryFp}
              disabled={busy}
              className="mt-5 mx-auto group relative grid place-items-center h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 border border-blue-400/30 text-blue-500 transition active:scale-95 disabled:opacity-60"
              aria-label={lang === 'ur' ? 'فنگر پرنٹ سے کھولیں' : 'Unlock with fingerprint'}
            >
              <Fingerprint size={40} className="group-active:scale-90 transition" />
            </button>
          )}
          {fpAvailable && (
            <p className="text-[11px] text-[var(--muted)] mt-1">{lang === 'ur' ? 'فنگر پرنٹ سے کھولیں' : 'Touch the sensor to unlock'}</p>
          )}

          <form onSubmit={tryPin} className="mt-4 space-y-2">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError('') }}
              placeholder={lang === 'ur' ? 'PIN لکھیں' : 'Enter PIN'}
              className="input text-center text-lg tracking-[0.4em]"
              aria-label="PIN"
            />
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <button type="submit" className="btn btn-primary w-full min-h-11">
              <ShieldCheck size={16} /> {lang === 'ur' ? 'کھولیں' : 'Unlock'}
            </button>
          </form>

          <div className="flex items-center justify-between mt-3 text-xs">
            <button type="button" className="btn btn-ghost h-8 px-2 text-[var(--muted)]" onClick={logout}>
              {lang === 'ur' ? 'لاگ آؤٹ' : 'Sign out'}
            </button>
            <button type="button" className="btn btn-ghost h-8 px-2 text-[var(--muted)] inline-flex items-center gap-1" onClick={exitLock}>
              <X size={13} /> {lang === 'ur' ? 'بعد میں' : 'Later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
