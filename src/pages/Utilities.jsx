import React from 'react'
import CrudPage from '../components/CrudPage'
import { UTILITY_TYPES } from '../constants/enums'
import { fmtCurrency, fmtDate, fmtNumber, todayISO } from '../utils/formatters'
import { Zap } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

const opts = (list) => list.map((v) => ({ value: v }))

/**
 * Utilities — electricity & solar billing register.
 * The unit price is a NORMAL EDITABLE FIELD: tariffs change, so every
 * bill is typed by hand (units × price is only a suggested amount —
 * you can always overwrite it before saving).
 */
export default function Utilities() {
  const { t } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'utilities',
        i18nPrefix: 'utilities',
        searchKeys: ['id', 'meterNo', 'billNo', 'vendor', 'notes'],
        defaults: () => ({ date: todayISO(), type: 'electricity', units: 0, unitPrice: 0, amount: 0 }),
        // Amount is auto-suggested from units × price but stays fully manual —
        // if the tariff changed, just type the real amount over it.
        compute: (v) => {
          const units = Number(v.units) || 0
          const price = Number(v.unitPrice) || 0
          const amount = Number(v.amount) || 0
          if (!amount && units && price) return { amount: Math.round(units * price) }
          return {}
        },
        columns: [
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'type', enumKey: 'enums.utilityType' },
          { key: 'meterNo', label: 'Meter no.', render: (r) => <span className="num">{r.meterNo || '—'}</span> },
          { key: 'units', label: 'Units', render: (r) => <span className="num">{fmtNumber(r.units, 0)}</span>, format: (v) => fmtNumber(v, 0) },
          { key: 'unitPrice', label: 'Unit price', render: (r) => <span className="num">{fmtCurrency(r.unitPrice)}</span>, format: (v) => fmtNumber(v) },
          { key: 'amount', label: 'Amount', render: (r) => <span className="num font-semibold">{fmtCurrency(r.amount)}</span>, format: (v) => fmtNumber(v) },
          { key: 'billNo', label: 'Bill no.', render: (r) => <span className="num">{r.billNo || '—'}</span> },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'type', type: 'select', options: opts(UTILITY_TYPES), enumPrefix: 'utilityType', required: true },
          { key: 'meterNo', hint: t('hints.meterNo') },
          { key: 'billNo' },
          { key: 'prevReading', type: 'number', min: 0 },
          { key: 'curReading', type: 'number', min: 0 },
          { key: 'units', type: 'number', min: 0, hint: t('hints.units') },
          { key: 'unitPrice', type: 'number', min: 0, hint: t('hints.unitPrice') },
          { key: 'amount', type: 'number', min: 0, hint: t('hints.amountAuto') },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        filters: [{ key: 'type', options: opts(UTILITY_TYPES) }],
        stats: (items) => {
          const monthStart = new Date().toISOString().slice(0, 7)
          const month = items.filter((u) => (u.date || '').startsWith(monthStart))
          return [
            { label: t('stats.monthElectricity'), value: fmtCurrency(month.filter((u) => u.type === 'electricity').reduce((a, u) => a + (u.amount || 0), 0)), icon: Zap, tone: 'danger' },
            { label: t('stats.monthSolarUnits'), value: fmtNumber(month.filter((u) => u.type === 'solar').reduce((a, u) => a + (u.units || 0), 0), 0), icon: Zap, tone: 'success' },
            { label: t('stats.allUnits'), value: fmtNumber(items.reduce((a, u) => a + (u.units || 0), 0), 0), icon: Zap, tone: 'info' },
            { label: t('stats.allAmount'), value: fmtCurrency(items.reduce((a, u) => a + (u.amount || 0), 0)), icon: Zap, tone: 'brand' },
          ]
        },
      }}
    />
  )
}
