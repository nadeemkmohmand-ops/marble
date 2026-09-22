import React from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import { WORK_ORDER_STATUS, FINISHES } from '../constants/enums'
import { fmtDate, fmtNumber, todayISO } from '../utils/formatters'
import { ClipboardList, Factory, CheckCircle2, Flame, FileText } from 'lucide-react'
import { useAppUI } from '../context/AppUIContext'
import { useLang } from '../context/LanguageContext'
import { db } from '../services/db'

/**
 * WorkOrders — factory-floor work order documents: "cut N slabs of size S
 * from block B". The supervisor keeps producedSlabs updated as cutting
 * proceeds; planned sq ft and progress % are computed live. Each order
 * prints as a printable Work Order sheet for the floor.
 */
const opts = (list) => list.map((v) => ({ value: v }))

/** "8×4" / "8x4 ft" → area of ONE slab in sq ft (0 when unparseable). */
function parseSlabSize(size) {
  const parts = String(size || '').toLowerCase().split(/[x×]/)
  const l = parseFloat(parts[0])
  const w = parseFloat(parts[1])
  if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0) return 0
  return l * w
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

export default function WorkOrders() {
  const { lang } = useLang()

  return (
    <CrudPage
      config={{
        collection: 'workOrders',
        i18nPrefix: 'workOrders',
        modalSize: 'xl',
        searchKeys: ['id', 'orderRef', 'blockId', 'supervisor', 'status'],
        defaults: () => ({ date: todayISO(), status: 'draft', slabsQty: 0, producedSlabs: 0, priority: 'normal' }),
        compute: (v) => {
          const unitSqft = parseSlabSize(v.slabSize)
          const qty = Number(v.slabsQty) || 0
          const produced = Number(v.producedSlabs) || 0
          return {
            plannedSqft: unitSqft ? round2(unitSqft * qty) : 0,
            progressPct: qty > 0 ? Math.min(100, Math.round((produced / qty) * 100)) : 0,
          }
        },
        rowActions: (record) => [<PrintWorkOrder key="wo" record={record} />],
        columns: [
          { key: 'id', label: 'WO #', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'blockId', label: 'Block', render: (r) => <span className="num">{r.blockId || '—'}</span> },
          { key: 'slabSize', label: 'Slab size', render: (r) => r.slabSize || '—' },
          { key: 'slabsQty', label: 'Planned slabs', render: (r) => <span className="num">{r.slabsQty ?? 0}</span>, format: (v) => fmtNumber(v) },
          { key: 'producedSlabs', label: 'Produced', render: (r) => <span className="num">{r.producedSlabs ?? 0}</span>, format: (v) => fmtNumber(v) },
          { key: 'plannedSqft', label: 'Planned sq ft', render: (r) => <span className="num">{fmtNumber(r.plannedSqft)}</span>, format: (v) => fmtNumber(v) },
          {
            key: 'progressPct',
            label: 'Progress',
            render: (r) => (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded bg-[var(--border)]">
                  <div className="h-full rounded bg-emerald-500" style={{ width: `${r.progressPct || 0}%` }} />
                </div>
                <span className="num text-xs text-[var(--muted)]">{r.progressPct || 0}%</span>
              </div>
            ),
            exportFormat: (_v, r) => `${r.progressPct || 0}%`,
          },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
          { key: 'dueDate', label: 'Due date', render: (r) => <span className="num">{fmtDate(r.dueDate)}</span>, format: (v) => fmtDate(v) },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'status', type: 'select', options: opts(WORK_ORDER_STATUS) },
          { key: 'priority', type: 'select', options: [{ value: 'normal' }, { value: 'urgent' }] },
          { key: 'customerName', type: 'ref', refCollection: 'customers', refLabel: 'name' },
          { key: 'orderRef', hint: 'ORD-0007' },
          { key: 'blockId', type: 'ref', refCollection: 'blocks', refLabel: 'id', required: true },
          { key: 'supervisor', type: 'ref', refCollection: 'workers', refLabel: 'name' },
          { key: 'machineName', type: 'ref', refCollection: 'machines', refLabel: 'name' },
          { key: 'slabsQty', type: 'number', min: 0, required: true },
          {
            key: 'slabSize',
            placeholder: '8×4 ft',
            hint: lang === 'ur' ? 'لمبائی×چوڑائی (فٹ) — مربع فٹ خود بن جائے گا' : 'L×W in ft — planned sq ft is auto',
          },
          { key: 'thicknessMm', type: 'number', min: 0 },
          { key: 'finish', type: 'select', options: opts(FINISHES) },
          { key: 'dueDate', type: 'date' },
          {
            key: 'producedSlabs',
            type: 'number',
            min: 0,
            hint: lang === 'ur' ? 'سپروائزر کاٹتے ہوئے اپڈیٹ کرے' : 'supervisor updates as cutting proceeds',
          },
          { key: 'instructions', type: 'textarea', span: 'full' },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        filters: [
          { key: 'status', options: opts(WORK_ORDER_STATUS) },
          { key: 'priority', options: [{ value: 'normal' }, { value: 'urgent' }] },
        ],
        stats: (items) => [
          { label: lang === 'ur' ? 'کل ورک آرڈرز' : 'Total work orders', value: items.length, icon: ClipboardList, tone: 'info' },
          {
            label: lang === 'ur' ? 'زیر اجرا' : 'In progress',
            value: items.filter((w) => w.status === 'issued' || w.status === 'in_progress').length,
            icon: Factory,
            tone: 'warning',
          },
          { label: lang === 'ur' ? 'مکمل' : 'Done', value: items.filter((w) => w.status === 'done').length, icon: CheckCircle2, tone: 'success' },
          {
            label: lang === 'ur' ? 'فوری' : 'Urgent',
            value: items.filter((w) => w.priority === 'urgent' && w.status !== 'done' && w.status !== 'cancelled').length,
            icon: Flame,
            tone: 'danger',
          },
        ],
      }}
    />
  )
}

function PrintWorkOrder({ record }) {
  const { requestPrint } = useAppUI()
  const { lang } = useLang()
  return (
    <Button
      size="sm"
      variant="secondary"
      icon={FileText}
      onClick={() =>
        requestPrint({
          template: 'workOrder',
          title: `Work Order — ${record.id}`,
          lang,
          data: { workOrder: record, customer: db.get('customers', record.customerName) || { name: record.customerName } },
        })
      }
    >
      {lang === 'ur' ? 'ورک آرڈر پرنٹ' : 'Print Work Order'}
    </Button>
  )
}
