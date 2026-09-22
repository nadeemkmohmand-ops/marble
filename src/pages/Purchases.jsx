import React, { useState } from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import Tabs from '../components/UI/Tabs'
import Badge from '../components/UI/Badge'
import { landedCost } from '../utils/calculations'
import { CURRENCIES, GRN_STATUS } from '../constants/enums'
import { fmtDate, todayISO, fmtNumber, fmtCurrency } from '../utils/formatters'
import { ShoppingCart, PackageCheck } from 'lucide-react'
import { useAppUI } from '../context/AppUIContext'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { db } from '../services/db'
import { storage } from '../utils/storage'
import { STORAGE_KEYS } from '../constants/storageKeys'

const CUR_OPTS = CURRENCIES.map((c) => ({ value: c, label: c }))
const opts = (list) => list.map((v) => ({ value: v }))

/**
 * Purchases v2: purchase orders (with promised date → supplier on-time
 * scorecards, PKR conversion for USD/EUR lots) + Goods Received Notes
 * as a formal receiving document.
 */
export default function Purchases() {
  const { t, lang } = useLang()
  const [tab, setTab] = useState(0)
  const usdRate = (storage.get(STORAGE_KEYS.SETTINGS, {}) || {}).usdRate || 278
  const ur = lang === 'ur'

  return (
    <div className="fade-in">
      <Tabs
        className="mb-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { label: t('nav.purchases') },
          { label: ur ? 'گوڈز ریسیوڈ نوٹ' : 'GRN' },
        ]}
      />
      {tab === 0 ? <PurchasesCrud usdRate={usdRate} /> : <GrnCrud />}
    </div>
  )
}

function PurchasesCrud({ usdRate }) {
  const { t, lang } = useLang()
  const { requestPrint } = useAppUI()
  const ur = lang === 'ur'

  const PrintPO = ({ record }) => (
    <Button
      size="sm"
      variant="secondary"
      onClick={() =>
        requestPrint({
          template: 'purchaseOrder',
          title: `${t('print.purchaseOrder')} — ${record.id}`,
          data: { purchase: record, supplier: db.get('suppliers', record.supplierName) || { name: record.supplierName } },
        })
      }
    >
      {t('print.purchaseOrder')}
    </Button>
  )

  return (
    <CrudPage
      config={{
        collection: 'purchases',
        i18nPrefix: 'purchases',
        searchKeys: ['id', 'lotNo', 'supplierName', 'country', 'blockRef'],
        defaults: () => ({ date: todayISO(), currency: 'PKR', purchaseCost: 0, freight: 0, customs: 0, clearing: 0, transport: 0, loading: 0, paidAmount: 0 }),
        compute: (v) => ({ landedTotal: landedCost(v) }),
        rowActions: (record) => [<PrintPO key="po" record={record} />],
        columns: [
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'id', label: 'PO', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'supplierName', label: 'Supplier' },
          { key: 'lotNo', label: 'Lot' },
          { key: 'country', label: 'Country' },
          { key: 'currency', label: 'Cur.' },
          {
            key: 'landedTotal', label: 'Landed',
            render: (r) => (
              <span className="num font-semibold">
                {fmtNumber(r.landedTotal)}
                {r.currency && r.currency !== 'PKR' && (
                  <span className="text-[10px] text-[var(--muted)] block">≈ {fmtNumber(r.landedTotal * usdRate, 0)} PKR</span>
                )}
              </span>
            ),
            format: (v) => fmtNumber(v),
          },
          { key: 'paidAmount', label: 'Paid', render: (r) => <span className="num">{fmtNumber(r.paidAmount)}</span>, format: (v) => fmtNumber(v) },
          {
            key: 'balance', label: 'Balance',
            render: (r) => <span className="num text-red-500">{fmtNumber((r.landedTotal || 0) - (r.paidAmount || 0))}</span>,
            exportFormat: (_v, r) => fmtNumber((r.landedTotal || 0) - (r.paidAmount || 0)),
          },
          {
            key: 'promisedDate', label: ur ? 'وعدہ شدہ تاریخ' : 'Promised',
            render: (r) => {
              if (!r.promisedDate) return '—'
              const late = r.date > r.promisedDate
              return <span className={`num ${late ? 'text-amber-500' : 'text-emerald-500'}`}>{fmtDate(r.promisedDate)}</span>
            },
            format: (v) => fmtDate(v),
          },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'supplierName', type: 'ref', refCollection: 'suppliers', refLabel: 'name', placeholder: '—' },
          { key: 'lotNo' },
          { key: 'country' },
          { key: 'blockRef', hint: t('hints.blockRef') },
          { key: 'currency', type: 'select', options: CUR_OPTS, enumPrefix: 'none' },
          { key: 'promisedDate', label: ur ? 'وعدہ شدہ ڈیلیوری تاریخ' : 'Promised delivery date', type: 'date', hint: ur ? 'سپلائر اسکور کارڈ کے لیے' : 'feeds the supplier scorecard' },
          { key: 'purchaseCost', type: 'number', min: 0, required: true },
          { key: 'freight', type: 'number', min: 0 },
          { key: 'customs', type: 'number', min: 0 },
          { key: 'clearing', type: 'number', min: 0 },
          { key: 'transport', type: 'number', min: 0 },
          { key: 'loading', type: 'number', min: 0 },
          { key: 'landedTotal', type: 'readonly', format: (v) => fmtNumber(v), hint: t('hints.landedTotalAuto') },
          { key: 'paidAmount', type: 'number', min: 0 },
          { key: 'terms', span: 'full' },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo' },
        ],
        stats: (items) => {
          const total = items.reduce((a, p) => a + (p.landedTotal || 0), 0)
          const paid = items.reduce((a, p) => a + (p.paidAmount || 0), 0)
          const onTime = items.filter((p) => p.promisedDate && p.date <= p.promisedDate).length
          const withPromise = items.filter((p) => p.promisedDate).length
          return [
            { label: t('stats.purchases'), value: items.length, icon: ShoppingCart, tone: 'info' },
            { label: t('stats.landedTotal'), value: fmtCurrency(total), icon: ShoppingCart, tone: 'brand' },
            { label: t('stats.paid'), value: fmtCurrency(paid), icon: ShoppingCart, tone: 'success' },
            { label: ur ? 'وقت پر ڈیلیوری' : 'On-time delivery', value: withPromise ? `${Math.round((onTime / withPromise) * 100)}%` : '—', icon: PackageCheck, tone: 'warning' },
          ]
        },
      }}
    />
  )
}

