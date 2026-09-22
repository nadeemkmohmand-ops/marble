import React, { useMemo, useState } from 'react'
import {
  Factory, Gauge, Percent, ScissorsSquare, Wand2, Play, Square,
  TimerReset, Layers3, Trophy,
} from 'lucide-react'
import CrudPage from '../components/CrudPage'
import Toolbar from '../components/UI/Toolbar'
import Tabs from '../components/UI/Tabs'
import Card from '../components/UI/Card'
import Table from '../components/UI/Table'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import StatCard from '../components/UI/StatCard'
import ExportMenu from '../components/UI/ExportMenu'
import EmptyState from '../components/States/EmptyState'
import Modal from '../components/UI/Modal'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { recoveryPct, theoreticalSqft, costPerSqft, landedCost, cftFromInches } from '../utils/calculations'
import { fmtNumber, fmtCurrency, todayISO } from '../utils/formatters'
import { JOB_TYPES, JOB_STATUS, BLOCK_STATUS, FINISHES } from '../constants/enums'
import { slabPlan, optimizeFace, bladeScoreboard } from '../utils/optimizer'

const opts = (list) => list.map((v) => ({ value: v }))

/**
 * Production & Cutting v2:
 *  1. Cutting Optimizer — kerf-aware slab yield + face packing with a
 *     printable cut sequence (one click → cutting plan).
 *  2. Cutting plans — now fully editable (was read-only).
 *  3. Job cards — cutting / polishing / edge / chamfer with machine,
 *     operator, blade, start/end, downtime (full CRUD, feeds yield).
 *  4. Yield + blade scoreboard — recovery %, cost/sq ft, best blade.
 */
