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
 * bill is typed by hand.
 *
 * Auto-calculations (live, as the user types — runs after every field
 * change via CrudPage's live-compute wrapper):
 *   • units   = current reading − previous reading   (when both readings are filled)
 *   • amount  = units × unit price                    (when both are > 0)
 * If the bill says something different, just type over the calculated
 * amount — your value sticks until the next related field changes.
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
        compute: (v) => {
          // Treat empty / null / undefined as "not filled yet" so clearing a
          // field doesn't make units jump to (cur - 0) or (0 - prev).
          const has = (x) => x !== '' && x !== undefined && x !== null
          const prev = has(v.prevReading) ? Number(v.prevReading) : null
          const cur = has(v.curReading) ? Number(v.curReading) : null
          const price = Number(v.unitPrice) || 0
          const out = {}
          // Units = current − previous (auto). Both readings must be filled
          // and current must be ≥ previous (no negative bills).
          if (prev !== null && cur !== null && cur >= prev) {
            out.units = Math.round((cur - prev) * 100) / 100
          }
          const units = out.units !== undefined ? out.units : (Number(v.units) || 0)
          // Amount = units × price (auto).
          if (units > 0 && price > 0) {
            out.amount = Math.round(units * price * 100) / 100
          }
          return out
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
          { key: 'units', type: 'number', min: 0, hint: t('hints.unitsAuto') },
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
