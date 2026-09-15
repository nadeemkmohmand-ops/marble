import { Plus, Users } from 'lucide-react'
import Badge from '../components/UI/Badge.jsx'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import EmptyState from '../components/States/EmptyState.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { Input } from '../components/UI/Input.jsx'
import Table from '../components/UI/Table.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { customerRows } from '../data/customers.js'
import { formatCurrency } from '../utils/formatters.js'

/**
 * Customers (گاہک) — placeholder page: name, contact and a fake ledger balance.
 * No CRUD — data comes from src/data/customers.js.
 */
export default function Customers() {
  const { t, pick, lang } = useAppUI()

  const columns = [
    { key: 'id', header: t('inv.id'), render: (row) => <span className="font-english font-semibold">{row.id}</span> },
    {
      key: 'name',
      header: t('common.name'),
      render: (row) => <span className="font-semibold">{pick(row.name)}</span>,
    },
    {
      key: 'phone',
      header: t('common.phone'),
      render: (row) => (
        <span className="font-english" dir="ltr">
          {row.phone}
        </span>
      ),
    },
    { key: 'area', header: t('common.area'), render: (row) => pick(row.area) },
    {
      key: 'balance',
      header: t('common.balance'),
      render: (row) =>
        row.balance > 0 ? (
          <Badge variant="warning">{formatCurrency(row.balance, lang)}</Badge>
        ) : (
          <Badge variant="success">✓</Badge>
        ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={t('nav.customers')}
        en="Customers"
        subtitle={t('customers.subtitle')}
        action={
          <Button variant="accent">
            <Plus size={18} />
            {t('customers.newCustomer')}
          </Button>
        }
      />

      <Card>
        <Input type="search" placeholder={t('customers.searchPlaceholder')} aria-label={t('common.search')} />
      </Card>

      {customerRows.length > 0 ? (
        <Table columns={columns} rows={customerRows} />
      ) : (
        <EmptyState icon={Users} title={t('states.empty')} description={t('states.emptyHint')} />
      )}

      <p className="pb-2 text-center text-xs leading-relaxed text-muted">{t('demoNote')}</p>
    </div>
  )
}
