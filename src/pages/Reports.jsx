import React, { useMemo, useState } from 'react'
import {
  BarChart3, TrendingUp, Percent, Wallet, Clock, HandCoins, Banknote,
  Users, HardHat, Wrench, LineChart as LineIcon,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'

import Toolbar from '../components/UI/Toolbar'
import Card from '../components/UI/Card'
import Tabs from '../components/UI/Tabs'
import Table from '../components/UI/Table'
import StatCard from '../components/UI/StatCard'
import ExportMenu from '../components/UI/ExportMenu'
import EmptyState from '../components/States/EmptyState'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { orderTotals, costPerSqft, landedCost, recoveryPct, theoreticalSqft, agingDays } from '../utils/calculations'
import { fmtCurrency, fmtNumber } from '../utils/formatters'
import { cn } from '../utils/cn'

/**
 * Reports — every number computed live from the collections:
 * P&L · profit per order/customer · cost per sqft · yield · valuation ·
 * stock aging · receivables/payables · labour productivity · downtime.
 */
export default function Reports() {
  const { t, lang, fmtNum } = useLang()
  const { canSee } = useAuth()
  const [tab, setTab] = useState(0)

  const { items: orders } = useCollection('orders')
  const { items: customers } = useCollection('customers')
  const { items: workers } = useCollection('workers')
  const { items: attendance } = useCollection('attendance')
  const { items: piecework } = useCollection('piecework')
  const { items: expenses } = useCollection('expenses')
  const { items: purchases } = useCollection('purchases')
  const { items: blocks } = useCollection('blocks')
  const { items: slabs } = useCollection('slabs')
  const { items: machines } = useCollection('machines')
  const { items: maintenance } = useCollection('maintenance')

  const monthPrefix = new Date().toISOString().slice(0, 7)

  // Monthly P&L (last 6 months)
  const pnl = useMemo(() => {
    const map = new Map()
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      map.set(key, { month: key.slice(2), revenue: 0, cogs: 0, expenses: 0, profit: 0 })
    }
    orders.filter((o) => o.status !== 'cancelled').forEach((o) => {
      const k = (o.date || '').slice(0, 7)
      if (!map.has(k)) return
      const tot = orderTotals(o).total
      const material = (o.items || []).reduce((a, it) => a + (it.sqft || it.lengthFt * it.widthFt || 0) * (it.costPerSqft || 0), 0)
      map.get(k).revenue += tot
      map.get(k).cogs += material
    })
    expenses.forEach((e) => {
      const k = (e.date || '').slice(0, 7)
      if (map.has(k)) map.get(k).expenses += e.amount || 0
    })
    return [...map.values()].map((m) => ({ ...m, profit: m.revenue - m.cogs - m.expenses }))
  }, [orders, expenses])

  // Profit per order
  const perOrder = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'cancelled')
        .map((o) => {
          const total = orderTotals(o).total
          const material = (o.items || []).reduce((a, it) => a + (it.sqft || it.lengthFt * it.widthFt || 0) * (it.costPerSqft || 0), 0)
          return { id: o.id, customer: o.customerName, date: o.date, revenue: total, material, profit: total - material - (o.commissionPct ? 0 : 0) }
        })
        .sort((a, b) => b.profit - a.profit),
    [orders],
  )

  // Profit per customer
  const perCustomer = useMemo(() => {
    const map = new Map()
    perOrder.forEach((o) => {
      const key = o.customer || '—'
      const cur = map.get(key) || { name: key, orders: 0, revenue: 0, profit: 0 }
      cur.orders += 1
      cur.revenue += o.revenue
      cur.profit += o.profit
      map.set(key, cur)
    })
    return [...map.values()].sort((a, b) => b.revenue - a.revenue)
  }, [perOrder])

  // Receivables & payables
  const receivables = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'cancelled')
        .map((o) => ({ id: o.id, customer: o.customerName, total: orderTotals(o).total, paid: o.paidAmount || 0, days: agingDays(o.date) }))
        .map((r) => ({ ...r, balance: r.total - r.paid }))
        .filter((r) => r.balance > 0)
        .sort((a, b) => b.days - a.days),
    [orders],
  )
  const payables = useMemo(
    () =>
      purchases
        .map((p) => ({ id: p.id, supplier: p.supplierName, total: p.landedTotal || 0, paid: p.paidAmount || 0, days: agingDays(p.date) }))
        .map((r) => ({ ...r, balance: r.total - r.paid }))
        .filter((r) => r.balance > 0)
        .sort((a, b) => b.days - a.days),
    [purchases],
  )

  // Valuation & aging
  const valuation = useMemo(() => {
    const blocksValue = blocks.filter((b) => b.status !== 'sold').reduce((a, b) => a + (b.landedTotal || 0), 0)
    const slabsValue = slabs.filter((s) => ['available', 'reserved'].includes(s.status)).reduce((a, s) => a + (s.price || 0), 0)
    const dead = slabs.filter((s) => s.status === 'available' && agingDays(s.createdAt) > 180)
    const old = slabs.filter((s) => s.status === 'available' && agingDays(s.createdAt) > 90 && agingDays(s.createdAt) <= 180)
    return { blocksValue, slabsValue, dead: dead.length, deadArea: dead.reduce((a, s) => a + (s.areaSqft || 0), 0), old: old.length }
  }, [blocks, slabs])

  // Labour productivity (this month)
  const productivity = useMemo(
    () =>
      workers.map((w) => {
        const att = attendance.filter((a) => a.workerId === w.id && (a.date || '').startsWith(monthPrefix))
        const pw = piecework.filter((p) => p.workerId === w.id && (p.date || '').startsWith(monthPrefix))
        return {
          name: w.name,
          days: att.filter((a) => ['present', 'half'].includes(a.status)).length,
          sqft: pw.reduce((a, p) => a + (p.units || 0), 0),
          earned: pw.reduce((a, p) => a + (p.earning || 0), 0),
        }
      }).sort((a, b) => b.sqft - a.sqft),
    [workers, attendance, piecework, monthPrefix],
  )

  // Machine downtime
  const downtime = useMemo(
    () =>
      machines.map((m) => {
        const logs = maintenance.filter((x) => x.machineName === m.id)
        return {
          name: m.name,
          hours: logs.reduce((a, x) => a + (x.downHours || 0), 0),
          cost: logs.reduce((a, x) => a + (x.cost || 0), 0),
          events: logs.length,
        }
      }).sort((a, b) => b.hours - a.hours),
    [machines, maintenance],
  )

  const money = (v) => fmtCurrency(v, { lang })

  const TABS = [t('reports.pnl'), t('reports.profitOrders'), t('reports.profitCustomers'), t('reports.receivables'), t('reports.payables'), t('reports.valuation'), t('reports.labourProductivity'), t('reports.downtime')]
  const visibleTabs = TABS.map((label, i) => ({ label, i })).filter(({ i }) => (i >= 3 ? canSee(['owner', 'accountant', 'manager']) : true))

  return (
    <div className="fade-in">
      <Toolbar
        title={t('reports.title')}
        description={t('reports.subtitle')}
        actions={<CurrentTabExport tab={tab} t={t} lang={lang} pnl={pnl} perOrder={perOrder} perCustomer={perCustomer} receivables={receivables} payables={payables} productivity={productivity} downtime={downtime} money={money} fmtNum={fmtNum} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label={t('home.monthSales')} value={money(pnl.find((m) => m.month === monthPrefix.slice(2))?.revenue || 0)} icon={TrendingUp} tone="brand" />
        <StatCard label={t('home.monthProfit')} value={money(pnl.find((m) => m.month === monthPrefix.slice(2))?.profit || 0)} icon={TrendingUp} tone="success" />
        <StatCard label={t('reports.receivables')} value={money(receivables.reduce((a, r) => a + r.balance, 0))} icon={HandCoins} tone="danger" />
        <StatCard label={t('reports.payables')} value={money(payables.reduce((a, r) => a + r.balance, 0))} icon={Banknote} tone="warning" />
      </div>

      <Tabs className="mb-4" active={tab} onChange={setTab} tabs={visibleTabs.map((v) => ({ label: v.label }))} />
      {(() => {
        const tabIndex = visibleTabs[tab]?.i ?? 0
        switch (tabIndex) {
          case 0:
            return <PnlReport pnl={pnl} t={t} money={money} />
          case 1:
            return <SimpleReport columns={orderColumns(t, money, fmtNum)} rows={perOrder} title={t('reports.profitOrders')} t={t} />
          case 2:
            return <SimpleReport columns={customerColumns(t, money, fmtNum)} rows={perCustomer} title={t('reports.profitCustomers')} t={t} />
          case 3:
            return <SimpleReport columns={receivableColumns(t, money, fmtNum)} rows={receivables} title={t('reports.receivables')} t={t} />
          case 4:
            return <SimpleReport columns={payableColumns(t, money, fmtNum)} rows={payables} title={t('reports.payables')} t={t} />
          case 5:
            return <ValuationReport valuation={valuation} t={t} money={money} fmtNum={fmtNum} lang={lang} />
          case 6:
            return <SimpleReport columns={productivityColumns(t, money, fmtNum)} rows={productivity} title={t('reports.labourProductivity')} t={t} />
          case 7:
            return <SimpleReport columns={downtimeColumns(t, money, fmtNum)} rows={downtime} title={t('reports.downtime')} t={t} />
          default:
            return null
        }
      })()}
    </div>
  )
}

