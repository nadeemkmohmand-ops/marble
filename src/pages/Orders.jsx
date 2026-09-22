import React, { useMemo, useState } from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import Modal from '../components/UI/Modal'
import OrderItemsEditor from '../components/OrderItemsEditor'
import { orderTotals } from '../utils/calculations'
import { ORDER_STATUS, WHT_TYPES } from '../constants/enums'
import { fmtCurrency, fmtDate, todayISO, fmtNumber } from '../utils/formatters'
import { Receipt, FileText, Truck, Layers } from 'lucide-react'
import Badge from '../components/UI/Badge'
import Checkbox from '../components/UI/Checkbox'
import { useAppUI } from '../context/AppUIContext'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { db } from '../services/db'
import { checkApprovals } from '../utils/permissions'
import { storage } from '../utils/storage'
import { STORAGE_KEYS } from '../constants/storageKeys'
import SignaturePad from '../components/UI/SignaturePad'

const opts = (list) => list.map((v) => ({ value: v }))

/** WHT amount from a rule + custom % override. */
function whtAmount(taxable, whtType, whtPct) {
  if (whtType === 'goods_1p5') return taxable * 0.015
  if (whtType === 'services_10') return taxable * 0.10
  if (whtType === 'custom') return taxable * ((Number(whtPct) || 0) / 100)
  return 0
}

export default function Orders() {
  const { lang, t } = useLang()
  const settings = storage.get(STORAGE_KEYS.SETTINGS, {}) || {}

  const beforeSave = (form) => checkApprovals(form, settings, getCurrentUser())

  return (
    <CrudPage
      config={{
        collection: 'orders',
        i18nPrefix: 'orders',
        modalSize: 'xl',
        searchKeys: ['id', 'customerName', 'status', 'quoteRef', 'vehicleNo', 'driver'],
        defaults: () => ({
          date: todayISO(), status: 'pending', items: [],
          edgeCharges: 0, installationCharges: 0, transportCharges: 0, discount: 0, taxPct: 0, commissionPct: 0, paidAmount: 0,
          whtType: settings?.taxIds?.defaultWht || 'none', whtPct: 0,
        }),
        compute: (v) => {
          const totals = orderTotals(v)
          const wht = whtAmount(taxableOf(v), v.whtType, v.whtPct)
          return { total: Math.round((totals.total + wht) * 100) / 100, whtAmount: Math.round(wht * 100) / 100 }
        },
        beforeSave,
        rowActions: (record) => [<PrintInvoice key="inv" record={record} />, <PrintChallan key="ch" record={record} />],
        extraToolbar: () => <BatchPrintButton />,
        columns: [
          { key: 'id', label: 'Order #', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'customerName', label: 'Customer' },
          { key: 'total', label: 'Total', render: (r) => <span className="num font-semibold">{fmtCurrency(r.total)}</span>, format: (v) => fmtNumber(v) },
          { key: 'whtAmount', label: 'WHT', render: (r) => <span className="num text-amber-500">{r.whtAmount ? fmtCurrency(r.whtAmount) : '—'}</span>, format: (v) => fmtNumber(v) },
          { key: 'paidAmount', label: 'Paid', render: (r) => <span className="num">{fmtCurrency(r.paidAmount)}</span>, format: (v) => fmtNumber(v) },
          { key: 'balance', label: 'Balance', render: (r) => <span className="num text-red-500">{fmtCurrency((r.total || 0) - (r.paidAmount || 0))}</span>, exportFormat: (_v, r) => fmtNumber((r.total || 0) - (r.paidAmount || 0)) },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
        ],
        fields: [
          { key: 'customerName', type: 'ref', refCollection: 'customers', refLabel: 'name', required: true, placeholder: '—' },
          { key: 'date', type: 'date', required: true },
          { key: 'status', type: 'select', options: opts(ORDER_STATUS) },
          { key: 'quoteRef', hint: t('orders.quoteHint') },
          { key: 'items', type: 'custom', component: OrderItemsEditor, span: 'full' },
          { key: 'edgeCharges', type: 'number', min: 0 },
          { key: 'installationCharges', type: 'number', min: 0 },
          { key: 'transportCharges', type: 'number', min: 0 },
          { key: 'discount', type: 'number', min: 0 },
          { key: 'taxPct', type: 'number', min: 0, hint: lang === 'ur' ? 'جی ایس ٹی / سیلز ٹیکس' : 'GST / sales tax %' },
          { key: 'whtType', label: 'WHT', type: 'select', options: WHT_TYPES.map((w) => ({ value: w, label: w === 'none' ? 'None' : w.replace('_', ' ') })) },
          { key: 'whtPct', label: 'WHT custom %', type: 'number', min: 0, hint: 'used when WHT = custom' },
          { key: 'whtAmount', type: 'readonly', format: (v) => fmtCurrency(v) },
          { key: 'total', type: 'readonly', format: (v) => fmtCurrency(v) },
          { key: 'paidAmount', type: 'number', min: 0 },
          { key: 'vehicleNo', hint: lang === 'ur' ? 'گاڑی مستر سے بھی منتخب کریں' : 'also pick from Vehicle master' },
          { key: 'driver' },
          { key: 'deliverySign', label: lang === 'ur' ? 'ڈیلیوری دستخط' : 'Delivery sign-off', type: 'custom', component: SignaturePad, span: 'full' },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        filters: [{ key: 'status', options: opts(ORDER_STATUS) }],
        onSaved: (rec, mode) => {
          // Automation: order became ready → draft a gate pass automatically.
          if (mode === 'update' && rec.status === 'ready') {
            const auto = (settings?.automations || {}).autoGatePass
            const exists = db.list('gatePasses').some((g) => g.orderRef === rec.id)
            if (auto && !exists) {
              db.save('gatePasses', {
                date: todayISO(), type: 'delivery', orderRef: rec.id,
                customerName: rec.customerName, vehicleNo: rec.vehicleNo || '', driver: rec.driver || '',
                goodsDesc: (rec.items || []).map((it) => it.description).filter(Boolean).join(', '),
                qty: (rec.items || []).reduce((a, it) => a + (it.qty || 0), 0),
                unit: 'pcs', sqft: (rec.items || []).reduce((a, it) => a + (it.sqft || it.lengthFt * it.widthFt * it.qty || 0), 0),
                issuedBy: 'auto', status: 'draft',
              })
            }
          }
        },
        stats: (items) => {
          const revenue = items.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + (o.total || 0), 0)
          const received = items.reduce((a, o) => a + (o.paidAmount || 0), 0)
          const active = items.filter((o) => ['confirmed', 'cutting', 'polishing'].includes(o.status)).length
          return [
            { label: t('stats.orders'), value: items.length, icon: Receipt, tone: 'info' },
            { label: t('stats.inProduction'), value: active, icon: Receipt, tone: 'warning' },
            { label: t('stats.revenue'), value: fmtCurrency(revenue), icon: Receipt, tone: 'brand' },
            { label: t('stats.receivable'), value: fmtCurrency(revenue - received), icon: Receipt, tone: 'danger' },
          ]
        },
      }}
    />
  )
}

