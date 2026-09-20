import React from 'react'
import CrudPage from '../components/CrudPage'
import { MACHINE_TYPES, MACHINE_STATUS } from '../constants/enums'
import { fmtCurrency } from '../utils/formatters'
import { Cog } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import Badge from '../components/UI/Badge'

const opts = (list) => list.map((v) => ({ value: v }))

export default function Machines() {
  const { t } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'machines',
        i18nPrefix: 'machines',
        searchKeys: ['id', 'name', 'type', 'location', 'notes'],
        defaults: () => ({ status: 'running' }),
        columns: [
          { key: 'id', label: 'ID', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'name', label: 'Name' },
          { key: 'type', enumKey: 'enums.machineType' },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
          { key: 'location', label: 'Location' },
          { key: 'powerKw', label: 'kW', render: (r) => <span className="num">{r.powerKw ?? '—'}</span> },
          { key: 'cost', label: 'Cost', render: (r) => <span className="num">{fmtCurrency(r.cost)}</span>, format: (v) => fmtNumber(v) },
        ],
        fields: [
          { key: 'name', required: true },
          { key: 'type', type: 'select', options: opts(MACHINE_TYPES), enumPrefix: 'machineType', required: true },
          { key: 'status', type: 'select', options: opts(MACHINE_STATUS) },
          { key: 'location' },
          { key: 'powerKw', type: 'number', min: 0 },
          { key: 'cost', type: 'number', min: 0 },
          { key: 'purchaseDate', type: 'date' },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo' },
        ],
        filters: [
          { key: 'status', options: opts(MACHINE_STATUS) },
          { key: 'type', options: opts(MACHINE_TYPES) },
        ],
        stats: (items) => [
          { label: t('stats.allMachines'), value: items.length, icon: Cog, tone: 'info' },
          { label: t('stats.running'), value: items.filter((m) => m.status === 'running').length, icon: Cog, tone: 'success' },
          { label: t('stats.underMaintenance'), value: items.filter((m) => m.status === 'maintenance').length, icon: Cog, tone: 'warning' },
          { label: t('stats.broken'), value: items.filter((m) => m.status === 'broken').length, icon: Cog, tone: 'danger' },
        ],
      }}
    />
  )
}
