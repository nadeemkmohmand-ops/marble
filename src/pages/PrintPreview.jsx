import React, { useEffect, useMemo, useState } from 'react'
import { Printer, ArrowLeft } from 'lucide-react'
import Toolbar from '../components/UI/Toolbar'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Select from '../components/UI/Select'
import EmptyState from '../components/States/EmptyState'
import { useLang } from '../context/LanguageContext'
import { consumePrintRequest } from '../context/AppUIContext'
import { invoiceHTML, challanHTML, quotationHTML, payslipHTML, purchaseOrderHTML, labelHTML, stockReportHTML, wrapStyled } from '../utils/printTemplates'
import { makeQR } from '../utils/qr'
import { printDocument } from '../utils/exporters'
import ROUTES from '../constants/routes'
import { useNavigate } from 'react-router-dom'

/**
 * PrintPreview — renders the requested document (invoice / challan /
 * quotation / payslip / PO / QR label / stock report) with a language
 * switch, then browser print → Save as PDF keeps Urdu shaping perfect.
 */
export default function PrintPreview() {
  const { t, lang, setLang } = useLang()
  const navigate = useNavigate()
  const [request] = useState(() => consumePrintRequest())
  const [html, setHtml] = useState('')

  const effectiveLang = request?.lang || lang

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!request?.template) return
      const { template, data = {}, title } = request
      let body = ''
      if (template === 'invoice') body = invoiceHTML({ order: data.order, customer: data.customer, company: data.company, lang: effectiveLang })
      else if (template === 'challan') body = challanHTML({ order: data.order, customer: data.customer, company: data.company, lang: effectiveLang })
      else if (template === 'quotation') body = quotationHTML({ quote: data.quote, customer: data.customer, company: data.company, lang: effectiveLang })
      else if (template === 'payslip') body = payslipHTML({ worker: data.worker, slip: data.slip, company: data.company, lang: effectiveLang })
      else if (template === 'purchaseOrder') body = purchaseOrderHTML({ purchase: data.purchase, supplier: data.supplier, company: data.company, lang: effectiveLang })
      else if (template === 'label') {
        const qr = await makeQR(data.record?.id, { size: 440 })
        body = labelHTML({ record: data.record, qrDataUrl: qr, kind: data.kind, company: data.company })
      } else if (template === 'stockReport') body = stockReportHTML({ rows: data.rows || [], columns: data.columns || [], title: title || 'Report', lang: effectiveLang })
      if (alive) setHtml(wrapStyled(body, { title: title || '', lang: effectiveLang }))
    })()
    return () => {
      alive = false
    }
  }, [request, effectiveLang])

  const doPrint = () => printDocument(html, { title: request?.title || 'Document' })

  return (
    <div className="fade-in">
      <Toolbar
        title={t('print.title')}
        description={request?.title || t('print.subtitle')}
        actions={
          <>
            <Select
              className="!w-auto"
              value={effectiveLang}
              onChange={(v) => setLang(v.target?.value ?? v)}
              options={[{ value: 'ur', label: 'اردو' }, { value: 'en', label: 'English' }]}
            />
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>{t('print.back')}</Button>
            <Button icon={Printer} onClick={doPrint} disabled={!html}>{t('print.print')}</Button>
          </>
        }
      />

      {html ? (
        <Card className="print-area bg-white text-slate-900">
          <div
            dir={effectiveLang === 'ur' ? 'rtl' : 'ltr'}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Card>
      ) : (
        <Card>
          <EmptyState icon={Printer} title={t('print.noDoc')} />
          <div className="text-center">
            <Button variant="secondary" onClick={() => navigate(ROUTES.ORDERS)}>{t('nav.orders')}</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
