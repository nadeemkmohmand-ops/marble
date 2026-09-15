import { HardHat, UserPlus } from 'lucide-react'
import Badge from '../components/UI/Badge.jsx'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import EmptyState from '../components/States/EmptyState.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import Table from '../components/UI/Table.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { workerRows } from '../data/workers.js'

/**
 * Workers (ورکرز) — placeholder page: staff list, shift and fake attendance.
 * No CRUD — data comes from src/data/workers.js.
 */
export default function Workers() {
  const { t, pick } = useAppUI()

  const presentCount = workerRows.filter((row) => row.present).length

  const columns = [
    { key: 'id', header: t('inv.id'), render: (row) => <span className="font-english font-semibold">{row.id}</span> },
    {
      key: 'name',
      header: t('common.name'),
      render: (row) => <span className="font-semibold">{pick(row.name)}</span>,
    },
    { key: 'role', header: t('common.role'), render: (row) => pick(row.role) },
    { key: 'shift', header: t('common.shift'), render: (row) => pick(row.shift) },
    {
      key: 'attendance',
      header: t('common.attendance'),
      render: (row) =>
        row.present ? (
          <Badge variant="success" dot>
            {t('workers.present')}
          </Badge>
        ) : (
          <Badge variant="error" dot>
            {t('workers.absent')}
          </Badge>
        ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={t('nav.workers')}
        en="Workers"
        subtitle={t('workers.subtitle')}
        action={
          <Button variant="accent">
            <UserPlus size={18} />
            {t('common.add')}
          </Button>
        }
      />

      {/* attendance summary (static) */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold text-main">{t('workers.attendanceToday')}</span>
          <Badge variant="info">
            {presentCount} / {workerRows.length}
          </Badge>
        </div>
      </Card>

      {workerRows.length > 0 ? (
        <Table columns={columns} rows={workerRows} />
      ) : (
        <EmptyState icon={HardHat} title={t('states.empty')} description={t('states.emptyHint')} />
      )}

      <p className="pb-2 text-center text-xs leading-relaxed text-muted">{t('demoNote')}</p>
    </div>
  )
}
