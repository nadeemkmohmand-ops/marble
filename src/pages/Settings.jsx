import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Save, Download, Upload, Database, Trash2, ShieldCheck, Globe, Fingerprint,
  KeyRound, Smartphone, QrCode, Users2, ScrollText, Zap, Building2, Eye,
} from 'lucide-react'
import Toolbar from '../components/UI/Toolbar'
import Card, { CardHeader } from '../components/UI/Card'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Button from '../components/UI/Button'
import Toggle from '../components/UI/Toggle'
import { useLang } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useAuth, defaultSecurity } from '../context/AuthContext'
import { useAppUI } from '../context/AppUIContext'
import { db } from '../services/db'
import { createBackup, restoreBackup } from '../services/backup'
import { testConnection } from '../services/supabaseClient'
import APP_CONFIG from '../config/app.config'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'
import { LANGUAGES } from '../constants/languages'
import { CURRENCIES, WHT_TYPES } from '../constants/enums'
import { registerFingerprint, webauthnAvailable, platformAuthenticatorAvailable } from '../utils/webauthn'
import { generateTotpSecret, totpUri, verifyTotp } from '../utils/totp'
import { makeQR } from '../utils/qr'
import { defaultPermissions, MODULES, ACTIONS } from '../utils/permissions'
import { auditLog } from '../utils/audit'

const SETTINGS_DEFAULTS = {
  automations: { autoGatePass: true, waReminders: true, reorderAlerts: true },
  approvals: { discountPct: 10, bigReceipt: 100000 },
  taxIds: { ntn: '', strn: '', defaultWht: 'none' },
  bigButtons: false,
}

