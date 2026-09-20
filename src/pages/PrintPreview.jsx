import React, { useEffect, useMemo, useState } from 'react'
import { Printer, ArrowLeft, Download } from 'lucide-react'
import Toolbar from '../components/UI/Toolbar'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Select from '../components/UI/Select'
import EmptyState from '../components/States/EmptyState'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { consumePrintRequest } from '../context/AppUIContext'
import { invoiceHTML, challanHTML, quotationHTML, payslipHTML, purchaseOrderHTML, labelHTML, stockReportHTML, wrapStyled } from '../utils/printTemplates'
import { makeQR } from '../utils/qr'
import { printDocument, downloadPDF } from '../utils/exporters'
import ROUTES from '../constants/routes'
import { useNavigate } from 'react-router-dom'

/**
 * PrintPreview — renders the requested document (invoice / challan /
 * quotation / payslip / PO / QR label / stock report) with a language
 * switch. "Download PDF" saves a real file directly (no print dialog);
 * "Print" opens the browser print dialog for anyone printing on paper.
 */
export default function PrintPreview() {
  const { t, lang, setLang } = useLang()
  const toast = useToast()
  const navigate = useNavigate()
  const [request] = useState(() => consumePrintRequest())
  const [html, setHtml] = useState('')
  const [downloading, setDownloading] = useState(false)

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

  const doDownload = async () => {
    setDownloading(true)
    try {
      await downloadPDF(html, { title: request?.title || 'Document', lang: effectiveLang })
    } catch (e) {
      toast.error(t('common.error'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fade-in">
      <Toolbar
        title={t('print.title')}
        description={request?.title || t('print.subtitle')}
        actions={
          <>
            <Select
              className="!w-auto min-w-[7rem]"
              value={effectiveLang}
              onChange={(e) => setLang(e.target.value)}
              options={[{ value: 'ur', label: 'اردو' }, { value: 'en', label: 'English' }]}
            />
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
              <span className="hidden sm:inline">{t('print.back')}</span>
            </Button>
            <Button variant="secondary" icon={Printer} onClick={doPrint} disabled={!html}>
              <span className="hidden sm:inline">{t('print.print')}</span>
            </Button>
            <Button icon={Download} onClick={doDownload} disabled={!html} loading={downloading}>
              <span className="hidden sm:inline">{t('print.downloadPdf')}</span>
            </Button>
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

