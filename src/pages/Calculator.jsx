import React, { useMemo, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import Toolbar from '../components/UI/Toolbar'
import Tabs from '../components/UI/Tabs'
import Card from '../components/UI/Card'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Button from '../components/UI/Button' // (kept for parity; not all tabs need it)
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useCollection } from '../hooks/useCollection'
import {
  sqftFromInches, sqftToSqm, cftFromInches, weightKg, recoveryPct,
  kerfLossSqft, costPerSqft, sellingPrice, orderProfit, breakEven, whatIfBlockPricing,
} from '../utils/calculations'
import { fmtCurrency } from '../utils/formatters'

/**
 * Calculator — every formula from the factory playbook:
 * area · volume/weight · recovery · kerf · cost/sqft · selling price ·
 * order profit · break-even · what-if block pricing.
 */
export default function Calculator() {
  const { t, fmtNum, lang } = useLang()
  const toast = useToast()
  const [tab, setTab] = useState(0)
  const [copied, setCopied] = useState(false)
  const { items: blocks } = useCollection('blocks')

  const TABS = [
    t('calc.area'), t('calc.volume'), t('calc.recovery'), t('calc.kerf'),
    t('calc.cost'), t('calc.pricing'), t('calc.profit'), t('calc.breakEven'), t('calc.whatif'),
  ]

  const money = (v) => fmtCurrency(v, { lang })
  const copy = (text) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      toast.success(t('common.copying'))
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const Result = ({ label, value, hint }) => (
    <div className="mt-4 border border-dashed border-[var(--accent)]/60 bg-[var(--accent)]/5 rounded-xl p-4 flex items-center justify-between gap-3">
      <div>
        <div className="text-[11px] text-[var(--muted)] leading-urdu no-clip">{label}</div>
        <div className="text-xl font-bold num">{value}</div>
        {hint && <div className="text-[10px] text-[var(--muted)] num">{hint}</div>}
      </div>
      <button className="btn btn-ghost h-9 w-9 justify-center" onClick={() => copy(String(value))} aria-label="Copy">
        {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
      </button>
    </div>
  )

  return (
    <div className="fade-in">
      <Toolbar title={t('calc.title')} description={t('calc.subtitle')} />
      <Tabs className="mb-4" active={tab} onChange={setTab} tabs={TABS} />
      <Card className="max-w-2xl">{[
        <AreaTab key="0" t={t} fmtNum={fmtNum} Result={Result} />,
        <VolumeTab key="1" t={t} fmtNum={fmtNum} Result={Result} />,
        <RecoveryTab key="2" t={t} fmtNum={fmtNum} Result={Result} />,
        <KerfTab key="3" t={t} fmtNum={fmtNum} Result={Result} />,
        <CostTab key="4" t={t} fmtNum={fmtNum} money={money} Result={Result} />,
        <PriceTab key="5" t={t} fmtNum={fmtNum} money={money} Result={Result} />,
        <ProfitTab key="6" t={t} fmtNum={fmtNum} money={money} Result={Result} />,
        <BreakEvenTab key="7" t={t} fmtNum={fmtNum} money={money} Result={Result} />,
        <WhatIfTab key="8" t={t} fmtNum={fmtNum} money={money} blocks={blocks} Result={Result} />,
      ][tab]}
      </Card>
      <p className="text-[11px] text-[var(--muted)] mt-3 leading-urdu no-clip">{t('calc.calcHint')}</p>
    </div>
  )
}

/* ── Tabs ── */
function AreaTab({ t, fmtNum, Result }) {
  const [v, setV] = useState({ l: '', w: '' })
  const sqft = sqftFromInches(v.l, v.w)
  return (
    <Form t={t} onCalc={null}>
      <Grid2>
        <Input type="number" label={t('calc.lengthIn')} value={v.l} onChange={(e) => setV((s) => ({ ...s, l: e.target.value }))} />
        <Input type="number" label={t('calc.widthIn')} value={v.w} onChange={(e) => setV((s) => ({ ...s, w: e.target.value }))} />
      </Grid2>
      <Result label={t('calc.sqftResult')} value={fmtNum(sqft)} hint="L × W ÷ 144" />
      <Result label={t('calc.sqmResult')} value={fmtNum(sqftToSqm(sqft), 3)} hint="sq ft × 0.092903" />
    </Form>
  )
}

function VolumeTab({ t, fmtNum, Result }) {
  const [v, setV] = useState({ l: '', w: '', h: '', d: 76 })
  const cft = cftFromInches(v.l, v.w, v.h)
  return (
    <Form t={t}>
      <Grid2>
        <Input type="number" label={t('calc.lengthIn')} value={v.l} onChange={(e) => setV((s) => ({ ...s, l: e.target.value }))} />
        <Input type="number" label={t('calc.widthIn')} value={v.w} onChange={(e) => setV((s) => ({ ...s, w: e.target.value }))} />
        <Input type="number" label={t('calc.heightIn')} value={v.h} onChange={(e) => setV((s) => ({ ...s, h: e.target.value }))} />
        <Input type="number" label={t('calc.density')} value={v.d} onChange={(e) => setV((s) => ({ ...s, d: e.target.value }))} />
      </Grid2>
      <Result label={t('calc.cftResult')} value={fmtNum(cft, 3)} hint="L × W × H ÷ 1728" />
      <Result label={t('calc.weightResult')} value={`${fmtNum(weightKg(cft, v.d || 76), 1)} kg`} hint="cft × density" />
    </Form>
  )
}

function RecoveryTab({ t, fmtNum, Result }) {
  const [v, setV] = useState({ s: '', th: '' })
  return (
    <Form t={t}>
      <Grid2>
        <Input type="number" label={t('calc.saleable')} value={v.s} onChange={(e) => setV((s) => ({ ...s, s: e.target.value }))} />
        <Input type="number" label={t('calc.theoretical')} value={v.th} onChange={(e) => setV((s) => ({ ...s, th: e.target.value }))} />
      </Grid2>
      <Result label={t('calc.recoveryResult')} value={`${fmtNum(recoveryPct(v.s, v.th), 1)}%`} hint="saleable ÷ theoretical × 100" />
    </Form>
  )
}

function KerfTab({ t, fmtNum, Result }) {
  const [v, setV] = useState({ b: 6.5, c: '', l: '' })
  return (
    <Form t={t}>
      <Grid2>
        <Input type="number" label={t('calc.bladeThickness')} value={v.b} onChange={(e) => setV((s) => ({ ...s, b: e.target.value }))} />
        <Input type="number" label={t('calc.cuts')} value={v.c} onChange={(e) => setV((s) => ({ ...s, c: e.target.value }))} />
        <Input type="number" label={t('calc.cutLength')} value={v.l} onChange={(e) => setV((s) => ({ ...s, l: e.target.value }))} />
      </Grid2>
      <Result label={t('calc.kerfResult')} value={fmtNum(kerfLossSqft(v.b, v.c, v.l), 2)} hint="blade ft × cuts × length" />
    </Form>
  )
}

function CostTab({ t, fmtNum, money, Result }) {
  const [v, setV] = useState({ c: '', s: '' })
  return (
    <Form t={t}>
      <Grid2>
        <Input type="number" label={t('calc.totalCost')} value={v.c} onChange={(e) => setV((s) => ({ ...s, c: e.target.value }))} />
        <Input type="number" label={t('calc.saleable')} value={v.s} onChange={(e) => setV((s) => ({ ...s, s: e.target.value }))} />
      </Grid2>
      <Result label={t('calc.costResult')} value={money(costPerSqft(v.c, v.s))} hint="cost ÷ saleable sq ft" />
    </Form>
  )
}

function PriceTab({ t, fmtNum, money, Result }) {
  const [v, setV] = useState({ c: '', m: 20, tx: 0, tr: 0 })
  return (
    <Form t={t}>
      <Grid2>
        <Input type="number" label={t('calc.costResult')} value={v.c} onChange={(e) => setV((s) => ({ ...s, c: e.target.value }))} />
        <Input type="number" label={t('calc.margin')} value={v.m} onChange={(e) => setV((s) => ({ ...s, m: e.target.value }))} />
        <Input type="number" label={t('calc.tax')} value={v.tx} onChange={(e) => setV((s) => ({ ...s, tx: e.target.value }))} />
        <Input type="number" label={t('calc.transport')} value={v.tr} onChange={(e) => setV((s) => ({ ...s, tr: e.target.value }))} />
      </Grid2>
      <Result label={t('calc.priceResult')} value={money(sellingPrice({ cost: v.c, marginPct: v.m, taxPct: v.tx, transport: v.tr }))} hint="cost ÷ (1 − margin) + tax + transport" />
    </Form>
  )
}

function ProfitTab({ t, fmtNum, money, Result }) {
  const [v, setV] = useState({ r: '', m: '', l: '', mc: '', tr: '', ins: '', cm: '' })
  return (
    <Form t={t}>
      <Grid2>
        <Input type="number" label={t('calc.revenue')} value={v.r} onChange={(e) => setV((s) => ({ ...s, r: e.target.value }))} />
        <Input type="number" label={t('calc.material')} value={v.m} onChange={(e) => setV((s) => ({ ...s, m: e.target.value }))} />
        <Input type="number" label={t('calc.labour')} value={v.l} onChange={(e) => setV((s) => ({ ...s, l: e.target.value }))} />
        <Input type="number" label={t('calc.machine')} value={v.mc} onChange={(e) => setV((s) => ({ ...s, mc: e.target.value }))} />
        <Input type="number" label={t('calc.transport')} value={v.tr} onChange={(e) => setV((s) => ({ ...s, tr: e.target.value }))} />
        <Input type="number" label={t('calc.installation')} value={v.ins} onChange={(e) => setV((s) => ({ ...s, ins: e.target.value }))} />
        <Input type="number" label={t('calc.commission')} value={v.cm} onChange={(e) => setV((s) => ({ ...s, cm: e.target.value }))} />
      </Grid2>
      <Result
        label={t('calc.profitResult')}
        value={money(orderProfit({ revenue: v.r, material: v.m, labour: v.l, machine: v.mc, transport: v.tr, installation: v.ins, commission: v.cm }))}
        hint="revenue − all costs"
      />
    </Form>
  )
}

function BreakEvenTab({ t, fmtNum, money, Result }) {
  const [v, setV] = useState({ f: '', p: '', q: '' })
  return (
    <Form t={t}>
      <Grid2>
        <Input type="number" label={t('calc.fixedCost')} value={v.f} onChange={(e) => setV((s) => ({ ...s, f: e.target.value }))} />
        <Input type="number" label={t('calc.variable')} value={v.p} onChange={(e) => setV((s) => ({ ...s, p: e.target.value }))} />
        <Input type="number" label={t('calc.qtySqft')} value={v.q} onChange={(e) => setV((s) => ({ ...s, q: e.target.value }))} />
      </Grid2>
      <Result label={t('calc.breakEvenResult')} value={money(breakEven({ fixedCost: v.f, qtySqft: v.q, variablePerSqft: v.p }))} hint="fixed ÷ qty + variable" />
    </Form>
  )
}

function WhatIfTab({ t, fmtNum, money, blocks, Result }) {
  const [v, setV] = useState({ blockId: '', cost: '', th: '', rec: 70, m: 20, o: 0 })
  const result = useMemo(() => whatIfBlockPricing({ blockCost: v.cost || 0, blockSqftTheoretical: v.th || 0, recoveryPct: v.rec, marginPct: v.m, otherCosts: v.o || 0 }), [v])
  return (
    <Form t={t}>
      <Grid2>
        <Select
          label={t('production.block')}
          value={v.blockId}
          onChange={(e) => {
            const b = blocks.find((x) => x.id === e.target.value)
            setV((s) => ({ ...s, blockId: e.target.value, cost: b ? b.landedTotal || b.purchaseCost || '' : s.cost, th: b ? theoreticalSqft(b.lengthIn, b.widthIn, b.heightIn, 2) : s.th }))
          }}
          options={blocks.map((b) => ({ value: b.id, label: `${b.id} (${b.lotNo || b.blockNo || ''})` }))}
          placeholder="—"
        />
        <Input type="number" label={t('calc.blockCost')} value={v.cost} onChange={(e) => setV((s) => ({ ...s, cost: e.target.value }))} />
        <Input type="number" label={t('calc.theoretical')} value={v.th} onChange={(e) => setV((s) => ({ ...s, th: e.target.value }))} />
        <Input type="number" label={t('calc.expectedRecovery')} value={v.rec} onChange={(e) => setV((s) => ({ ...s, rec: e.target.value }))} />
        <Input type="number" label={t('calc.margin')} value={v.m} onChange={(e) => setV((s) => ({ ...s, m: e.target.value }))} />
        <Input type="number" label={t('calc.otherCosts')} value={v.o} onChange={(e) => setV((s) => ({ ...s, o: e.target.value }))} />
      </Grid2>
      <Result label={t('calc.saleable')} value={`${fmtNum(result.saleableSqft, 0)} sq ft`} />
      <Result label={t('calc.costResult')} value={money(result.costPerSqft)} />
      <Result label={t('calc.priceResult')} value={money(result.pricePerSqft)} />
      <Result label={t('calc.profitPerSqft')} value={money(result.profitPerSqft)} />
    </Form>
  )
}

/* ── small helpers ── */
function Form({ t, children }) {
  return <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>{children}</form>
}

function Grid2({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}
