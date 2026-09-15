import { useState } from 'react'
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import ChartPlaceholder from '../components/UI/ChartPlaceholder.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { Field, Input } from '../components/UI/Input.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { monthlyProduction, reportSummary, slabTypes, weeklyProduction } from '../data/placeholderData.js'

/**
 * Reports (رپورٹس) — weekly / monthly / custom report UI with static
 * CSS charts and export buttons. No real export or data.
 */
export default function Reports() {
  const { t, pick } = useAppUI()
  const [reportType, setReportType] = useState('weekly')

  const types = [
    { id: 'weekly', label: t('rep.weekly') },
    { id: 'monthly', label: t('rep.monthly') },
    { id: 'custom', label: t('rep.custom') },
  ]

  const chartData = (reportType === 'weekly' ? weeklyProduction : monthlyProduction).map((d) => ({
    label: pick(d.label),
    value: d.value,
  }))

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

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t('rep.from')}>
            <Input type="date" defaultValue="2026-09-08" className="font-english" />
          </Field>
          <Field label={t('rep.to')}>
            <Input type="date" defaultValue="2026-09-14" className="font-english" />
          </Field>
        </div>
      </Card>

      {/* charts */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card title={reportType === 'weekly' ? t('rep.productionChart') : t('rep.productionChartMonthly')}>
          <ChartPlaceholder data={chartData} height="h-48" />
        </Card>

        <Card title={t('rep.slabTypes')}>
          <ChartPlaceholder
            variant="donut"
            data={slabTypes.map((d) => ({ label: pick(d.label), value: d.value, color: d.color }))}
            centerValue="248"
            centerLabel={t('common.slabs')}
          />
        </Card>
      </div>

      {/* summary tiles */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {reportSummary.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.labelKey} className="surface flex items-center gap-3 p-4">
              <Icon size={24} className={`shrink-0 ${item.cls}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-english text-lg font-bold leading-tight text-main sm:text-xl">{item.value}</p>
                <p className="text-[11px] text-muted">
                  {t(item.labelKey)} {pick(item.unit) ? `(${pick(item.unit)})` : ''}
                </p>
              </div>
            </div>
          )
        })}
      </section>

      {/* export buttons (UI only) */}
      <Card title={t('common.export')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button variant="outline" className="w-full">
            <FileDown size={18} className="text-error" />
            {t('rep.exportPdf')}
          </Button>
          <Button variant="outline" className="w-full">
            <FileSpreadsheet size={18} className="text-success" />
            {t('rep.exportExcel')}
          </Button>
          <Button variant="outline" className="w-full">
            <Printer size={18} className="text-primary" />
            {t('common.print')}
          </Button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">{t('demoNote')}</p>
      </Card>
    </div>
  )
}
