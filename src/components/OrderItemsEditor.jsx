import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Input from './UI/Input'
import Button from './UI/Button'
import { useLang } from '../context/LanguageContext'
import { orderTotals } from '../utils/calculations'
import { fmtCurrency } from '../utils/formatters'

/**
 * Line-items editor for Quotations & Orders (room-wise measurements).
 * sq ft auto = L × W × qty; rate per sq ft; wastage % per item.
 */
export default function OrderItemsEditor({ value = [], form, onChange, label }) {
  const { t, fmtNum, lang } = useLang()
  const items = Array.isArray(value) ? value : []

  const set = (i, key, v) => {
    const next = items.map((it, j) => (j === i ? { ...it, [key]: v } : it))
    onChange(next)
  }

  const add = () =>
    onChange([...items, { description: '', room: '', lengthFt: '', widthFt: '', qty: 1, rate: 0, wastagePct: form?.wastagePct ?? 0 }])

  const remove = (i) => onChange(items.filter((_, j) => j !== i))

  const totals = orderTotals({ ...form, items })
  const money = (v) => fmtCurrency(v, { currency: form?.currency || 'PKR', lang })

  return (
    <div className="sm:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-[var(--muted)] leading-urdu no-clip">{label || t('fields.items')}</div>
        <Button type="button" size="sm" variant="secondary" icon={Plus} onClick={add}>
          {t('quotations.addItem')}
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-[var(--muted)] py-3 text-center leading-urdu">{t('quotations.itemsHint')}</p>
      )}

      <div className="space-y-3">
        {items.map((it, i) => {
          const sqft = Number(it.sqft) || (Number(it.lengthFt) || 0) * (Number(it.widthFt) || 0) * (Number(it.qty) || 1)
          const lineTotal = sqft * (1 + (Number(it.wastagePct) || 0) / 100) * (Number(it.rate) || 0)
          return (
            <div key={i} className="border border-[var(--border)] rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold num">#{i + 1}</span>
                <button type="button" onClick={() => remove(i)} className="btn btn-ghost h-7 w-7 justify-center text-red-500" aria-label="Remove">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Input label={t('fields.description')} value={it.description || ''} onChange={(e) => set(i, 'description', e.target.value)} />
                <Input label={t('fields.room')} value={it.room || ''} onChange={(e) => set(i, 'room', e.target.value)} />
                <Input label={t('fields.lengthFt')} type="number" step="0.1" value={it.lengthFt ?? ''} onChange={(e) => set(i, 'lengthFt', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                <Input label={t('fields.widthFt')} type="number" step="0.1" value={it.widthFt ?? ''} onChange={(e) => set(i, 'widthFt', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                <Input label={t('fields.quantity')} type="number" min="1" value={it.qty ?? 1} onChange={(e) => set(i, 'qty', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                <Input label={`${t('fields.sqft')} (${t('common.optional')})`} type="number" step="0.1" value={it.sqft ?? ''} onChange={(e) => set(i, 'sqft', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                <Input label={t('fields.rate')} type="number" step="0.1" value={it.rate ?? ''} onChange={(e) => set(i, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                <Input label={t('fields.wastagePct')} type="number" step="0.5" value={it.wastagePct ?? 0} onChange={(e) => set(i, 'wastagePct', e.target.value === '' ? '' : parseFloat(e.target.value))} />
              </div>
              <div className="text-end text-xs num text-[var(--muted)]">
                {fmtNum(sqft)} sq ft × {fmtNum(it.rate || 0)} <span className="font-semibold text-[var(--text)]">= {money(lineTotal)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {items.length > 0 && (
        <div className="mt-3 border border-dashed border-[var(--border)] rounded-xl p-3 text-sm space-y-1.5 num">
          <Line label={t('common.subtotal')} value={money(totals.itemsTotal)} />
          <Line label={t('fields.edgeCharges')} value={money(totals.extras)} />
          <Line label={t('fields.discount')} value={`- ${money(totals.discount)}`} />
          <Line label={t('fields.taxPct')} value={money(totals.tax)} />
          <Line label={t('common.grandTotal')} value={money(totals.total)} strong />
        </div>
      )}
    </div>
  )
}

function Line({ label, value, strong }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? 'font-bold border-t border-[var(--border)] pt-1.5 mt-1' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
