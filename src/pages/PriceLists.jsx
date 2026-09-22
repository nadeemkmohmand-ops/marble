import React from 'react'
import { ListChecks, CheckCircle2, Percent, AlertTriangle } from 'lucide-react'

import CrudPage from '../components/CrudPage'
import { useLang } from '../context/LanguageContext'
import { CUSTOMER_TYPES, FINISHES, GRADES } from '../constants/enums'
import { fmtCurrency, fmtDate, fmtNumber, todayISO } from '../utils/formatters'

/**
 * PriceLists — rate cards per customer type / size / finish / grade.
 * Each list carries a selling rate per sq ft and an optional minimum
 * rate floor (margin guard) with an effective date window.
 */
const opts = (list) => list.map((v) => ({ value: v }))

export default function PriceLists() {
  const { lang } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'priceLists',
        i18nPrefix: 'priceLists',
        searchKeys: ['name', 'customerType', 'sizeText', 'finish', 'grade'],
        defaults: () => ({ effectiveFrom: todayISO(), active: true }),
        columns: [
          { key: 'name', label: 'List name' },
          { key: 'customerType', label: 'Customer type', format: (v) => v },
          { key: 'sizeText', label: 'Size', render: (r) => <span className="num">{r.sizeText || '—'}</span> },
          { key: 'thicknessMm', label: 'Thickness', render: (r) => <span className="num">{r.thicknessMm ?? '—'}</span>, format: (v) => fmtNumber(v) },
          { key: 'finish', label: 'Finish', format: (v) => v },
          { key: 'grade', label: 'Grade', format: (v) => v },
          { key: 'ratePerSqft', label: 'Rate / sq ft', render: (r) => <span className="num font-semibold">{fmtCurrency(r.ratePerSqft)}</span>, format: (v) => fmtNumber(v) },
          { key: 'minRatePerSqft', label: 'Min rate', render: (r) => <span className="num">{r.minRatePerSqft ? fmtCurrency(r.minRatePerSqft) : '—'}</span>, format: (v) => fmtNumber(v) },
          { key: 'effectiveFrom', label: 'Effective from', render: (r) => <span className="num">{fmtDate(r.effectiveFrom)}</span>, format: (v) => fmtDate(v) },
          {
            key: 'active', label: 'Active',
            render: (r) => (
              <span className={r.active ? 'text-emerald-600 font-semibold' : 'text-[var(--muted)]'}>{r.active ? '✓' : '—'}</span>
            ),
            exportFormat: (_v, r) => (r.active ? 'Active' : ''),
          },
        ],
        fields: [
          { key: 'name', required: true, hint: lang === 'ur' ? 'مثلاً ریٹیل 2026' : 'e.g. Retail 2026' },
          { key: 'customerType', type: 'select', options: opts(CUSTOMER_TYPES) },
          { key: 'sizeText', placeholder: '8×4' },
          { key: 'thicknessMm', type: 'number', min: 0 },
          { key: 'finish', type: 'select', options: opts(FINISHES) },
          { key: 'grade', type: 'select', options: opts(GRADES) },
          { key: 'ratePerSqft', type: 'number', min: 0, required: true },
          { key: 'minRatePerSqft', type: 'number', min: 0, hint: lang === 'ur' ? 'کم سے کم ریٹ (مارجن فرش)' : 'Margin floor' },
          { key: 'effectiveFrom', type: 'date' },
          { key: 'effectiveTo', type: 'date' },
          { key: 'active', type: 'checkbox' },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        filters: [
          { key: 'customerType', options: opts(CUSTOMER_TYPES) },
          { key: 'finish', options: opts(FINISHES) },
          { key: 'grade', options: opts(GRADES) },
        ],
        stats: (items) => {
          const active = items.filter((r) => r.active).length
          const avgRate = items.length ? items.reduce((a, r) => a + (r.ratePerSqft || 0), 0) / items.length : 0
          const belowFloor = items.filter((r) => (r.minRatePerSqft || 0) > 0 && (r.ratePerSqft || 0) < r.minRatePerSqft).length
          return [
            { label: lang === 'ur' ? 'ریٹ لسٹس' : 'Price lists', value: items.length, icon: ListChecks, tone: 'info' },
            { label: lang === 'ur' ? 'فعال' : 'Active', value: active, icon: CheckCircle2, tone: 'success' },
            { label: lang === 'ur' ? 'اوسط ریٹ' : 'Avg rate', value: fmtCurrency(avgRate), icon: Percent, tone: 'brand' },
            { label: lang === 'ur' ? 'فرش سے نیچے' : 'Below floor', value: belowFloor, icon: AlertTriangle, tone: belowFloor ? 'danger' : 'info' },
          ]
        },
      }}
    />
  )
}
