import React, { useMemo, useState } from 'react'
import { Package, ScissorsSquare, AlertTriangle, Coins } from 'lucide-react'

import CrudPage from '../components/CrudPage'
import Tabs from '../components/UI/Tabs'
import Badge from '../components/UI/Badge'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { CONSUMABLE_TYPES } from '../constants/enums'
import { db } from '../services/db'
import { fmtCurrency, fmtDate, fmtNumber, todayISO } from '../utils/formatters'

/**
 * Consumables — blades, belts, bearings, chemicals & spares store:
 *  1. Items register with stock qty, reorder point and stock value
 *  2. Stock in/out moves — "out" moves automatically deduct the item
 *     stock and can be linked to a machine / cutting job (JOB-####)
 *     so blade cost per sq ft can be tracked.
 */
const opts = (list) => list.map((v) => ({ value: v }))

export default function Consumables() {
  const { lang, fmtNum } = useLang()
  const [tab, setTab] = useState(0)
  const { items: moves } = useCollection('consumableMoves')
  const { items: jobCards } = useCollection('jobCards')

  const moveStats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7)
    const monthMoves = moves.filter((m) => (m.date || '').slice(0, 7) === month)
    const costOf = (m) => (m.qty || 0) * (m.unitCost || 0)
    const inCostMonth = monthMoves.filter((m) => m.direction === 'in').reduce((a, m) => a + costOf(m), 0)
    const outCostMonth = monthMoves.filter((m) => m.direction === 'out').reduce((a, m) => a + costOf(m), 0)
    const outCostAll = moves.filter((m) => m.direction === 'out').reduce((a, m) => a + costOf(m), 0)
    const outputSqft = jobCards.reduce((a, j) => a + (j.outputSqft || 0), 0)
    const perSqft = outputSqft > 0 ? outCostAll / outputSqft : 0
    return [
      { label: lang === 'ur' ? 'اسٹاک حرکتیں' : 'Moves', value: moves.length, icon: Package, tone: 'info' },
      { label: lang === 'ur' ? 'اس ماہ ان لاگت' : 'In cost this month', value: fmtCurrency(inCostMonth), icon: Package, tone: 'success' },
      { label: lang === 'ur' ? 'اس ماہ آؤٹ لاگت' : 'Out cost this month', value: fmtCurrency(outCostMonth), icon: Coins, tone: 'warning' },
      { label: lang === 'ur' ? 'فی مربع فٹ کھرچ' : 'Cost / sq ft', value: fmtCurrency(perSqft), icon: ScissorsSquare, tone: 'brand' },
    ]
  }, [moves, jobCards, lang])

  return (
    <div className="fade-in">
      <Tabs
        className="mb-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { label: lang === 'ur' ? 'آئٹمز' : 'Items' },
          { label: lang === 'ur' ? 'اسٹاک ان/آؤٹ' : 'Stock In/Out' },
        ]}
      />

      {tab === 0 && (
        <CrudPage
          config={{
            collection: 'consumables',
            i18nPrefix: 'consumables',
            searchKeys: ['name', 'type', 'location'],
            columns: [
              { key: 'name', label: 'Item' },
              { key: 'type', label: 'Type', format: (v) => v },
              { key: 'stockQty', label: 'Stock', render: (r) => <span className="num">{fmtNum(r.stockQty)}</span>, format: (v) => fmtNumber(v) },
              { key: 'minQty', label: 'Min', render: (r) => <span className="num">{fmtNum(r.minQty)}</span>, format: (v) => fmtNumber(v) },
              { key: 'unitCost', label: 'Unit cost', render: (r) => <span className="num">{fmtCurrency(r.unitCost)}</span>, format: (v) => fmtNumber(v) },
              {
                key: 'stockValue', label: 'Stock value',
                render: (r) => <span className="num font-semibold">{fmtCurrency((r.stockQty || 0) * (r.unitCost || 0))}</span>,
                exportFormat: (_v, r) => fmtNumber((r.stockQty || 0) * (r.unitCost || 0)),
              },
              {
                key: 'reorder', label: 'Reorder',
                render: (r) =>
                  (r.stockQty || 0) <= (r.minQty || 0) ? (
                    <Badge status="open" label={lang === 'ur' ? 'مجوزہ آرڈر' : 'Reorder'} />
                  ) : (
                    '—'
                  ),
                exportFormat: (_v, r) => ((r.stockQty || 0) <= (r.minQty || 0) ? 'Reorder' : ''),
              },
            ],
            fields: [
              { key: 'name', required: true },
              { key: 'type', type: 'select', options: opts(CONSUMABLE_TYPES) },
              { key: 'unit', placeholder: 'pcs / kg / litre' },
              { key: 'stockQty', type: 'number', min: 0 },
              { key: 'minQty', type: 'number', min: 0, hint: lang === 'ur' ? 'دوبارہ آرڈر کی حد' : 'Reorder point' },
              { key: 'unitCost', type: 'number', min: 0 },
              { key: 'supplierId', type: 'ref', refCollection: 'suppliers', refLabel: 'name' },
              { key: 'location' },
              { key: 'lastPurchasedAt', type: 'date' },
              { key: 'notes', type: 'textarea', span: 'full' },
            ],
            stats: (items) => {
              const stockValue = items.reduce((a, r) => a + (r.stockQty || 0) * (r.unitCost || 0), 0)
              const below = items.filter((r) => (r.stockQty || 0) <= (r.minQty || 0)).length
              const blades = items.filter((r) => r.type === 'blade').length
              return [
                { label: lang === 'ur' ? 'آئٹمز' : 'Items', value: items.length, icon: Package, tone: 'info' },
                { label: lang === 'ur' ? 'اسٹاک ویلیو' : 'Stock value', value: fmtCurrency(stockValue), icon: Coins, tone: 'brand' },
                { label: lang === 'ur' ? 'ری آرڈر پر' : 'Below reorder', value: below, icon: AlertTriangle, tone: below ? 'danger' : 'info' },
                { label: lang === 'ur' ? 'بلیڈز' : 'Blades', value: blades, icon: ScissorsSquare, tone: 'warning' },
              ]
            },
          }}
        />
      )}

      {tab === 1 && (
        <CrudPage
          config={{
            collection: 'consumableMoves',
            i18nPrefix: 'consumableMoves',
            searchKeys: ['itemId', 'machineName', 'jobRef'],
            defaults: () => ({ date: todayISO(), direction: 'out', qty: 0, unitCost: 0 }),
            compute: (v) => ({ total: (v.qty || 0) * (v.unitCost || 0) }),
            onSaved: (rec, mode) => {
              // An "in" move tops the item stock up, an "out" move
              // deducts it — never below zero.
              if (mode === 'add' && rec.itemId) {
                const item = db.get('consumables', rec.itemId)
                if (item) {
                  db.save('consumables', {
                    id: item.id,
                    stockQty: Math.max(0, (item.stockQty || 0) + (rec.direction === 'in' ? 1 : -1) * (rec.qty || 0)),
                  })
                }
              }
            },
            columns: [
              { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
              { key: 'itemId', label: 'Item' },
              {
                key: 'direction', label: 'Direction',
                render: (r) => (
                  <span className={`font-semibold ${r.direction === 'in' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {r.direction === 'in' ? '↑' : '↓'} {r.direction === 'in' ? (lang === 'ur' ? 'ان' : 'In') : lang === 'ur' ? 'آؤٹ' : 'Out'}
                  </span>
                ),
                format: (v) => v,
              },
              { key: 'qty', label: 'Qty', render: (r) => <span className="num">{fmtNum(r.qty)}</span>, format: (v) => fmtNumber(v) },
              { key: 'unitCost', label: 'Unit cost', render: (r) => <span className="num">{fmtCurrency(r.unitCost)}</span>, format: (v) => fmtNumber(v) },
              { key: 'total', label: 'Total', render: (r) => <span className="num font-semibold">{fmtCurrency(r.total)}</span>, format: (v) => fmtNumber(v) },
              { key: 'machineName', label: 'Machine' },
              { key: 'jobRef', label: 'Job ref', render: (r) => <span className="num">{r.jobRef || '—'}</span> },
            ],
            fields: [
              { key: 'date', type: 'date', required: true },
              { key: 'itemId', type: 'ref', refCollection: 'consumables', refLabel: 'name', required: true },
              {
                key: 'direction', type: 'select',
                options: [
                  { value: 'in', label: lang === 'ur' ? 'اسٹاک ان' : 'Stock in' },
                  { value: 'out', label: lang === 'ur' ? 'اسٹاک آؤٹ' : 'Stock out' },
                ],
              },
              { key: 'qty', type: 'number', min: 0, required: true },
              { key: 'unitCost', type: 'number', min: 0 },
              { key: 'machineName', type: 'ref', refCollection: 'machines', refLabel: 'name' },
              { key: 'jobRef', hint: lang === 'ur' ? 'JOB-0001 — بلیڈ لاگت کٹنگ جاب سے جوڑیں' : 'JOB-0001 to link blade cost to cutting job' },
              { key: 'total', type: 'readonly', format: (v) => fmtCurrency(v), hint: lang === 'ur' ? 'خودکار' : 'Auto' },
              { key: 'notes', type: 'textarea', span: 'full' },
            ],
            stats: () => moveStats,
          }}
        />
      )}
    </div>
  )
}
