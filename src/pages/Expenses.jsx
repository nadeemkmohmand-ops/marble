import { Plus, Wallet } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import EmptyState from '../components/States/EmptyState.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import Table from '../components/UI/Table.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { expenseRows, expenseSummary } from '../data/expenses.js'
import { formatCurrency, formatNumber } from '../utils/formatters.js'
import { sum } from '../utils/numbers.js'

/**
 * Expenses (اخراجات) — placeholder page: static summary + expense table.
 * Separate from Reports; no CRUD — data comes from src/data/expenses.js.
 */
export default function Expenses() {
  const { t, pick, lang } = useAppUI()

  const columns = [
    { key: 'id', header: t('inv.id'), render: (row) => <span className="font-english font-semibold">{row.id}</span> },
    {
      key: 'date',
      header: t('common.date'),
      render: (row) => <span className="font-english">{row.date}</span>,
    },
    { key: 'category', header: t('common.category'), render: (row) => pick(row.category) },
    {
      key: 'amount',
      header: t('common.amount'),
      render: (row) => (
        <span className="font-english font-semibold text-error">{formatCurrency(row.amount, lang)}</span>
      ),
    },
    { key: 'note', header: t('common.note'), render: (row) => pick(row.note) },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={t('nav.expenses')}
        en="Expenses"
        subtitle={t('expenses.subtitle')}
        action={
          <Button variant="accent">
            <Plus size={18} />
            {t('expenses.addExpense')}
          </Button>
        }
      />

      {/* monthly summary (static) */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {expenseSummary.map((item) => (
          <div key={item.labelKey} className="surface p-4">
            <p className="text-xs font-medium text-muted">{t(item.labelKey)}</p>
            <p className="mt-2 font-english text-xl font-bold text-main sm:text-2xl">
              {formatNumber(item.value, 'en')}
            </p>
          </div>
        ))}
        <div className="surface border-accent/40 p-4">
          <p className="text-xs font-medium text-muted">{t('expenses.monthTotal')}</p>
          <p className="mt-2 font-english text-xl font-bold text-accent-dark dark:text-accent-light sm:text-2xl">
            {formatNumber(sum(expenseSummary.map((item) => item.value)), 'en')}
          </p>
        </div>
      </section>

      {expenseRows.length > 0 ? (
        <Table columns={columns} rows={expenseRows} />
      ) : (
        <EmptyState icon={Wallet} title={t('states.empty')} description={t('states.emptyHint')} />
      )}

      <p className="pb-2 text-center text-xs leading-relaxed text-muted">{t('demoNote')}</p>
    </div>
  )
}
