import React from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import { PAYMENT_METHODS } from '../constants/enums'
import { fmtCurrency, fmtDate, fmtNumber, todayISO } from '../utils/formatters'
import { Banknote, ArrowUpCircle, ArrowDownCircle, CalendarDays, FileText } from 'lucide-react'
import { useAppUI } from '../context/AppUIContext'
import { useLang } from '../context/LanguageContext'
import { db } from '../services/db'

/**
 * Receipts — formal money-in / money-out vouchers with number, method
 * (cash / bank / cheque / online) and reference. Replaces the single
 * "paid amount" field workflow: every payment is its own receipt row,
 * and a receipt that references an order (ORD-0007) automatically
 * posts its amount onto that order's paid amount.
 */
const opts = (list) => list.map((v) => ({ value: v }))

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

export default function Receipts() {
  const { lang } = useLang()

  return (
    <CrudPage
      config={{
        collection: 'receipts',
        i18nPrefix: 'receipts',
        searchKeys: ['id', 'partyName', 'referenceNo', 'orderRef', 'method'],
        defaults: () => ({ date: todayISO(), direction: 'in', method: 'cash', amount: 0 }),
        onSaved: (rec, mode) => {
          // Auto-post a received payment onto the referenced order's paid
          // amount (only on create — edits/deletes stay manual).
          if (mode !== 'add' || !rec || rec.direction !== 'in' || !rec.orderRef) return
          const order = db.get('orders', rec.orderRef)
          if (order) db.save('orders', { id: order.id, paidAmount: round2((order.paidAmount || 0) + (rec.amount || 0)) })
        },
        rowActions: (record) => [<PrintReceipt key="rcp" record={record} />],
        columns: [
          { key: 'id', label: 'Receipt #', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          {
            key: 'direction',
            label: 'Direction',
            render: (r) =>
              r.direction === 'out' ? (
                <span className="inline-flex items-center gap-1 font-semibold text-red-500">↓ {lang === 'ur' ? 'ادائیگی' : 'Out'}</span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  ↑ {lang === 'ur' ? 'وصول' : 'In'}
                </span>
              ),
            format: (v) => (v === 'out' ? 'Out' : 'In'),
          },
          { key: 'partyName', label: 'Party', render: (r) => <span className="font-semibold">{r.partyName || '—'}</span> },
          { key: 'customerId', label: 'Customer', render: (r) => (r.customerId ? <span className="num">{r.customerId}</span> : '—') },
          { key: 'method', label: 'Method', format: (v) => v },
          { key: 'referenceNo', label: 'Cheque / Txn #', render: (r) => <span className="num">{r.referenceNo || '—'}</span> },
          {
            key: 'amount',
            label: 'Amount',
            render: (r) => (
              <span className={`num font-semibold ${r.direction === 'out' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {fmtCurrency(r.amount)}
              </span>
            ),
            format: (v) => fmtNumber(v),
          },
          { key: 'orderRef', label: 'Order ref', render: (r) => (r.orderRef ? <span className="num">{r.orderRef}</span> : '—') },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          {
            key: 'direction',
            type: 'select',
            required: true,
            options: [
              { value: 'in', label: lang === 'ur' ? 'وصولی (ان)' : 'Received (in)' },
              { value: 'out', label: lang === 'ur' ? 'ادائیگی (آؤٹ)' : 'Paid (out)' },
            ],
          },
          { key: 'partyType', type: 'select', options: opts(['customer', 'supplier', 'worker', 'agent', 'other']) },
          {
            key: 'partyName',
            required: true,
            hint: lang === 'ur' ? 'نام لکھیں یا نیچے سے منتخب کریں' : 'type the name or pick below',
          },
          { key: 'customerId', type: 'ref', refCollection: 'customers', refLabel: 'name' },
          { key: 'supplierId', type: 'ref', refCollection: 'suppliers', refLabel: 'name' },
          { key: 'workerId', type: 'ref', refCollection: 'workers', refLabel: 'name' },
          { key: 'amount', type: 'number', min: 0, required: true },
          { key: 'method', type: 'select', options: opts(PAYMENT_METHODS) },
          { key: 'referenceNo', hint: lang === 'ur' ? 'چیک / ٹرانزیکشن نمبر' : 'Cheque / txn no.' },
          { key: 'bankName' },
          { key: 'chequeDate', type: 'date' },
          {
            key: 'orderRef',
            hint:
              lang === 'ur'
                ? 'ORD-0007 — رسید محفوظ ہونے پر آرڈر کی ادائیگی خود بڑھ جائے گی'
                : 'ORD-0007 — auto-updates the order paid amount on save',
          },
          { key: 'receivedBy' },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        filters: [
          { key: 'direction', options: [{ value: 'in' }, { value: 'out' }] },
          { key: 'method', options: PAYMENT_METHODS.map((v) => ({ value: v })) },
        ],
        stats: (items) => {
          const month = todayISO().slice(0, 7)
          const totalIn = items.filter((r) => r.direction === 'in').reduce((a, r) => a + (r.amount || 0), 0)
          const totalOut = items.filter((r) => r.direction === 'out').reduce((a, r) => a + (r.amount || 0), 0)
          return [
            { label: lang === 'ur' ? 'کل وصولی' : 'Total received', value: fmtCurrency(totalIn), icon: ArrowUpCircle, tone: 'success' },
            { label: lang === 'ur' ? 'کل ادائیگی' : 'Total paid out', value: fmtCurrency(totalOut), icon: ArrowDownCircle, tone: 'danger' },
            { label: lang === 'ur' ? 'خالص' : 'Net', value: fmtCurrency(totalIn - totalOut), icon: Banknote, tone: 'brand' },
            {
              label: lang === 'ur' ? 'اس ماہ' : 'This month',
              value: items.filter((r) => (r.date || '').slice(0, 7) === month).length,
              icon: CalendarDays,
              tone: 'info',
            },
          ]
        },
      }}
    />
  )
}

function PrintReceipt({ record }) {
  const { requestPrint } = useAppUI()
  const { lang } = useLang()
  return (
    <Button
      size="sm"
      variant="secondary"
      icon={FileText}
      onClick={() =>
        requestPrint({
          template: 'receipt',
          title: `Receipt — ${record.id}`,
          lang,
          data: { receipt: record, party: { name: record.partyName } },
        })
      }
    >
      {lang === 'ur' ? 'رسید پرنٹ' : 'Print Receipt'}
    </Button>
  )
}
