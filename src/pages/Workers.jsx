import React from 'react'
import CrudPage from '../components/CrudPage'
import { WORKER_SKILLS, RATE_TYPES } from '../constants/enums'
import { fmtCurrency, fmtNumber } from '../utils/formatters'
import { HardHat } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

const opts = (list) => list.map((v) => ({ value: v }))

export default function Workers() {
  const { t } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'workers',
        i18nPrefix: 'workers',
        searchKeys: ['name', 'phone', 'skill', 'cnic'],
        defaults: () => ({ skill: 'helper', rateType: 'daily', dailyRate: 0, advances: 0, deductions: 0, loan: 0, status: 'available' }),
        columns: [
          { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
          { key: 'skill', enumKey: 'enums.skill' },
          { key: 'phone', label: 'Phone', render: (r) => <span className="num">{r.phone || '—'}</span> },
          { key: 'rateType', enumKey: 'enums.rateType' },
          { key: 'dailyRate', label: 'Daily rate', render: (r) => <span className="num">{r.rateType === 'daily' ? fmtCurrency(r.dailyRate) : '—'}</span>, exportFormat: (_v, r) => (r.rateType === 'daily' ? fmtNumber(r.dailyRate) : '') },
          { key: 'pieceCutting', label: 'Cutting/sqft', render: (r) => <span className="num">{r.pieceCutting ?? '—'}</span> },
          { key: 'piecePolishing', label: 'Polish/sqft', render: (r) => <span className="num">{r.piecePolishing ?? '—'}</span> },
          { key: 'advances', label: 'Advance', render: (r) => <span className="num">{fmtCurrency(r.advances)}</span>, format: (v) => fmtNumber(v) },
          { key: 'loan', label: 'Loan', render: (r) => <span className="num">{fmtCurrency(r.loan)}</span>, format: (v) => fmtNumber(v) },
        ],
        fields: [
          { key: 'name', required: true },
          { key: 'skill', type: 'select', options: opts(WORKER_SKILLS), required: true },
          { key: 'phone', type: 'tel' },
          { key: 'cnic' },
          { key: 'rateType', type: 'select', options: opts(RATE_TYPES) },
          { key: 'dailyRate', type: 'number', min: 0 },
          { key: 'pieceCutting', type: 'number', min: 0, hint: 'rate per sq ft' },
          { key: 'piecePolishing', type: 'number', min: 0, hint: 'rate per sq ft' },
          { key: 'pieceLoading', type: 'number', min: 0, hint: 'rate per slab' },
          { key: 'pieceInstallation', type: 'number', min: 0, hint: 'rate per order / sqft' },
          { key: 'advances', type: 'number', min: 0 },
          { key: 'loan', type: 'number', min: 0 },
          { key: 'loanInstallment', type: 'number', min: 0, hint: 'monthly recovery' },
          { key: 'address', span: 'full' },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo' },
        ],
        filters: [
          { key: 'skill', options: opts(WORKER_SKILLS) },
          { key: 'rateType', options: opts(RATE_TYPES) },
        ],
        stats: (items) => [
          { label: t('stats.workers'), value: items.length, icon: HardHat, tone: 'info' },
          { label: t('stats.cutters'), value: items.filter((w) => w.skill === 'cutter').length, icon: HardHat, tone: 'brand' },
          { label: t('stats.polishers'), value: items.filter((w) => w.skill === 'polisher').length, icon: HardHat, tone: 'success' },
          { label: t('stats.advancesOutstanding'), value: fmtCurrency(items.reduce((a, w) => a + (w.advances || 0) + (w.loan || 0), 0)), icon: HardHat, tone: 'danger' },
        ],
      }}
    />
  )
}
