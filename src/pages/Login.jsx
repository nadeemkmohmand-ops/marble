import React, { useState } from 'react'
import { LogIn, ArrowRight } from 'lucide-react'
import Card from '../components/UI/Card'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Button from '../components/UI/Button'
import BackgroundFX from '../components/Layout/BackgroundFX'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import ROUTES from '../constants/routes'
import APP_INFO from '../constants/appInfo'

export default function Login() {
  const { t, lang } = useLang()
  const { users, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ userId: users[0]?.id || '', pin: '' })
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const res = login(form.userId, form.pin)
    if (res.ok) {
      navigate(location.state?.from || ROUTES.HOME)
    } else {
      setError(res.error === 'wrong_pin' ? t('login.wrongPin') : t('login.userNotFound'))
    }
  }

  return (
    <div className="relative min-h-screen grid place-items-center p-4">
      <BackgroundFX />
      <Card className="float3d w-full max-w-sm top-hairline shadow-lift">
        <div className="text-center mb-6">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-flame-400 via-flame-500 to-flame-600 shadow-[0_10px_28px_-8px_rgba(249,115,22,0.65)] grid place-items-center text-white text-2xl font-bold">
              M
            </div>
            {/* Tiny decorative 3D cube — floating beside the logo */}
            <div className="absolute -end-2 -top-2 cube3d" aria-hidden="true">
              <span /><span /><span /><span /><span /><span />
            </div>
          </div>
          <h1 className="mt-3 font-bold text-lg leading-urdu no-clip">
            <span className="text-gradient-flame">{lang === 'ur' ? APP_INFO.nameUr : APP_INFO.name}</span>
          </h1>
          <p className="text-xs text-[var(--muted)] leading-urdu no-clip">{t('login.subtitle')}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Select
            label={t('login.user')}
            value={form.userId}
            onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            options={users.map((u) => ({ value: u.id, label: u.name }))}
          />
          <Input
            label={t('login.pin')}
            type="password"
            inputMode="numeric"
            value={form.pin}
            error={error}
            onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
          />
          <Button type="submit" icon={LogIn} className="w-full min-h-11">{t('login.signIn')}</Button>
        </form>
        <button
          className="btn btn-ghost w-full min-h-10 text-sm mt-2 text-[var(--muted)]"
          onClick={() => navigate(ROUTES.HOME)}
        >
          {t('login.continueGuest')}
          <ArrowRight size={15} className="flip-rtl" />
        </button>
      </Card>
    </div>
  )
}