export default function Production() {
  const { t, lang, fmtNum } = useLang()
  const [tab, setTab] = useState(0)
  const { items: plans } = useCollection('cuttingPlans')
  const { items: jobs } = useCollection('jobCards')
  const { items: blocks } = useCollection('blocks')

  const yieldRows = useMemo(() => {
    return blocks.map((b) => {
      const theo = theoreticalSqft(b.lengthIn, b.widthIn, b.heightIn, 2)
      const saleable = Number(b.saleableSqft || 0) || plans.filter((p) => p.blockId === b.id).reduce((a, p) => a + (p.actualSqft || 0), 0)
      const rec = recoveryPct(saleable, theo)
      const cost = costPerSqft(landedCost(b), saleable)
      return { ...b, theo, saleable, rec, cost }
    })
  }, [blocks, plans])

  const blades = useMemo(() => bladeScoreboard(jobs.filter((j) => j.jobType === 'cutting' || !j.jobType)), [jobs])

  const planColumns = [
    { key: 'id', label: 'Plan #', render: (r) => <span className="num font-semibold">{r.id}</span> },
    { key: 'blockId', label: t('production.block'), render: (r) => <span className="num">{r.blockId || '—'}</span> },
    { key: 'plannedSlabs', label: t('fields.plannedSlabs'), exportFormat: (v) => String(v || '') },
    { key: 'bladeThickness', label: t('fields.bladeThickness'), render: (r) => <span className="num">{r.bladeThickness ?? '—'}</span>, format: (v) => fmtNumber(v) },
    { key: 'plannedSqft', label: t('production.plannedSqft'), render: (r) => <span className="num">{fmtNum(r.plannedSqft)}</span>, format: (v) => fmtNumber(v) },
    { key: 'actualSqft', label: t('production.actualSqft'), render: (r) => <span className="num font-semibold">{fmtNum(r.actualSqft)}</span>, format: (v) => fmtNumber(v) },
    { key: 'status', label: t('common.status'), render: (r) => <Badge status={r.status || 'cutting'} />, format: (v) => v },
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
        tabs={[
          { label: lang === 'ur' ? 'آپٹیمائزر' : 'Optimizer' },
          { label: t('production.plans') },
          { label: t('production.jobs') },
          { label: t('production.yield') },
        ]}
      />

      {tab === 0 && <OptimizerTab blocks={blocks} />}
      {tab === 1 && <CrudPage config={plansConfig(t, lang)} />}
      {tab === 2 && <JobCardsTab t={t} lang={lang} />}
      {tab === 3 && (
        <div className="space-y-4">
          <Card>
            <Table columns={yieldColumns} rows={yieldRows} empty={<EmptyState title={t('common.noData')} />} />
          </Card>
          {blades.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-amber-500" />
                <h3 className="font-semibold text-sm">{lang === 'ur' ? 'بہترین بلیڈ پرفارمنس' : 'Blade performance (least kerf loss wins)'}</h3>
              </div>
              <Table
                columns={[
                  { key: 'bladeType', label: 'Blade', render: (r) => <span className="font-semibold">{r.bladeType}</span> },
                  { key: 'jobs', label: 'Jobs', render: (r) => <span className="num">{r.jobs}</span> },
                  { key: 'outputSqft', label: 'Output sq ft', render: (r) => <span className="num">{fmtNumber(r.outputSqft, 0)}</span> },
                  { key: 'wastePct', label: 'Waste %', render: (r) => <span className={`num font-bold ${r.wastePct <= 8 ? 'text-emerald-500' : r.wastePct <= 15 ? 'text-amber-500' : 'text-red-500'}`}>{fmtNumber(r.wastePct, 1)}%</span> },
                ]}
                rows={blades}
              />
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── Tab 1: Optimizer ───────────────────────── */

function OptimizerTab({ blocks }) {
  const { t, lang, fmtNum } = useLang()
  const toast = useToast()
  const [blockId, setBlockId] = useState('')
  const [thicknessMm, setThicknessMm] = useState(20)
  const [kerfMm, setKerfMm] = useState(6.5)
  const [sizesText, setSizesText] = useState('8×4, 7×4, 6×4, 8×3.5, 6×3.5')
  const block = blocks.find((b) => b.id === blockId)

  const plan = useMemo(() => (block ? slabPlan(block, { thicknessMm, kerfMm }) : null), [block, thicknessMm, kerfMm])

  const facePack = useMemo(() => {
    if (!block) return null
    const sizes = sizesText
      .split(',')
      .map((s) => {
        const m = s.trim().match(/(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)/)
        return m ? { lengthFt: parseFloat(m[1]), widthFt: parseFloat(m[2]) } : null
      })
      .filter(Boolean)
    if (!sizes.length) return null
    return optimizeFace({ lengthIn: block.lengthIn, heightIn: block.heightIn }, sizes)
  }, [block, sizesText])

  const savePlan = () => {
    if (!block) return
    const planned = plan?.slabCount ? `${plan.slabCount}× ${thicknessMm}mm slabs` : ''
    import('../services/db').then(({ db }) => {
      db.save('cuttingPlans', {
        blockId: block.id,
        plannedSlabs: planned,
        bladeThickness: kerfMm,
        plannedSqft: plan?.totalSqft || 0,
        actualSqft: 0,
        status: 'cutting',
        optimizerSizes: sizesText,
        optimizerUsedPct: facePack?.usedPct ?? null,
        notes: facePack?.sequence?.map((s) => s.text).join(' | ') || '',
      })
      toast.success(lang === 'ur' ? 'کٹنگ پلان محفوظ ہو گیا' : 'Cutting plan created from optimizer')
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Wand2 size={16} className="text-[var(--accent)]" />
          <h3 className="font-semibold text-sm">{lang === 'ur' ? 'کٹنگ آپٹیمائزر — بلاک سے زیادہ سے زیادہ نکالیں' : 'Cutting optimizer — squeeze the most out of every block'}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Select
            className="col-span-2 sm:col-span-1"
            label={lang === 'ur' ? 'بلاک' : 'Block'}
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
            placeholder={lang === 'ur' ? 'بلاک چنیں…' : 'Pick a block…'}
            options={blocks.map((b) => ({ value: b.id, label: `${b.id} (${b.grade || '—'})` }))}
          />
          <Input type="number" label={lang === 'ur' ? 'سلاب موٹائی (mm)' : 'Slab thickness (mm)'} value={thicknessMm} min={5} step={1} onChange={(e) => setThicknessMm(parseFloat(e.target.value) || 0)} />
          <Input type="number" label={lang === 'ur' ? 'بلیڈ موٹائی (mm)' : 'Blade kerf (mm)'} value={kerfMm} min={0} step={0.5} onChange={(e) => setKerfMm(parseFloat(e.target.value) || 0)} />
          <Input className="col-span-2 sm:col-span-1" label={lang === 'ur' ? 'مطلوبہ سائز (فٹ)' : 'Target sizes (ft)'} value={sizesText} onChange={(e) => setSizesText(e.target.value)} hint="8×4, 7×4, 6×4…" />
        </div>

        {!block && (
          <div className="mt-4">
            <EmptyState
              icon={Layers3}
              title={lang === 'ur' ? 'بلاک چنیں' : 'Pick a block'}
              hint={lang === 'ur' ? 'بلاک کے ابعاد سے سلاب گنتی اور کٹ سیکوئنس بنے گی' : 'Slab count & cut sequence are generated from the block dimensions'}
            />
          </div>
        )}

        {block && plan && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label={lang === 'ur' ? 'سلابز بنیں گے' : 'Slabs produced'} value={plan.slabCount} icon={ScissorsSquare} tone="info" />
              <StatCard label={lang === 'ur' ? 'کل سکوئر فٹ' : 'Total sq ft'} value={fmtNum(plan.totalSqft, 0)} icon={Gauge} tone="success" />
              <StatCard label={lang === 'ur' ? 'کرف نقصان' : 'Kerf loss sq ft'} value={fmtNum(plan.kerfLossSqft, 0)} icon={Percent} tone="warning" />
              <StatCard label={lang === 'ur' ? 'چہرہ استعمال' : 'Face utilization'} value={facePack ? `${fmtNum(facePack.usedPct, 1)}%` : '—'} icon={Wand2} tone={facePack && facePack.usedPct >= 85 ? 'success' : 'brand'} />
            </div>

            {facePack && facePack.placements.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">{lang === 'ur' ? 'سائز کمبینیشن' : 'Size combination'}</h4>
                  <Table
                    columns={[
                      { key: 'sizeFt', label: 'Size (ft)', render: (r) => <span className="num font-semibold">{r.sizeFt}</span> },
                      { key: 'total', label: 'Pieces', render: (r) => <span className="num">{r.total}</span> },
                    ]}
                    rows={facePack.placements}
                  />
                  <p className="text-[11px] text-[var(--muted)] mt-2">
                    {lang === 'ur' ? 'گنجائش' : 'Utilization'}: {fmtNum(facePack.usedSqft, 0)} / {fmtNum(facePack.faceSqft, 0)} sq ft — {lang === 'ur' ? 'ضیاع' : 'waste'} {fmtNum(facePack.wastePct, 1)}%
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">{lang === 'ur' ? 'مجوزہ کٹ سیکوئنس' : 'Suggested cut sequence'}</h4>
                  <ol className="space-y-2">
                    {facePack.sequence.map((s) => (
                      <li key={s.step} className="flex gap-2 text-xs leading-urdu no-clip">
                        <span className="grid place-items-center h-5 w-5 shrink-0 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-bold num">{s.step}</span>
                        <span>{s.text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button icon={ScissorsSquare} onClick={savePlan}>{lang === 'ur' ? 'کٹنگ پلان بنائیں' : 'Create cutting plan'}</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ───────────────────────── Tab 2: Plans config ───────────────────────── */

function plansConfig(t, lang) {
  return {
    collection: 'cuttingPlans',
    i18nPrefix: 'cuttingPlans',
    searchKeys: ['id', 'blockId', 'plannedSlabs', 'status'],
    defaults: () => ({ date: todayISO(), status: 'cutting', plannedSqft: 0, actualSqft: 0, bladeThickness: 6.5 }),
    columns: [
      { key: 'id', label: 'Plan #', render: (r) => <span className="num font-semibold">{r.id}</span> },
      { key: 'blockId', label: t('production.block'), render: (r) => <span className="num">{r.blockId || '—'}</span> },
      { key: 'plannedSlabs', label: t('fields.plannedSlabs'), exportFormat: (v) => String(v || '') },
      { key: 'bladeThickness', label: t('fields.bladeThickness'), render: (r) => <span className="num">{r.bladeThickness ?? '—'}</span>, format: (v) => fmtNumber(v) },
      { key: 'plannedSqft', label: t('production.plannedSqft'), render: (r) => <span className="num">{fmtNumber(r.plannedSqft)}</span>, format: (v) => fmtNumber(v) },
      { key: 'actualSqft', label: t('production.actualSqft'), render: (r) => <span className="num font-semibold">{fmtNumber(r.actualSqft)}</span>, format: (v) => fmtNumber(v) },
      { key: 'status', label: t('common.status'), render: (r) => <Badge status={r.status || 'cutting'} />, format: (v) => v },
    ],
    fields: [
      { key: 'date', type: 'date' },
      { key: 'blockId', type: 'ref', refCollection: 'blocks', refLabel: 'id', required: true, placeholder: '—' },
      { key: 'plannedSlabs', placeholder: '18× 20mm slabs', required: true },
      { key: 'bladeThickness', label: 'Blade thickness (mm)', type: 'number', min: 0, step: 0.5 },
      { key: 'plannedSqft', type: 'number', min: 0 },
      { key: 'actualSqft', type: 'number', min: 0 },
      { key: 'status', type: 'select', options: opts(BLOCK_STATUS.filter((s) => s !== 'sold')) },
      { key: 'optimizerSizes', label: lang === 'ur' ? 'آپٹیمائزر سائزز' : 'Optimizer sizes', hint: '8×4, 7×4…' },
      { key: 'optimizerUsedPct', label: lang === 'ur' ? 'چہرہ استعمال %' : 'Face utilization %', type: 'number', min: 0 },
      { key: 'notes', type: 'textarea', span: 'full' },
    ],
    filters: [{ key: 'status', options: opts(['available', 'cutting', 'reserved', 'rejected']) }],
  }
}

/* ───────────────────────── Tab 3: Job cards ───────────────────────── */

function JobCardsTab({ t, lang }) {
  const { items: jobs } = useCollection('jobCards')
  const [quick, setQuick] = useState(null) // running job being clocked out
  const active = jobs.filter((j) => j.status === 'running')
  const today = jobs.filter((j) => (j.date || '').slice(0, 10) === todayISO())

  const config = {
    collection: 'jobCards',
    i18nPrefix: 'jobCards',
    searchKeys: ['id', 'machineName', 'operator', 'bladeType', 'blockId', 'slabId'],
    defaults: () => ({
      date: todayISO(),
      jobType: 'cutting',
      status: 'pending',
      shift: 'day',
      outputSqft: 0,
      outputSlabs: 0,
      wastageSqft: 0,
      downtimeHrs: 0,
    }),
    compute: (v) => {
      let hours = 0
      if (v.startTime && v.endTime) {
        const [sh, sm] = String(v.startTime).split(':').map(Number)
        const [eh, em] = String(v.endTime).split(':').map(Number)
        if ([sh, sm, eh, em].every(Number.isFinite)) {
          hours = (eh * 60 + em - (sh * 60 + sm)) / 60
          if (hours < 0) hours += 24
          hours = Math.round(hours * 100) / 100
        }
      }
      return { hours }
    },
    columns: [
      { key: 'id', label: 'Job #', render: (r) => <span className="num font-semibold">{r.id}</span> },
      { key: 'date', label: t('common.date'), render: (r) => <span className="num">{r.date || '—'}</span> },
      { key: 'jobType', label: lang === 'ur' ? 'کام' : 'Type', render: (r) => <Badge status={r.jobType === 'cutting' ? 'cutting' : r.jobType} /> },
      { key: 'machineName', label: t('fields.machine') },
      { key: 'operator', label: t('fields.operator') },
      { key: 'bladeType', label: 'Blade', render: (r) => r.bladeType || '—' },
      { key: 'hours', label: 'Hrs', render: (r) => <span className="num">{fmtNumber(r.hours || 0, 1)}</span>, format: (v) => fmtNumber(v) },
      { key: 'downtimeHrs', label: 'Downtime', render: (r) => <span className="num text-amber-500">{fmtNumber(r.downtimeHrs || 0, 1)}</span>, format: (v) => fmtNumber(v) },
      { key: 'outputSqft', label: t('production.output'), render: (r) => <span className="num font-semibold">{fmtNumber(r.outputSqft)}</span>, format: (v) => fmtNumber(v) },
      { key: 'status', label: t('common.status'), render: (r) => <Badge status={r.status} />, format: (v) => v },
    ],
    fields: [
      { key: 'date', type: 'date', required: true },
      { key: 'jobType', type: 'select', options: opts(JOB_TYPES), required: true },
      { key: 'status', type: 'select', options: opts(JOB_STATUS) },
      { key: 'shift', type: 'select', options: opts(['day', 'night']) },
      { key: 'machineName', type: 'ref', refCollection: 'machines', refLabel: 'name' },
      { key: 'operator', type: 'ref', refCollection: 'workers', refLabel: 'name' },
      { key: 'bladeType', label: 'Blade type', placeholder: 'e.g. 6.5mm gang, multi-wire 8mm' },
      { key: 'blockId', type: 'ref', refCollection: 'blocks', refLabel: 'id', placeholder: '—' },
      { key: 'slabId', type: 'ref', refCollection: 'slabs', refLabel: 'id', placeholder: '—', hint: 'for polishing / edge jobs' },
      { key: 'startTime', label: 'Start time', type: 'time' },
      { key: 'endTime', label: 'End time', type: 'time' },
      { key: 'hours', label: 'Hours (auto)', type: 'readonly', format: (v) => fmtNumber(v, 1) },
      { key: 'downtimeHrs', label: 'Downtime (hrs)', type: 'number', min: 0, step: 0.5 },
      { key: 'outputSlabs', label: 'Output slabs', type: 'number', min: 0 },
      { key: 'outputSqft', label: 'Output sq ft', type: 'number', min: 0 },
      { key: 'wastageSqft', label: 'Wastage sq ft', type: 'number', min: 0 },
      { key: 'notes', type: 'textarea', span: 'full' },
    ],
    filters: [
      { key: 'jobType', options: opts(JOB_TYPES) },
      { key: 'status', options: opts(JOB_STATUS) },
    ],
    rowActions: (record, { setDetail }) => [
      record.status !== 'done' && (
        <Button
          key="clock"
          size="sm"
          variant="secondary"
          icon={record.status === 'running' ? Square : Play}
          onClick={() => {
            const now = new Date()
            const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
            if (record.status === 'running') {
              setQuick({ ...record, endTime: hm })
              setDetail(null)
            } else {
              import('../services/db').then(({ db }) => {
                db.save('jobCards', { id: record.id, status: 'running', startTime: hm })
              })
            }
          }}
        >
          {record.status === 'running' ? (lang === 'ur' ? 'ختم کریں' : 'Clock out') : (lang === 'ur' ? 'شروع کریں' : 'Start job')}
        </Button>
      ),
    ],
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={lang === 'ur' ? 'آج کے جاب کارڈز' : 'Jobs today'} value={today.length} icon={Factory} tone="info" />
        <StatCard label={lang === 'ur' ? 'چل رہے ہیں' : 'Running now'} value={active.length} icon={Play} tone="warning" />
        <StatCard
          label={lang === 'ur' ? 'آج کا آؤٹ پٹ' : "Today's output"}
          value={`${fmtNumber(today.reduce((a, j) => a + (j.outputSqft || 0), 0), 0)} sq ft`}
          icon={Gauge}
          tone="success"
        />
      </div>
      <CrudPage config={config} />

      {/* Clock-out sheet: fill output numbers when ending a running job */}
      <Modal
        open={Boolean(quick)}
        onClose={() => setQuick(null)}
        title={lang === 'ur' ? 'جاب مکمل کریں' : 'Complete job'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setQuick(null)} className="w-full sm:w-auto">{t('common.cancel')}</Button>
            <Button
              className="w-full sm:w-auto"
              icon={TimerReset}
              onClick={() => {
                import('../services/db').then(({ db }) => {
                  db.save('jobCards', { id: quick.id, endTime: quick.endTime, outputSqft: Number(quick.outputSqft) || 0, outputSlabs: Number(quick.outputSlabs) || 0, wastageSqft: Number(quick.wastageSqft) || 0, status: 'done' })
                })
                setQuick(null)
              }}
            >
              {lang === 'ur' ? 'محفوظ کریں' : 'Save'}
            </Button>
          </div>
        }
      >
        {quick && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input type="time" label={lang === 'ur' ? 'اختتام' : 'End time'} value={quick.endTime || ''} onChange={(e) => setQuick((q) => ({ ...q, endTime: e.target.value }))} />
            <Input type="number" label={lang === 'ur' ? 'ڈاؤن ٹائم (گھنٹے)' : 'Downtime (hrs)'} value={quick.downtimeHrs ?? 0} onChange={(e) => setQuick((q) => ({ ...q, downtimeHrs: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={lang === 'ur' ? 'آؤٹ پٹ سلابز' : 'Output slabs'} value={quick.outputSlabs ?? 0} onChange={(e) => setQuick((q) => ({ ...q, outputSlabs: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={lang === 'ur' ? 'آؤٹ پٹ سکوئر فٹ' : 'Output sq ft'} value={quick.outputSqft ?? 0} onChange={(e) => setQuick((q) => ({ ...q, outputSqft: parseFloat(e.target.value) || 0 }))} />
            <Input type="number" label={lang === 'ur' ? 'ضیاع سکوئر فٹ' : 'Wastage sq ft'} value={quick.wastageSqft ?? 0} onChange={(e) => setQuick((q) => ({ ...q, wastageSqft: parseFloat(e.target.value) || 0 }))} />
          </div>
        )}
      </Modal>
    </div>
  )
}
