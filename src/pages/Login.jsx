import { useState } from 'react'
import { Gem } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import Checkbox from '../components/UI/Checkbox.jsx'
import FormField from '../components/UI/FormField.jsx'
import { Input } from '../components/UI/Input.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

/**
 * Login (لاگ ان) — auth shell PLACEHOLDER.
 * Pure UI: no validation, no session, no backend. When real auth lands,
 * wire this form to a future AuthContext + ProtectedRoute.
 */
export default function Login() {
  const { t } = useAppUI()
  const { toast } = useToast()
  const [remember, setRemember] = useState(true)

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

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            toast({ type: 'success', message: t('toast.demo') })
          }}
        >
          <FormField label={t('login.username')} required>
            <Input
              type="text"
              autoComplete="username"
              placeholder="admin@marblefactory.pk"
              dir="ltr"
              className="font-english"
            />
          </FormField>

          <FormField label={t('login.password')} required>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              dir="ltr"
              className="font-english"
            />
          </FormField>

          <Checkbox label={t('login.remember')} checked={remember} onChange={setRemember} />

          <Button type="submit" size="lg" className="w-full">
            {t('login.submit')}
          </Button>
        </form>

        <p className="mt-4 rounded-xl bg-secondary p-3 text-center text-xs leading-relaxed text-muted dark:bg-gray-700/40">
          {t('login.note')}
        </p>
      </Card>
    </div>
  )
}
