import React, { useMemo, useState } from 'react'
import { Users, HandCoins, BadgeCheck, Clock } from 'lucide-react'

import CrudPage from '../components/CrudPage'
import Tabs from '../components/UI/Tabs'
import Badge from '../components/UI/Badge'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { AGENT_TYPES, COMMISSION_STATUS } from '../constants/enums'
import { fmtCurrency, fmtDate, fmtNumber, todayISO } from '../utils/formatters'

/**
 * Agents & Commissions — salesmen / brokers / contractors register plus
 * the commission ledger: sale amount × pct = commission, tracked through
 * earned → approved → paid, with a live pending-payout figure.
 */
const opts = (list) => list.map((v) => ({ value: v }))

export default function Agents() {
  const { lang } = useLang()
  const [tab, setTab] = useState(0)
  const { items: commissions } = useCollection('commissions')

  const commissionStats = useMemo(() => {
    const sum = (status) => commissions.filter((c) => c.status === status).reduce((a, c) => a + (c.commissionAmount || 0), 0)
    const earned = sum('earned')
    const approved = sum('approved')
    const paid = sum('paid')
    return [
      { label: lang === 'ur' ? 'کمائے گئے' : 'Earned total', value: fmtCurrency(earned), icon: HandCoins, tone: 'info' },
      { label: lang === 'ur' ? 'منظور شدہ' : 'Approved total', value: fmtCurrency(approved), icon: BadgeCheck, tone: 'warning' },
      { label: lang === 'ur' ? 'ادا شدہ' : 'Paid total', value: fmtCurrency(paid), icon: HandCoins, tone: 'success' },
      { label: lang === 'ur' ? 'بقایا ادائیگی' : 'Pending payout', value: fmtCurrency(earned + approved - paid), icon: Clock, tone: 'danger' },
    ]
  }, [commissions, lang])

  return (
    <div className="fade-in">
      <Tabs
        className="mb-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { label: lang === 'ur' ? 'ایجنٹس' : 'Agents' },
          { label: lang === 'ur' ? 'کمیشن' : 'Commissions' },
        ]}
      />

      {tab === 0 && (
        <CrudPage
          config={{
            collection: 'agents',
            i18nPrefix: 'agents',
            searchKeys: ['name', 'phone', 'cnic'],
            columns: [
              { key: 'name', label: 'Name' },
              { key: 'type', label: 'Type', format: (v) => v },
              { key: 'phone', label: 'Phone', render: (r) => <span className="num">{r.phone || '—'}</span> },
              { key: 'commissionPct', label: 'Comm %', render: (r) => <span className="num">{r.commissionPct ?? '—'}%</span>, format: (v) => fmtNumber(v) },
              { key: 'address', label: 'Address' },
            ],
            fields: [
              { key: 'name', required: true },
              { key: 'type', type: 'select', options: opts(AGENT_TYPES) },
              { key: 'phone', type: 'tel' },
              { key: 'cnic' },
              { key: 'address' },
              { key: 'commissionPct', type: 'number', min: 0, step: 0.1, hint: lang === 'ur' ? 'پہلے سے طے شدہ کمیشن فیصد' : 'Default commission %' },
              { key: 'bankName' },
              { key: 'notes', type: 'textarea', span: 'full' },
            ],
          }}
        />
      )}

      {tab === 1 && (
        <CrudPage
          config={{
            collection: 'commissions',
            i18nPrefix: 'commissions',
            searchKeys: ['agentId', 'orderRef', 'status'],
            defaults: () => ({ date: todayISO(), status: 'earned', commissionPct: 2, saleAmount: 0, paidAmount: 0 }),
            compute: (v) => ({ commissionAmount: ((v.saleAmount || 0) * (v.commissionPct || 0)) / 100 }),
            columns: [
              { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
              { key: 'agentId', label: 'Agent' },
              { key: 'orderRef', label: 'Order ref', render: (r) => <span className="num">{r.orderRef || '—'}</span> },
              { key: 'saleAmount', label: 'Sale', render: (r) => <span className="num">{fmtCurrency(r.saleAmount)}</span>, format: (v) => fmtNumber(v) },
              {
                key: 'commissionAmount', label: 'Commission',
                render: (r) => <span className="num font-semibold">{fmtCurrency(r.commissionAmount)}</span>,
                format: (v) => fmtNumber(v),
              },
              { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
              { key: 'paidAmount', label: 'Paid', render: (r) => <span className="num">{fmtCurrency(r.paidAmount)}</span>, format: (v) => fmtNumber(v) },
            ],
            fields: [
              { key: 'date', type: 'date', required: true },
              { key: 'agentId', type: 'ref', refCollection: 'agents', refLabel: 'name', required: true },
              { key: 'orderRef' },
              { key: 'saleAmount', type: 'number', min: 0 },
              { key: 'commissionPct', type: 'number', min: 0, step: 0.1 },
              { key: 'commissionAmount', type: 'readonly', format: (v) => fmtCurrency(v), hint: lang === 'ur' ? 'خودکار' : 'Auto' },
              { key: 'status', type: 'select', options: opts(COMMISSION_STATUS) },
              { key: 'paidAt', type: 'date' },
              { key: 'paidAmount', type: 'number', min: 0 },
              { key: 'notes', type: 'textarea', span: 'full' },
            ],
            filters: [{ key: 'status', options: opts(COMMISSION_STATUS) }],
            stats: () => commissionStats,
          }}
        />
      )}
    </div>
  )
}
