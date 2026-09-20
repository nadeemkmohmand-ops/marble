import React from 'react'
import CrudPage from '../components/CrudPage'
import { MAINTENANCE_TYPES } from '../constants/enums'
import { fmtCurrency, fmtDate, todayISO } from '../utils/formatters'
import { Wrench } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

const opts = (list) => list.map((v) => ({ value: v }))

export default function Maintenance() {
  const { t } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'maintenance',
        i18nPrefix: 'maintenance',
        searchKeys: ['id', 'machineName', 'technician', 'parts', 'notes'],
        defaults: () => ({ date: todayISO() }),
        columns: [
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'machineName', label: 'Machine' },
          { key: 'type', enumKey: 'enums.maintenanceType' },
          { key: 'downHours', label: 'Downtime hrs', render: (r) => <span className="num">{r.downHours ?? 0}</span>, format: (v) => fmtNumber(v) },
          { key: 'cost', label: 'Cost', render: (r) => <span className="num">{fmtCurrency(r.cost)}</span>, format: (v) => fmtNumber(v) },
          { key: 'technician', label: 'Technician' },
          { key: 'nextDue', label: 'Next due', render: (r) => <span className="num">{fmtDate(r.nextDue)}</span>, format: (v) => fmtDate(v) },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'machineName', type: 'ref', refCollection: 'machines', refLabel: 'name', placeholder: '—' },
          { key: 'type', type: 'select', options: opts(MAINTENANCE_TYPES), enumPrefix: 'maintenanceType', required: true },
          { key: 'downHours', type: 'number', min: 0 },
          { key: 'cost', type: 'number', min: 0 },
          { key: 'parts', span: 'full' },
          { key: 'technician' },
          { key: 'nextDue', type: 'date' },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        filters: [{ key: 'type', options: opts(MAINTENANCE_TYPES) }],
        stats: (items) => {
          const downtime = items.reduce((a, m) => a + (m.downHours || 0), 0)
          const cost = items.reduce((a, m) => a + (m.cost || 0), 0)
          const monthStart = new Date().toISOString().slice(0, 7)
          return [
            { label: t('stats.allLogs'), value: items.length, icon: Wrench, tone: 'info' },
            { label: t('stats.totalDowntime'), value: fmtNumber(downtime, 0), icon: Wrench, tone: 'warning' },
            { label: t('stats.maintenanceCost'), value: fmtCurrency(cost), icon: Wrench, tone: 'danger' },
            { label: t('stats.thisMonth'), value: items.filter((m) => (m.date || '').startsWith(monthStart)).length, icon: Wrench, tone: 'brand' },
          ]
        },
      }}
    />
  )
}
