import React, { useState } from 'react'
import { MessageSquareWarning, Siren, CheckCircle2, ReceiptText, Undo2, AlertTriangle as AlertIcon } from 'lucide-react'

import CrudPage from '../components/CrudPage'
import Tabs from '../components/UI/Tabs'
import Badge from '../components/UI/Badge'
import { useLang } from '../context/LanguageContext'
import { COMPLAINT_STATUS, RETURN_STATUS } from '../constants/enums'
import { fmtCurrency, fmtDate, fmtNumber, todayISO } from '../utils/formatters'

/**
 * Complaints & Returns — after-sales quality desk:
 *  1. Complaints (quality / dimension / delivery / breakage / shade)
 *     with severity, compensation and credit note reference
 *  2. Returns — requested slabs with restock / scrap disposition and
 *     the credit amount issued to the customer.
 */
const opts = (list) => list.map((v) => ({ value: v }))

const SEVERITY_DOT = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' }

export default function Complaints() {
  const { lang, fmtNum } = useLang()
  const [tab, setTab] = useState(0)

  return (
    <div className="fade-in">
      <Tabs
        className="mb-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { label: lang === 'ur' ? 'شکایات' : 'Complaints' },
          { label: lang === 'ur' ? 'واپسی' : 'Returns' },
        ]}
      />

      {tab === 0 && <ComplaintsTab lang={lang} fmtNum={fmtNum} />}
      {tab === 1 && <ReturnsTab lang={lang} fmtNum={fmtNum} />}
    </div>
  )
}

/* ─────────────────────────── Complaints ─────────────────────────── */

