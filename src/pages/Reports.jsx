import { useCallback, useEffect, useMemo, useState } from 'react'
import { Banknote, FileDown, FileSpreadsheet, Layers, Percent, Printer, TrendingUp } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import ChartPlaceholder from '../components/UI/ChartPlaceholder.jsx'
import ErrorState from '../components/States/ErrorState.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { Field, Input } from '../components/UI/Input.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { daysAgoISO, reportsApi, todayISO } from '../services/apiClient.js'
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters.js'

/** Bilingual colors + labels for the material donut chart. */
const MATERIAL_COLORS = {
  white: '#1E3A8A',
  grey: '#D97706',
  yellow: '#10B981',
  black: '#374151',
  other: '#6B7280',
}

/**
 * Reports (رپورٹس) — every chart and tile is computed from REAL Supabase data:
 *  - production chart = pieces per day aggregated from orders + order_items
 *  - donut = stock quantity grouped by material from inventory_items
 *  - tiles = payments revenue / order count / piece total / avg cutting waste
 */
export default function Reports() {
  const { t, lang } = useAppUI()
  const [reportType, setReportType] = useState('weekly')

  const [from, setFrom] = useState(daysAgoISO(6))
  const [to, setTo] = useState(todayISO())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({
    production: [],
    materials: [],
    summary: { revenue: 0, orderCount: 0, totalPieces: 0, avgWaste: 0 },
  })

  const range = useMemo(() => {
    if (reportType === 'weekly') return { from: daysAgoISO(6), to: todayISO() }
    if (reportType === 'monthly') return { from: daysAgoISO(29), to: todayISO() }
    return { from, to }
  }, [reportType, from, to])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [production, materials, summary] = await Promise.all([
        reportsApi.piecesPerDay(range.from, range.to),
        reportsApi.inventoryByMaterial(),
        reportsApi.summary(range.from, range.to),
      ])
      setData({ production, materials, summary })
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to])

  useEffect(() => {
    load()
  }, [load])

  const types = [
    { id: 'weekly', label: t('rep.weekly') },
    { id: 'monthly', label: t('rep.monthly') },
    { id: 'custom', label: t('rep.custom') },
  ]

  /** Fill missing days with 0 so the chart doesn't skip quiet days. */
  const productionChart = useMemo(() => {
    const byDay = new Map(data.production.map((entry) => [entry.date, entry.pieces]))
    const days = []
    const start = new Date(range.from)
    const end = new Date(range.to)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const pad = (n) => String(n).padStart(2, '0')
      const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      days.push({ label: iso.slice(5), value: byDay.get(iso) || 0 })
    }
    return days
  }, [data.production, range.from, range.to])

  const materialChart = data.materials.map((entry) => ({
    label: t(`inv.material_${entry.material}`),
    value: entry.quantity,
    color: MATERIAL_COLORS[entry.material] || '#6B7280',
  }))
  const totalSlabs = data.materials.reduce((sum, entry) => sum + entry.quantity, 0)

  const tiles = [
    {
      labelKey: 'rep.revenue',
      value: formatCurrency(data.summary.revenue, lang),
      icon: Banknote,
      cls: 'text-success',
    },
    {
      labelKey: 'rep.ordersCount',
      value: formatNumber(data.summary.orderCount, 'en'),
      icon: Layers,
      cls: 'text-accent dark:text-accent-light',
    },
    {
      labelKey: 'rep.piecesTile',
      value: formatNumber(data.summary.totalPieces, 'en'),
      icon: TrendingUp,
      cls: 'text-primary dark:text-primary-light',
    },
    {
      labelKey: 'rep.avgWaste',
      value: formatPercent(Math.round(data.summary.avgWaste * 10) / 10, 'en'),
      icon: Percent,
      cls: 'text-error',
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader title={t('nav.reports')} en="Reports" subtitle={t('rep.subtitle')} />

      {/* report type + date range */}
      <Card title={t('rep.reportType')}>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1 dark:bg-gray-700/50">
          {types.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setReportType(type.id)}
              className={`rounded-lg py-2.5 text-sm font-bold transition-colors ${
                reportType === type.id
                  ? 'bg-white text-primary shadow-sm dark:bg-gray-800 dark:text-white'
                  : 'text-text-light hover:text-text-dark dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              aria-pressed={reportType === type.id}
            >
              {type.label}
            </button>
          ))}
        </div>

        {reportType === 'custom' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={t('rep.from')}>
              <Input
                type="date"
                className="font-english"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.target.value)}
              />
            </Field>
            <Field label={t('rep.to')}>
              <Input
                type="date"
                className="font-english"
                value={to}
                min={from}
                onChange={(event) => setTo(event.target.value)}
              />
            </Field>
          </div>
        )}
      </Card>

      {error ? (
        <ErrorState title={t('db.error')} description={error.message} retryLabel={t('db.retry')} onRetry={load} />
      ) : (
        <>
          {/* charts */}
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <Card title={t('rep.productionByDay')}>
              {loading ? (
                <p className="py-16 text-center text-sm text-muted">{t('states.loading')}</p>
              ) : (
                <ChartPlaceholder data={productionChart} height="h-48" />
              )}
            </Card>

            <Card title={t('rep.inventoryByMaterial')}>
              {loading ? (
                <p className="py-16 text-center text-sm text-muted">{t('states.loading')}</p>
              ) : materialChart.length > 0 ? (
                <ChartPlaceholder
                  variant="donut"
                  data={materialChart}
                  centerValue={formatNumber(totalSlabs, 'en')}
                  centerLabel={t('common.slabs')}
                />
              ) : (
                <p className="py-16 text-center text-sm text-muted">{t('rep.noData')}</p>
              )}
            </Card>
          </div>

          {/* summary tiles — real numbers */}
          <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {tiles.map((tile) => {
              const Icon = tile.icon
              return (
                <div key={tile.labelKey} className="surface flex items-center gap-3 p-4">
                  <Icon size={24} className={`shrink-0 ${tile.cls}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-english truncate text-lg font-bold leading-tight text-main sm:text-xl" dir="ltr">
                      {tile.value}
                    </p>
                    <p className="text-[11px] text-muted">{t(tile.labelKey)}</p>
                  </div>
                </div>
              )
            })}
          </section>
        </>
      )}

      {/* export buttons */}
      <Card title={t('common.export')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button variant="outline" className="w-full" onClick={() => window.print()}>
            <FileDown size={18} className="text-error" />
            {t('rep.exportPdf')}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const header = `${['date', 'pieces'].join(',')}\n`
              const csv = productionChart.map((row) => `${row.label},${row.value}`).join('\n')
              const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `production-${range.from}_to_${range.to}.csv`
              link.click()
              URL.revokeObjectURL(url)
            }}
          >
            <FileSpreadsheet size={18} className="text-success" />
            {t('rep.exportExcel')}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.print()}>
            <Printer size={18} className="text-primary" />
            {t('common.print')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