function taxableOf(order) {
  const totals = orderTotals(order)
  return Math.max(0, (totals.itemsTotal || 0) + (totals.extras || 0) - (totals.discount || 0))
}

function getCurrentUser() {
  return (storage.get(STORAGE_KEYS.AUTH, null) || {})
}

function PrintInvoice({ record }) {
  const { requestPrint } = useAppUI()
  const { t, lang } = useLang()
  const settings = storage.get(STORAGE_KEYS.SETTINGS, {}) || {}
  return (
    <Button
      size="sm"
      variant="secondary"
      icon={FileText}
      onClick={() =>
        requestPrint({
          template: 'invoice',
          title: `${t('print.invoice')} — ${record.id}`,
          lang,
          data: {
            order: record,
            customer: db.get('customers', record.customerName) || { name: record.customerName },
            company: { ...(storage.get(STORAGE_KEYS.COMPANY, {}) || {}), ntn: settings?.taxIds?.ntn, strn: settings?.taxIds?.strn },
          },
        })
      }
    >
      {t('orders.invoice')}
    </Button>
  )
}

function PrintChallan({ record }) {
  const { requestPrint } = useAppUI()
  const { t, lang } = useLang()
  return (
    <Button
      size="sm"
      variant="secondary"
      icon={Truck}
      onClick={() =>
        requestPrint({
          template: 'challan',
          title: `${t('print.challan')} — ${record.id}`,
          lang,
          data: { order: record, customer: db.get('customers', record.customerName) || { name: record.customerName } },
        })
      }
    >
      {t('orders.challan')}
    </Button>
  )
}

/** Batch print — many invoices in ONE combined PDF. */
function BatchPrintButton() {
  const { requestPrint } = useAppUI()
  const { t, lang } = useLang()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(new Set())
  const orders = db.list('orders')
  const sorted = useMemo(() => orders.slice(0, 60), [orders]) // recent 60 — keeps the sheet light

  const doPrint = () => {
    if (!picked.size) { toast.error(lang === 'ur' ? 'آرڈرز چنیں' : 'Pick orders first'); return }
    const chosen = sorted.filter((o) => picked.has(o.id))
    requestPrint({
      template: 'batchInvoices',
      title: `${lang === 'ur' ? 'بل بیچ' : 'Batch invoices'} (${chosen.length})`,
      lang,
      data: { orders: chosen },
    })
    setOpen(false)
  }

  return (
    <>
      <Button variant="secondary" icon={Layers} size="md" onClick={() => setOpen(true)}>
        <span className="hidden sm:inline">{lang === 'ur' ? 'بل بیچ پرنٹ' : 'Batch print'}</span>
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={lang === 'ur' ? 'ایک PDF میں کئی بل' : 'Batch print invoices'}
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)} className="w-full sm:w-auto">{t('common.cancel')}</Button>
            <Button icon={FileText} onClick={doPrint} className="w-full sm:w-auto">
              {lang === 'ur' ? 'بنائیں' : 'Build PDF'} ({picked.size})
            </Button>
          </div>
        }
      >
        <div className="space-y-1.5 max-h-80 overflow-auto">
          {sorted.map((o) => (
            <Checkbox
              key={o.id}
              label={`${o.id} — ${o.customerName || ''} — ${fmtCurrency(o.total)}`}
              checked={picked.has(o.id)}
              onChange={(v) => {
                const next = new Set(picked)
                if (v) next.add(o.id)
                else next.delete(o.id)
                setPicked(next)
              }}
            />
          ))}
        </div>
      </Modal>
    </>
  )
}
