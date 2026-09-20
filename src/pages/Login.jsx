import React, { useState } from 'react'
import { LogIn, ArrowRight } from 'lucide-react'
import Card from '../components/UI/Card'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Button from '../components/UI/Button'
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
    <div className="min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[var(--accent)] grid place-items-center text-white text-2xl font-bold">M</div>
          <h1 className="mt-3 font-bold text-lg leading-urdu no-clip">{lang === 'ur' ? APP_INFO.nameUr : APP_INFO.name}</h1>
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