/* ── report bodies ── */
function PnlReport({ pnl, t, money }) {
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-sm mb-4 leading-urdu no-clip">{t('reports.pnl')}</h3>
        <div className="h-72" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pnl} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted)" width={58} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="revenue" name={t('reports.revenue')} stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="profit" name={t('reports.profit')} stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expenses" name={t('nav.expenses')} stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <Table
          columns={[
            { key: 'month', label: t('reports.month'), render: (r) => <span className="num font-semibold">{r.month}</span> },
            { key: 'revenue', label: t('reports.revenue'), render: (r) => <span className="num">{money(r.revenue)}</span> },
            { key: 'expenses', label: t('nav.expenses'), render: (r) => <span className="num">{money(r.expenses)}</span> },
            { key: 'profit', label: t('reports.profit'), render: (r) => <span className={cn('num font-bold', r.profit >= 0 ? 'text-emerald-500' : 'text-red-500')}>{money(r.profit)}</span> },
          ]}
          rows={pnl}
          keyOf={(r) => r.month}
          empty={<EmptyState title={t('reports.noData')} />}
        />
      </Card>
    </div>
  )
}

function SimpleReport({ columns, rows, title, t }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm leading-urdu no-clip">{title}</h3>
      </div>
      <Table columns={columns} rows={rows} keyOf={(r, i) => r.id || r.name || i} empty={<EmptyState title={t('reports.noData')} />} />
    </Card>
  )
}

