import React from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import { SUPPLIER_TYPES } from '../constants/enums'
import { fmtCurrency, fmtNumber } from '../utils/formatters'
import { Truck } from 'lucide-react'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { whatsappText } from '../utils/exporters'

const opts = (list) => list.map((v) => ({ value: v }))

export default function Suppliers() {
  const { lang, t } = useLang()
  const { items: purchases } = useCollection('purchases')

  const transform = React.useCallback(
    (suppliers) =>
      suppliers.map((s) => {
        const mine = purchases.filter((p) => p.supplierName === s.id)
        const _purchases = mine.reduce((a, p) => a + (p.landedTotal || 0), 0)
        const _paid = mine.reduce((a, p) => a + (p.paidAmount || 0), 0)
        const _balance = _purchases - _paid + (s.openingBalance || 0)
        return { ...s, _purchases, _paid, _balance }
      }),
    [purchases],
  )

  const shareLedger = (s) => {
    const text = [
      lang === 'ur' ? `*کھاتہ — ${s.name}*` : `*Ledger — ${s.name}*`,
      '',
      `${lang === 'ur' ? 'کل خریداری' : 'Total purchases'}: ${fmtCurrency(s._purchases)}`,
      `${lang === 'ur' ? 'کل ادا شدہ' : 'Total paid'}: ${fmtCurrency(s._paid)}`,
      `${lang === 'ur' ? 'بقایا' : 'Balance'}: ${fmtCurrency(s._balance)}`,
    ].join('\n')
    whatsappText(text, s.whatsapp || s.phone)
  }

  return (
    <CrudPage
      config={{
        collection: 'suppliers',
        i18nPrefix: 'suppliers',
        transform,
        searchKeys: ['name', 'phone', 'country', 'type', 'address'],
        defaults: () => ({ type: 'local', openingBalance: 0, currency: 'PKR' }),
        rowActions: (record) => [
          <Button key="wa" size="sm" variant="whatsapp" onClick={() => shareLedger(record)}>
            {t('suppliers.ledger')}
          </Button>,
        ],
        columns: [
          { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
          { key: 'type', enumKey: 'enums.supplierType' },
          { key: 'phone', label: 'Phone', render: (r) => <span className="num">{r.phone || '—'}</span> },
          { key: 'country', label: 'Country' },
          { key: '_purchases', label: 'Purchases', render: (r) => <span className="num">{fmtCurrency(r._purchases)}</span>, exportFormat: (_v, r) => fmtNumber(r._purchases) },
          { key: '_paid', label: 'Paid', render: (r) => <span className="num">{fmtCurrency(r._paid)}</span>, exportFormat: (_v, r) => fmtNumber(r._paid) },
          { key: '_balance', label: 'Balance', render: (r) => <span className={`num font-semibold ${(r._balance || 0) > 0 ? 'text-red-500' : ''}`}>{fmtCurrency(r._balance)}</span>, exportFormat: (_v, r) => fmtNumber(r._balance) },
        ],
        fields: [
          { key: 'name', required: true },
          { key: 'type', type: 'select', options: opts(SUPPLIER_TYPES), enumPrefix: 'supplierType' },
          { key: 'phone', type: 'tel' },
          { key: 'whatsapp', type: 'tel' },
          { key: 'country' },
          { key: 'address', span: 'full' },
          { key: 'openingBalance', type: 'number' },
          { key: 'currency', type: 'select', options: ['PKR', 'USD', 'EUR', 'AED', 'CNY'].map((c) => ({ value: c, label: c })) },
          { key: 'terms', span: 'full' },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo' },
        ],
        stats: (items) => [
          { label: t('stats.suppliers'), value: items.length, icon: Truck, tone: 'info' },
          { label: t('stats.quarryImport'), value: items.filter((s) => s.type !== 'local').length, icon: Truck, tone: 'brand' },
          { label: t('stats.totalPayable'), value: fmtCurrency(items.reduce((a, s) => a + (s._balance || 0), 0)), icon: Truck, tone: 'danger' },
          { label: t('stats.local'), value: items.filter((s) => s.type === 'local').length, icon: Truck, tone: 'success' },
        ],
      }}
    />
  )
}
