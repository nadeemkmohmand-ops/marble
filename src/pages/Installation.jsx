import React from 'react'
import { CalendarClock, HardHat, CheckCircle2, Wallet } from 'lucide-react'

import CrudPage from '../components/CrudPage'
import Badge from '../components/UI/Badge'
import SignaturePad from '../components/UI/SignaturePad'
import { useLang } from '../context/LanguageContext'
import { INSTALL_STATUS } from '../constants/enums'
import { fmtCurrency, fmtDate, fmtNumber, todayISO } from '../utils/formatters'

/**
 * Installation — site jobs from measurement to customer sign-off:
 * schedule a team, track measure/start/complete dates, area, charges
 * vs. expenses (live profit) and capture the customer's signature.
 */
const opts = (list) => list.map((v) => ({ value: v }))

export default function Installation() {
  const { lang, fmtNum } = useLang()
  return (
    <CrudPage
      config={{
        collection: 'installationJobs',
        i18nPrefix: 'installationJobs',
        modalSize: 'lg',
        searchKeys: ['id', 'customerId', 'orderRef', 'siteAddress', 'teamLeader'],
        defaults: () => ({ date: todayISO(), status: 'scheduled', charges: 0, expenses: 0, areaSqft: 0 }),
        compute: (v) => ({ profit: (v.charges || 0) - (v.expenses || 0) }),
        columns: [
          { key: 'id', label: 'Job #', render: (r) => <span className="num font-semibold">{r.id}</span> },
          { key: 'date', label: 'Date', render: (r) => <span className="num">{fmtDate(r.date)}</span>, format: (v) => fmtDate(v) },
          { key: 'customerId', label: 'Customer' },
          { key: 'siteAddress', label: 'Site address' },
          { key: 'areaSqft', label: 'Area', render: (r) => <span className="num">{fmtNum(r.areaSqft)}</span>, format: (v) => fmtNumber(v) },
          { key: 'charges', label: 'Charges', render: (r) => <span className="num font-semibold">{fmtCurrency(r.charges)}</span>, format: (v) => fmtNumber(v) },
          { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} />, format: (v) => v },
          { key: 'completedAt', label: 'Completed', render: (r) => <span className="num">{fmtDate(r.completedAt)}</span>, format: (v) => fmtDate(v) },
        ],
        fields: [
          { key: 'date', type: 'date', required: true },
          { key: 'customerId', type: 'ref', refCollection: 'customers', refLabel: 'name' },
          { key: 'orderRef' },
          { key: 'siteAddress', span: 'full' },
          { key: 'measureDate', type: 'date' },
          { key: 'measuredBy' },
          { key: 'teamLeader', type: 'ref', refCollection: 'workers', refLabel: 'name' },
          { key: 'teamMembers', placeholder: lang === 'ur' ? 'نام کاما سے الگ کریں' : 'names comma separated' },
          { key: 'scheduledDate', type: 'date' },
          { key: 'startedAt', type: 'date' },
          { key: 'completedAt', type: 'date' },
          { key: 'areaSqft', type: 'number', min: 0 },
          { key: 'charges', type: 'number', min: 0 },
          { key: 'expenses', type: 'number', min: 0 },
          { key: 'profit', type: 'readonly', format: (v) => fmtCurrency(v), hint: lang === 'ur' ? 'خودکار' : 'Auto' },
          { key: 'status', type: 'select', options: opts(INSTALL_STATUS) },
          { key: 'customerSign', type: 'custom', component: SignaturePad, span: 'full' },
          { key: 'signDate', type: 'date' },
          { key: 'notes', type: 'textarea', span: 'full' },
          { key: 'photos', type: 'photo' },
        ],
        filters: [{ key: 'status', options: opts(INSTALL_STATUS) }],
        stats: (items) => {
          const month = new Date().toISOString().slice(0, 7)
          const doneMonth = items.filter((j) => j.status === 'done' && ((j.completedAt || j.date) || '').slice(0, 7) === month).length
          const charges = items.reduce((a, j) => a + (j.charges || 0), 0)
          return [
            { label: lang === 'ur' ? 'شیڈولڈ' : 'Scheduled', value: items.filter((j) => j.status === 'scheduled').length, icon: CalendarClock, tone: 'info' },
            { label: lang === 'ur' ? 'جاری' : 'In progress', value: items.filter((j) => j.status === 'in_progress').length, icon: HardHat, tone: 'warning' },
            { label: lang === 'ur' ? 'اس ماہ مکمل' : 'Done this month', value: doneMonth, icon: CheckCircle2, tone: 'success' },
            { label: lang === 'ur' ? 'چارجز کل' : 'Charges total', value: fmtCurrency(charges), icon: Wallet, tone: 'brand' },
          ]
        },
      }}
    />
  )
}
