import React, { useMemo, useState } from 'react'
import { FileText, HandCoins, MessageCircle, Scale, Wallet } from 'lucide-react'
import Toolbar from '../components/UI/Toolbar'
import Tabs from '../components/UI/Tabs'
import Card from '../components/UI/Card'
import Select from '../components/UI/Select'
import Button from '../components/UI/Button'
import Table from '../components/UI/Table'
import StatCard from '../components/UI/StatCard'
import ExportMenu from '../components/UI/ExportMenu'
import EmptyState from '../components/States/EmptyState'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { useAppUI } from '../context/AppUIContext'
import { fmtCurrency, fmtDate, fmtNumber } from '../utils/formatters'
import { whatsappText } from '../utils/exporters'

/**
 * Ledgers — transaction-by-transaction statement of account for every
 * customer, supplier and worker, with a running balance column. Rows
 * are DERIVED (never stored): invoices/orders, receipts, credit/debit
 * notes, payroll slips and manual ledger entries are merged, sorted by
 * date and accumulated as opening + debit − credit. Each ledger can be
 * exported, shared on WhatsApp and printed as a formal Statement PDF.
 */
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

const PARTY_KINDS = ['customer', 'supplier', 'worker']

const EMPTY_LEDGER = { rows: [], opening: 0, closing: 0, totalDebit: 0, totalCredit: 0 }

