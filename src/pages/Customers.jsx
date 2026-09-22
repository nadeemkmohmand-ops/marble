import React, { useMemo, useState } from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import Modal from '../components/UI/Modal'
import Select from '../components/UI/Select'
import Input from '../components/UI/Input'
import { fmtCurrency, fmtNumber } from '../utils/formatters'
import { Users, MessageCircle, Copy, Merge, PhoneCall } from 'lucide-react'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { whatsappText } from '../utils/exporters'
import { db } from '../services/db'
import { CUSTOMER_TYPES } from '../constants/enums'

const opts = (list) => list.map((v) => ({ value: v }))

/** Normalize a phone number for duplicate detection (digits only, last 9). */
function phoneKey(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  return digits.length >= 9 ? digits.slice(-9) : digits || null
}

/** Find customer pairs that share a phone number (or exact name). */
function findDuplicates(customers) {
  const byPhone = new Map()
  const byName = new Map()
  const pairs = []
  customers.forEach((c) => {
    const pk = phoneKey(c.phone)
    if (pk) {
      if (byPhone.has(pk)) pairs.push({ a: byPhone.get(pk), b: c, reason: 'phone' })
      else byPhone.set(pk, c)
    }
    const nk = String(c.name || '').trim().toLowerCase()
    if (nk) {
      if (byName.has(nk)) pairs.push({ a: byName.get(nk), b: c, reason: 'name' })
      else byName.set(nk, c)
    }
  })
  return pairs
}

/**
 * Customers v2 — full CRM layer: type/category, credit limit & days,
 * CNIC/NTN, call/visit follow-up log and duplicate detection & merge.
 */