function ValuationReport({ valuation, t, money, fmtNum, lang }) {
  const rows = [
    { name: lang === 'ur' ? 'بلاکس (دستیاب)' : 'Blocks (in stock)', value: valuation.blocksValue, qty: '' },
    { name: lang === 'ur' ? 'سلیبس (دستیاب + بک)' : 'Slabs (available + reserved)', value: valuation.slabsValue, qty: '' },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={lang === 'ur' ? 'بلاک مالیت' : 'Blocks value'} value={money(valuation.blocksValue)} icon={Wallet} tone="info" />
        <StatCard label={lang === 'ur' ? 'سلیب مالیت' : 'Slabs value'} value={money(valuation.slabsValue)} icon={Wallet} tone="brand" />
        <StatCard label={t('notifications.lowStock')} value={valuation.old} sub={lang === 'ur' ? '+۹۰ دن پرانے' : 'older than 90d'} icon={Clock} tone="warning" />
        <StatCard label={t('reports.aging')} value={valuation.dead} sub={lang === 'ur' ? `+${fmtNum(valuation.deadArea, 0)} sq ft` : `${fmtNum(valuation.deadArea, 0)} sq ft`} icon={Clock} tone="danger" />
      </div>
      <Card>
        <Table
          columns={[
            { key: 'name', label: lang === 'ur' ? 'قسم' : 'Category', render: (r) => <span className="font-medium">{r.name}</span> },
            { key: 'value', label: lang === 'ur' ? 'مالیت' : 'Value', render: (r) => <span className="num font-semibold">{money(r.value)}</span> },
          ]}
          rows={rows}
          keyOf={(r) => r.name}
          empty={null}
        />
      </Card>
    </div>
  )
}