function GrnCrud() {
  const { t, lang } = useLang()
  const toast = useToast()
  const { requestPrint } = useAppUI()
  const ur = lang === 'ur'

  const PrintGRN = ({ record }) => (
    <Button
      size="sm"
      variant="secondary"
      icon={PackageCheck}
      onClick={() =>
        requestPrint({
          template: 'grn',
          title: `${ur ? 'GRN' : 'GRN'} — ${record.id}`,
          lang,
          data: { grn: record, supplier: db.get('suppliers', record.supplierName) || { name: record.supplierName } },
        })
      }
    >
      {ur ? 'پرنٹ' : 'Print'}
    </Button>
  )

  return (
    <CrudPage
      config={{
        collection: 'grn',
        i18nPrefix: 'grn',
        searchKeys: ['id', 'purchaseRef', 'lotNo', 'supplierName', 'receivedBy'],
        defaults: () => ({ date: todayISO(), status: 'received', qtyBlocks: 0, qtySlabs: 0 }),
        rowActions: (record) => [<PrintGRN key="grn" record={record} />],
        columns: [
          { key: 'id', label: 'GRN #', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'purchaseRef', label: ur ? 'PO' : 'PO', render: (r) => <span className="num">{r.purchaseRef || '—'}</span> },
          { key: 'supplierName', label: 'Supplier' },
          { key: 'lotNo', label: 'Lot' },
          { key: 'qtyBlocks', label: ur ? 'بلاکس' : 'Blocks', render: (r) => <span className="num">{r.qtyBlocks || 0}</span> },
          { key: 'qtySlabs', label: ur ? 'سلابز' : 'Slabs', render: (r) => <span className="num">{r.qtySlabs || 0}</span> },
          { key: 'condition', label: ur ? 'حالت' : 'Condition' },
          { key: 'status', label: t('common.status'), render: (r) => <Badge status={r.status} />, format: (v) => v },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'purchaseRef', label: ur ? 'خریداری آرڈر' : 'Purchase order', type: 'ref', refCollection: 'purchases', refLabel: 'id', placeholder: '—' },
          { key: 'supplierName', type: 'ref', refCollection: 'suppliers', refLabel: 'name', placeholder: '—' },
          { key: 'lotNo' },
          { key: 'qtyBlocks', label: ur ? 'بلاکس وصول' : 'Blocks received', type: 'number', min: 0 },
          { key: 'qtySlabs', label: ur ? 'سلابز وصول' : 'Slabs received', type: 'number', min: 0 },
          { key: 'condition', label: ur ? 'حالت' : 'Condition', type: 'select', options: opts(['good', 'damaged', 'short']) },
          { key: 'receivedBy' },
          { key: 'verifiedBy', label: ur ? 'تصدیق' : 'Verified by' },
          { key: 'status', type: 'select', options: opts(GRN_STATUS) },
          { key: 'discrepancies', label: ur ? 'فرق / نقص' : 'Discrepancies', type: 'textarea', span: 'full' },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo' },
        ],
        filters: [{ key: 'status', options: opts(GRN_STATUS) }],
        onSaved: (rec) => {
          if (rec.status === 'discrepancy') toast.error(ur ? 'فرق درج ہوا — سپلائر سے رابطہ کریں' : 'Discrepancy recorded — contact the supplier')
        },
        stats: (items) => [
          { label: ur ? 'کل GRN' : 'Total GRNs', value: items.length, icon: PackageCheck, tone: 'info' },
          { label: ur ? 'بلاکس وصول' : 'Blocks received', value: items.reduce((a, g) => a + (g.qtyBlocks || 0), 0), icon: PackageCheck, tone: 'brand' },
          { label: ur ? 'سلابز وصول' : 'Slabs received', value: items.reduce((a, g) => a + (g.qtySlabs || 0), 0), icon: PackageCheck, tone: 'success' },
          { label: ur ? 'فرق والے' : 'Discrepancies', value: items.filter((g) => g.status === 'discrepancy').length, icon: PackageCheck, tone: 'danger' },
        ],
      }}
    />
  )
}
