import React, { useRef, useState } from 'react'
import { Save, Download, Upload, Database, Trash2, ShieldCheck, Globe } from 'lucide-react'
import Toolbar from '../components/UI/Toolbar'
import Card, { CardHeader } from '../components/UI/Card'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Button from '../components/UI/Button'
import Toggle from '../components/UI/Toggle'
import { useLang } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useAppUI } from '../context/AppUIContext'
import { db } from '../services/db'
import { createBackup, restoreBackup } from '../services/backup'
import { testConnection } from '../services/supabaseClient'
import APP_CONFIG from '../config/app.config'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'
import { LANGUAGES } from '../constants/languages'
import { CURRENCIES } from '../constants/enums'

export default function Settings() {
  const { t, lang, setLang, urduDigits, setUrduDigits } = useLang()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const { users, addUser, removeUser, user } = useAuth()
  const { confirm } = useAppUI()
  const fileRef = useRef(null)

  const [company, setCompany] = useState(() => storage.get(STORAGE_KEYS.COMPANY, { name: APP_CONFIG.appName, address: '', phone: '', currency: APP_CONFIG.currency }))
  const [defaults, setDefaults] = useState(() => storage.get(STORAGE_KEYS.SETTINGS, APP_CONFIG.defaults))
  const [cloud, setCloud] = useState(null)

  const saveAll = () => {
    storage.set(STORAGE_KEYS.COMPANY, company)
    storage.set(STORAGE_KEYS.SETTINGS, defaults)
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

  return (
    <div className="fade-in max-w-3xl">
      <Toolbar
        title={t('settings.title')}
        description={t('settings.subtitle')}
        actions={<Button icon={Save} onClick={saveAll}>{t('common.save')}</Button>}
      />

      <div className="space-y-4">
        {/* Company */}
        <Card>
          <CardHeader title={t('settings.company')} subtitle={t('settings.logoHint')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={t('settings.companyName')} value={company.name || ''} onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))} />
            <Input label={t('settings.companyPhone')} value={company.phone || ''} onChange={(e) => setCompany((c) => ({ ...c, phone: e.target.value }))} />
            <Input label={t('settings.companyAddress')} className="sm:col-span-2" value={company.address || ''} onChange={(e) => setCompany((c) => ({ ...c, address: e.target.value }))} />
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
            <Toggle
              label={t('settings.urduDigits')}
              checked={Boolean(urduDigits)}
              onChange={setUrduDigits}
            />
          </div>
        </Card>

        {/* Business defaults */}
        <Card>
          <CardHeader title={t('settings.defaults')} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Select label={t('settings.currency')} value={defaults.currency || 'PKR'} onChange={(e) => setDefaults((d) => ({ ...d, currency: e.target.value }))} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
            <Input type="number" label={t('settings.usdRate')} value={defaults.usdRate ?? 278} onChange={(e) => setDefaults((d) => ({ ...d, usdRate: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={t('settings.wastage')} value={defaults.defaultWastagePct ?? 8} onChange={(e) => setDefaults((d) => ({ ...d, defaultWastagePct: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={t('settings.margin')} value={defaults.defaultMarginPct ?? 20} onChange={(e) => setDefaults((d) => ({ ...d, defaultMarginPct: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={t('settings.tax')} value={defaults.defaultTaxPct ?? 0} onChange={(e) => setDefaults((d) => ({ ...d, defaultTaxPct: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={t('settings.blade')} value={defaults.bladeThicknessMm ?? 6.5} onChange={(e) => setDefaults((d) => ({ ...d, bladeThicknessMm: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={t('settings.density')} value={defaults.densityKgPerCft ?? 76} onChange={(e) => setDefaults((d) => ({ ...d, densityKgPerCft: parseFloat(e.target.value) || 0 }))} />
          </div>
        </Card>

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

        {/* Users */}
        <Card>
          <CardHeader title={t('settings.users')} subtitle={`${t('settings.role')}: owner / manager / accountant / supervisor`} action={<ShieldCheck size={18} className="text-[var(--accent)]" />} />
          <div className="space-y-2 mb-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 border border-[var(--border)] rounded-xl px-3 py-2">
                <div>
                  <div className="text-sm font-medium leading-urdu no-clip">{u.name}</div>
                  <div className="text-[11px] text-[var(--muted)]">{u.role} · PIN {u.pin}</div>
                </div>
                {u.id !== user?.id && (
                  <button className="btn btn-ghost h-8 w-8 justify-center text-red-500" onClick={() => removeUser(u.id)} aria-label="Remove">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <AddUserForm onAdd={addUser} t={t} />
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

function AddUserForm({ onAdd, t }) {
  const [form, setForm] = useState({ name: '', role: 'supervisor', pin: '' })
  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
      onSubmit={(e) => {
        e.preventDefault()
        if (!form.name || !form.pin) return
        onAdd(form)
        setForm({ name: '', role: 'supervisor', pin: '' })
      }}
    >
      <Input label={t('fields.name')} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      <Select
        label={t('settings.role')}
        value={form.role}
        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
        options={['owner', 'manager', 'accountant', 'supervisor'].map((r) => ({ value: r, label: r }))}
      />
      <Input label="PIN" type="password" inputMode="numeric" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} />
      <Button type="submit" className="min-h-10">{t('settings.addUser')}</Button>
    </form>
  )
}
