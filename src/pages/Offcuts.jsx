import React from 'react'
import CrudPage from '../components/CrudPage'
import { offcutArea } from '../utils/calculations'
import { OFFCUT_STATUS, SELL_BY, GRADES } from '../constants/enums'
import { fmtNumber, fmtCurrency } from '../utils/formatters'
import { Scissors } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import Badge from '../components/UI/Badge'

const opts = (list) => list.map((v) => ({ value: v }))

export default function Offcuts() {
  const { t } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'offcuts',
        i18nPrefix: 'offcuts',
        scan: true,
        qrField: true,
        searchKeys: ['id', 'parentSlab', 'bundleId', 'grade', 'location'],
        defaults: () => ({ status: 'available', sellBy: 'sqft', qty: 1 }),
        compute: (v) => ({ areaSqft: offcutArea(v.lengthFt, v.widthFt, v.qty || 1) }),
        columns: [
          { key: 'id', label: 'ID', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'parentSlab', label: 'Parent slab', render: (r) => <span className="num">{r.parentSlab || '—'}</span> },
          { key: 'size', label: 'L×W (ft)', render: (r) => <span className="num">{r.lengthFt}×{r.widthFt}</span>, exportFormat: (v, r) => `${r.lengthFt}×${r.widthFt}` },
          { key: 'qty', label: 'Qty', render: (r) => <span className="num">{r.qty ?? 1}</span> },
          { key: 'areaSqft', label: 'Sq ft', render: (r) => <span className="num font-semibold">{fmtNumber(r.areaSqft)}</span>, format: (v) => fmtNumber(v) },
          { key: 'bundleId', label: 'Bundle' },
          { key: 'sellBy', enumKey: 'enums.sellBy' },
          { key: 'price', label: 'Price', render: (r) => <span className="num">{fmtCurrency(r.price)}</span>, format: (v) => fmtNumber(v) },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
        ],
        fields: [
          { key: 'parentSlab', type: 'ref', refCollection: 'slabs', refLabel: 'id', placeholder: '—' },
          { key: 'lengthFt', type: 'number', required: true, min: 0, step: 0.1 },
          { key: 'widthFt', type: 'number', required: true, min: 0, step: 0.1 },
          { key: 'qty', type: 'number', min: 1 },
          { key: 'areaSqft', type: 'readonly', format: (v) => fmtNumber(v, 1), hint: t('hints.areaFromQty') },
          { key: 'thicknessMm', type: 'number', min: 0 },
          { key: 'bundleId' },
          { key: 'mixedLot', type: 'checkbox' },
          { key: 'sellBy', type: 'select', options: opts(SELL_BY) },
          { key: 'price', type: 'number', min: 0 },
          { key: 'grade', type: 'select', options: opts(GRADES) },
          { key: 'location' },
          { key: 'status', type: 'select', options: opts(OFFCUT_STATUS) },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo' },
        ],
        filters: [{ key: 'status', options: OFFCUT_STATUS }],
        stats: (items) => {
          const available = items.filter((o) => o.status === 'available')
          return [
            { label: t('stats.totalRemnants'), value: items.length, icon: Scissors, tone: 'info' },
            { label: t('stats.available'), value: available.length, icon: Scissors, tone: 'success' },
            { label: t('stats.availableSqft'), value: fmtNumber(available.reduce((a, o) => a + (o.areaSqft || 0), 0), 0), icon: Scissors, tone: 'brand' },
            { label: t('stats.sold'), value: items.filter((o) => o.status === 'sold').length, icon: Scissors, tone: 'warning' },
          ]
        },
      }}
    />
  )
}
