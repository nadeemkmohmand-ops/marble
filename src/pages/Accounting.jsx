import React, { useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, BookOpen, FileStack, Scale, Wallet } from 'lucide-react'
import CrudPage from '../components/CrudPage'
import Toolbar from '../components/UI/Toolbar'
import Tabs from '../components/UI/Tabs'
import Card from '../components/UI/Card'
import Table from '../components/UI/Table'
import StatCard from '../components/UI/StatCard'
import ExportMenu from '../components/UI/ExportMenu'
import EmptyState from '../components/States/EmptyState'
import { ACCOUNT_TYPES, VOUCHER_TYPES } from '../constants/enums'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { fmtCurrency, fmtDate, fmtNumber, todayISO } from '../utils/formatters'
import { db } from '../services/db'
import { storage } from '../utils/storage'

/**
 * Accounting — minimal double-entry layer over the factory data:
 *  0. Chart of Accounts (seeded once with a standard marble-factory COA)
 *  1. Vouchers (journal / payment / receipt — one debit, one credit)
 *  2. Cash / Bank Book (read-only, derived from vouchers on 10xx accounts)
 *  3. Trial Balance (per-account totals; must balance)
 *  4. Credit Notes (customer side)
 *  5. Debit Notes (supplier side)
 */
const opts = (list) => list.map((v) => ({ value: v }))

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

const COA_SEED_FLAG = 'marble.coaSeeded'

