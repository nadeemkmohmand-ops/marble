import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, HandCoins, Banknote, TrendingUp, Package, Layers, Scissors,
  HardHat, Cog, Plus, Calculator, FileText, CalendarCheck, BarChart3,
  LayoutDashboard, ArrowUp, ArrowDown, Eye, EyeOff, Package2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'

import StatCard from '../components/UI/StatCard'
import Card from '../components/UI/Card'
import Table from '../components/UI/Table'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import EmptyState from '../components/States/EmptyState'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { orderTotals } from '../utils/calculations'
import { fmtCurrency, fmtNumber, fmtDate } from '../utils/formatters'
import { storage } from '../utils/storage'
import ROUTES from '../constants/routes'

const PIE_COLORS = ['#3b82f6', '#f97316', '#fbbf24', '#10b981', '#34d399']

// Customizable dashboard widgets (drag-free: show/hide + reorder).
const WIDGET_DEFS = [
  { id: 'kpi', label: 'KPI cards' },
  { id: 'quick', label: 'Quick actions' },
  { id: 'sales', label: 'Sales & expenses chart' },
  { id: 'grade', label: 'Slabs by grade' },
  { id: 'movements', label: 'Recent movements' },
]
const WIDGETS_KEY = 'marble.dashboardWidgets'

function loadWidgetConfig() {
  const saved = storage.get(WIDGETS_KEY, null)
  if (!saved || !Array.isArray(saved.order)) return { order: WIDGET_DEFS.map((w) => w.id), hidden: [] }
  const known = saved.order.filter((id) => WIDGET_DEFS.some((w) => w.id === id))
  WIDGET_DEFS.forEach((w) => { if (!known.includes(w.id)) known.push(w.id) })
  return { order: known, hidden: Array.isArray(saved.hidden) ? saved.hidden : [] }
}

