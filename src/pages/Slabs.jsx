import React from 'react'
import CrudPage from '../components/CrudPage'
import { sqftFromFeet, sqftToSqm } from '../utils/calculations'
import { SLAB_STATUS, GRADES, FINISHES, EDGES } from '../constants/enums'
import { fmtNumber } from '../utils/formatters'
import { Layers } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import Badge from '../components/UI/Badge'

const opts = (list) => list.map((v) => ({ value: v }))

export default function Slabs() {
  const { t } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'slabs',
        i18nPrefix: 'slabs',
        scan: true,
        qrField: true,
        modalSize: 'lg',
        searchKeys: ['id', 'parentBlock', 'grade', 'finish', 'color', 'rack', 'reservedFor'],
        defaults: () => ({ status: 'available', finish: 'polished', edge: 'none' }),
        compute: (v) => ({
          areaSqft: sqftFromFeet(v.lengthFt, v.widthFt),
          areaSqm: sqftToSqm(sqftFromFeet(v.lengthFt, v.widthFt)),
        }),
        columns: [
          { key: 'id', label: 'Slab ID', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'parentBlock', label: 'Block', render: (r) => <span className="num">{r.parentBlock || '—'}</span> },
          { key: 'size', label: 'L×W (ft)', render: (r) => <span className="num">{r.lengthFt}×{r.widthFt}</span>, exportFormat: (v, r) => `${r.lengthFt}×${r.widthFt}` },
          { key: 'thicknessMm', label: 'mm', render: (r) => <span className="num">{r.thicknessMm}</span> },
          { key: 'areaSqft', label: 'Sq ft', render: (r) => <span className="num font-semibold">{fmtNumber(r.areaSqft)}</span>, format: (v) => fmtNumber(v) },
          { key: 'finish', enumKey: 'enums.finish' },
          { key: 'grade', label: 'Grade' },
          { key: 'rack', label: 'Rack' },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
        ],
        fields: [
          { key: 'parentBlock', type: 'ref', refCollection: 'blocks', refLabel: 'id', placeholder: '—' },
          { key: 'lengthFt', label: 'Length (ft)', type: 'number', required: true, min: 0, step: 0.1 },
          { key: 'widthFt', label: 'Width (ft)', type: 'number', required: true, min: 0, step: 0.1 },
          { key: 'thicknessMm', label: 'Thickness (mm)', type: 'number', min: 0 },
          { key: 'areaSqft', type: 'readonly', format: (v) => fmtNumber(v, 1), hint: t('hints.areaSqftAuto') },
          { key: 'areaSqm', type: 'readonly', format: (v) => fmtNumber(v, 2), hint: t('hints.areaSqmAuto') },
          { key: 'finish', type: 'select', options: opts(FINISHES) },
          { key: 'edge', type: 'select', options: opts(EDGES) },
          { key: 'grade', type: 'select', options: opts(GRADES) },
          { key: 'defects', span: 'full' },
          { key: 'patches', span: 'full' },
          { key: 'rack' },
          { key: 'yard' },
          { key: 'status', type: 'select', options: opts(SLAB_STATUS) },
          { key: 'reservedFor' },
          { key: 'orderRef' },
          { key: 'price', type: 'number', min: 0 },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo' },
        ],
        filters: [
          { key: 'status', options: SLAB_STATUS },
          { key: 'grade', options: opts(GRADES) },
          { key: 'finish', options: opts(FINISHES) },
        ],
        stats: (items) => {
          const available = items.filter((s) => s.status === 'available')
          const area = available.reduce((a, s) => a + (s.areaSqft || 0), 0)
          const reserved = items.filter((s) => s.status === 'reserved').length
          const sold = items.filter((s) => s.status === 'sold').length
          return [
            { label: t('stats.totalSlabs'), value: items.length, icon: Layers, tone: 'info' },
            { label: t('stats.availableArea'), value: fmtNumber(area, 0), icon: Layers, tone: 'success' },
            { label: t('stats.reserved'), value: reserved, icon: Layers, tone: 'warning' },
            { label: t('stats.sold'), value: sold, icon: Layers, tone: 'brand' },
          ]
        },
      }}
    />
  )
}
