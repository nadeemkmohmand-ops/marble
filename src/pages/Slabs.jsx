import React from 'react'
import CrudPage from '../components/CrudPage'
import { sqftFromFeet, sqftToSqm, theoreticalSqft, landedCost } from '../utils/calculations'
import { SLAB_STATUS, GRADES, FINISHES, EDGES } from '../constants/enums'
import { fmtNumber, fmtCurrency } from '../utils/formatters'
import { Layers } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import Badge from '../components/UI/Badge'
import { db } from '../services/db'
import { storage } from '../utils/storage'
import { STORAGE_KEYS } from '../constants/storageKeys'

const opts = (list) => list.map((v) => ({ value: v }))

/**
 * Slabs now INHERIT from their parent block: weight (cft × density)
 * and cost per sq ft (block landed cost ÷ theoretical yield), plus a
 * shade-batch lot reference for vein-matched orders.
 */
export default function Slabs() {
  const { t } = useLang()
  const density = (storage.get(STORAGE_KEYS.SETTINGS, {}) || {}).densityKgPerCft || 76

  const inherit = (v) => {
    const area = sqftFromFeet(v.lengthFt, v.widthFt)
    const out = { areaSqft: area, areaSqm: sqftToSqm(area) }
    const block = v.parentBlock ? db.get('blocks', v.parentBlock) : null
    if (block) {
      const thickFt = (Number(v.thicknessMm) || 20) / 304.8
      out.weightKg = Math.round(area * thickFt * (Number(block.density) || density))
      const theo = theoreticalSqft(block.lengthIn, block.widthIn, block.heightIn, v.thicknessMm || 20)
      if (theo > 0) out.costPerSqftSlab = Math.round((landedCost(block) / theo) * 100) / 100
    }
    return out
  }

  return (
    <CrudPage
      config={{
        collection: 'slabs',
        i18nPrefix: 'slabs',
        scan: true,
        qrField: true,
        modalSize: 'lg',
        searchKeys: ['id', 'parentBlock', 'grade', 'finish', 'color', 'rack', 'reservedFor', 'lotId'],
        defaults: () => ({ status: 'available', finish: 'polished', edge: 'none' }),
        compute: inherit,
        columns: [
          { key: 'id', label: 'Slab ID', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'parentBlock', label: 'Block', render: (r) => <span className="num">{r.parentBlock || '—'}</span> },
          { key: 'size', label: 'L×W (ft)', render: (r) => <span className="num">{r.lengthFt}×{r.widthFt}</span>, exportFormat: (v, r) => `${r.lengthFt}×${r.widthFt}` },
          { key: 'thicknessMm', label: 'mm', render: (r) => <span className="num">{r.thicknessMm}</span> },
          { key: 'areaSqft', label: 'Sq ft', render: (r) => <span className="num font-semibold">{fmtNumber(r.areaSqft)}</span>, format: (v) => fmtNumber(v) },
          { key: 'weightKg', label: 'kg', render: (r) => <span className="num">{r.weightKg ? fmtNumber(r.weightKg, 0) : '—'}</span>, format: (v) => fmtNumber(v) },
          { key: 'costPerSqftSlab', label: 'Cost/sq ft', render: (r) => <span className="num">{r.costPerSqftSlab ? fmtCurrency(r.costPerSqftSlab) : '—'}</span>, format: (v) => fmtNumber(v) },
          { key: 'finish', enumKey: 'enums.finish' },
          { key: 'grade', label: 'Grade', enumKey: 'enums.grade' },
          { key: 'lotId', label: 'Lot / batch', render: (r) => <span className="num">{r.lotId || '—'}</span> },
          { key: 'rack', label: 'Rack' },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
        ],
        fields: [
          { key: 'parentBlock', type: 'ref', refCollection: 'blocks', refLabel: 'id', placeholder: '—' },
          { key: 'lotId', label: 'Shade batch / lot', type: 'ref', refCollection: 'lots', refLabel: 'name', placeholder: '—', hint: t('hints.lotRef') || 'group vein-consistent slabs' },
          { key: 'lengthFt', label: 'Length (ft)', type: 'number', required: true, min: 0, step: 0.1 },
          { key: 'widthFt', label: 'Width (ft)', type: 'number', required: true, min: 0, step: 0.1 },
          { key: 'thicknessMm', label: 'Thickness (mm)', type: 'number', min: 0 },
          { key: 'areaSqft', type: 'readonly', format: (v) => fmtNumber(v, 1), hint: t('hints.areaSqftAuto') },
          { key: 'areaSqm', type: 'readonly', format: (v) => fmtNumber(v, 2), hint: t('hints.areaSqmAuto') },
          { key: 'weightKg', label: 'Weight (kg, inherited)', type: 'readonly', format: (v) => (v ? fmtNumber(v, 0) : '—') },
          { key: 'costPerSqftSlab', label: 'Cost / sq ft (inherited)', type: 'readonly', format: (v) => (v ? fmtCurrency(v) : '—') },
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
          const held = items.filter((s) => s.status === 'held').length
          const value = available.reduce((a, s) => a + (s.costPerSqftSlab || 0) * (s.areaSqft || 0), 0)
          return [
            { label: t('stats.totalSlabs'), value: items.length, icon: Layers, tone: 'info' },
            { label: t('stats.availableArea'), value: fmtNumber(area, 0), icon: Layers, tone: 'success' },
            { label: t('stats.reserved'), value: reserved, icon: Layers, tone: 'warning' },
            { label: 'Stock value', value: fmtCurrency(value), icon: Layers, tone: 'brand' },
          ]
        },
      }}
    />
  )
}
