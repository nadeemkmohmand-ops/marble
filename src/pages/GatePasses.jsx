import React from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import SignaturePad from '../components/UI/SignaturePad'
import { GATE_PASS_TYPES } from '../constants/enums'
import { fmtDate, fmtNumber, todayISO } from '../utils/formatters'
import { Truck, CalendarDays, FileText, Recycle } from 'lucide-react'
import { useAppUI } from '../context/AppUIContext'
import { useLang } from '../context/LanguageContext'

/**
 * GatePasses — the factory guard's register. Every load that leaves the
 * factory (marble delivery, waste/scrap, returns, transfers) gets a
 * numbered gate pass with vehicle, driver, goods description and the
 * receiver's signature captured on-device. Each pass prints as a
 * printable Gate Pass document.
 */
const opts = (list) => list.map((v) => ({ value: v }))

const TYPE_UR = { delivery: 'ڈیلیوری', return: 'واپسی', transfer: 'ٹرانسفر', waste: 'اسکریپ' }

export default function GatePasses() {
  const { lang } = useLang()

  const typeOptions = GATE_PASS_TYPES.map((v) => ({ value: v, label: lang === 'ur' ? TYPE_UR[v] || v : v }))

  return (
    <CrudPage
      config={{
        collection: 'gatePasses',
        i18nPrefix: 'gatePasses',
        modalSize: 'lg',
        searchKeys: ['id', 'orderRef', 'customerName', 'vehicleNo', 'driver', 'receiverName'],
        defaults: () => ({ date: todayISO(), type: 'delivery' }),
        rowActions: (record) => [<PrintGatePass key="gp" record={record} />],
        columns: [
          { key: 'id', label: 'Pass #', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          {
            key: 'type',
            label: 'Type',
            render: (r) => (lang === 'ur' ? TYPE_UR[r.type] || r.type : r.type),
            format: (v) => v,
          },
          { key: 'orderRef', label: 'Order ref', render: (r) => (r.orderRef ? <span className="num">{r.orderRef}</span> : '—') },
          { key: 'customerName', label: 'Customer' },
          { key: 'vehicleNo', label: 'Vehicle no.' },
          { key: 'driver', label: 'Driver' },
          { key: 'qty', label: 'Qty', render: (r) => <span className="num">{r.qty ?? '—'}</span>, format: (v) => fmtNumber(v) },
          { key: 'receiverName', label: 'Receiver' },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'type', type: 'select', options: typeOptions },
          { key: 'orderRef', hint: 'ORD-0007' },
          { key: 'customerName', type: 'ref', refCollection: 'customers', refLabel: 'name' },
          { key: 'vehicleNo' },
          { key: 'driver' },
          { key: 'driverPhone', type: 'tel' },
          { key: 'goodsDesc', span: 'full', placeholder: 'Slabs / blocks / offcuts description' },
          { key: 'qty', type: 'number', min: 0 },
          { key: 'unit', placeholder: 'slabs / sq ft / cft' },
          { key: 'sqft', type: 'number', min: 0 },
          { key: 'destination', span: 'full' },
          { key: 'receiverName' },
          { key: 'receiverPhone', type: 'tel' },
          {
            key: 'receiverSign',
            type: 'custom',
            component: SignaturePad,
            span: 'full',
            format: (v) => (v ? (lang === 'ur' ? '✓ دستخط محفوظ' : '✓ signature captured') : '—'),
          },
          { key: 'issuedBy' },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo' },
        ],
        stats: (items) => {
          const month = todayISO().slice(0, 7)
          return [
            { label: lang === 'ur' ? 'آج' : 'Today', value: items.filter((g) => g.date === todayISO()).length, icon: Truck, tone: 'info' },
            {
              label: lang === 'ur' ? 'اس ماہ' : 'This month',
              value: items.filter((g) => (g.date || '').slice(0, 7) === month).length,
              icon: CalendarDays,
              tone: 'brand',
            },
            { label: lang === 'ur' ? 'کل پاس' : 'Total passes', value: items.length, icon: FileText, tone: 'success' },
            {
              label: lang === 'ur' ? 'اسکریپ واپسی' : 'Waste returns',
              value: items.filter((g) => g.type === 'waste').length,
              icon: Recycle,
              tone: 'danger',
            },
          ]
        },
      }}
    />
  )
}

function PrintGatePass({ record }) {
  const { requestPrint } = useAppUI()
  const { lang } = useLang()
  return (
    <Button
      size="sm"
      variant="secondary"
      icon={FileText}
      onClick={() =>
        requestPrint({
          template: 'gatePass',
          title: `Gate Pass — ${record.id}`,
          lang,
          data: { pass: record },
        })
      }
    >
      {lang === 'ur' ? 'گیٹ پاس پرنٹ' : 'Print Gate Pass'}
    </Button>
  )
}