function ComplaintsTab({ lang, fmtNum }) {
  return (
    <CrudPage
      config={{
        collection: 'complaints',
        i18nPrefix: 'complaints',
        modalSize: 'lg',
        searchKeys: ['id', 'customerId', 'slabId', 'orderRef', 'description'],
        defaults: () => ({ date: todayISO(), status: 'open', severity: 'medium', compensationAmount: 0 }),
        columns: [
          { key: 'id', label: 'Complaint #', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'customerId', label: 'Customer' },
          { key: 'slabId', label: 'Slab', render: (r) => <span className="num">{r.slabId || '—'}</span> },
          { key: 'category', label: 'Category', format: (v) => v },
          {
            key: 'severity', label: 'Severity',
            render: (r) => (
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT[r.severity] || 'bg-[var(--muted)]'}`} />
                {r.severity || '—'}
              </span>
            ),
            format: (v) => v,
          },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
          { key: 'compensationAmount', label: 'Compensation', render: (r) => <span className="num">{fmtCurrency(r.compensationAmount)}</span>, format: (v) => fmtNumber(v) },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'customerId', type: 'ref', refCollection: 'customers', refLabel: 'name' },
          { key: 'slabId', type: 'ref', refCollection: 'slabs', refLabel: 'id', hint: lang === 'ur' ? 'اسلیب ریکارڈ سے انٹیک تصاویر' : 'Pull intake photos from slab record' },
          { key: 'orderRef' },
          {
            key: 'category', type: 'select',
            options: [{ value: 'quality' }, { value: 'dimension' }, { value: 'delivery' }, { value: 'breakage' }, { value: 'shade_mismatch' }, { value: 'other' }],
          },
          { key: 'severity', type: 'select', options: [{ value: 'low' }, { value: 'medium' }, { value: 'high' }] },
          { key: 'description', type: 'textarea', span: 'full' },
          {
            key: 'photos', type: 'photo',
            label: lang === 'ur' ? 'تصاویر (انٹیک تصاویر سے موازنہ)' : 'Photos (compare intake photos)',
          },
          { key: 'status', type: 'select', options: opts(COMPLAINT_STATUS) },
          { key: 'resolvedAt', type: 'date' },
          { key: 'resolution', type: 'textarea', span: 'full' },
          { key: 'compensationAmount', type: 'number', min: 0 },
          { key: 'creditNoteRef', hint: lang === 'ur' ? 'CRN آئی ڈی اگر کریڈٹ ہو' : 'CRN id if credited' },
        ],
        filters: [
          { key: 'status', options: opts(COMPLAINT_STATUS) },
          { key: 'severity', options: [{ value: 'low' }, { value: 'medium' }, { value: 'high' }] },
        ],
        stats: (items) => {
          const month = new Date().toISOString().slice(0, 7)
          const open = items.filter((c) => c.status === 'open')
          const resolvedMonth = items.filter((c) => c.status === 'resolved' && ((c.resolvedAt || c.date) || '').slice(0, 7) === month).length
          const compensation = items.reduce((a, c) => a + (c.compensationAmount || 0), 0)
          return [
            { label: lang === 'ur' ? 'کھلی شکایات' : 'Open', value: open.length, icon: MessageSquareWarning, tone: 'warning' },
            { label: lang === 'ur' ? 'ہائی سیورٹی کھلی' : 'High severity open', value: open.filter((c) => c.severity === 'high').length, icon: Siren, tone: 'danger' },
            { label: lang === 'ur' ? 'اس ماہ حل شدہ' : 'Resolved this month', value: resolvedMonth, icon: CheckCircle2, tone: 'success' },
            { label: lang === 'ur' ? 'کمپنزیشن کل' : 'Compensation total', value: fmtCurrency(compensation), icon: ReceiptText, tone: 'brand' },
          ]
        },
      }}
    />
  )
}

/* ─────────────────────────── Returns ─────────────────────────── */

function ReturnsTab({ lang, fmtNum }) {
  return (
    <CrudPage
      config={{
        collection: 'returns',
        i18nPrefix: 'returns',
        searchKeys: ['id', 'customerId', 'slabId', 'orderRef'],
        defaults: () => ({ date: todayISO(), status: 'requested', qty: 0, sqft: 0, restockQty: 0, scrapQty: 0, creditAmount: 0 }),
        columns: [
          { key: 'id', label: 'Return #', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'customerId', label: 'Customer' },
          { key: 'slabId', label: 'Slab', render: (r) => <span className="num">{r.slabId || '—'}</span> },
          { key: 'qty', label: 'Qty', render: (r) => <span className="num">{fmtNum(r.qty)}</span>, format: (v) => fmtNumber(v) },
          {
            key: 'condition', label: 'Condition',
            render: (r) => (
              <span className={`font-medium ${r.condition === 'restock' ? 'text-emerald-600' : 'text-red-500'}`}>
                {r.condition === 'restock' ? (lang === 'ur' ? 'دوبارہ فروخت' : 'Restock') : lang === 'ur' ? 'اسکریپ' : 'Scrap'}
              </span>
            ),
            format: (v) => v,
          },
          { key: 'creditAmount', label: 'Credit', render: (r) => <span className="num">{fmtCurrency(r.creditAmount)}</span>, format: (v) => fmtNumber(v) },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'customerId', type: 'ref', refCollection: 'customers', refLabel: 'name' },
          { key: 'orderId', type: 'ref', refCollection: 'orders', refLabel: 'id' },
          { key: 'slabId', type: 'ref', refCollection: 'slabs', refLabel: 'id' },
          { key: 'qty', type: 'number', min: 0 },
          { key: 'sqft', type: 'number', min: 0, step: 0.1 },
          {
            key: 'reason', type: 'select',
            options: [{ value: 'defect' }, { value: 'wrong_size' }, { value: 'shade_mismatch' }, { value: 'over_supply' }, { value: 'other' }],
          },
          {
            key: 'condition', type: 'select',
            options: [
              { value: 'restock', label: lang === 'ur' ? 'دوبارہ فروخت' : 'Restock' },
              { value: 'scrap', label: lang === 'ur' ? 'اسکریپ' : 'Scrap' },
            ],
          },
          { key: 'restockQty', type: 'number', min: 0 },
          { key: 'scrapQty', type: 'number', min: 0 },
          { key: 'creditAmount', type: 'number', min: 0 },
          { key: 'creditNoteId', hint: lang === 'ur' ? 'CRN آئی ڈی' : 'CRN id' },
          { key: 'status', type: 'select', options: opts(RETURN_STATUS) },
          { key: 'photos', type: 'photo' },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        filters: [{ key: 'status', options: opts(RETURN_STATUS) }],
        stats: (items) => {
          const restocked = items.reduce((a, r) => a + (r.restockQty || 0), 0)
          const scrapped = items.reduce((a, r) => a + (r.scrapQty || 0), 0)
          const credit = items.reduce((a, r) => a + (r.creditAmount || 0), 0)
          return [
            { label: lang === 'ur' ? 'واپسیاں' : 'Returns', value: items.length, icon: Undo2, tone: 'info' },
            { label: lang === 'ur' ? 'دوبارہ فروخت مقدار' : 'Restocked qty', value: restocked, icon: CheckCircle2, tone: 'success' },
            { label: lang === 'ur' ? 'اسکریپ مقدار' : 'Scrapped qty', value: scrapped, icon: AlertIcon, tone: 'danger' },
            { label: lang === 'ur' ? 'کریڈٹ کل' : 'Credit total', value: fmtCurrency(credit), icon: ReceiptText, tone: 'brand' },
          ]
        },
      }}
    />
  )
}
