import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import EmptyState from '../components/States/EmptyState.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'

/**
 * NotFound (صفحہ نہیں ملا) — bilingual 404 page.
 * The catch-all route now renders this instead of silently redirecting home.
 */
export default function NotFound() {
  const { t } = useAppUI()

  return (
    <EmptyState
      icon={Compass}
      title={t('notFound.title')}
      description={t('notFound.desc')}
      action={
        <Button as={Link} to="/" variant="primary">
          {t('notFound.backHome')}
        </Button>
      }
      className="border-none bg-transparent shadow-none dark:bg-transparent"
    />
  )
}
