import React from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import OrderItemsEditor from '../components/OrderItemsEditor'
import { orderTotals } from '../utils/calculations'
import { QUOTE_STATUS } from '../constants/enums'
import { fmtCurrency, fmtDate, todayISO, fmtNumber } from '../utils/formatters'
import { FileText, AlertTriangle } from 'lucide-react'
import Badge from '../components/UI/Badge'
import { useAppUI } from '../context/AppUIContext'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { db } from '../services/db'
import { uid } from '../utils/id'
import { storage } from '../utils/storage'
import { STORAGE_KEYS } from '../constants/storageKeys'

const opts = (list) => list.map((v) => ({ value: v }))

/**
 * MarginAlert — warns INSIDE the quotation builder when a line's rate
 * falls below the margin floor: either the matching price-list floor
 * (per size/finish/grade/customer type) or, when no price list covers
 * the item, the average slab cost × (1 + default margin %).
 */
function MarginAlert({ form }) {
  const { lang } = useLang()
  const ur = lang === 'ur'
  const settings = storage.get(STORAGE_KEYS.SETTINGS, {}) || {}
  const priceLists = db.list('priceLists').filter((p) => p.active !== false)
  const slabs = db.list('slabs').filter((s) => s.costPerSqftSlab)
  const marginPct = Number(settings.defaultMarginPct) || 20

  const issues = []
  ;(form?.items || []).forEach((it, idx) => {
    const sizeText = `${it.lengthFt}×${it.widthFt}`
    const list = priceLists.find((p) => (p.sizeText || '').replace(/\s/g, '') === sizeText.replace(/\s/g, ''))
    const floor = list
      ? (list.minRatePerSqft || 0)
      : (() => {
        if (!slabs.length) return 0
        const avgCost = slabs.reduce((a, s) => a + s.costPerSqftSlab, 0) / slabs.length
        return Math.round(avgCost * (1 + marginPct / 100))
      })()
    if (floor > 0 && (it.rate || 0) < floor) {
      issues.push({ idx: idx + 1, desc: it.description || `#${idx + 1}`, rate: it.rate, floor, source: list ? 'price list' : 'cost' })
    }
  })

  if (!issues.length) return null
  return (
    <div className="sm:col-span-2 rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 flex gap-2.5">
      <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
      <div className="text-xs leading-urdu no-clip">
        <div className="font-bold text-amber-600 mb-0.5">{ur ? 'منافع الرٹ' : 'Margin alert'}</div>
        {issues.map((i) => (
          <div key={i.idx} className="num">
            {ur
              ? `${i.desc}: ریٹ ${fmtCurrency(i.rate)} فرش ${fmtCurrency(i.floor)} سے نیچے ہے`
              : `${i.desc}: rate ${fmtCurrency(i.rate)} is below the ${fmtCurrency(i.floor)} floor (${i.source})`}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Quotations() {
  const { t } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'quotations',
        i18nPrefix: 'quotations',
        modalSize: 'xl',
        searchKeys: ['id', 'customerName', 'status', 'notes'],
        defaults: () => ({
          date: todayISO(),
          validUntil: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
          status: 'draft',
          items: [],
          edgeCharges: 0, installationCharges: 0, transportCharges: 0, discount: 0, taxPct: 0, commissionPct: 0,
        }),
        compute: (v) => ({ total: orderTotals(v).total }),
        rowActions: (record) => [<ConvertButton key="cv" record={record} />],
        columns: [
          { key: 'id', label: 'Quote #', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'customerName', label: 'Customer' },
          { key: 'itemsCount', label: 'Items', render: (r) => <span className="num">{(r.items || []).length}</span>, exportFormat: (_v, r) => (r.items || []).length },
          { key: 'total', label: 'Total', render: (r) => <span className="num font-semibold">{fmtCurrency(r.total)}</span>, format: (v) => fmtNumber(v) },
          { key: 'validUntil', label: 'Valid until', render: (r) => <span className="num">{fmtDate(r.validUntil)}</span>, format: (v) => fmtDate(v) },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
        ],
        fields: [
          { key: 'customerName', type: 'ref', refCollection: 'customers', refLabel: 'name', required: true, placeholder: '—' },
          { key: 'date', type: 'date', required: true },
          { key: 'validUntil', type: 'date' },
          { key: 'status', type: 'select', options: opts(QUOTE_STATUS) },
          { key: 'items', type: 'custom', component: OrderItemsEditor, span: 'full' },
          { key: '_marginAlert', type: 'custom', component: MarginAlert, span: 'full' },
          { key: 'edgeCharges', type: 'number', min: 0 },
          { key: 'installationCharges', type: 'number', min: 0 },
          { key: 'transportCharges', type: 'number', min: 0 },
          { key: 'discount', type: 'number', min: 0 },
          { key: 'taxPct', type: 'number', min: 0 },
          { key: 'commissionPct', type: 'number', min: 0 },
          { key: 'total', type: 'readonly', format: (v) => fmtCurrency(v) },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        filters: [{ key: 'status', options: opts(QUOTE_STATUS) }],
        stats: (items) => {
          const accepted = items.filter((q) => q.status === 'accepted' || q.status === 'converted')
          return [
            { label: t('stats.quotations'), value: items.length, icon: FileText, tone: 'info' },
            { label: t('stats.accepted'), value: accepted.length, icon: FileText, tone: 'success' },
            { label: t('stats.acceptedValue'), value: fmtCurrency(accepted.reduce((a, q) => a + (q.total || 0), 0)), icon: FileText, tone: 'brand' },
            { label: t('stats.pipeline'), value: fmtCurrency(items.filter((q) => ['draft', 'sent'].includes(q.status)).reduce((a, q) => a + (q.total || 0), 0)), icon: FileText, tone: 'warning' },
          ]
        },
      }}
    />
  )
}

function ConvertButton({ record }) {
  const toast = useToast()
  if (record.status === 'converted') return null
  return (
    <Button
      size="sm"
      onClick={() => {
        const order = db.save('orders', {
          ...record,
          id: uid('orders'),
          status: 'pending',
          quoteRef: record.id,
          paidAmount: 0,
          createdAt: new Date().toISOString(),
        })
        db.save('quotations', { ...record, status: 'converted' })
        toast.success(t('quotations.converted'))
        window.location.hash = `#/orders`
        return order
      }}
    >
      {t('quotations.convert')}
    </Button>
  )
}