export default function Settings() {
  const { t, lang, setLang, urduDigits, setUrduDigits } = useLang()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const { users, addUser, updateUser, removeUser, user } = useAuth()
  const { confirm } = useAppUI()
  const fileRef = useRef(null)
  const ur = lang === 'ur'

  const [company, setCompany] = useState(() => storage.get(STORAGE_KEYS.COMPANY, { name: APP_CONFIG.appName, address: '', phone: '', currency: APP_CONFIG.currency }))
  const [settings, setSettings] = useState(() => ({
    ...SETTINGS_DEFAULTS,
    ...(storage.get(STORAGE_KEYS.SETTINGS, APP_CONFIG.defaults) || {}),
  }))
  const [cloud, setCloud] = useState(null)

  const setSec = (patch) => setSettings((s) => ({ ...s, security: { ...defaultSecurity(), ...(s.security || {}), ...patch } }))

  const saveAll = () => {
    storage.set(STORAGE_KEYS.COMPANY, company)
    const prev = storage.get(STORAGE_KEYS.SETTINGS, {}) || {}
    storage.set(STORAGE_KEYS.SETTINGS, { ...prev, ...settings })
    document.documentElement.classList.toggle('big-mode', Boolean(settings.bigButtons))
    window.dispatchEvent(new Event('settings:changed'))
    auditLog('security', 'settings', { meta: 'settings saved' })
    toast.success(t('settings.savedOk'))
  }

  const testCloud = async () => {
    setCloud('testing')
    const res = await testConnection()
    setCloud(res)
    toast[res.ok ? 'success' : 'error'](res.ok ? t('settings.cloudOn') : String(res.reason || t('settings.cloudOff')))
  }

  const eraseAll = async () => {
    const ok = await confirm({ message: t('settings.resetConfirm') })
    if (!ok) return
    Object.values(STORAGE_KEYS)
      .filter((k) => ![STORAGE_KEYS.LANG, STORAGE_KEYS.THEME, STORAGE_KEYS.URDU_DIGITS].includes(k))
      .forEach((k) => storage.remove(k))
    storage.set(STORAGE_KEYS.SEED_DONE, true) // never resurrect starter data after a wipe
    window.location.reload()
  }

  // Apply big-button mode on mount (also live through the toggle below)
  useEffect(() => {
    document.documentElement.classList.toggle('big-mode', Boolean(settings.bigButtons))
  }, [settings.bigButtons])

  const sec = { ...defaultSecurity(), ...(settings.security || {}) }
  const canEditSecurity = user?.role === 'owner'

  return (
    <div className="fade-in max-w-3xl">
      <Toolbar
        title={t('settings.title')}
        description={t('settings.subtitle')}
        actions={<Button icon={Save} onClick={saveAll}>{t('common.save')}</Button>}
      />

      <div className="space-y-4">
        {/* Company + tax identity */}
        <Card>
          <CardHeader title={t('settings.company')} subtitle={t('settings.logoHint')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={t('settings.companyName')} value={company.name || ''} onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))} />
            <Input label={t('settings.companyPhone')} value={company.phone || ''} onChange={(e) => setCompany((c) => ({ ...c, phone: e.target.value }))} />
            <Input label={t('settings.companyAddress')} className="sm:col-span-2" value={company.address || ''} onChange={(e) => setCompany((c) => ({ ...c, address: e.target.value }))} />
            <Input label={ur ? 'NTN نمبر' : 'NTN (tax) number'} value={(settings.taxIds?.ntn) || ''} onChange={(e) => setSettings((s) => ({ ...s, taxIds: { ...SETTINGS_DEFAULTS.taxIds, ...s.taxIds, ntn: e.target.value } }))} />
            <Input label={ur ? 'STRN نمبر' : 'STRN (sales tax) number'} value={(settings.taxIds?.strn) || ''} onChange={(e) => setSettings((s) => ({ ...s, taxIds: { ...SETTINGS_DEFAULTS.taxIds, ...s.taxIds, strn: e.target.value } }))} />
            <Select
              label={ur ? 'ڈیفالٹ WHT' : 'Default WHT rule'}
              value={settings.taxIds?.defaultWht || 'none'}
              onChange={(e) => setSettings((s) => ({ ...s, taxIds: { ...SETTINGS_DEFAULTS.taxIds, ...s.taxIds, defaultWht: e.target.value } }))}
              options={WHT_TYPES.map((w) => ({ value: w, label: w === 'none' ? (ur ? 'کوئی نہیں' : 'None') : w.replace('_', ' ') }))}
            />
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader title={t('settings.language')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={t('settings.language')}
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              options={LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
            />
            <Select
              label={t('settings.theme')}
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              options={[
                { value: 'light', label: t('settings.themeLight') },
                { value: 'dark', label: t('settings.themeDark') },
                { value: 'system', label: t('settings.themeSystem') },
              ]}
            />
            <Toggle label={t('settings.urduDigits')} checked={Boolean(urduDigits)} onChange={setUrduDigits} />
            <Toggle
              label={ur ? 'بڑے بٹن موڈ' : 'Big-button mode'}
              description={ur ? 'یارڈ ورکرز کے لیے بڑا فونٹ اور بٹن' : 'Larger touch targets & text for yard workers'}
              checked={Boolean(settings.bigButtons)}
              onChange={(v) => setSettings((s) => ({ ...s, bigButtons: v }))}
            />
          </div>
        </Card>

        {/* ── SECURITY CENTER ── */}
        <Card className="gradient-border">
          <CardHeader
            title={ur ? 'سیکیورٹی سینٹر' : 'Security Center'}
            subtitle={ur ? 'فنگر پرنٹ، PIN، 2FA، سیشن اور ڈیوائسز' : 'Fingerprint · PIN lock · 2FA · sessions · devices'}
            action={<ShieldCheck size={18} className="text-[var(--accent)]" />}
          />
          {!canEditSecurity && (
            <p className="text-xs text-[var(--muted)] mb-2">{ur ? 'صرف مالک سیکیورٹی تبدیل کر سکتا ہے۔' : 'Only the owner can change security settings.'}</p>
          )}
          <SecurityCenter sec={sec} setSec={setSec} disabled={!canEditSecurity} user={user} ur={ur} />
        </Card>

        {/* Access grants — the one-person app model */}
        <Card>
          <CardHeader
            title={ur ? 'ای میل رسائی' : 'Email access grants'}
            subtitle={ur ? 'مالک کسی بھی ای میل کو رسائی دے سکتا ہے — ہر ای میل + PIN اکاؤنٹ' : 'The owner grants access to any email — each email + PIN gets a role'}
            action={<Users2 size={18} className="text-[var(--accent)]" />}
          />
          <AccessGrants users={users} addUser={addUser} updateUser={updateUser} removeUser={removeUser} me={user} ur={ur} />
        </Card>

        {/* Permissions matrix + approvals (owner only) */}
        {canEditSecurity && <PermissionsMatrix settings={settings} setSettings={setSettings} ur={ur} />}

        {/* Business defaults */}
        <Card>
          <CardHeader title={t('settings.defaults')} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Select label={t('settings.currency')} value={settings.currency || 'PKR'} onChange={(e) => setSettings((d) => ({ ...d, currency: e.target.value }))} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
            <Input type="number" label={t('settings.usdRate')} value={settings.usdRate ?? 278} onChange={(e) => setSettings((d) => ({ ...d, usdRate: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={t('settings.wastage')} value={settings.defaultWastagePct ?? 8} onChange={(e) => setSettings((d) => ({ ...d, defaultWastagePct: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={t('settings.margin')} value={settings.defaultMarginPct ?? 20} onChange={(e) => setSettings((d) => ({ ...d, defaultMarginPct: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={t('settings.tax')} value={settings.defaultTaxPct ?? 0} onChange={(e) => setSettings((d) => ({ ...d, defaultTaxPct: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={t('settings.blade')} value={settings.bladeThicknessMm ?? 6.5} onChange={(e) => setSettings((d) => ({ ...d, bladeThicknessMm: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={t('settings.density')} value={settings.densityKgPerCft ?? 76} onChange={(e) => setSettings((d) => ({ ...d, densityKgPerCft: parseFloat(e.target.value) || 0 }))} />
          </div>
        </Card>

        {/* Automations */}
        <Card>
          <CardHeader title={ur ? 'آٹومیشن' : 'Automations'} subtitle={ur ? 'خودکار دستاویزات اور یاد دہانیاں' : 'Auto documents & reminders'} action={<Zap size={18} className="text-amber-500" />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Toggle
              label={ur ? 'آرڈر ریڈی → گیٹ پاس خود بنے' : 'Order ready → auto gate pass draft'}
              checked={Boolean(settings.automations?.autoGatePass)}
              onChange={(v) => setSettings((s) => ({ ...s, automations: { ...SETTINGS_DEFAULTS.automations, ...s.automations, autoGatePass: v } }))}
            />
            <Toggle
              label={ur ? 'واٹس ایپ یاد دہانی چپس' : 'WhatsApp reminder chips'}
              description={ur ? 'بل/چالان بھیجنے کے لیے ایک ٹیپ لنک' : 'One-tap payment/challan reminder links'}
              checked={Boolean(settings.automations?.waReminders)}
              onChange={(v) => setSettings((s) => ({ ...s, automations: { ...SETTINGS_DEFAULTS.automations, ...s.automations, waReminders: v } }))}
            />
            <Toggle
              label={ur ? 'اسٹاک ری آرڈر الرٹس' : 'Stock reorder alerts'}
              checked={Boolean(settings.automations?.reorderAlerts)}
              onChange={(v) => setSettings((s) => ({ ...s, automations: { ...SETTINGS_DEFAULTS.automations, ...s.automations, reorderAlerts: v } }))}
            />
          </div>
        </Card>

        {/* Branches / yards */}
        <BranchCard ur={ur} />

        {/* Cloud */}
        <Card>
          <CardHeader
            title={t('settings.cloud')}
            subtitle={APP_CONFIG.supabase.configured ? t('settings.cloudOn') : t('settings.cloudOff')}
            action={<Database size={18} className={APP_CONFIG.supabase.configured ? 'text-emerald-500' : 'text-[var(--muted)]'} />}
          />
          <p className="text-xs text-[var(--muted)] leading-urdu no-clip mb-3">{t('settings.cloudHint')}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" icon={Globe} onClick={testCloud}>{t('settings.testConnection')}</Button>
            {cloud === 'testing' && <span className="text-xs text-[var(--muted)]">…</span>}
            {cloud && cloud !== 'testing' && (
              <span className={`text-xs font-semibold ${cloud.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                {cloud.ok ? '✓' : '✗'} {cloud.ok ? t('settings.cloudOn') : cloud.reason}
              </span>
            )}
          </div>
        </Card>

        {/* Backup */}
        <Card>
          <CardHeader title={t('settings.backup')} />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={Download} onClick={createBackup}>{t('settings.downloadBackup')}</Button>
            <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>{t('settings.restoreBackup')}</Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  await restoreBackup(file, db)
                  toast.success(t('common.saved'))
                } catch (err) {
                  toast.error(err.message)
                }
                e.target.value = ''
              }}
            />
          </div>
        </Card>

        {/* Danger */}
        <Card className="border-red-500/40">
          <CardHeader title={t('settings.reset')} subtitle={t('settings.resetConfirm')} />
          <Button variant="danger" icon={Trash2} onClick={eraseAll}>{t('settings.resetAll')}</Button>
        </Card>
      </div>
    </div>
  )
}

/* ═══════════════════ Security Center internals ═══════════════════ */

function SecurityCenter({ sec, setSec, disabled, user, ur }) {
  const toast = useToast()
  const [fpSupported, setFpSupported] = useState(null)
  const [busy, setBusy] = useState(false)
  const [totpStep, setTotpStep] = useState(null) // { secret, qr }
  const [totpCode, setTotpCode] = useState('')

  useEffect(() => {
    platformAuthenticatorAvailable().then(setFpSupported)
  }, [])

  const enroll = async () => {
    setBusy(true)
    try {
      const credentialId = await registerFingerprint({ userId: user?.id || 'usr-owner', userName: user?.name || 'Owner' })
      setSec({ fingerprintEnabled: true, fingerprintCredentialId: credentialId, fingerprintUserId: user?.id || 'usr-owner' })
      auditLog('security', 'settings', { meta: 'fingerprint enrolled' })
      toast.success(ur ? 'فنگر پرنٹ رجسٹر ہو گیا' : 'Fingerprint enrolled — save to keep it')
    } catch (e) {
      toast.error(e?.name === 'NotAllowedError' ? (ur ? 'منسوخ کر دیا' : 'Cancelled') : String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  const startTotp = async () => {
    const secret = generateTotpSecret()
    const qr = await makeQR(totpUri(secret, { account: user?.email || 'owner' }))
    setTotpStep({ secret, qr })
  }

  const confirmTotp = async () => {
    const ok = await verifyTotp(totpStep.secret, totpCode)
    if (!ok) { toast.error(ur ? 'کوڈ غلط ہے — دوبارہ کوشش کریں' : 'Wrong code — try again'); return }
    setSec({ totpEnabled: true, totpSecret: totpStep.secret })
    setTotpStep(null)
    setTotpCode('')
    auditLog('security', 'settings', { meta: '2FA enabled' })
    toast.success(ur ? '2FA فعال' : 'Two-factor authentication enabled')
  }

  const disableTotp = () => {
    setSec({ totpEnabled: false, totpSecret: null })
    auditLog('security', 'settings', { meta: '2FA disabled' })
  }

  return (
    <div className="space-y-3">
      {/* Fingerprint */}
      <div className="rounded-xl border border-[var(--border)] p-3">
        <div className="flex items-center gap-3 mb-2">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500"><Fingerprint size={18} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-urdu no-clip">{ur ? 'فنگر پرنٹ سے کھولنا' : 'Fingerprint unlock'}</div>
            <div className="text-[11px] text-[var(--muted)] leading-urdu no-clip">
              {fpSupported === false
                ? (ur ? 'اس ڈیوائس پر دستیاب نہیں' : 'Not available on this device/browser')
                : sec.fingerprintCredentialId
                  ? (ur ? 'رجسٹر شدہ ✓ — لاگ اِن پیج پر فنگر بٹن آئے گا' : 'Enrolled ✓ — a fingerprint button appears on the login page')
                  : (ur ? ' Touch ID / Android فنگر پرنٹ / Windows Hello' : 'Touch ID · Android fingerprint · Windows Hello')}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" icon={Fingerprint} disabled={disabled || busy || fpSupported === false} onClick={enroll}>
            {sec.fingerprintCredentialId ? (ur ? 'دوبارہ رجسٹر کریں' : 'Re-enroll') : (ur ? 'فنگر رجسٹر کریں' : 'Register fingerprint')}
          </Button>
          <Toggle
            label={ur ? 'لاگ اِن پیج پر فنگر بٹن دکھائیں' : 'Show fingerprint on login'}
            checked={Boolean(sec.fingerprintEnabled)}
            onChange={(v) => setSec({ fingerprintEnabled: v })}
          />
        </div>
      </div>

      {/* PIN lock + auto-lock + session */}
      <div className="rounded-xl border border-[var(--border)] p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Toggle
          label={ur ? 'PIN لاک (ایپ دوبارہ کھلنے پر)' : 'PIN lock on reopen'}
          description={ur ? 'ایپ بند کر کے کھولنے پر PIN/فنگر مانگے گا' : 'Re-opening the app asks for PIN or fingerprint'}
          checked={Boolean(sec.pinLockEnabled)}
          onChange={(v) => setSec({ pinLockEnabled: v })}
        />
        <Toggle
          label={ur ? 'فنگر پرنٹ سے بھی کھولیں' : 'Allow fingerprint on lock screen'}
          checked={Boolean(sec.fingerprintEnabled)}
          onChange={(v) => setSec({ fingerprintEnabled: v })}
        />
        <Input
          type="number"
          min={0}
          label={ur ? 'آٹو لاک (منٹ، 0 = بند)' : 'Auto-lock after (min, 0 = off)'}
          value={sec.autoLockMin ?? 0}
          disabled={disabled}
          onChange={(e) => setSec({ autoLockMin: Math.max(0, parseFloat(e.target.value) || 0) })}
        />
        <Input
          type="number"
          min={0}
          label={ur ? 'سیشن ٹائم آؤٹ (منٹ، 0 = بند)' : 'Session timeout (min, 0 = off)'}
          value={sec.sessionTimeoutMin ?? 0}
          disabled={disabled}
          onChange={(e) => setSec({ sessionTimeoutMin: Math.max(0, parseFloat(e.target.value) || 0) })}
        />
      </div>

      {/* 2FA */}
      <div className="rounded-xl border border-[var(--border)] p-3">
        <div className="flex items-center gap-3 mb-2">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-violet-500/10 text-violet-500"><Smartphone size={18} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-urdu no-clip">{ur ? 'دو مرحلہ تصدیق (2FA)' : 'Two-factor authentication'}</div>
            <div className="text-[11px] text-[var(--muted)] leading-urdu no-clip">
              {sec.totpEnabled
                ? (ur ? 'فعال ✓ — لاگ اِن پر 6 ہندسوں کا کوڈ پوچھا جائے گا' : 'Active ✓ — a 6-digit code is asked at login')
                : (ur ? 'Google Authenticator سے ہم آہنگ' : 'Works with Google Authenticator / Authy')}
            </div>
          </div>
          {sec.totpEnabled && (
            <Button size="sm" variant="danger" disabled={disabled} onClick={disableTotp}>{ur ? 'بند کریں' : 'Disable'}</Button>
          )}
        </div>
        {!sec.totpEnabled && !totpStep && (
          <Button size="sm" variant="secondary" icon={QrCode} disabled={disabled} onClick={startTotp}>
            {ur ? '2FA فعال کریں' : 'Set up 2FA'}
          </Button>
        )}
        {totpStep && (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              {totpStep.qr && <img src={totpStep.qr} alt="2FA QR" className="h-28 w-28 rounded-lg border border-[var(--border)] bg-white p-1" />}
              <div className="text-xs text-[var(--muted)] leading-urdu no-clip">
                <p className="mb-1">{ur ? 'اپنی اوتھینٹیکیٹر ایپ میں اس QR کو سکین کریں، پھر 6 ہندسوں کا کوڈ لکھ کر تصدیق کریں۔' : 'Scan the QR with your authenticator app, then verify with the 6-digit code.'}</p>
                <p className="num break-all select-all font-mono">{totpStep.secret}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input className="flex-1" inputMode="numeric" maxLength={6} placeholder="000000" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))} />
              <Button icon={KeyRound} onClick={confirmTotp}>{ur ? 'تصدیق' : 'Verify'}</Button>
              <Button variant="secondary" onClick={() => setTotpStep(null)}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}
      </div>

      {/* Device history */}
      <div className="rounded-xl border border-[var(--border)] p-3">
        <div className="text-sm font-semibold mb-1.5">{ur ? 'لاگ اِن ڈیوائس ہسٹری' : 'Login device history'}</div>
        {(sec.devices || []).length === 0 ? (
          <p className="text-xs text-[var(--muted)]">{ur ? 'ابھی کوئی ریکارڈ نہیں' : 'No logins recorded yet'}</p>
        ) : (
          <ul className="space-y-1.5 max-h-40 overflow-auto">
            {sec.devices.slice(0, 10).map((d, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-xs border-b border-dashed border-[var(--border)] pb-1">
                <span className="font-medium truncate">{d.name}</span>
                <span className="text-[var(--muted)] num">{String(d.at).slice(0, 16).replace('T', ' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════ Access grants ═══════════════════ */

function AccessGrants({ users, addUser, updateUser, removeUser, me, ur }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'supervisor', pin: '' })
  return (
    <>
      <div className="space-y-2 mb-3">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium leading-urdu no-clip">{u.name}</div>
              <div className="text-[11px] text-[var(--muted)] num">{u.email}</div>
            </div>
            <Select
              className="!w-auto min-w-[8.5rem]"
              value={u.role}
              onChange={(e) => updateUser(u.id, { role: e.target.value })}
              options={['owner', 'manager', 'accountant', 'supervisor'].map((r) => ({ value: r, label: r }))}
            />
            <Input
              className="!w-24"
              type="password"
              inputMode="numeric"
              value={u.pin}
              onChange={(e) => updateUser(u.id, { pin: e.target.value })}
              aria-label="PIN"
            />
            {u.id !== me?.id && (
              <button className="btn btn-ghost h-8 w-8 justify-center text-red-500" onClick={() => removeUser(u.id)} aria-label="Revoke">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <form
        className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.email || !form.pin) return
          addUser({ ...form, name: form.name || form.email.split('@')[0] })
          setForm({ name: '', email: '', role: 'supervisor', pin: '' })
        }}
      >
        <Input label={ur ? 'نام (اختیاری)' : 'Name (optional)'} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <Select
          label={ur ? 'کردار' : 'Role'}
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          options={['owner', 'manager', 'accountant', 'supervisor'].map((r) => ({ value: r, label: r }))}
        />
        <Input label="PIN" type="password" inputMode="numeric" required value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} />
        <Button type="submit" className="min-h-10">{ur ? 'رسائی دیں' : 'Grant access'}</Button>
      </form>
    </>
  )
}

/* ═══════════════════ Permissions matrix ═══════════════════ */

function PermissionsMatrix({ settings, setSettings, ur }) {
  const [role, setRole] = useState('supervisor')
  const matrix = settings.permissions || defaultPermissions()
  const roles = ['manager', 'accountant', 'supervisor']

  const setCell = (mod, action, val) => {
    const next = { ...matrix }
    next[role] = { ...next[role], [mod]: { ...(next[role]?.[mod] || { view: true, add: true, edit: true, delete: true, export: true }), [action]: val } }
    setSettings((s) => ({ ...s, permissions: next }))
  }

  const actionLabel = { view: ur ? 'دیکھیں' : 'View', add: ur ? 'نیا' : 'Add', edit: ur ? 'تبدیلی' : 'Edit', delete: ur ? 'حذف' : 'Del', export: ur ? 'ایکسپورٹ' : 'Export' }

  return (
    <Card>
      <CardHeader
        title={ur ? 'ماڈیول اجازتیں' : 'Module permissions'}
        subtitle={ur ? 'ہر کردار کے لیے ماڈیول اور کارروائی کنٹرول — مالک ہمیشہ مکمل' : 'Per-module view/add/edit/delete/export per role — owner is always full'}
        action={<ScrollText size={18} className="text-[var(--accent)]" />}
      />
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Select
          className="!w-auto min-w-[10rem]"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={roles.map((r) => ({ value: r, label: r }))}
        />
        <Button size="sm" variant="secondary" icon={Eye} onClick={() => setSettings((s) => ({ ...s, permissions: defaultPermissions() }))}>
          {ur ? 'ڈیفالٹ پر واپس' : 'Reset defaults'}
        </Button>
      </div>
      <div className="max-h-72 overflow-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[var(--card)]">
            <tr>
              <th className="text-start px-2 py-2">{ur ? 'ماڈیول' : 'Module'}</th>
              {ACTIONS.map((a) => <th key={a} className="px-1.5 py-2 font-medium">{actionLabel[a]}</th>)}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod) => {
              const cell = matrix[role]?.[mod] || { view: true, add: true, edit: true, delete: true, export: true }
              return (
                <tr key={mod} className="border-t border-[var(--border)]">
                  <td className="px-2 py-1.5 num">{mod}</td>
                  {ACTIONS.map((a) => (
                    <td key={a} className="px-1.5 py-1.5 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[var(--accent)]"
                        checked={cell[a] !== false}
                        onChange={(e) => setCell(mod, a, e.target.checked)}
                        aria-label={`${mod} ${a}`}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Input
          type="number"
          min={0}
          label={ur ? 'رعایت کی حد فیصد (اُوپر صرف مالک)' : 'Discount approval limit % (above → owner only)'}
          value={settings.approvals?.discountPct ?? 10}
          onChange={(e) => setSettings((s) => ({ ...s, approvals: { ...SETTINGS_DEFAULTS.approvals, ...s.approvals, discountPct: parseFloat(e.target.value) || 0 } }))}
        />
        <Input
          type="number"
          min={0}
          label={ur ? 'بڑی وصولی حد (رقم)' : 'Big-receipt approval limit (amount)'}
          value={settings.approvals?.bigReceipt ?? 100000}
          onChange={(e) => setSettings((s) => ({ ...s, approvals: { ...SETTINGS_DEFAULTS.approvals, ...s.approvals, bigReceipt: parseFloat(e.target.value) || 0 } }))}
        />
      </div>
    </Card>
  )
}

/* ═══════════════════ Branches ═══════════════════ */

function useCollectionBranches() {
  const [items, setItems] = React.useState(() => db.list('branches'))
  React.useEffect(() => db.onChange((c) => { if (c === 'branches') setItems(db.list('branches')) }), [])
  return {
    items,
    add: (d) => db.save('branches', d),
    remove: (id) => db.remove('branches', id),
  }
}

function BranchCard({ ur }) {
  const { items, add, remove } = useCollectionBranches()
  const [name, setName] = useState('')
  return (
    <Card>
      <CardHeader
        title={ur ? 'برانچز / یارڈز' : 'Branches / yards'}
        subtitle={ur ? 'ملٹی برانچ ڈھانچہ — بلاکس اور آرڈرز پر برانچ منتخب کریں' : 'Multi-branch structure — pick a branch on blocks, orders & expenses'}
        action={<Building2 size={18} className="text-[var(--accent)]" />}
      />
      <div className="flex flex-wrap gap-2 mb-3">
        {items.length === 0 && <p className="text-xs text-[var(--muted)]">{ur ? 'ابھی کوئی برانچ نہیں — صرف ہیڈ آفس' : 'No branches yet — head office only'}</p>}
        {items.map((b) => (
          <span key={b.id} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium">
            {b.name}
            <button onClick={() => remove(b.id)} className="text-red-500" aria-label={`Remove ${b.name}`}>×</button>
          </span>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { add({ name: name.trim() }); setName('') } }}>
        <Input className="flex-1" placeholder={ur ? 'برانچ کا نام' : 'Branch name'} value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit">{ur ? 'شامل کریں' : 'Add'}</Button>
      </form>
    </Card>
  )
}
