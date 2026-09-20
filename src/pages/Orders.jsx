import React from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import OrderItemsEditor from '../components/OrderItemsEditor'
import { orderTotals } from '../utils/calculations'
import { ORDER_STATUS } from '../constants/enums'
import { fmtCurrency, fmtDate, todayISO, fmtNumber } from '../utils/formatters'
import { Receipt, Printer, Truck } from 'lucide-react'
import Badge from '../components/UI/Badge'
import { useAppUI } from '../context/AppUIContext'
import { useLang } from '../context/LanguageContext'
import { db } from '../services/db'

const opts = (list) => list.map((v) => ({ value: v }))

export default function Orders() {
  const { lang, t } = useLang()
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
        }),
        compute: (v) => ({ total: orderTotals(v).total }),
        rowActions: (record) => [<PrintInvoice key="inv" record={record} />, <PrintChallan key="ch" record={record} />],
        columns: [
          { key: 'id', label: 'Order #', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'customerName', label: 'Customer' },
          { key: 'total', label: 'Total', render: (r) => <span className="num font-semibold">{fmtCurrency(r.total)}</span>, format: (v) => fmtNumber(v) },
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
          { key: 'taxPct', type: 'number', min: 0 },
          { key: 'commissionPct', type: 'number', min: 0 },
          { key: 'total', type: 'readonly', format: (v) => fmtCurrency(v) },
          { key: 'paidAmount', type: 'number', min: 0 },
          { key: 'vehicleNo' },
          { key: 'driver' },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        filters: [{ key: 'status', options: opts(ORDER_STATUS) }],
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

function PrintInvoice({ record }) {
  const { requestPrint } = useAppUI()
  return (
    <Button
      size="sm"
      variant="secondary"
      icon={Printer}
      onClick={() =>
        requestPrint({
          template: 'invoice',
          title: `${t('print.invoice')} — ${record.id}`,
          lang,
          data: { order: record, customer: db.get('customers', record.customerName) || { name: record.customerName } },
        })
      }
    >
      {t('orders.invoice')}
    </Button>
  )
}

function PrintChallan({ record }) {
  const { requestPrint } = useAppUI()
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
