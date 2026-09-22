import React from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import Table from '../components/UI/Table'
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
  const { items: suppliers } = useCollection('suppliers')

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

  // Supplier scorecards — on-time delivery % and landed-cost per purchase.
  const scorecards = React.useMemo(() => {
    return suppliers.map((s) => {
      const mine = purchases.filter((p) => p.supplierName === s.id)
      const withPromise = mine.filter((p) => p.promisedDate)
      const onTime = withPromise.filter((p) => p.date <= p.promisedDate).length
      const avgLanded = mine.length ? mine.reduce((a, p) => a + (p.landedTotal || 0), 0) / mine.length : 0
      return {
        id: s.id,
        name: s.name,
        purchases: mine.length,
        onTimePct: withPromise.length ? Math.round((onTime / withPromise.length) * 100) : null,
        avgLanded,
      }
    }).filter((r) => r.purchases > 0).sort((a, b) => b.onTimePct - a.onTimePct)
  }, [suppliers, purchases])

  return (
    <>
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

      {/* ── Supplier scorecards: who is actually reliable? ── */}
      {scorecards.length > 0 && (
        <div className="card p-3 sm:p-4 mt-4">
          <h3 className="font-semibold text-sm mb-3 leading-urdu no-clip">
            {lang === 'ur' ? 'سپلائر اسکور کارڈ — کون اصل میں قابلِ بھروسا ہے؟' : 'Supplier scorecards — who is actually reliable?'}
          </h3>
          <Table
            columns={[
              { key: 'name', label: 'Supplier', render: (r) => <span className="font-semibold">{r.name}</span> },
              { key: 'purchases', label: 'Purchases', render: (r) => <span className="num">{r.purchases}</span> },
              {
                key: 'onTimePct', label: 'On-time %',
                render: (r) => r.onTimePct === null
                  ? <span className="text-[var(--muted)]">—</span>
                  : <span className={`num font-bold ${r.onTimePct >= 80 ? 'text-emerald-500' : r.onTimePct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{r.onTimePct}%</span>,
              },
              { key: 'avgLanded', label: 'Avg landed / lot', render: (r) => <span className="num">{fmtCurrency(r.avgLanded)}</span>, format: (v) => fmtNumber(v) },
            ]}
            rows={scorecards}
          />
          <p className="text-[11px] text-[var(--muted)] mt-2">
            {lang === 'ur' ? 'وقت پر ڈیلیوری کا حساب خریداری پر درج "وعدہ شدہ تاریخ" سے بنتا ہے۔' : 'On-time % comes from the promised delivery date recorded on each purchase.'}
          </p>
        </div>
      )}
    </>
  )
}