export default function Ledgers() {
  const { t, lang } = useLang()
  const { requestPrint } = useAppUI()
  const [tab, setTab] = useState(0)
  const [selectedId, setSelectedId] = useState('')

  const { items: customers } = useCollection('customers')
  const { items: suppliers } = useCollection('suppliers')
  const { items: workers } = useCollection('workers')
  const { items: orders } = useCollection('orders')
  const { items: receipts } = useCollection('receipts')
  const { items: purchases } = useCollection('purchases')
  const { items: creditNotes } = useCollection('creditNotes')
  const { items: debitNotes } = useCollection('debitNotes')
  const { items: ledgerEntries } = useCollection('ledgerEntries')
  const { items: payroll } = useCollection('payroll')

  const L = (en, ur) => (lang === 'ur' ? ur : en)

  const parties = tab === 0 ? customers : tab === 1 ? suppliers : workers
  const party = parties.find((p) => p.id === selectedId) || parties[0] || null

  const ledger = useMemo(() => {
    if (!party) return EMPTY_LEDGER
    const id = party.id
    const opening = round2(party.openingBalance || 0)
    const rows = []

    if (tab === 0) {
      // Customer: invoices debit, receipts (in) credit, credit notes credit.
      orders
        .filter((o) => (o.customerName === id || o.customerId === id) && o.status !== 'cancelled')
        .forEach((o) => rows.push({ id: o.id, date: o.date, type: 'Invoice', ref: o.id, debit: round2(o.total || 0), credit: 0 }))
      receipts
        .filter((r) => r.customerId === id && r.direction === 'in')
        .forEach((r) => rows.push({ id: r.id, date: r.date, type: 'Receipt', ref: r.id, debit: 0, credit: round2(r.amount || 0) }))
      creditNotes
        .filter((c) => c.customerId === id)
        .forEach((c) => rows.push({ id: c.id, date: c.date, type: 'Credit Note', ref: c.id, debit: 0, credit: round2(c.amount || 0) }))
    } else if (tab === 1) {
      // Supplier: purchases (landed) debit, payments (out) credit, debit notes debit.
      purchases
        .filter((p) => p.supplierName === id || p.supplierId === id)
        .forEach((p) => rows.push({ id: p.id, date: p.date, type: 'Purchase', ref: p.id, debit: round2(p.landedTotal || 0), credit: 0 }))
      receipts
        .filter((r) => r.supplierId === id && r.direction === 'out')
        .forEach((r) => rows.push({ id: r.id, date: r.date, type: 'Payment', ref: r.id, debit: 0, credit: round2(r.amount || 0) }))
      debitNotes
        .filter((d) => d.supplierId === id)
        .forEach((d) => rows.push({ id: d.id, date: d.date, type: 'Debit Note', ref: d.id, debit: round2(d.amount || 0), credit: 0 }))
    } else {
      // Worker: payslips credit (owed to worker); advances paid = debit entries.
      payroll
        .filter((s) => s.workerId === id)
        .forEach((s) => rows.push({ id: s.id, date: s.date, type: 'Payslip', ref: s.id, debit: 0, credit: round2(s.netPayable || 0) }))
    }

    // Manual adjustments / advances from the accountant's ledger entries.
    ledgerEntries
      .filter((e) => e.partyType === PARTY_KINDS[tab] && e.partyId === id)
      .forEach((e) =>
        rows.push({
          id: e.id,
          date: e.date,
          type: e.description || 'Adjustment',
          ref: e.id,
          debit: round2(e.debit || 0),
          credit: round2(e.credit || 0),
        }),
      )

    rows.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))

    let bal = opening
    let totalDebit = 0
    let totalCredit = 0
    rows.forEach((r) => {
      totalDebit += r.debit || 0
      totalCredit += r.credit || 0
      bal += (r.debit || 0) - (r.credit || 0)
      r.balance = round2(bal)
    })

    return { rows, opening, closing: round2(bal), totalDebit: round2(totalDebit), totalCredit: round2(totalCredit) }
  }, [tab, party, orders, receipts, purchases, creditNotes, debitNotes, ledgerEntries, payroll])

  const { rows, opening, closing, totalDebit, totalCredit } = ledger

  const labels =
    tab === 0
      ? { billed: L('Total billed', 'کل بل'), received: L('Received', 'وصول') }
      : tab === 1
        ? { billed: L('Total purchases', 'کل خریداری'), received: L('Paid', 'ادائیگی') }
        : { billed: L('Advances / paid', 'پیشگی / ادائیگی'), received: L('Earned', 'کمائی') }

  // Customers/suppliers: positive = they owe the factory (danger).
  // Workers: negative = the factory owes the worker (danger).
  const closingTone = tab === 2 ? (closing < 0 ? 'danger' : 'success') : closing > 0 ? 'danger' : 'success'
  const balanceClass = (b) => {
    if (!b) return 'num font-semibold'
    const owed = tab === 2 ? b < 0 : b > 0
    return `num font-semibold ${owed ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`
  }

  const columns = [
    { key: 'date', label: t('common.date'), render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
    { key: 'type', label: L('Type', 'قسم'), format: (v) => v },
    { key: 'ref', label: L('Ref #', 'نمبر شمار'), render: (r) => <span className="num font-semibold">{r.ref}</span> },
    {
      key: 'debit',
      label: L('Debit', 'ڈیبٹ'),
      render: (r) => (r.debit ? <span className="num">{fmtNumber(r.debit)}</span> : <span className="text-[var(--muted)]">—</span>),
      format: (v) => fmtNumber(v),
    },
    {
      key: 'credit',
      label: L('Credit', 'کریڈٹ'),
      render: (r) => (r.credit ? <span className="num">{fmtNumber(r.credit)}</span> : <span className="text-[var(--muted)]">—</span>),
      format: (v) => fmtNumber(v),
    },
    {
      key: 'balance',
      label: t('common.balance'),
      render: (r) => <span className={balanceClass(r.balance)}>{fmtNumber(r.balance)}</span>,
      format: (v) => fmtNumber(v),
    },
  ]

  const shareLedger = () => {
    if (!party) return
    const text = [
      `*${L('Statement', 'اسٹیٹمنٹ')} — ${party.name}*`,
      '',
      `${L('Opening', 'افتتاحی')}: ${fmtCurrency(opening)}`,
      `${labels.billed}: ${fmtCurrency(totalDebit)}`,
      `${labels.received}: ${fmtCurrency(totalCredit)}`,
      `${L('Closing balance', 'بقایا')}: ${fmtCurrency(closing)}`,
    ].join('\n')
    whatsappText(text, party.whatsapp || party.phone)
  }

  const printStatement = () => {
    if (!party) return
    requestPrint({
      template: 'statement',
      title: `Statement — ${party.name}`,
      lang,
      data: { party, type: PARTY_KINDS[tab], rows, opening, closing },
    })
  }

  return (
    <div className="fade-in">
      <Toolbar
        title={L('Ledgers — Statement of Account', 'کھاتے — اسٹیٹمنٹ آف اکاؤنٹ')}
        description={L(
          'Running balance per customer, supplier and worker — export, share or print a formal statement.',
          'ہر گاہک، سپلائر اور مزدور کا رننگ بیلنس — ایکسپورٹ، شیئر یا باقاعدہ اسٹیٹمنٹ پرنٹ کریں۔',
        )}
        actions={
          party && (
            <>
              <ExportMenu
                title={`${party.name} — ${L('Ledger', 'کھاتہ')}`}
                columns={columns}
                rows={rows}
                meta={{ phone: party.whatsapp || party.phone }}
              />
              <Button icon={FileText} onClick={printStatement}>
                {L('Statement PDF', 'اسٹیٹمنٹ PDF')}
              </Button>
              <Button variant="whatsapp" icon={MessageCircle} onClick={shareLedger}>
                {t('customers.statement')}
              </Button>
            </>
          )
        }
        filters={
          parties.length > 0 && (
            <Select
              className="!w-auto min-w-[11rem] max-w-full"
              value={party?.id || ''}
              onChange={(e) => setSelectedId(e.target.value)}
              options={parties.map((p) => ({ value: p.id, label: p.name || p.id }))}
              placeholder={L('Select party…', 'پارٹی منتخب کریں…')}
            />
          )
        }
      />

      <Tabs
        className="mb-4"
        active={tab}
        onChange={(i) => {
          setTab(i)
          setSelectedId('')
        }}
        tabs={[{ label: t('nav.customers') }, { label: t('nav.suppliers') }, { label: t('nav.workers') }]}
      />

      {!party ? (
        <Card>
          <EmptyState
            title={L(`No ${PARTY_KINDS[tab]}s yet`, tab === 0 ? 'ابھی کوئی گاہک نہیں' : tab === 1 ? 'ابھی کوئی سپلائر نہیں' : 'ابھی کوئی مزدور نہیں')}
            hint={L(
              'Add one from its own page first — the ledger will fill up automatically from invoices, receipts and notes.',
              'پہلے اپنے صفحے سے ایک شامل کریں — بل، رسیدیں اور نوٹس سے کھاتہ خود بھر جائے گا۔',
            )}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <StatCard label={L('Opening balance', 'افتتاحی بیلنس')} value={fmtCurrency(opening)} icon={Wallet} tone="info" />
            <StatCard label={labels.billed} value={fmtCurrency(totalDebit)} icon={FileText} tone="brand" />
            <StatCard label={labels.received} value={fmtCurrency(totalCredit)} icon={HandCoins} tone="success" />
            <StatCard label={L('Closing balance', 'اختتامی بیلنس')} value={fmtCurrency(closing)} icon={Scale} tone={closingTone} />
          </div>

          <Card>
            <Table
              columns={columns}
              rows={rows}
              keyOf={(r) => r.id}
              empty={
                <EmptyState
                  title={L('No transactions yet', 'ابھی کوئی لین دین نہیں')}
                  hint={L(
                    'Invoices, receipts, notes and adjustments build this ledger automatically.',
                    'بل، رسیدیں، نوٹس اور ایڈجسٹمنٹ اس کھاتے کو خود بناتے ہیں۔',
                  )}
                />
              }
            />
          </Card>
        </>
      )}
    </div>
  )
}
