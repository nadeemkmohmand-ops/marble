import React, { useMemo } from 'react'
import { AlertTriangle, Wrench, BellRing, CheckCheck } from 'lucide-react'
import Toolbar from '../components/UI/Toolbar'
import Card from '../components/UI/Card'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import EmptyState from '../components/States/EmptyState'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { agingDays } from '../utils/calculations'
import { fmtDate, fmtNumber } from '../utils/formatters'
import { orderTotals } from '../utils/calculations'

/** Alerts: low stock slabs, overdue invoices, maintenance due, advance recovery. */
export default function Notifications() {
  const { t, lang, fmtNum } = useLang()
  const { items: slabs } = useCollection('slabs')
  const { items: orders } = useCollection('orders')
  const { items: maintenance } = useCollection('maintenance')
  const { items: workers } = useCollection('workers')

  const alerts = useMemo(() => {
    const out = []
    // low stock
    const availableArea = slabs.filter((s) => s.status === 'available').reduce((a, s) => a + (s.areaSqft || 0), 0)
    if (availableArea < 500) {
      out.push({ id: 'low-stock', kind: 'lowStock', severity: 'warning', title: t('notifications.lowStock'), body: lang === 'ur' ? `دستیاب سلیب رقبہ صرف ${fmtNumber(availableArea, 0)} سکوئر فٹ ہے` : `Available slab area is only ${fmtNumber(availableArea, 0)} sq ft` })
    }
    // overdue invoices (balance > 0 and older than 30 days)
    orders
      .filter((o) => o.status !== 'cancelled')
      .map((o) => ({ ...o, balance: orderTotals(o).total - (o.paidAmount || 0), days: agingDays(o.date) }))
      .filter((o) => o.balance > 0 && o.days > 30)
      .slice(0, 20)
      .forEach((o) => {
        out.push({ id: `inv-${o.id}`, kind: 'overdueInvoice', severity: 'danger', title: `${t('notifications.overdueInvoice')} — ${o.id}`, body: `${o.customerName || ''} · ${o.days} ${lang === 'ur' ? 'دن' : 'days'}` })
      })
    // maintenance due
    maintenance
      .filter((m) => m.nextDue && new Date(m.nextDue) <= new Date(Date.now() + 7 * 86400000))
      .forEach((m) => {
        out.push({ id: `mnt-${m.id}`, kind: 'maintenanceDue', severity: 'warning', title: `${t('notifications.maintenanceDue')} — ${m.machineName || ''}`, body: fmtDate(m.nextDue, { lang }) })
      })
    // advances outstanding
    workers
      .filter((w) => (w.advances || 0) > 0 || (w.loan || 0) > 0)
      .slice(0, 20)
      .forEach((w) => {
        out.push({ id: `adv-${w.id}`, kind: 'advanceDue', severity: 'info', title: `${t('notifications.advanceDue')} — ${w.name}`, body: `${fmtNumber((w.advances || 0) + (w.loan || 0), 0)}` })
      })
    return out
  }, [slabs, orders, maintenance, workers, t, lang, fmtNum])

  return (
    <div className="fade-in">
      <Toolbar
        title={t('notifications.title')}
        description={t('notifications.subtitle')}
        actions={
          <Button variant="secondary" icon={CheckCheck} onClick={() => { /* informational page — nothing to persist */ }}>
            {t('notifications.markRead')}
          </Button>
        }
      />
      {alerts.length === 0 ? (
        <Card><EmptyState icon={BellRing} title={t('home.noNotifications')} /></Card>
      ) : (
        <div className="space-y-2.5">
          {alerts.map((a) => (
            <Card key={a.id} className="!p-4 flex items-start gap-3">
              <div
                className={`h-9 w-9 shrink-0 rounded-xl grid place-items-center ${
                  a.severity === 'danger' ? 'bg-red-500/15 text-red-500' : a.severity === 'warning' ? 'bg-amber-500/15 text-amber-500' : 'bg-sky-500/15 text-sky-500'
                }`}
              >
                {a.kind === 'maintenanceDue' ? <Wrench size={16} /> : <AlertTriangle size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm leading-urdu no-clip">{a.title}</div>
                <div className="text-xs text-[var(--muted)] leading-urdu no-clip">{a.body}</div>
              </div>
              <Badge label={t(`notifications.${a.kind}`)} tone={a.severity === 'danger' ? 'danger' : a.severity === 'warning' ? 'warning' : 'info'} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
