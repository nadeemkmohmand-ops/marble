import React from 'react'
import CrudPage from '../components/CrudPage'
import { PARTNER_TYPES } from '../constants/enums'
import { fmtCurrency, fmtNumber } from '../utils/formatters'
import { Handshake } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import Badge from '../components/UI/Badge'

const opts = (list) => list.map((v) => ({ value: v }))

/**
 * Partners — the rock-business register around the factory:
 *  · raw_lend      → gives raw rocks on credit (ادھار)
 *  · marble_borrow → takes cut marble on credit
 *  · custom_cut    → brings own rock, factory cuts it for a fee
 *  · transport     → brings rocks in their own vehicles
 * Everything is typed by hand — names work in Urdu AND English.
 */
export default function Partners() {
  const { t } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'partners',
        i18nPrefix: 'partners',
        searchKeys: ['id', 'name', 'nameEn', 'phone', 'whatsapp', 'vehicleNo', 'notes'],
        defaults: () => ({ type: 'raw_lend', openingBalance: 0 }),
        columns: [
          { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
          { key: 'nameEn', label: 'Name (EN)', render: (r) => r.nameEn || '—' },
          { key: 'type', enumKey: 'enums.partnerType', render: (r) => <Badge status={r.type} label={t(`enums.partnerType.${r.type}`)} /> },
          { key: 'phone', label: 'Phone', render: (r) => <span className="num">{r.phone || '—'}</span> },
          { key: 'vehicleNo', label: 'Vehicle', render: (r) => <span className="num">{r.vehicleNo || '—'}</span> },
          { key: 'openingBalance', label: 'Balance', render: (r) => <span className="num">{fmtCurrency(r.openingBalance)}</span>, format: (v) => fmtNumber(v) },
        ],
        fields: [
          { key: 'name', required: true },
          { key: 'nameEn', hint: t('hints.nameEn') },
          { key: 'type', type: 'select', options: opts(PARTNER_TYPES), enumPrefix: 'partnerType', required: true },
          { key: 'phone', type: 'tel' },
          { key: 'whatsapp', type: 'tel' },
          { key: 'vehicleNo', hint: t('hints.vehicleNo') },
          { key: 'openingBalance', type: 'number', hint: t('hints.openingBalance') },
          { key: 'address', span: 'full' },
          { key: 'notes', type: 'textarea', span: 'full' },
        ],
        filters: [{ key: 'type', options: opts(PARTNER_TYPES) }],
        stats: (items) => [
          { label: t('stats.partners'), value: items.length, icon: Handshake, tone: 'info' },
          { label: t('stats.lenders'), value: items.filter((p) => p.type === 'raw_lend').length, icon: Handshake, tone: 'warning' },
          { label: t('stats.borrowers'), value: items.filter((p) => p.type === 'marble_borrow').length, icon: Handshake, tone: 'brand' },
          { label: t('stats.transporters'), value: items.filter((p) => p.type === 'transport').length, icon: Handshake, tone: 'success' },
        ],
      }}
    />
  )
}
