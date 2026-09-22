import React from 'react'
import CrudPage from '../components/CrudPage'
import { MACHINE_TYPES, MACHINE_STATUS } from '../constants/enums'
import { fmtCurrency, fmtNumber } from '../utils/formatters'
import { Cog, Zap } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import Badge from '../components/UI/Badge'
import { storage } from '../utils/storage'
import { STORAGE_KEYS } from '../constants/storageKeys'

const opts = (list) => list.map((v) => ({ value: v }))

/**
 * Machine-hour rate = electricity (kW × PKR/unit) + depreciation
 * ((cost − salvage) ÷ years ÷ annual hours). Shows the real cost of
 * one machine hour so quoting and job costing stop guessing.
 */
export function machineHourRate(machine, { unitRate = 35 } = {}) {
  const kw = Number(machine?.powerKw) || 0
  const cost = Number(machine?.cost) || 0
  const salvage = Number(machine?.salvageValue) || 0
  const years = Number(machine?.depreciationYears) || 10
  const hours = Number(machine?.annualHours) || 3000
  const electricity = kw * unitRate
  const depreciation = hours > 0 ? (cost - salvage) / years / hours : 0
  const maintenance = hours > 0 ? (Number(machine?.annualMaintenanceCost) || 0) / hours : 0
  return {
    electricity: Math.round(electricity * 100) / 100,
    depreciation: Math.round(depreciation * 100) / 100,
    maintenance: Math.round(maintenance * 100) / 100,
    total: Math.round((electricity + depreciation + maintenance) * 100) / 100,
    perSqft: machine?.avgOutputSqftHr ? Math.round(((electricity + depreciation + maintenance) / machine.avgOutputSqftHr) * 100) / 100 : null,
  }
}

export default function Machines() {
  const { t, lang } = useLang()
  const unitRate = Number((storage.get(STORAGE_KEYS.SETTINGS, {}) || {}).electricityRatePerUnit) || 35
  const ur = lang === 'ur'

  const rateCell = (r) => {
    const rate = machineHourRate(r, { unitRate })
    return (
      <span className="num" title={`elec ${rate.electricity} + dep ${rate.depreciation} + maint ${rate.maintenance}`}>
        {fmtCurrency(rate.total)}
        {rate.perSqft ? <span className="text-[10px] text-[var(--muted)] block">{fmtCurrency(rate.perSqft)}/sq ft</span> : null}
      </span>
    )
  }

  return (
    <CrudPage
      config={{
        collection: 'machines',
        i18nPrefix: 'machines',
        searchKeys: ['id', 'name', 'type', 'work', 'location', 'notes'],
        defaults: () => ({ status: 'running', annualHours: 3000, depreciationYears: 10 }),
        columns: [
          { key: 'id', label: 'ID', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'name', label: 'Name' },
          { key: 'work', render: (r) => <span className="leading-urdu no-clip">{r.work || '—'}</span>, exportFormat: (v) => String(v || '') },
          { key: 'type', enumKey: 'enums.machineType' },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
          { key: 'location', label: 'Location' },
          { key: 'powerKw', label: 'kW', render: (r) => <span className="num">{r.powerKw ?? '—'}</span> },
          { key: 'cost', label: 'Cost', render: (r) => <span className="num">{fmtCurrency(r.cost)}</span>, format: (v) => fmtNumber(v) },
          { key: '_hourRate', label: ur ? 'گھنٹہ ریٹ' : 'Hour rate', render: rateCell, exportFormat: (_v, r) => fmtNumber(machineHourRate(r, { unitRate }).total) },
        ],
        fields: [
          { key: 'name', required: true },
          { key: 'work', hint: t('fields.work') },
          { key: 'type', type: 'select', options: opts(MACHINE_TYPES), enumPrefix: 'machineType' },
          { key: 'status', type: 'select', options: opts(MACHINE_STATUS) },
          { key: 'location' },
          { key: 'powerKw', type: 'number', min: 0 },
          { key: 'cost', type: 'number', min: 0 },
          { key: 'salvageValue', label: ur ? 'ریزیڈوئل ویلیو' : 'Salvage value', type: 'number', min: 0 },
          { key: 'depreciationYears', label: ur ? 'ڈیپریشن سال' : 'Depreciation years', type: 'number', min: 1 },
          { key: 'annualHours', label: ur ? 'سالانہ اوقات کار' : 'Annual running hours', type: 'number', min: 1 },
          { key: 'annualMaintenanceCost', label: ur ? 'سالانہ مینٹیننس' : 'Annual maintenance cost', type: 'number', min: 0 },
          { key: 'avgOutputSqftHr', label: ur ? 'اوسط آؤٹ پٹ (sq ft/گھنٹہ)' : 'Avg output (sq ft/hr)', type: 'number', min: 0, hint: ur ? 'پر سکوئر فٹ لاگت خود بن جائے گی' : 'drives the per-sq-ft machine cost' },
          { key: 'purchaseDate', type: 'date' },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo' },
        ],
        filters: [
          { key: 'status', options: opts(MACHINE_STATUS) },
          { key: 'type', options: opts(MACHINE_TYPES) },
        ],
        stats: (items) => {
          const running = items.filter((m) => m.status === 'running')
          const fleetRate = running.reduce((a, m) => a + machineHourRate(m, { unitRate }).total, 0)
          return [
            { label: t('stats.allMachines'), value: items.length, icon: Cog, tone: 'info' },
            { label: t('stats.running'), value: running.length, icon: Cog, tone: 'success' },
            { label: ur ? 'مینٹیننس میں' : 'Under maintenance', value: items.filter((m) => m.status === 'maintenance').length, icon: Cog, tone: 'warning' },
            { label: ur ? 'فلیٹ لاگت/گھنٹہ' : 'Fleet cost / hour', value: fmtCurrency(fleetRate), icon: Zap, tone: 'brand' },
          ]
        },
      }}
    />
  )
}
