import React from 'react'
import CrudPage from '../components/CrudPage'
import { landedCost, cftFromInches, weightKg } from '../utils/calculations'
import { BLOCK_STATUS, GRADES } from '../constants/enums'
import { fmtCurrency, fmtNumber } from '../utils/formatters'
import { Package } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import Badge from '../components/UI/Badge'

const GRADE_OPTIONS = GRADES.map((g) => ({ value: g, label: g }))

export default function Blocks() {
  const { t } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'blocks',
        i18nPrefix: 'blocks',
        scan: true,
        qrField: true,
        searchKeys: ['id', 'blockNo', 'lotNo', 'supplier', 'quarry', 'country', 'color', 'yard', 'rack'],
        defaults: () => ({
          status: 'available',
          density: 76,
          purchaseCost: 0, freight: 0, customs: 0, clearing: 0, transport: 0, loading: 0,
        }),
        compute: (v) => ({
          cft: cftFromInches(v.lengthIn, v.widthIn, v.heightIn),
          weightKg: weightKg(cftFromInches(v.lengthIn, v.widthIn, v.heightIn), v.density || 76),
          landedTotal: landedCost(v),
        }),
        columns: [
          { key: 'id', label: 'Block ID', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'blockNo', label: 'No.' },
          { key: 'lotNo', label: 'Lot' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'size', label: 'L×W×H (in)', render: (r) => <span className="num">{r.lengthIn}×{r.widthIn}×{r.heightIn}</span>, exportFormat: (v, r) => `${r.lengthIn}×${r.widthIn}×${r.heightIn}` },
          { key: 'cft', label: 'CFT', render: (r) => <span className="num">{fmtNumber(r.cft)}</span>, format: (v) => fmtNumber(v) },
          { key: 'weightKg', label: 'kg', render: (r) => <span className="num">{fmtNumber(r.weightKg, 0)}</span>, format: (v) => fmtNumber(v, 0) },
          { key: 'landedTotal', label: 'Landed', render: (r) => <span className="num">{fmtCurrency(r.landedTotal)}</span>, format: (v) => fmtNumber(v) },
          { key: 'grade', label: 'Grade' },
          { key: 'yard', label: 'Yard' },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
        ],
        fields: [
          { key: 'blockNo', required: true, placeholder: 'BLK-0001' },
          { key: 'lotNo' },
          { key: 'supplier' },
          { key: 'quarry' },
          { key: 'country', placeholder: 'Pakistan / Italy / …' },
          { key: 'lengthIn', label: 'Length (inches)', type: 'number', required: true, min: 0 },
          { key: 'widthIn', label: 'Width (inches)', type: 'number', required: true, min: 0 },
          { key: 'heightIn', label: 'Height (inches)', type: 'number', required: true, min: 0 },
          { key: 'cft', type: 'readonly', format: (v) => fmtNumber(v, 2), hint: 'auto: L×W×H÷1728' },
          { key: 'weightKg', type: 'readonly', format: (v) => fmtNumber(v, 0), hint: 'auto: cft × density' },
          { key: 'density', type: 'number', hint: 'default 76 kg/cft' },
          { key: 'purchaseCost', type: 'number', min: 0 },
          { key: 'freight', type: 'number', min: 0 },
          { key: 'customs', type: 'number', min: 0 },
          { key: 'clearing', type: 'number', min: 0 },
          { key: 'transport', type: 'number', min: 0 },
          { key: 'loading', type: 'number', min: 0 },
          { key: 'landedTotal', type: 'readonly', format: (v) => fmtCurrency(v), hint: 'auto: purchase+freight+customs+clearing+transport+loading' },
          { key: 'grade', type: 'select', options: GRADE_OPTIONS },
          { key: 'color' },
          { key: 'veining', span: 'full' },
          { key: 'qualityNotes', type: 'textarea', span: 'full' },
          { key: 'yard' },
          { key: 'rack' },
          { key: 'gate' },
          { key: 'status', type: 'select', options: BLOCK_STATUS.map((s) => ({ value: s })) },
          { key: 'photos', type: 'photo' },
        ],
        filters: [
          { key: 'status', options: BLOCK_STATUS },
          { key: 'grade', options: GRADE_OPTIONS },
        ],
        stats: (items) => {
          const available = items.filter((b) => b.status === 'available')
          const value = available.reduce((a, b) => a + (b.landedTotal || 0), 0)
          const cft = available.reduce((a, b) => a + (b.cft || 0), 0)
          return [
            { label: t('stats.totalBlocks'), value: items.length, icon: Package, tone: 'info' },
            { label: t('stats.available'), value: available.length, icon: Package, tone: 'success' },
            { label: t('stats.stockValue'), value: fmtCurrency(value), icon: Package, tone: 'brand' },
            { label: t('stats.availableCft'), value: fmtNumber(cft, 0), icon: Package, tone: 'warning' },
          ]
        },
      }}
    />
  )
}