export default function Customers() {
  const { lang, t } = useLang()
  const toast = useToast()
  const { items: orders } = useCollection('orders')
  const { items: followups, add: addFollowup } = useCollection('followups')
  const [dupOpen, setDupOpen] = useState(false)
  const [logFor, setLogFor] = useState(null) // customer being logged
  const [logEntry, setLogEntry] = useState({ date: new Date().toISOString().slice(0, 10), type: 'call', notes: '' })
  const ur = lang === 'ur'

  const transform = React.useCallback(
    (customers) =>
      customers.map((c) => {
        const mine = orders.filter((o) => o.customerName === c.id && o.status !== 'cancelled')
        const _orders = mine.length
        const _total = mine.reduce((a, o) => a + (o.total || 0), 0)
        const _paid = mine.reduce((a, o) => a + (o.paidAmount || 0), 0)
        const _balance = _total - _paid + (c.openingBalance || 0)
        const _overdue = _balance > 0 && c.creditDays && mine.some((o) => o.date && Date.now() - new Date(o.date).getTime() > c.creditDays * 86400000)
        return { ...c, _orders, _total, _paid, _balance, _overdue }
      }),
    [orders],
  )

  const dupPairs = useMemo(() => findDuplicates(transform(db.list('customers'))), [transform])

  const mergeCustomers = async (keep, drop) => {
    // move orders, receipts, followups onto the kept customer, then delete the duplicate
    db.list('orders').filter((o) => o.customerName === drop.id).forEach((o) => db.save('orders', { id: o.id, customerName: keep.id }))
    db.list('receipts').filter((r) => r.customerId === drop.id).forEach((r) => db.save('receipts', { id: r.id, customerId: keep.id }))
    db.list('ledgerEntries').filter((e) => e.partyId === drop.id).forEach((e) => db.save('ledgerEntries', { id: e.id, partyId: keep.id }))
    db.remove('customers', drop.id)
    toast.success(ur ? 'اکاؤنٹس ضم ہو گئے' : 'Accounts merged')
    setDupOpen(false)
  }

  const shareStatement = (c) => {
    const text = [
      ur ? `*اسٹیٹمنٹ — ${c.name}*` : `*Statement — ${c.name}*`,
      '',
      `${ur ? 'آرڈرز' : 'Orders'}: ${c._orders}`,
      `${ur ? 'کل' : 'Total'}: ${fmtCurrency(c._total)}`,
      `${ur ? 'وصول' : 'Received'}: ${fmtCurrency(c._paid)}`,
      `${ur ? 'بقایا' : 'Balance'}: ${fmtCurrency(c._balance)}`,
    ].join('\n')
    whatsappText(text, c.whatsapp || c.phone)
  }

  const FollowupButton = ({ record }) => (
    <Button size="sm" variant="secondary" icon={PhoneCall} onClick={() => setLogFor(record)}>
      {ur ? 'فالو اپ' : 'Log call'}
    </Button>
  )

  return (
    <>
      <CrudPage
        config={{
          collection: 'customers',
          i18nPrefix: 'customers',
          transform,
          searchKeys: ['name', 'phone', 'address', 'cnic', 'ntn', 'notes'],
          defaults: () => ({ openingBalance: 0, customerType: 'retail' }),
          rowActions: (record) => [
            <FollowupButton key="log" record={record} />,
            <Button key="wa" size="sm" variant="whatsapp" icon={MessageCircle} onClick={() => shareStatement(record)}>
              {t('customers.statement')}
            </Button>,
          ],
          extraToolbar: () => (
            <Button size="md" variant="secondary" icon={Copy} onClick={() => setDupOpen(true)}>
              <span className="hidden sm:inline">{ur ? 'ڈپلیکیٹ چیک' : 'Duplicates'}</span>
              {dupPairs.length > 0 && <span className="ml-1 rounded-full bg-red-500 text-white text-[10px] px-1.5 num">{dupPairs.length}</span>}
            </Button>
          ),
          columns: [
            { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
            { key: 'customerType', label: ur ? 'قسم' : 'Type', render: (r) => r.customerType || 'retail' },
            { key: 'phone', label: 'Phone', render: (r) => <span className="num">{r.phone || '—'}</span> },
            { key: '_orders', label: 'Orders', render: (r) => <span className="num">{r._orders}</span> },
            { key: '_total', label: 'Total', render: (r) => <span className="num">{fmtCurrency(r._total)}</span>, exportFormat: (_v, r) => fmtNumber(r._total) },
            { key: '_balance', label: 'Balance', render: (r) => <span className={`num font-semibold ${(r._balance || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{fmtCurrency(r._balance)}{r._overdue ? ' ⚠' : ''}</span>, exportFormat: (_v, r) => fmtNumber(r._balance) },
            { key: 'creditLimit', label: ur ? 'کریڈٹ حد' : 'Credit limit', render: (r) => <span className="num">{r.creditLimit ? fmtCurrency(r.creditLimit) : '—'}</span>, format: (v) => fmtNumber(v) },
          ],
          fields: [
            { key: 'name', required: true },
            { key: 'phone', type: 'tel' },
            { key: 'whatsapp', type: 'tel' },
            { key: 'customerType', label: ur ? 'گاہک کی قسم' : 'Customer type', type: 'select', options: opts(CUSTOMER_TYPES) },
            { key: 'cnic', label: 'CNIC' },
            { key: 'ntn', label: 'NTN' },
            { key: 'creditLimit', label: ur ? 'کریڈٹ حد (رقم)' : 'Credit limit (amount)', type: 'number', min: 0 },
            { key: 'creditDays', label: ur ? 'کریڈٹ دن' : 'Credit days', type: 'number', min: 0 },
            { key: 'address', span: 'full' },
            { key: 'openingBalance', type: 'number' },
            { key: 'lostReason', label: ur ? 'کھوئے جانے کی وجہ' : 'Lost reason', hint: ur ? 'اگر کوئی ڈیل نہ بنی' : 'why a deal was lost (CRM)' },
            { key: 'notes', type: 'textarea', span: 'full' },
          ],
          onSaved: (rec, mode) => {
            if (mode === 'add') {
              const dup = db.list('customers').find((c) => c.id !== rec.id && phoneKey(c.phone) && phoneKey(c.phone) === phoneKey(rec.phone))
              if (dup) toast.error(ur ? `غور کریں: ${dup.name} ایک ہی فون نمبر سے پہلے سے موجود ہے` : `Possible duplicate: ${dup.name} already has this phone`)
            }
          },
          stats: (items) => [
            { label: t('stats.customers'), value: items.length, icon: Users, tone: 'info' },
            { label: t('stats.totalReceivable'), value: fmtCurrency(items.reduce((a, c) => a + Math.max(0, c._balance || 0), 0)), icon: Users, tone: 'danger' },
            { label: t('stats.totalBusiness'), value: fmtCurrency(items.reduce((a, c) => a + (c._total || 0), 0)), icon: Users, tone: 'brand' },
            { label: ur ? 'ڈپلیکیٹس' : 'Duplicates found', value: dupPairs.length, icon: Merge, tone: 'warning' },
          ],
          detailRender: (record) => {
            const mine = followups.filter((f) => f.customerId === record.id).slice(0, 8)
            if (!mine.length) return null
            return (
              <div>
                <div className="text-xs font-semibold text-[var(--muted)] mb-1.5">{ur ? 'حالیہ فالو اپس' : 'Recent follow-ups'}</div>
                {mine.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 border-b border-dashed border-[var(--border)] py-1 text-xs">
                    <span className="num text-[var(--muted)]">{f.date}</span>
                    <span className="font-medium">{f.type}</span>
                    <span className="truncate">{f.notes}</span>
                  </div>
                ))}
              </div>
            )
          },
        }}
      />

      {/* Duplicates review & merge */}
      <Modal
        open={dupOpen}
        onClose={() => setDupOpen(false)}
        title={ur ? 'ڈپلیکیٹ گاہک' : 'Duplicate customers'}
        footer={<Button variant="secondary" onClick={() => setDupOpen(false)}>{t('common.close')}</Button>}
      >
        {dupPairs.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-4 text-center">{ur ? 'کوئی ڈپلیکیٹ نہیں ملا — ڈیٹا صاف ہے ✓' : 'No duplicates found — data is clean ✓'}</p>
        ) : (
          <div className="space-y-3">
            {dupPairs.map((pair, i) => (
              <div key={i} className="border border-[var(--border)] rounded-xl p-3">
                <div className="text-xs text-[var(--muted)] mb-1.5">
                  {pair.reason === 'phone' ? (ur ? 'ایک ہی فون نمبر' : 'Same phone number') : (ur ? 'ایک ہی نام' : 'Same name')}
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">{pair.a.name} <span className="num text-xs text-[var(--muted)]">{pair.a.phone}</span></span>
                  <span className="text-[var(--muted)]">≈</span>
                  <span className="font-semibold">{pair.b.name} <span className="num text-xs text-[var(--muted)]">{pair.b.phone}</span></span>
                </div>
                <div className="flex justify-end mt-2">
                  <Button size="sm" icon={Merge} onClick={() => mergeCustomers(pair.a, pair.b)}>
                    {ur ? `ضم کریں → ${pair.a.name}` : `Merge into ${pair.a.name}`}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Follow-up log quick entry */}
      <Modal
        open={Boolean(logFor)}
        onClose={() => setLogFor(null)}
        title={`${ur ? 'فالو اپ' : 'Follow-up'} — ${logFor?.name || ''}`}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setLogFor(null)} className="w-full sm:w-auto">{t('common.cancel')}</Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                if (!logFor || !logEntry.notes) return
                addFollowup({ ...logEntry, customerId: logFor.id, customerName: logFor.name })
                setLogEntry({ date: new Date().toISOString().slice(0, 10), type: 'call', notes: '' })
                setLogFor(null)
                toast.success(t('common.saved'))
              }}
            >
              {t('common.save')}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input type="date" label={t('common.date')} value={logEntry.date} onChange={(e) => setLogEntry((f) => ({ ...f, date: e.target.value }))} />
          <Select
            label={ur ? 'قسم' : 'Type'}
            value={logEntry.type}
            onChange={(e) => setLogEntry((f) => ({ ...f, type: e.target.value }))}
            options={opts(['call', 'visit', 'whatsapp', 'complaint', 'payment_reminder'])}
          />
          <Input className="sm:col-span-3" label={ur ? 'نوٹس' : 'Notes'} value={logEntry.notes} onChange={(e) => setLogEntry((f) => ({ ...f, notes: e.target.value }))} />
        </div>
        {logFor && (
          <div className="mt-3 max-h-32 overflow-auto border-t border-[var(--border)] pt-2">
            {followups.filter((f) => f.customerId === logFor.id).slice(0, 10).map((f) => (
              <div key={f.id} className="text-xs py-0.5 border-b border-dashed border-[var(--border)]">
                <span className="num text-[var(--muted)]">{f.date}</span> — <span className="font-medium">{f.type}</span> — {f.notes}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}
