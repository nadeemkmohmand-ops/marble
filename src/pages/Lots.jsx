import React from 'react'
import CrudPage from '../components/CrudPage'
import { GRADES, FINISHES } from '../constants/enums'
import { Layers } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { fmtNumber } from '../utils/formatters'

const opts = (list) => list.map((v) => ({ value: v }))

/**
 * Lots & Bundles — sellable shade-batch groups and transport bundles.
 * Slabs can reference a lot (shade batch) so vein-consistent orders
 * can be pulled together, held, and exchanged as one unit.
 */
export default function Lots() {
  const { t, lang } = useLang()
  const ur = lang === 'ur'
  return (
    <CrudPage
      config={{
        collection: 'lots',
        i18nPrefix: 'lots',
        searchKeys: ['id', 'name', 'shade', 'status'],
        defaults: () => ({ date: new Date().toISOString().slice(0, 10), status: 'open', slabCount: 0 }),
        columns: [
          { key: 'id', label: 'Lot #', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name || '—'}</span> },
          { key: 'shade', label: 'Shade / vein', render: (r) => r.shade || '—' },
          { key: 'slabCount', label: 'Slabs', render: (r) => <span className="num">{r.slabCount || 0}</span> },
          { key: 'totalSqft', label: 'Sq ft', render: (r) => <span className="num">{fmtNumber(r.totalSqft, 0)}</span>, format: (v) => fmtNumber(v) },
          { key: 'bundleId', label: ur ? 'بنڈل' : 'Bundle' },
          { key: 'status', label: t('common.status') },
        ],
        fields: [
          { key: 'name', required: true, placeholder: 'e.g. Ziarat White batch-12' },
          { key: 'shade', label: ur ? 'شیڈ / وین' : 'Shade / vein' },
          { key: 'slabCount', label: ur ? 'سلابز' : 'Slab count', type: 'number', min: 0 },
          { key: 'totalSqft', label: ur ? 'کل سکوئر فٹ' : 'Total sq ft', type: 'number', min: 0 },
          { key: 'grade', type: 'select', options: opts(GRADES), enumPrefix: 'grade' },
          { key: 'finish', type: 'select', options: opts(FINISHES), enumPrefix: 'finish' },
          { key: 'bundleId', label: ur ? 'ٹرانسپورٹ بنڈل' : 'Transport bundle', hint: ur ? 'ایک ہی گاڑی کا بنڈل گروپ' : 'group slabs shipped together' },
          { key: 'yard', label: ur ? 'یارڈ' : 'Yard' },
          { key: 'rack', label: ur ? 'ریک' : 'Rack' },
          { key: 'status', type: 'select', options: opts(['open', 'selling', 'reserved', 'closed']) },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        filters: [
          { key: 'status', options: opts(['open', 'selling', 'reserved', 'closed']) },
          { key: 'grade', options: opts(GRADES), enumPrefix: 'grade' },
        ],
        stats: (items) => [
          { label: ur ? 'کل لاٹس' : 'Total lots', value: items.length, icon: Layers, tone: 'info' },
          { label: ur ? 'کھلے' : 'Open', value: items.filter((l) => l.status === 'open').length, icon: Layers, tone: 'warning' },
          { label: ur ? 'سلابز' : 'Slabs grouped', value: items.reduce((a, l) => a + (l.slabCount || 0), 0), icon: Layers, tone: 'brand' },
          { label: ur ? 'سکوئر فٹ' : 'Sq ft', value: fmtNumber(items.reduce((a, l) => a + (l.totalSqft || 0), 0), 0), icon: Layers, tone: 'success' },
        ],
      }}
    />
  )
}
