import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Gem } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import Checkbox from '../components/UI/Checkbox.jsx'
import FormField from '../components/UI/FormField.jsx'
import { Input } from '../components/UI/Input.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { useAuth } from '../context/index.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { isSupabaseConfigured } from '../services/apiClient.js'

/**
 * Login (لاگ ان) — real Supabase email/password sign-in.
 * The admin account (nadeemk.mohmand@gmail.com) is created in the Supabase
 * Dashboard — its password is NEVER stored in code.
 */
export default function Login() {
  const { t } = useAppUI()
  const { toast } = useToast()
  const { status, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Already signed in? Straight to the app (or back to the intended page).
  if (status === 'authenticated') {
    return <Navigate to={location.state?.from || '/'} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError(signInError.message)
        toast({ type: 'error', message: t('auth.invalid') })
        return
      }
      toast({ type: 'success', message: t('auth.signedIn') })
      navigate(location.state?.from || '/', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card bodyClassName="p-6 sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white">
            <Gem size={26} aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold text-main">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('login.subtitle')}</p>
        </div>

        {!isSupabaseConfigured && (
          <p className="mb-4 rounded-xl bg-warning/10 p-3 text-center text-xs font-semibold leading-relaxed text-warning-dark dark:text-warning">
            {t('db.notConfigured')}
          </p>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <FormField label={t('login.username')} required>
            <Input
              type="email"
              autoComplete="username"
              placeholder="admin@marblefactory.pk"
              dir="ltr"
              className="font-english"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </FormField>

          <FormField label={t('login.password')} required>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              dir="ltr"
              className="font-english"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </FormField>

          <Checkbox label={t('login.remember')} checked={remember} onChange={setRemember} />

          {error && (
            <p className="rounded-xl bg-error/10 px-3 py-2 text-center text-xs font-semibold text-error" dir="ltr">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? t('auth.signingIn') : t('login.submit')}
          </Button>
        </form>

        <p className="mt-4 rounded-xl bg-secondary p-3 text-center text-xs leading-relaxed text-muted dark:bg-gray-700/40">
          {t('login.note')}
        </p>
      </Card>
    </div>
  )
}