export default function Home() {
  const { t, lang, fmtNum } = useLang()
  const { user } = useAuth()
  const toast = useToast()
  const { items: blocks } = useCollection('blocks')
  const { items: slabs } = useCollection('slabs')
  const { items: offcuts } = useCollection('offcuts')
  const { items: orders } = useCollection('orders')
  const { items: purchases } = useCollection('purchases')
  const { items: expenses } = useCollection('expenses')
  const { items: workers } = useCollection('workers')
  const { items: attendance } = useCollection('attendance')
  const { items: machines } = useCollection('machines')
  const { items: movements } = useCollection('movements')

  const monthPrefix = new Date().toISOString().slice(0, 7)

  const stats = useMemo(() => {
    const stockValue =
      blocks.filter((b) => b.status !== 'sold').reduce((a, b) => a + (b.landedTotal || 0), 0) +
      slabs.filter((s) => ['available', 'reserved'].includes(s.status)).reduce((a, s) => a + (s.price || 0), 0)
    const validOrders = orders.filter((o) => o.status !== 'cancelled')
    const revenue = validOrders.reduce((a, o) => a + (o.total || 0), 0)
    const received = validOrders.reduce((a, o) => a + (o.paidAmount || 0), 0)
    const payables = purchases.reduce((a, p) => a + ((p.landedTotal || 0) - (p.paidAmount || 0)), 0)
    const monthOrders = validOrders.filter((o) => (o.date || '').startsWith(monthPrefix))
    const monthSales = monthOrders.reduce((a, o) => a + (o.total || 0), 0)
    const monthExpenses = expenses.filter((e) => (e.date || '').startsWith(monthPrefix)).reduce((a, e) => a + (e.amount || 0), 0)
    const today = new Date().toISOString().slice(0, 10)
    const presentToday = attendance.filter((a) => a.date === today && ['present', 'half'].includes(a.status)).length
    return { stockValue, receivables: revenue - received, payables, monthSales, monthProfit: monthSales - monthExpenses, monthExpenses, presentToday }
  }, [blocks, slabs, orders, purchases, expenses, attendance, monthPrefix])

  const monthly = useMemo(() => {
    const map = new Map()
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      map.set(key, { month: key.slice(2), sales: 0, expenses: 0 })
    }
    orders.filter((o) => o.status !== 'cancelled').forEach((o) => {
      const k = (o.date || '').slice(0, 7)
      if (map.has(k)) map.get(k).sales += o.total || 0
    })
    expenses.forEach((e) => {
      const k = (e.date || '').slice(0, 7)
      if (map.has(k)) map.get(k).expenses += e.amount || 0
    })
    return [...map.values()]
  }, [orders, expenses])

  const gradeData = useMemo(() => {
    const grades = { A: 0, B: 0, C: 0 }
    slabs.forEach((s) => {
      if (s.grade in grades) grades[s.grade] += 1
    })
    return Object.entries(grades).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0)
  }, [slabs])

  const role = user?.role || 'owner'
  const isFinance = role === 'owner' || role === 'accountant'

  const quickActions = [
    { to: ROUTES.BLOCKS, icon: Plus, label: t('home.addBlock') },
    { to: ROUTES.QUOTATIONS, icon: FileText, label: t('home.newQuote') },
    { to: ROUTES.ORDERS, icon: FileText, label: t('home.newOrder') },
    { to: ROUTES.ATTENDANCE, icon: CalendarCheck, label: t('home.markAttendance') },
    { to: ROUTES.CALCULATOR, icon: Calculator, label: t('nav.calculator') },
    { to: ROUTES.REPORTS, icon: BarChart3, label: t('nav.reports') },
  ]

  /* ── dashboard widget customization (show/hide + reorder) ── */
  const [widgets, setWidgets] = useState(loadWidgetConfig)
  const [customizing, setCustomizing] = useState(false)
  const saveWidgets = (next) => {
    setWidgets(next)
    storage.set(WIDGETS_KEY, next)
  }
  const toggleWidget = (id) => {
    const hidden = widgets.hidden.includes(id) ? widgets.hidden.filter((h) => h !== id) : [...widgets.hidden, id]
    saveWidgets({ ...widgets, hidden })
  }
  const moveWidget = (id, dir) => {
    const order = [...widgets.order]
    const i = order.indexOf(id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= order.length) return
    ;[order[i], order[j]] = [order[j], order[i]]
    saveWidgets({ ...widgets, order })
  }
  const widgetLabel = (id) => WIDGET_DEFS.find((w) => w.id === id)?.label || id
  const show = (id) => !widgets.hidden.includes(id)

  const widgets_ = {
    kpi: (
      <>
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isFinance ? (
            <>
              <StatCard label={t('home.stockValue')} value={fmtCurrency(stats.stockValue, { lang })} icon={Wallet} tone="brand" />
              <StatCard label={t('home.receivables')} value={fmtCurrency(stats.receivables, { lang })} icon={HandCoins} tone="danger" />
              <StatCard label={t('home.payables')} value={fmtCurrency(stats.payables, { lang })} icon={Banknote} tone="warning" />
              <StatCard label={t('home.monthProfit')} value={fmtCurrency(stats.monthProfit, { lang })} icon={TrendingUp} tone="success" />
            </>
          ) : (
            <>
              <StatCard label={t('home.blocksAvailable')} value={blocks.filter((b) => b.status === 'available').length} icon={Package} tone="info" />
              <StatCard label={t('home.slabsAvailable')} value={slabs.filter((s) => s.status === 'available').length} icon={Layers} tone="success" />
              <StatCard label={t('home.workersToday')} value={stats.presentToday} icon={HardHat} tone="brand" />
              <StatCard label={t('home.machinesRunning')} value={machines.filter((m) => m.status === 'running').length} icon={Cog} tone="warning" />
            </>
          )}
        </div>

        {/* Second row for non-finance roles keeps finance visible to owner only */}
        {isFinance && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label={t('home.blocksAvailable')} value={blocks.filter((b) => b.status === 'available').length} icon={Package} tone="info" />
            <StatCard label={t('home.slabsAvailable')} value={fmtNum(slabs.filter((s) => s.status === 'available').reduce((a, s) => a + (s.areaSqft || 0), 0), 0)} sub="sq ft" icon={Layers} tone="success" />
            <StatCard label={t('home.workersToday')} value={stats.presentToday} icon={HardHat} tone="brand" />
            <StatCard label={t('home.monthExpenses')} value={fmtCurrency(stats.monthExpenses, { lang })} icon={Wallet} tone="danger" />
          </div>
        )}
      </>
    ),
    quick: (
      <Card>
        <h3 className="font-semibold text-sm mb-3 leading-urdu no-clip">{t('home.quickActions')}</h3>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to}>
              <Button variant="secondary" size="sm" icon={a.icon} className="!min-h-9">
                {a.label}
              </Button>
            </Link>
          ))}
        </div>
      </Card>
    ),
    sales: (
      <Card className="lg:col-span-2">
        <h3 className="font-semibold text-sm mb-4 leading-urdu no-clip">{t('home.salesTrend')}</h3>
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient id="barExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted)" width={54} />
              <Tooltip
                cursor={{ fill: 'rgba(249,115,22,0.06)' }}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="sales" name={t('reports.revenue')} fill="url(#barSales)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name={t('nav.expenses')} fill="url(#barExpenses)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ),
    grade: (
      <Card>
        <h3 className="font-semibold text-sm mb-4 leading-urdu no-clip">{t('home.byGrade')}</h3>
        {gradeData.length === 0 ? (
          <EmptyState title={t('common.noData')} />
        ) : (
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={gradeData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {gradeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    ),
    movements: (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm leading-urdu no-clip">{t('home.recentMovements')}</h3>
          <Link to={ROUTES.MOVEMENTS} className="text-xs text-[var(--accent)]">{t('common.details')}</Link>
        </div>
        {movements.length === 0 ? (
          <EmptyState title={t('common.noData')} />
        ) : (
          <Table
            columns={[
              { key: 'date', label: t('common.date'), render: (r) => <span className="num">{fmtDate(r.date)}</span> },
              { key: 'type', label: t('fields.type'), render: (r) => <span className="leading-urdu no-clip">{t(`enums.movement.${r.type}`)}</span> },
              { key: 'refId', label: t('fields.refId'), render: (r) => <span className="num">{r.refId || '—'}</span> },
              { key: 'qty', label: t('fields.quantity'), render: (r) => <span className="num">{fmtNum(r.qty)}</span> },
              { key: 'party', label: t('fields.party') },
            ]}
            rows={movements.slice(0, 6)}
            empty={<EmptyState title={t('common.noData')} />}
          />
        )}
      </Card>
    ),
  }

  return (
    <div className="fade-in space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold leading-urdu-lg no-clip">
            {t('home.welcome')}{user ? ` — ${user.name}` : ''}
          </h1>
          <p className="text-xs text-[var(--muted)] leading-urdu no-clip">{t(`home.role${role.charAt(0).toUpperCase()}${role.slice(1)}`)}</p>
        </div>
        <button
          type="button"
          className={`btn btn-ghost h-9 px-3 text-xs inline-flex items-center gap-1.5 ${customizing ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : 'text-[var(--muted)]'}`}
          onClick={() => setCustomizing((v) => !v)}
        >
          <LayoutDashboard size={14} />
          {lang === 'ur' ? 'ڈیش بورڈ ترتیب' : 'Customize'}
        </button>
      </div>

      {customizing && (
        <Card className="border-dashed">
          <h3 className="font-semibold text-sm mb-2">{lang === 'ur' ? 'ویجٹس دکھائیں / ترتیب دیں' : 'Show / hide & reorder widgets'}</h3>
          <div className="flex flex-wrap gap-2">
            {widgets.order.map((id) => {
              const hidden = widgets.hidden.includes(id)
              return (
                <div key={id} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${hidden ? 'border-[var(--border)] text-[var(--muted)]' : 'border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]'}`}>
                  <button type="button" onClick={() => moveWidget(id, -1)} className="p-0.5" aria-label="Move up"><ArrowUp size={12} /></button>
                  <button type="button" onClick={() => moveWidget(id, 1)} className="p-0.5" aria-label="Move down"><ArrowDown size={12} /></button>
                  <span className="font-medium">{widgetLabel(id)}</span>
                  <button type="button" onClick={() => toggleWidget(id)} className="p-0.5" aria-label={hidden ? 'Show' : 'Hide'}>
                    {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {widgets.order.map((id) => (show(id) ? <React.Fragment key={id}>{widgets_[id]}</React.Fragment> : null))}
    </div>
  )
}
