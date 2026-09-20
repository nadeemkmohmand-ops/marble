import React from 'react'
import CrudPage from '../components/CrudPage'
import { MOVEMENT_TYPES } from '../constants/enums'
import { fmtNumber, fmtDate, todayISO } from '../utils/formatters'
import { ArrowLeftRight } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import Badge from '../components/UI/Badge'

const TYPES = MOVEMENT_TYPES.map((v) => ({ value: v }))

export default function StockMovements() {
  const { t } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'movements',
        i18nPrefix: 'movements',
        searchKeys: ['id', 'refId', 'party', 'fromLocation', 'toLocation', 'notes'],
        defaults: () => ({ date: todayISO(), type: 'adjustment' }),
        columns: [
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'type', label: 'Type', render: (r) => <Badge status={mapTone(r.type)} label={t(`enums.movement.${r.type}`)} />, exportFormat: (v) => v },
          { key: 'refId', label: 'Record', render: (r) => <span className="num">{r.refId || '—'}</span> },
          { key: 'qty', label: 'Qty / sq ft', render: (r) => <span className="num">{fmtNumber(r.qty)}</span>, format: (v) => fmtNumber(v) },
          { key: 'fromLocation', label: 'From' },
          { key: 'toLocation', label: 'To' },
          { key: 'party', label: 'Party' },
          { key: 'notes', label: 'Notes', exportFormat: (v) => String(v || '').slice(0, 60) },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'type', type: 'select', options: TYPES, enumPrefix: 'movement', required: true },
          { key: 'refId', hint: t('hints.refId') },
          { key: 'qty', type: 'number', hint: t('hints.qtyMoved') },
          { key: 'fromLocation' },
          { key: 'toLocation' },
          { key: 'party', hint: t('hints.party') },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo', span: 'full' },
        ],
        filters: [{ key: 'type', options: TYPES }],
        stats: (items) => {
          const byType = (t) => items.filter((m) => m.type === t).length
          return [
            { label: t('stats.allMovements'), value: items.length, icon: ArrowLeftRight, tone: 'info' },
            { label: t('stats.purchasesIn'), value: byType('purchase_in'), icon: ArrowLeftRight, tone: 'success' },
            { label: t('stats.salesOut'), value: byType('sale'), icon: ArrowLeftRight, tone: 'brand' },
            { label: t('stats.damageWastage'), value: byType('damage'), icon: ArrowLeftRight, tone: 'danger' },
          ]
        },
      }}
    />
  )
}

function mapTone(type) {
  return { purchase_in: 'available', cutting_out: 'cutting', transfer: 'invoiced', sale: 'sold', damage: 'damaged', return: 'returned', adjustment: 'idle' }[type] || 'idle'
}
