import { useState } from 'react'
import { FileDown, Printer } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import Tabs from '../components/UI/Tabs.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { factoryInfo } from '../data/app.js'

/**
 * PrintPreview (پرنٹ پریویو) — placeholder page for report/invoice printing.
 * Tabs switch between a fake invoice and a fake report; the preview is a
 * static A4-styled surface. No real print/export logic yet.
 */
export default function PrintPreview() {
  const { t, pick } = useAppUI()
  const { toast } = useToast()
  const [tab, setTab] = useState('invoice')

  const tabs = [
    { id: 'invoice', label: t('print.invoice') },
    { id: 'report', label: t('print.report') },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={t('nav.printPreview')}
        en="Print Preview"
        subtitle={t('print.subtitle')}
        action={
          <Button variant="primary" onClick={() => toast({ type: 'info', message: t('toast.demo') })}>
            <Printer size={18} />
            {t('print.printAction')}
          </Button>
        }
      />

      <Card>
        <Tabs tabs={tabs} value={tab} onChange={setTab} className="max-w-xs" />
      </Card>

      {/* A4-ish preview surface */}
      <div className="surface mx-auto w-full max-w-2xl p-6 sm:p-8" dir="rtl">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4 dark:border-gray-700">
          <div>
            <p className="text-lg font-bold text-main">{pick(factoryInfo.name)}</p>
            <p className="mt-0.5 text-xs text-muted">{pick(factoryInfo.address)}</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-white">
            <FileDown size={20} aria-hidden="true" />
          </span>
        </div>

        {tab === 'invoice' ? (
          <div className="pt-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="text-muted">
                {t('print.billTo')}: <span className="font-semibold text-main">حاجی بلڈرز</span>
              </span>
              <span className="text-muted">
                {t('print.invoiceNo')}: <span className="font-english font-semibold text-main" dir="ltr">INV-2026-124</span>
              </span>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted dark:border-gray-700">
                  <th className="py-2 text-start">{t('common.item')}</th>
                  <th className="py-2 text-start">{t('common.quantity')}</th>
                  <th className="py-2 text-start">{t('print.rate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-gray-700">
                <tr>
                  <td className="py-2.5">سفید ماربل 12 × 12</td>
                  <td className="font-english py-2.5">120</td>
                  <td className="font-english py-2.5">1,500</td>
                </tr>
                <tr>
                  <td className="py-2.5">سرمئی ماربل 18 × 18</td>
                  <td className="font-english py-2.5">60</td>
                  <td className="font-english py-2.5">2,200</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-end text-sm font-bold text-main">
              {t('print.grandTotal')}:{' '}
              <span className="font-english" dir="ltr">PKR 312,000</span>
            </p>
          </div>
        ) : (
          <div className="pt-4">
            <p className="text-sm text-muted">
              {t('rep.subtitle')}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between gap-3">
                <span className="text-muted">{t('rep.totalProduction')}</span>
                <span className="font-english font-semibold text-main" dir="ltr">1,240</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted">{t('rep.slabsUsed')}</span>
                <span className="font-english font-semibold text-main" dir="ltr">86</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted">{t('rep.wasteRate')}</span>
                <span className="font-english font-semibold text-main" dir="ltr">8.5%</span>
              </li>
            </ul>
          </div>
        )}

        <p className="mt-6 border-t border-border pt-3 text-[11px] leading-relaxed text-muted dark:border-gray-700">
          {t('print.previewNote')}
        </p>
      </div>
    </div>
  )
}
