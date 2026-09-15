import { useState } from 'react'
import { BellOff, CheckCheck } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import EmptyState from '../components/States/EmptyState.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { notificationRows } from '../data/notifications.js'

/**
 * Notifications (اطلاعات) — placeholder page: static notification feed.
 * Linked from the header bell. No real notification source yet.
 */
export default function Notifications() {
  const { t, pick } = useAppUI()
  const { toast } = useToast()
  const [readIds, setReadIds] = useState([])

  const markAllRead = () => {
    setReadIds(notificationRows.map((row) => row.id))
    toast({ type: 'success', message: t('toast.demo') })
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={t('nav.notifications')}
        en="Notifications"
        subtitle={t('notifications.subtitle')}
        action={
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck size={16} />
            {t('notifications.markAllRead')}
          </Button>
        }
      />

      {notificationRows.length > 0 ? (
        <ul className="surface divide-y divide-border dark:divide-gray-700">
          {notificationRows.map((row) => {
            const read = readIds.includes(row.id)
            return (
              <li
                key={row.id}
                className={`flex items-start gap-3 px-4 py-4 sm:px-5 ${read ? 'opacity-50' : ''}`}
              >
                <span className="mt-1.5">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      row.type === 'warning'
                        ? 'bg-warning'
                        : row.type === 'success'
                          ? 'bg-success'
                          : 'bg-primary'
                    }`}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-main">{pick(row.title)}</p>
                  <p className="mt-0.5 text-xs text-muted">{pick(row.detail)}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap pt-0.5 text-[11px] text-muted">
                  {pick(row.time)}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState icon={BellOff} title={t('states.empty')} description={t('states.emptyHint')} />
      )}

      <p className="pb-2 text-center text-xs leading-relaxed text-muted">{t('demoNote')}</p>
    </div>
  )
}
