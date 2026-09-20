import React from 'react'
import CrudPage from '../components/CrudPage'
import Button from '../components/UI/Button'
import { landedCost } from '../utils/calculations'
import { CURRENCIES } from '../constants/enums'
import { fmtDate, todayISO, fmtNumber, fmtCurrency } from '../utils/formatters'
import { ShoppingCart } from 'lucide-react'
import { useAppUI } from '../context/AppUIContext'
import { useLang } from '../context/LanguageContext'
import { db } from '../services/db'

const CUR_OPTS = CURRENCIES.map((c) => ({ value: c, label: c }))

export default function Purchases() {
  const { t } = useLang()
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
          { key: 'landedTotal', label: 'Landed', render: (r) => <span className="num font-semibold">{fmtNumber(r.landedTotal)}</span>, format: (v) => fmtNumber(v) },
          { key: 'paidAmount', label: 'Paid', render: (r) => <span className="num">{fmtNumber(r.paidAmount)}</span>, format: (v) => fmtNumber(v) },
          {
            key: 'balance', label: 'Balance',
            render: (r) => <span className="num text-red-500">{fmtNumber((r.landedTotal || 0) - (r.paidAmount || 0))}</span>,
            exportFormat: (_v, r) => fmtNumber((r.landedTotal || 0) - (r.paidAmount || 0)),
          },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'supplierName', type: 'ref', refCollection: 'suppliers', refLabel: 'name', placeholder: '—' },
          { key: 'lotNo' },
          { key: 'country' },
          { key: 'blockRef', hint: t('hints.blockRef') },
          { key: 'currency', type: 'select', options: CUR_OPTS, enumPrefix: 'none' },
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
          return [
            { label: t('stats.purchases'), value: items.length, icon: ShoppingCart, tone: 'info' },
            { label: t('stats.landedTotal'), value: fmtCurrency(total), icon: ShoppingCart, tone: 'brand' },
            { label: t('stats.paid'), value: fmtCurrency(paid), icon: ShoppingCart, tone: 'success' },
            { label: t('stats.payable'), value: fmtCurrency(total - paid), icon: ShoppingCart, tone: 'danger' },
          ]
        },
      }}
    />
  )
}

function PrintPO({ record }) {
  const { requestPrint } = useAppUI()
  return (
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
}
