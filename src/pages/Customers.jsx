import React from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import { fmtCurrency, fmtNumber } from '../utils/formatters'
import { Users, MessageCircle } from 'lucide-react'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { whatsappText } from '../utils/exporters'

export default function Customers() {
  const { lang, t } = useLang()
  const { items: orders } = useCollection('orders')

  const transform = React.useCallback(
    (customers) =>
      customers.map((c) => {
        const mine = orders.filter((o) => o.customerId === c.id && o.status !== 'cancelled')
        const _orders = mine.length
        const _total = mine.reduce((a, o) => a + (o.total || 0), 0)
        const _paid = mine.reduce((a, o) => a + (o.paidAmount || 0), 0)
        const _balance = _total - _paid + (c.openingBalance || 0)
        return { ...c, _orders, _total, _paid, _balance }
      }),
    [orders],
  )

  const shareStatement = (c) => {
    const text = [
      lang === 'ur' ? `*اسٹیٹمنٹ — ${c.name}*` : `*Statement — ${c.name}*`,
      '',
      `${lang === 'ur' ? 'آرڈرز' : 'Orders'}: ${c._orders}`,
      `${lang === 'ur' ? 'کل' : 'Total'}: ${fmtCurrency(c._total)}`,
      `${lang === 'ur' ? 'وصول' : 'Received'}: ${fmtCurrency(c._paid)}`,
      `${lang === 'ur' ? 'بقایا' : 'Balance'}: ${fmtCurrency(c._balance)}`,
    ].join('\n')
    whatsappText(text, c.whatsapp || c.phone)
  }

  return (
    <CrudPage
      config={{
        collection: 'customers',
        i18nPrefix: 'customers',
        transform,
        searchKeys: ['name', 'phone', 'address', 'notes'],
        defaults: () => ({ openingBalance: 0 }),
        rowActions: (record) => [
          <Button key="wa" size="sm" variant="whatsapp" icon={MessageCircle} onClick={() => shareStatement(record)}>
            {t('customers.statement')}
          </Button>,
        ],
        columns: [
          { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
          { key: 'phone', label: 'Phone', render: (r) => <span className="num">{r.phone || '—'}</span> },
          { key: '_orders', label: 'Orders', render: (r) => <span className="num">{r._orders}</span> },
          { key: '_total', label: 'Total', render: (r) => <span className="num">{fmtCurrency(r._total)}</span>, exportFormat: (_v, r) => fmtNumber(r._total) },
          { key: '_paid', label: 'Received', render: (r) => <span className="num">{fmtCurrency(r._paid)}</span>, exportFormat: (_v, r) => fmtNumber(r._paid) },
          { key: '_balance', label: 'Balance', render: (r) => <span className={`num font-semibold ${(r._balance || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{fmtCurrency(r._balance)}</span>, exportFormat: (_v, r) => fmtNumber(r._balance) },
        ],
        fields: [
          { key: 'name', required: true },
          { key: 'phone', type: 'tel' },
          { key: 'whatsapp', type: 'tel' },
          { key: 'address', span: 'full' },
          { key: 'openingBalance', type: 'number' },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        stats: (items) => [
          { label: t('stats.customers'), value: items.length, icon: Users, tone: 'info' },
          { label: t('stats.totalReceivable'), value: fmtCurrency(items.reduce((a, c) => a + Math.max(0, c._balance || 0), 0)), icon: Users, tone: 'danger' },
          { label: t('stats.totalBusiness'), value: fmtCurrency(items.reduce((a, c) => a + (c._total || 0), 0)), icon: Users, tone: 'brand' },
          { label: t('stats.withBalance'), value: items.filter((c) => (c._balance || 0) > 0).length, icon: Users, tone: 'warning' },
        ],
      }}
    />
  )
}
