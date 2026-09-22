import React from 'react'
import { Link } from 'react-router-dom'
import { Package, Layers, Scissors, ArrowLeftRight, ArrowUpRight } from 'lucide-react'
import Toolbar from '../components/UI/Toolbar'
import StatCard from '../components/UI/StatCard'
import Card from '../components/UI/Card'
import Table from '../components/UI/Table'
import ExportMenu from '../components/UI/ExportMenu'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { fmtCurrency, fmtNumber } from '../utils/formatters'
import ROUTES from '../constants/routes'

/** Inventory hub — combined valuation + quick links to each register. */
export default function Inventory() {
  const { t, fmtNum, lang } = useLang()
  const { items: blocks } = useCollection('blocks')
  const { items: slabs } = useCollection('slabs')
  const { items: offcuts } = useCollection('offcuts')
  const { items: movements } = useCollection('movements')

  const blocksValue = blocks.filter((b) => b.status !== 'sold').reduce((a, b) => a + (b.landedTotal || 0), 0)
  const slabsValue = slabs.filter((s) => ['available', 'reserved'].includes(s.status)).reduce((a, s) => a + (s.price || 0), 0)
  const offcutArea = offcuts.filter((o) => o.status === 'available').reduce((a, o) => a + (o.areaSqft || 0), 0)

  const rows = [
    { id: 'blocks', label: t('nav.blocks'), count: blocks.length, value: blocksValue, area: '—', to: ROUTES.BLOCKS, icon: Package },
    { id: 'slabs', label: t('nav.slabs'), count: slabs.filter((s) => s.status !== 'sold').length, value: slabsValue, area: fmtNum(slabs.filter((s) => s.status !== 'sold').reduce((a, s) => a + (s.areaSqft || 0), 0), 0), to: ROUTES.SLABS, icon: Layers },
    { id: 'offcuts', label: t('nav.offcuts'), count: offcuts.filter((o) => o.status !== 'sold').length, value: offcuts.reduce((a, o) => a + (o.price || 0), 0), area: fmtNum(offcutArea, 0), to: ROUTES.OFFCUTS, icon: Scissors },
  ]

  const columns = [
    { key: 'label', label: lang === 'ur' ? 'ریجسٹر' : 'Register', render: (r) => (
      <Link to={r.to} className="flex items-center gap-2 font-semibold text-[var(--accent)]">
        <r.icon size={15} /> {r.label} <ArrowUpRight size={13} />
      </Link>
    ), exportFormat: (_v, r) => r.label },
    { key: 'count', label: lang === 'ur' ? 'تعداد' : 'Count', render: (r) => <span className="num">{r.count}</span> },
    { key: 'area', label: 'Sq ft', render: (r) => <span className="num">{r.area}</span> },
    { key: 'value', label: lang === 'ur' ? 'مالیت' : 'Value', render: (r) => <span className="num font-semibold">{fmtCurrency(r.value, { lang })}</span>, exportFormat: (_v, r) => fmtNumber(r.value) },
  ]

  return (
    <div className="fade-in">
      <Toolbar
        title={t('nav.inventory')}
        description={lang === 'ur' ? 'بلاکس، سلیبس، بچے ٹکڑے — ایک نظر میں' : 'Blocks, slabs and remnants at a glance'}
        actions={<ExportMenu title={t('reports.valuation')} columns={columns} rows={rows} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label={t('home.blocksAvailable')} value={blocks.filter((b) => b.status === 'available').length} icon={Package} tone="info" />
        <StatCard label={t('home.slabsAvailable')} value={slabs.filter((s) => s.status === 'available').length} icon={Layers} tone="success" />
        <StatCard label={t('home.offcutArea')} value={fmtNum(offcutArea, 0)} sub="sq ft" icon={Scissors} tone="warning" />
        <StatCard label={t('home.stockValue')} value={fmtCurrency(blocksValue + slabsValue, { lang })} icon={Package} tone="brand" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[ROUTES.BLOCKS, ROUTES.SLABS, ROUTES.OFFCUTS, ROUTES.MOVEMENTS].map((to) => (
          <Link key={to} to={to} className="card p-4 flex items-center gap-3 hover:brightness-105">
            {to === ROUTES.BLOCKS && <Package size={20} className="text-[var(--accent)]" />}
            {to === ROUTES.SLABS && <Layers size={20} className="text-emerald-500" />}
            {to === ROUTES.OFFCUTS && <Scissors size={20} className="text-amber-500" />}
            {to === ROUTES.MOVEMENTS && <ArrowLeftRight size={20} className="text-azure-500" />}
            <span className="font-medium text-sm leading-urdu no-clip">{t(`nav.${to.slice(1)}`)}</span>
          </Link>
        ))}
      </div>

      <Card>
        <h3 className="font-semibold text-sm mb-3 leading-urdu no-clip">{t('reports.valuation')}</h3>
        <Table columns={columns} rows={rows} keyOf={(r) => r.id} empty={null} />
        <div className="flex justify-between border-t-2 border-[var(--border)] mt-3 pt-3 px-3 font-bold num">
          <span>{t('common.total')}</span>
          <span>{fmtCurrency(blocksValue + slabsValue + offcuts.reduce((a, o) => a + (o.price || 0), 0), { lang })}</span>
        </div>
      </Card>
    </div>
  )
}
