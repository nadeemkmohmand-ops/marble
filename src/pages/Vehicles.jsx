import React, { useMemo, useState } from 'react'
import { Truck, Fuel, Route, Wallet } from 'lucide-react'

import CrudPage from '../components/CrudPage'
import Tabs from '../components/UI/Tabs'
import Badge from '../components/UI/Badge'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { VEHICLE_TYPES, TRIP_STATUS } from '../constants/enums'
import { fmtCurrency, fmtDate, fmtNumber, todayISO } from '../utils/formatters'

/**
 * Vehicles & Trip Log — fleet register (own / rented trucks with driver,
 * fuel and rent info) plus a per-trip ledger: freight vs. fuel, tolls,
 * other expenses and driver pay → live trip cost & profit per trip.
 */
const opts = (list) => list.map((v) => ({ value: v }))

export default function Vehicles() {
  const { lang } = useLang()
  const [tab, setTab] = useState(0)
  const { items: trips } = useCollection('trips')

  const tripStats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7)
    const monthTrips = trips.filter((r) => (r.date || '').slice(0, 7) === month)
    const sum = (arr, key) => arr.reduce((a, r) => a + (r[key] || 0), 0)
    return [
      { label: lang === 'ur' ? 'اس ماہ کے سفر' : 'Trips this month', value: monthTrips.length, icon: Route, tone: 'info' },
      { label: lang === 'ur' ? 'اس ماہ کا فریٹ' : 'Freight this month', value: fmtCurrency(sum(monthTrips, 'freight')), icon: Wallet, tone: 'brand' },
      { label: lang === 'ur' ? 'اس ماہ کی لاگت' : 'Cost this month', value: fmtCurrency(sum(monthTrips, 'totalCost')), icon: Fuel, tone: 'warning' },
      { label: lang === 'ur' ? 'اس ماہ کا منافع' : 'Profit this month', value: fmtCurrency(sum(monthTrips, 'profit')), icon: Truck, tone: 'success' },
    ]
  }, [trips, lang])

  return (
    <div className="fade-in">
      <Tabs
        className="mb-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { label: lang === 'ur' ? 'گاڑیاں' : 'Vehicles' },
          { label: lang === 'ur' ? 'سفر رجسٹر' : 'Trip Log' },
        ]}
      />

      {tab === 0 && (
        <CrudPage
          config={{
            collection: 'vehicles',
            i18nPrefix: 'vehicles',
            searchKeys: ['regNo', 'driverName', 'make'],
            columns: [
              { key: 'regNo', label: 'Reg #', render: (r) => <span className="num font-semibold">{r.regNo || '—'}</span> },
              { key: 'type', label: 'Type', format: (v) => v },
              { key: 'driverName', label: 'Driver' },
              { key: 'ownerType', label: 'Owner', format: (v) => v },
              { key: 'rentMonthly', label: 'Rent / month', render: (r) => <span className="num">{fmtCurrency(r.rentMonthly)}</span>, format: (v) => fmtNumber(v) },
              { key: 'year', label: 'Year', render: (r) => <span className="num">{r.year || '—'}</span> },
            ],
            fields: [
              { key: 'regNo', required: true, placeholder: 'LEB-4521' },
              { key: 'type', type: 'select', options: opts(VEHICLE_TYPES) },
              { key: 'make' },
              { key: 'model' },
              { key: 'year', type: 'number' },
              { key: 'ownerType', type: 'select', options: [{ value: 'own' }, { value: 'rented' }] },
              { key: 'rentMonthly', type: 'number', min: 0 },
              { key: 'driverName' },
              { key: 'driverPhone', type: 'tel' },
              { key: 'driverCnic' },
              { key: 'fuelType', type: 'select', options: [{ value: 'diesel' }, { value: 'petrol' }, { value: 'cng' }] },
              { key: 'tankCapacityLitres', type: 'number', min: 0 },
              { key: 'notes', type: 'textarea', span: 'full' },
              { key: 'photos', type: 'photo' },
            ],
          }}
        />
      )}

      {tab === 1 && (
        <CrudPage
          config={{
            collection: 'trips',
            i18nPrefix: 'trips',
            searchKeys: ['id', 'vehicleId', 'driverName', 'fromLoc', 'toLoc', 'orderRef'],
            defaults: () => ({
              date: todayISO(), status: 'planned',
              fuelLitres: 0, fuelCost: 0, tolls: 0, otherExpense: 0, driverPay: 0, freight: 0,
            }),
            compute: (v) => {
              const totalCost = (v.fuelCost || 0) + (v.tolls || 0) + (v.otherExpense || 0) + (v.driverPay || 0)
              return { totalCost, profit: (v.freight || 0) - totalCost }
            },
            columns: [
              { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
              { key: 'id', label: 'Trip #', render: (r) => <span className="num">{r.id}</span> },
              { key: 'vehicleId', label: 'Vehicle' },
              { key: 'route', label: 'Route', render: (r) => `${r.fromLoc || '—'} → ${r.toLoc || '—'}` },
              { key: 'freight', label: 'Freight', render: (r) => <span className="num">{fmtCurrency(r.freight)}</span>, format: (v) => fmtNumber(v) },
              { key: 'totalCost', label: 'Cost', render: (r) => <span className="num">{fmtCurrency(r.totalCost)}</span>, format: (v) => fmtNumber(v) },
              {
                key: 'profit', label: 'Profit',
                render: (r) => (
                  <span className={`num font-semibold ${(r.profit || 0) < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {fmtCurrency(r.profit)}
                  </span>
                ),
                exportFormat: (_v, r) => fmtNumber(r.profit),
              },
              { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
            ],
            fields: [
              { key: 'date', type: 'date', required: true },
              { key: 'vehicleId', type: 'ref', refCollection: 'vehicles', refLabel: 'regNo' },
              { key: 'driverName' },
              { key: 'status', type: 'select', options: opts(TRIP_STATUS) },
              { key: 'fromLoc' },
              { key: 'toLoc' },
              { key: 'orderRef' },
              { key: 'freight', type: 'number', min: 0 },
              { key: 'fuelLitres', type: 'number', min: 0, step: 0.1 },
              { key: 'fuelCost', type: 'number', min: 0 },
              { key: 'tolls', type: 'number', min: 0 },
              { key: 'otherExpense', type: 'number', min: 0 },
              { key: 'driverPay', type: 'number', min: 0 },
              { key: 'totalCost', type: 'readonly', format: (v) => fmtCurrency(v), hint: lang === 'ur' ? 'خودکار' : 'Auto' },
              { key: 'profit', type: 'readonly', format: (v) => fmtCurrency(v), hint: lang === 'ur' ? 'خودکار' : 'Auto' },
              { key: 'notes', type: 'textarea', span: 'full' },
            ],
            filters: [{ key: 'status', options: opts(TRIP_STATUS) }],
            stats: () => tripStats,
          }}
        />
      )}
    </div>
  )
}
