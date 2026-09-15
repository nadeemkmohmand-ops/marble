import { useState } from 'react'
import { ClipboardList, Plus, Search } from 'lucide-react'
import Badge from '../components/UI/Badge.jsx'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import EmptyState from '../components/States/EmptyState.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { Select } from '../components/UI/Input.jsx'
import Table from '../components/UI/Table.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { orderRows } from '../data/orders.js'

/** Order status → Badge variant mapping. */
const STATUS_VARIANTS = {
  pending: 'warning',
  cutting: 'info',
  ready: 'success',
  delivered: 'neutral',
}

/**
 * Orders (آرڈرز) — placeholder page: static order table with a status filter.
 * No CRUD, no persistence — data comes from src/data/orders.js.
 */
export default function Orders() {
  const { t, pick } = useAppUI()
  const [status, setStatus] = useState('all')

  const visible = status === 'all' ? orderRows : orderRows.filter((row) => row.status === status)

  const columns = [
    {
      key: 'id',
      header: t('inv.id'),
      render: (row) => (
        <span className="font-english font-semibold text-primary dark:text-primary-light">{row.id}</span>
      ),
    },
    { key: 'customer', header: t('common.customer'), render: (row) => pick(row.customer) },
    { key: 'item', header: t('common.item'), render: (row) => pick(row.item) },
    {
      key: 'quantity',
      header: t('common.quantity'),
      render: (row) => <span className="font-english font-semibold">{row.quantity}</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status]} dot>
          {pick(row.statusLabel)}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={t('nav.orders')}
        en="Orders"
        subtitle={t('orders.subtitle')}
        action={
          <Button variant="accent">
            <Plus size={18} />
            {t('orders.newOrder')}
          </Button>
        }
      />

      {/* status filter (UI only) */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search
              size={18}
              className="absolute start-3.5 top-1/2 -translate-y-1/2 text-text-light"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder={t('common.search')}
              className="field-input ps-10"
              aria-label={t('common.search')}
            />
          </div>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={t('common.status')}>
            <option value="all">{t('common.status')}: {t('common.all')}</option>
            <option value="pending">{t('orders.statusPending')}</option>
            <option value="cutting">{t('orders.statusCutting')}</option>
            <option value="ready">{t('orders.statusReady')}</option>
            <option value="delivered">{t('orders.statusDelivered')}</option>
          </Select>
        </div>
      </Card>

      {/* table / empty state */}
      {visible.length > 0 ? (
        <Table columns={columns} rows={visible} />
      ) : (
        <EmptyState icon={ClipboardList} title={t('states.empty')} description={t('states.emptyHint')} />
      )}

      <p className="pb-2 text-center text-xs leading-relaxed text-muted">{t('demoNote')}</p>
    </div>
  )
}