/* ── column defs ── */
function orderColumns(t, money, fmtNum) {
  return [
    { key: 'id', label: t('nav.orders'), render: (r) => <span className="num font-semibold">{r.id}</span> },
    { key: 'customer', label: t('nav.customers') },
    { key: 'revenue', label: t('reports.revenue'), render: (r) => <span className="num">{money(r.revenue)}</span> },
    { key: 'material', label: t('calc.material'), render: (r) => <span className="num">{money(r.material)}</span> },
    { key: 'profit', label: t('reports.profit'), render: (r) => <span className={cn('num font-bold', r.profit >= 0 ? 'text-emerald-500' : 'text-red-500')}>{money(r.profit)}</span>, exportFormat: (_v, r) => fmtNumber(r.profit) },
  ]
}
function customerColumns(t, money, fmtNum) {
  return [
    { key: 'name', label: t('nav.customers'), render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'orders', label: t('customers.totalOrders'), render: (r) => <span className="num">{r.orders}</span> },
    { key: 'revenue', label: t('reports.revenue'), render: (r) => <span className="num">{money(r.revenue)}</span> },
    { key: 'profit', label: t('reports.profit'), render: (r) => <span className="num font-bold">{money(r.profit)}</span>, exportFormat: (_v, r) => fmtNumber(r.profit) },
  ]
}
function receivableColumns(t, money, fmtNum) {
  return [
    { key: 'id', label: t('nav.orders'), render: (r) => <span className="num font-semibold">{r.id}</span> },
    { key: 'customer', label: t('nav.customers') },
    { key: 'total', label: t('common.total'), render: (r) => <span className="num">{money(r.total)}</span> },
    { key: 'paid', label: t('common.paid'), render: (r) => <span className="num">{money(r.paid)}</span> },
    { key: 'balance', label: t('common.balance'), render: (r) => <span className="num font-bold text-red-500">{money(r.balance)}</span>, exportFormat: (_v, r) => fmtNumber(r.balance) },
    { key: 'days', label: lang_days(t), render: (r) => <span className="num">{r.days}</span> },
  ]
}
function payableColumns(t, money, fmtNum) {
  return [
    { key: 'id', label: t('nav.purchases'), render: (r) => <span className="num font-semibold">{r.id}</span> },
    { key: 'supplier', label: t('nav.suppliers') },
    { key: 'total', label: t('common.total'), render: (r) => <span className="num">{money(r.total)}</span> },
    { key: 'balance', label: t('common.balance'), render: (r) => <span className="num font-bold text-red-500">{money(r.balance)}</span>, exportFormat: (_v, r) => fmtNumber(r.balance) },
    { key: 'days', label: lang_days(t), render: (r) => <span className="num">{r.days}</span> },
  ]
}
function productivityColumns(t, money, fmtNum) {
  return [
    { key: 'name', label: t('nav.workers'), render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'days', label: t('fields.presentDays'), render: (r) => <span className="num">{r.days}</span> },
    { key: 'sqft', label: 'Sq ft', render: (r) => <span className="num">{fmtNumber(r.sqft, 0)}</span> },
    { key: 'earned', label: t('payroll.earning'), render: (r) => <span className="num font-bold">{money(r.earned)}</span>, exportFormat: (_v, r) => fmtNumber(r.earned) },
  ]
}
function downtimeColumns(t, money, fmtNum) {
  return [
    { key: 'name', label: t('nav.machines'), render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'events', label: t('maintenance.title'), render: (r) => <span className="num">{r.events}</span> },
    { key: 'hours', label: t('fields.downtime'), render: (r) => <span className="num font-bold">{fmtNumber(r.hours, 0)}</span> },
    { key: 'cost', label: t('fields.cost'), render: (r) => <span className="num">{money(r.cost)}</span>, exportFormat: (_v, r) => fmtNumber(r.cost) },
  ]
}
function lang_days(t) {
  return t('reports.aging').includes('/') ? 'Days' : 'دن'
}

function CurrentTabExport({ tab, t, lang, pnl, perOrder, perCustomer, receivables, payables, productivity, downtime, money, fmtNum }) {
  const sets = [
    { title: t('reports.pnl'), columns: pnlCols(t, money), rows: pnl },
    { title: t('reports.profitOrders'), columns: orderColumns(t, money, fmtNum), rows: perOrder },
    { title: t('reports.profitCustomers'), columns: customerColumns(t, money, fmtNum), rows: perCustomer },
    { title: t('reports.receivables'), columns: receivableColumns(t, money, fmtNum), rows: receivables },
    { title: t('reports.payables'), columns: payableColumns(t, money, fmtNum), rows: payables },
    { title: t('reports.labourProductivity'), columns: productivityColumns(t, money, fmtNum), rows: productivity },
    { title: t('reports.downtime'), columns: downtimeColumns(t, money, fmtNum), rows: downtime },
  ]
  const cur = sets[Math.min(tab, sets.length - 1)]
  return <ExportMenu title={cur.title} columns={cur.columns} rows={cur.rows} />
}

function pnlCols(t, money) {
  return [
    { key: 'month', label: t('reports.month') },
    { key: 'revenue', label: t('reports.revenue'), format: (v) => fmtNumber(v) },
    { key: 'expenses', label: t('nav.expenses'), format: (v) => fmtNumber(v) },
    { key: 'profit', label: t('reports.profit'), format: (v) => fmtNumber(v) },
  ]
}
