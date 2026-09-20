import React from 'react'
import CrudPage from '../components/CrudPage'
import { EXPENSE_CATEGORIES } from '../constants/enums'
import { fmtCurrency, fmtDate, todayISO, fmtNumber } from '../utils/formatters'
import { Receipt } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

const opts = (list) => list.map((v) => ({ value: v }))

export default function Expenses() {
  const { t } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'expenses',
        i18nPrefix: 'expenses',
        searchKeys: ['id', 'category', 'allocateTo', 'notes', 'vendor'],
        defaults: () => ({ date: todayISO(), category: 'misc', amount: 0 }),
        columns: [
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'category', enumKey: 'enums.expenseCategory' },
          { key: 'amount', label: 'Amount', render: (r) => <span className="num font-semibold">{fmtCurrency(r.amount)}</span>, format: (v) => fmtNumber(v) },
          { key: 'recurring', label: 'Recurring', render: (r) => (r.recurring ? '✓' : '—'), format: (v, r) => (r.recurring ? 'Yes' : 'No') },
          { key: 'allocateTo', label: 'Allocated to' },
          { key: 'vendor', label: 'Vendor' },
          { key: 'notes', label: 'Notes', exportFormat: (v) => String(v || '').slice(0, 50) },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'category', type: 'select', options: opts(EXPENSE_CATEGORIES), enumPrefix: 'expenseCategory', required: true },
          { key: 'amount', type: 'number', min: 0, required: true },
          { key: 'recurring', type: 'checkbox' },
          { key: 'allocateTo', hint: t('hints.allocateTo') },
          { key: 'machineHours', type: 'number', min: 0 },
          { key: 'vendor' },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo' },
        ],
        filters: [{ key: 'category', options: opts(EXPENSE_CATEGORIES) }],
        stats: (items) => {
          const monthStart = new Date().toISOString().slice(0, 7)
          const month = items.filter((e) => (e.date || '').startsWith(monthStart))
          return [
            { label: t('stats.thisMonth'), value: fmtCurrency(month.reduce((a, e) => a + (e.amount || 0), 0)), icon: Receipt, tone: 'danger' },
            { label: t('stats.allExpenses'), value: fmtCurrency(items.reduce((a, e) => a + (e.amount || 0), 0)), icon: Receipt, tone: 'info' },
            { label: t('stats.recurringMonthly'), value: items.filter((e) => e.recurring).length, icon: Receipt, tone: 'warning' },
            { label: t('stats.entries'), value: items.length, icon: Receipt, tone: 'brand' },
          ]
        },
      }}
    />
  )
}