const SEED_COA = [
  { code: '1000', name: 'Cash in Hand', type: 'asset' },
  { code: '1010', name: 'Bank Account', type: 'asset' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset' },
  { code: '1200', name: 'Inventory — Blocks', type: 'asset' },
  { code: '1210', name: 'Inventory — Slabs', type: 'asset' },
  { code: '1300', name: 'Inventory — Consumables', type: 'asset' },
  { code: '1500', name: 'Vehicles', type: 'asset' },
  { code: '2000', name: 'Accounts Payable', type: 'liability' },
  { code: '2100', name: 'GST / Sales Tax Payable', type: 'liability' },
  { code: '2200', name: 'WHT Payable', type: 'liability' },
  { code: '3000', name: 'Owner Capital', type: 'equity' },
  { code: '3100', name: 'Retained Earnings', type: 'equity' },
  { code: '4000', name: 'Sales Revenue', type: 'income' },
  { code: '4100', name: 'Installation Income', type: 'income' },
  { code: '4200', name: 'Commission Income', type: 'income' },
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
  { code: '5100', name: 'Wages & Salaries', type: 'expense' },
  { code: '5200', name: 'Electricity & Fuel', type: 'expense' },
  { code: '5300', name: 'Freight & Transport', type: 'expense' },
  { code: '5400', name: 'Repairs & Maintenance', type: 'expense' },
  { code: '5500', name: 'Consumables & Blades', type: 'expense' },
  { code: '5600', name: 'Rent', type: 'expense' },
  { code: '5700', name: 'Miscellaneous Expense', type: 'expense' },
  { code: '5800', name: 'Agent Commission Expense', type: 'expense' },
  { code: '5900', name: 'WHT Expense', type: 'expense' },
]

const NOTE_REASONS = [{ value: 'defect' }, { value: 'shortage' }, { value: 'price_adjustment' }, { value: 'return' }, { value: 'other' }]

/** Cash & bank accounts = chart codes starting with "10". */
const isCashAccount = (acc) => String(acc?.code || '').startsWith('10')

export default function Accounting() {
  const { t, lang } = useLang()
  const [tab, setTab] = useState(0)

  const L = (en, ur) => (lang === 'ur' ? ur : en)

  const { items: accounts } = useCollection('accounts')
  const { items: vouchers } = useCollection('vouchers')

  // One-time standard chart of accounts seed (skipped when data exists
  // or the device has already seeded — flag survives a "clear all").
  useEffect(() => {
    if (db.list('accounts').length > 0) return
    if (storage.get(COA_SEED_FLAG, false)) return
    SEED_COA.forEach((acc) => db.save('accounts', { ...acc, openingBalance: 0, active: true }))
    storage.set(COA_SEED_FLAG, true)
  }, [])

  const accountById = useMemo(() => {
    const map = {}
    accounts.forEach((a) => {
      map[a.id] = a
    })
    return map
  }, [accounts])

  const accountName = (id) => accountById[id]?.name || id || '—'

  const cashAccountIds = useMemo(() => new Set(accounts.filter(isCashAccount).map((a) => a.id)), [accounts])
  const cashOpening = useMemo(
    () => round2(accounts.filter(isCashAccount).reduce((a, acc) => a + (acc.openingBalance || 0), 0)),
    [accounts],
  )

  /* Cash / Bank Book — every voucher touching a 10xx account.
     Money IN  = the cash/bank account is DEBITED  (value received).
     Money OUT = the cash/bank account is CREDITED (value given).
     This keeps the closing balance consistent with the trial balance
     (assets: opening + debit − credit). */
  const cashBook = useMemo(() => {
    const rows = vouchers
      .filter((v) => cashAccountIds.has(v.debitAccount) || cashAccountIds.has(v.creditAccount))
      .map((v) => {
        const cashDr = cashAccountIds.has(v.debitAccount)
        const other = accountById[cashDr ? v.creditAccount : v.debitAccount]
        return {
          id: v.id,
          date: v.date,
          particulars: v.narration || other?.name || '—',
          in: cashDr ? round2(v.amount || 0) : 0,
          out: cashDr ? 0 : round2(v.amount || 0),
        }
      })
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))

    let bal = cashOpening
    let totalIn = 0
    let totalOut = 0
    rows.forEach((r) => {
      totalIn += r.in
      totalOut += r.out
      bal += r.in - r.out
      r.balance = round2(bal)
    })
    return { rows, totalIn: round2(totalIn), totalOut: round2(totalOut), closing: round2(bal) }
  }, [vouchers, cashAccountIds, accountById, cashOpening])

  /* Trial Balance — per account: opening + Σvoucher debits/credits.
     Debit-nature accounts (asset/expense) close on the debit side,
     the rest on the credit side; grand totals must balance. */
  const trial = useMemo(() => {
    const rows = accounts
      .map((acc) => {
        const debitTotal = round2(vouchers.filter((v) => v.debitAccount === acc.id).reduce((a, v) => a + (v.amount || 0), 0))
        const creditTotal = round2(vouchers.filter((v) => v.creditAccount === acc.id).reduce((a, v) => a + (v.amount || 0), 0))
        const opening = round2(acc.openingBalance || 0)
        const debitNature = acc.type === 'asset' || acc.type === 'expense'
        const closing = round2(opening + (debitNature ? debitTotal - creditTotal : creditTotal - debitTotal))
        return {
          id: acc.id,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          opening,
          debit: debitNature ? Math.max(0, closing) : Math.max(0, -closing),
          credit: debitNature ? Math.max(0, -closing) : Math.max(0, closing),
        }
      })
      .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')))
    const totalDebit = round2(rows.reduce((a, r) => a + r.debit, 0))
    const totalCredit = round2(rows.reduce((a, r) => a + r.credit, 0))
    return { rows, totalDebit, totalCredit, difference: round2(totalDebit - totalCredit) }
  }, [accounts, vouchers])

  const trialBalanced = Math.abs(trial.difference) < 0.005

  const cashColumns = [
    { key: 'date', label: t('common.date'), render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
    { key: 'particulars', label: L('Particulars', 'تفصیل'), render: (r) => <span className="font-medium">{r.particulars}</span> },
    {
      key: 'in',
      label: L('In', 'وصول'),
      render: (r) => (r.in ? <span className="num text-emerald-600 dark:text-emerald-400">{fmtCurrency(r.in)}</span> : <span className="text-[var(--muted)]">—</span>),
      format: (v) => fmtNumber(v),
    },
    {
      key: 'out',
      label: L('Out', 'ادائیگی'),
      render: (r) => (r.out ? <span className="num text-red-500">{fmtCurrency(r.out)}</span> : <span className="text-[var(--muted)]">—</span>),
      format: (v) => fmtNumber(v),
    },
    {
      key: 'balance',
      label: t('common.balance'),
      render: (r) => <span className="num font-semibold">{fmtCurrency(r.balance)}</span>,
      format: (v) => fmtNumber(v),
    },
  ]

  const trialColumns = [
    { key: 'code', label: L('Code', 'کوڈ'), render: (r) => <span className="num font-semibold">{r.code}</span> },
    { key: 'name', label: L('Account', 'اکاؤنٹ'), render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'type', label: L('Type', 'قسم'), format: (v) => v },
    { key: 'opening', label: L('Opening', 'افتتاحی'), render: (r) => <span className="num">{fmtNumber(r.opening)}</span>, format: (v) => fmtNumber(v) },
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
  ]

  return (
    <div className="fade-in">
      <Toolbar
        title={L('Accounting', 'اکاؤنٹنگ')}
        description={L(
          'Chart of accounts, vouchers, cash/bank book, trial balance, credit & debit notes.',
          'اکاؤنٹس چارٹ، واؤچرز، کیش/بینک بک، ٹرائل بیلنس، کریڈٹ اور ڈیبٹ نوٹس۔',
        )}
        actions={
          tab === 2 ? (
            <ExportMenu title={L('Cash / Bank Book', 'کیش/بینک بک')} columns={cashColumns} rows={cashBook.rows} />
          ) : tab === 3 ? (
            <ExportMenu title={L('Trial Balance', 'ٹرائل بیلنس')} columns={trialColumns} rows={trial.rows} />
          ) : null
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label={L('Vouchers', 'واؤچرز')} value={vouchers.length} icon={FileStack} tone="info" />
        <StatCard label={L('Cash / bank in', 'کیش/بینک وصول')} value={fmtCurrency(cashBook.totalIn)} icon={ArrowUpCircle} tone="success" />
        <StatCard label={L('Cash / bank out', 'کیش/بینک ادائیگی')} value={fmtCurrency(cashBook.totalOut)} icon={ArrowDownCircle} tone="warning" />
        <StatCard
          label={L('Trial difference', 'ٹرائل فرق')}
          value={fmtCurrency(trial.difference)}
          icon={Scale}
          tone={trialBalanced ? 'success' : 'danger'}
          sub={trialBalanced ? L('Books balance ✓', 'کھاتہ متوازن ہے ✓') : L('Debits ≠ credits', 'ڈیبٹ اور کریڈٹ برابر نہیں')}
        />
      </div>

      <Tabs
        className="mb-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { label: L('Chart of Accounts', 'اکاؤنٹس چارٹ'), icon: BookOpen },
          { label: L('Vouchers', 'واؤچرز') },
          { label: L('Cash / Bank Book', 'کیش/بینک بک'), icon: Wallet },
          { label: L('Trial Balance', 'ٹرائل بیلنس') },
          { label: L('Credit Notes', 'کریڈٹ نوٹس') },
          { label: L('Debit Notes', 'ڈیبٹ نوٹس') },
        ]}
      />

      {tab === 0 && (
        <CrudPage
          config={{
            collection: 'accounts',
            i18nPrefix: 'accounts',
            searchKeys: ['code', 'name'],
            defaults: () => ({ openingBalance: 0, active: true }),
            columns: [
              { key: 'code', label: 'Code', render: (r) => <span className="num font-semibold">{r.code}</span> },
              { key: 'name', label: 'Account name', render: (r) => <span className="font-semibold">{r.name}</span> },
              { key: 'type', label: 'Type', format: (v) => v },
              { key: 'openingBalance', label: 'Opening', render: (r) => <span className="num">{fmtNumber(r.openingBalance)}</span>, format: (v) => fmtNumber(v) },
            ],
            fields: [
              { key: 'code', required: true, placeholder: '1000' },
              { key: 'name', required: true },
              { key: 'type', type: 'select', options: opts(ACCOUNT_TYPES) },
              { key: 'openingBalance', type: 'number' },
              { key: 'parentCode', hint: L('Head-office account code', 'مرکزی اکاؤنٹ کا کوڈ') },
              { key: 'active', type: 'checkbox' },
            ],
          }}
        />
      )}

      {tab === 1 && (
        <CrudPage
          config={{
            collection: 'vouchers',
            i18nPrefix: 'vouchers',
            searchKeys: ['id', 'refDoc', 'narration', 'debitAccount', 'creditAccount'],
            defaults: () => ({ date: todayISO(), type: 'journal', amount: 0 }),
            columns: [
              { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
              { key: 'id', label: 'Voucher #', render: (r) => <span className="num font-semibold">{r.id}</span> },
              { key: 'type', label: 'Type', format: (v) => v },
              { key: 'debitAccount', label: 'Debit A/C', render: (r) => <span className="font-medium">{accountName(r.debitAccount)}</span> },
              { key: 'creditAccount', label: 'Credit A/C', render: (r) => <span className="font-medium">{accountName(r.creditAccount)}</span> },
              { key: 'amount', label: 'Amount', render: (r) => <span className="num font-semibold">{fmtCurrency(r.amount)}</span>, format: (v) => fmtNumber(v) },
            ],
            fields: [
              { key: 'date', type: 'date', required: true },
              { key: 'type', type: 'select', options: opts(VOUCHER_TYPES) },
              {
                key: 'debitAccount',
                type: 'ref',
                refCollection: 'accounts',
                refLabel: 'name',
                hint: L('DR — value received', 'ڈیبٹ — جو ملا'),
              },
              {
                key: 'creditAccount',
                type: 'ref',
                refCollection: 'accounts',
                refLabel: 'name',
                hint: L('CR — value given', 'کریڈٹ — جو دیا'),
              },
              { key: 'amount', type: 'number', min: 0, required: true },
              { key: 'narration', span: 'full' },
              { key: 'refDoc', hint: 'ORD-0007 / PUR-0002 / RCP-0001' },
            ],
          }}
        />
      )}

      {tab === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label={L('Total in', 'کل وصول')} value={fmtCurrency(cashBook.totalIn)} icon={ArrowUpCircle} tone="success" />
            <StatCard label={L('Total out', 'کل ادائیگی')} value={fmtCurrency(cashBook.totalOut)} icon={ArrowDownCircle} tone="warning" />
            <StatCard label={L('Closing balance', 'اختتامی بیلنس')} value={fmtCurrency(cashBook.closing)} icon={Wallet} tone="brand" />
          </div>
          <Card>
            <Table
              columns={cashColumns}
              rows={cashBook.rows}
              keyOf={(r) => r.id}
              empty={
                <EmptyState
                  title={t('common.noData')}
                  hint={L(
                    'Vouchers touching a cash/bank account (code 10…) appear here automatically.',
                    'وہ واؤچرز جو کیش/بینک اکاؤنٹ (کوڈ 10…) کو لگتے ہیں خود یہاں آ جائیں گے۔',
                  )}
                />
              }
            />
          </Card>
        </div>
      )}

      {tab === 3 && (
        <Card>
          <Table
            columns={trialColumns}
            rows={trial.rows}
            keyOf={(r) => r.id}
            empty={
              <EmptyState
                title={t('common.noData')}
                hint={L('Accounts appear here once the chart of accounts exists.', 'اکاؤنٹس چارٹ بننے کے بعد یہاں نظر آئیں گے۔')}
              />
            }
          />
          <div className="mt-3 pt-3 border-t border-dashed border-[var(--border)] flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
            <span>
              {L('Total debit', 'کل ڈیبٹ')}: <b className="num">{fmtCurrency(trial.totalDebit)}</b>
            </span>
            <span>
              {L('Total credit', 'کل کریڈٹ')}: <b className="num">{fmtCurrency(trial.totalCredit)}</b>
            </span>
            <span className={trialBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'font-semibold text-red-500'}>
              {L('Difference', 'فرق')}: <span className="num">{fmtCurrency(trial.difference)}</span>
              {trialBalanced ? ' ✓' : ''}
            </span>
          </div>
        </Card>
      )}

      {tab === 4 && (
        <CrudPage
          config={{
            collection: 'creditNotes',
            i18nPrefix: 'creditNotes',
            searchKeys: ['id', 'customerId', 'orderRef', 'reason'],
            defaults: () => ({ date: todayISO(), amount: 0, gstAmount: 0 }),
            columns: [
              { key: 'id', label: 'Note #', render: (r) => <span className="num font-semibold">{r.id}</span> },
              { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
              { key: 'customerId', label: 'Customer' },
              { key: 'reason', label: 'Reason', format: (v) => v },
              { key: 'amount', label: 'Amount', render: (r) => <span className="num font-semibold">{fmtCurrency(r.amount)}</span>, format: (v) => fmtNumber(v) },
              { key: 'gstAmount', label: 'GST', render: (r) => <span className="num">{fmtCurrency(r.gstAmount)}</span>, format: (v) => fmtNumber(v) },
            ],
            fields: [
              { key: 'date', type: 'date', required: true },
              { key: 'customerId', type: 'ref', refCollection: 'customers', refLabel: 'name' },
              { key: 'orderRef', hint: 'ORD-0007' },
              { key: 'reason', type: 'select', options: NOTE_REASONS },
              { key: 'amount', type: 'number', min: 0, required: true },
              { key: 'gstAmount', type: 'number', min: 0 },
              { key: 'notes', type: 'textarea', span: 'full' },
            ],
          }}
        />
      )}

      {tab === 5 && (
        <CrudPage
          config={{
            collection: 'debitNotes',
            i18nPrefix: 'debitNotes',
            searchKeys: ['id', 'supplierId', 'purchaseRef', 'reason'],
            defaults: () => ({ date: todayISO(), amount: 0, gstAmount: 0 }),
            columns: [
              { key: 'id', label: 'Note #', render: (r) => <span className="num font-semibold">{r.id}</span> },
              { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
              { key: 'supplierId', label: 'Supplier' },
              { key: 'reason', label: 'Reason', format: (v) => v },
              { key: 'amount', label: 'Amount', render: (r) => <span className="num font-semibold">{fmtCurrency(r.amount)}</span>, format: (v) => fmtNumber(v) },
              { key: 'gstAmount', label: 'GST', render: (r) => <span className="num">{fmtCurrency(r.gstAmount)}</span>, format: (v) => fmtNumber(v) },
            ],
            fields: [
              { key: 'date', type: 'date', required: true },
              { key: 'supplierId', type: 'ref', refCollection: 'suppliers', refLabel: 'name' },
              { key: 'purchaseRef', hint: 'PUR-0001' },
              { key: 'reason', type: 'select', options: NOTE_REASONS },
              { key: 'amount', type: 'number', min: 0, required: true },
              { key: 'gstAmount', type: 'number', min: 0 },
              { key: 'notes', type: 'textarea', span: 'full' },
            ],
          }}
        />
      )}
    </div>
  )
}
