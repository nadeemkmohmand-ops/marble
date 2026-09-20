import React, { useMemo, useState } from 'react'
import { Factory, Gauge, Percent, ScissorsSquare } from 'lucide-react'
import Toolbar from '../components/UI/Toolbar'
import Tabs from '../components/UI/Tabs'
import Card from '../components/UI/Card'
import Table from '../components/UI/Table'
import Badge from '../components/UI/Badge'
import StatCard from '../components/UI/StatCard'
import ExportMenu from '../components/UI/ExportMenu'
import EmptyState from '../components/States/EmptyState'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { recoveryPct, theoreticalSqft, costPerSqft, landedCost, cftFromInches } from '../utils/calculations'
import { fmtNumber, fmtCurrency } from '../utils/formatters'

/**
 * Production & Cutting:
 *  1. Cutting plans (block → planned slabs, blade, kerf, theoretical sq ft)
 *  2. Job cards (machine, operator, shift, output, wastage)
 *  3. Yield report (recovery % & cost per sq ft per block)
 */
export default function Production() {
  const { t, lang, fmtNum } = useLang()
  const [tab, setTab] = useState(0)
  const { items: plans } = useCollection('cuttingPlans')
  const { items: jobs } = useCollection('jobCards')
  const { items: blocks } = useCollection('blocks')

  const yieldRows = useMemo(() => {
    return blocks.map((b) => {
      const theo = theoreticalSqft(b.lengthIn, b.widthIn, b.heightIn, 2) // assume 2cm if unknown
      const saleable = Number(b.saleableSqft || 0) || plans.filter((p) => p.blockId === b.id).reduce((a, p) => a + (p.actualSqft || 0), 0)
      const rec = recoveryPct(saleable, theo)
      const cost = costPerSqft(landedCost(b), saleable)
      return { ...b, theo, saleable, rec, cost }
    })
  }, [blocks, plans])

  const planColumns = [
    { key: 'id', label: 'Plan #', render: (r) => <span className="num font-semibold">{r.id}</span> },
    { key: 'blockId', label: t('production.block'), render: (r) => <span className="num">{r.blockId || '—'}</span> },
    { key: 'plannedSlabs', label: t('fields.plannedSlabs'), exportFormat: (v) => String(v || '') },
    { key: 'bladeThickness', label: t('fields.bladeThickness'), render: (r) => <span className="num">{r.bladeThickness ?? '—'}</span>, format: (v) => fmtNumber(v) },
    { key: 'plannedSqft', label: t('production.plannedSqft'), render: (r) => <span className="num">{fmtNum(r.plannedSqft)}</span>, format: (v) => fmtNumber(v) },
    { key: 'actualSqft', label: t('production.actualSqft'), render: (r) => <span className="num font-semibold">{fmtNum(r.actualSqft)}</span>, format: (v) => fmtNumber(v) },
    { key: 'status', label: t('common.status'), render: (r) => <Badge status={r.status || 'cutting'} />, format: (v) => v },
  ]

  const jobColumns = [
    { key: 'id', label: 'Job #', render: (r) => <span className="num font-semibold">{r.id}</span> },
    { key: 'date', label: t('common.date'), render: (r) => <span className="num">{r.date || '—'}</span> },
    { key: 'machineName', label: t('fields.machine') },
    { key: 'operator', label: t('fields.operator') },
    { key: 'shift', label: t('fields.shift'), format: (v) => v },
    { key: 'outputSqft', label: t('production.output'), render: (r) => <span className="num font-semibold">{fmtNum(r.outputSqft)}</span>, format: (v) => fmtNumber(v) },
    { key: 'wastageSqft', label: t('fields.wastage'), render: (r) => <span className="num">{fmtNum(r.wastageSqft)}</span>, format: (v) => fmtNumber(v) },
  ]

  const yieldColumns = [
    { key: 'id', label: 'Block', render: (r) => <span className="num font-semibold">{r.id}</span> },
    { key: 'lotNo', label: t('fields.lotNo') },
    { key: 'cft', label: 'CFT', render: (r) => <span className="num">{fmtNum(r.cft || cftFromInches(r.lengthIn, r.widthIn, r.heightIn), 1)}</span>, format: (v) => fmtNumber(v) },
    { key: 'theo', label: t('production.theoretical'), render: (r) => <span className="num">{fmtNum(r.theo, 0)}</span>, format: (v) => fmtNumber(v, 0) },
    { key: 'saleable', label: t('production.saleable'), render: (r) => <span className="num">{fmtNum(r.saleable, 0)}</span>, format: (v) => fmtNumber(v, 0) },
    { key: 'rec', label: t('production.recovery'), render: (r) => <span className={`num font-bold ${(r.rec || 0) >= 70 ? 'text-emerald-500' : (r.rec || 0) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{fmtNum(r.rec, 1)}%</span>, exportFormat: (_v, r) => fmtNumber(r.rec, 1) },
    { key: 'cost', label: t('production.costPerSqft'), render: (r) => <span className="num">{fmtCurrency(r.cost)}</span>, format: (v) => fmtNumber(v) },
  ]

  const totalSaleable = yieldRows.reduce((a, r) => a + (r.saleable || 0), 0)
  const totalTheo = yieldRows.reduce((a, r) => a + (r.theo || 0), 0)

  return (
    <div className="fade-in">
      <Toolbar
        title={t('production.title')}
        description={t('production.subtitle')}
        actions={
          <ExportMenu
            title={t('production.yield')}
            columns={yieldColumns}
            rows={yieldRows}
          />
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label={t('production.plans')} value={plans.length} icon={ScissorsSquare} tone="info" />
        <StatCard label={t('production.jobs')} value={jobs.length} icon={Factory} tone="brand" />
        <StatCard label={t('production.recovery')} value={`${fmtNum(totalTheo ? (totalSaleable / totalTheo) * 100 : 0, 1)}%`} icon={Percent} tone="success" />
        <StatCard label={t('production.saleable')} value={fmtNum(totalSaleable, 0)} icon={Gauge} tone="warning" />
      </div>

      <Tabs
        className="mb-4"
        active={tab}
        onChange={setTab}
        tabs={[{ label: t('production.plans') }, { label: t('production.jobs') }, { label: t('production.yield') }]}
      />

      {tab === 0 && (
        <Card>
          <Table columns={planColumns} rows={plans} empty={<EmptyState title={t('common.noData')} />} />
        </Card>
      )}
      {tab === 1 && (
        <Card>
          <Table columns={jobColumns} rows={jobs} empty={<EmptyState title={t('common.noData')} />} />
        </Card>
      )}
      {tab === 2 && (
        <Card>
          <Table columns={yieldColumns} rows={yieldRows} empty={<EmptyState title={t('common.noData')} />} />
        </Card>
      )}
    </div>
  )
}
