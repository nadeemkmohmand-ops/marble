// ─────────────────────────────────────────────────────────────────
// printTemplates.js — self-contained HTML documents for print/PDF:
// invoice · delivery challan · quotation · payslip · purchase order ·
// slab/block QR label · stock report. Bilingual + RTL safe.
// These templates are also used by the PDF exporter (print dialog).
// ─────────────────────────────────────────────────────────────────
import { fmtDate, fmtCurrency, fmtNumber } from './formatters'
import { orderTotals } from './calculations'

// FIX (style leak): these rules used to target `body` and bare
// `table`/`th`/`td` selectors. The <style> tag ships inside documents
// rendered on-screen (PrintPreview) and inside the off-screen PDF
// holder — unscoped selectors restyled the WHOLE live app (body
// margins, every table) while a document was open/exported.
// Everything is now scoped under .print-doc, the wrapper div that
// docShell() puts around every document.
const baseCss = (rtl) => `
  .print-doc * { box-sizing:border-box; }
  .print-doc { font-family:${rtl ? "'Noto Nastaliq Urdu', serif" : "'Inter', Arial, sans-serif"}; direction:${rtl ? 'rtl' : 'ltr'};
         margin:24px; color:#111; line-height:${rtl ? '2' : '1.5'}; background:#fff; }
  .print-doc .doc-head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0f172a; padding-bottom:12px; margin-bottom:16px; }
  .print-doc .doc-title { font-size:22px; font-weight:700; }
  .print-doc .doc-sub { font-size:12px; color:#555; }
  .print-doc table { border-collapse:collapse; width:100%; margin-top:10px; }
  .print-doc th, .print-doc td { border:1px solid #999; padding:6px 9px; font-size:12px; text-align:${rtl ? 'right' : 'left'}; }
  .print-doc th { background:#eef2f7; }
  .print-doc .totals td { border:none; padding:3px 9px; font-size:13px; }
  .print-doc .grand { font-weight:700; border-top:2px solid #0f172a !important; font-size:15px; }
  .print-doc .stamp { margin-top:36px; display:flex; justify-content:space-between; font-size:12px; }
  .print-doc .stamp .box { border:1px dashed #777; padding:28px 40px 6px; }
  .print-doc .qr { width:110px; height:110px; }
  .print-doc .label { width:320px; border:2px solid #0f172a; border-radius:10px; padding:12px; text-align:center; page-break-inside:avoid; margin:8px; display:inline-block; vertical-align:top; }
  .print-doc .muted { color:#666; font-size:11px; }
  .print-doc .footer { margin-top:26px; border-top:1px solid #bbb; padding-top:8px; font-size:11px; color:#666; text-align:center; }
`

function docShell(title, bodyHtml, rtl) {
  return `<div class="print-doc" dir="${rtl ? 'rtl' : 'ltr'}">${bodyHtml}<div class="footer">${title}</div></div>`
}

function companyHeader(company, docType, docNo, dateVal) {
  return `<div class="doc-head">
    <div>
      <div class="doc-title">${esc(company?.name || 'Marble Factory')}</div>
      <div class="doc-sub">${esc(company?.address || '')}</div>
      <div class="doc-sub">${esc(company?.phone || '')}</div>
    </div>
    <div style="text-align:end">
      <div class="doc-title" style="font-size:18px">${esc(docType)}</div>
      <div class="doc-sub"># ${esc(docNo)}</div>
      <div class="doc-sub">${fmtDate(dateVal)}</div>
    </div>
  </div>`
}

function partyBlock(label, party) {
  if (!party) return ''
  return `<div style="margin:10px 0">
    <span class="muted">${esc(label)}</span>
    <div><b>${esc(party.name || '')}</b> ${party.phone ? `— ${esc(party.phone)}` : ''}</div>
    <div class="muted">${esc(party.address || '')}</div>
  </div>`
}

export function invoiceHTML({ order, customer, company, lang = 'en' }) {
  const rtl = lang === 'ur'
  const t = orderTotals(order)
  const cur = (v) => fmtCurrency(v, { currency: company?.currency || 'PKR', lang })
  const items = (order.items || [])
    .map(
      (it, i) => `<tr><td>${i + 1}</td><td>${esc(it.description || '')}</td>
      <td>${fmtNumber(it.lengthFt)} × ${fmtNumber(it.widthFt)}</td><td>${fmtNumber(it.qty)}</td>
      <td>${fmtNumber(it.sqft || it.lengthFt * it.widthFt * it.qty)}</td>
      <td>${cur(it.rate)}</td><td>${cur((it.sqft || it.lengthFt * it.widthFt * it.qty) * it.rate)}</td></tr>`,
    )
    .join('')
  const body = `
    ${companyHeader(company, lang === 'ur' ? 'بل' : 'INVOICE', order.id, order.date)}
    ${partyBlock(lang === 'ur' ? 'گاہک' : 'Customer', customer)}
    <table><thead><tr><th>#</th><th>${rtl ? 'تفصیل' : 'Description'}</th><th>${rtl ? 'لمبائی × چوڑائی (فٹ)' : 'L × W (ft)'}</th>
    <th>${rtl ? 'تعداد' : 'Qty'}</th><th>${rtl ? 'سکوئر فٹ' : 'Sq ft'}</th><th>${rtl ? 'ریٹ' : 'Rate'}</th><th>${rtl ? 'رقم' : 'Amount'}</th></tr></thead>
    <tbody>${items}</tbody></table>
    <table class="totals"><tbody>
      <tr><td></td><td style="width:40%">${rtl ? 'آئٹمز کل' : 'Items total'}</td><td style="width:20%">${cur(t.itemsTotal)}</td></tr>
      <tr><td></td><td>${rtl ? 'کنارہ/تنصیب/ٹرانسپورٹ' : 'Edge / Installation / Transport'}</td><td>${cur(t.extras)}</td></tr>
      <tr><td></td><td>${rtl ? 'رعایت' : 'Discount'}</td><td>- ${cur(t.discount)}</td></tr>
      <tr><td></td><td>${rtl ? 'ٹیکس' : 'Tax'}</td><td>${cur(t.tax)}</td></tr>
      <tr><td></td><td class="grand">${rtl ? 'کل' : 'Grand total'}</td><td class="grand">${cur(t.total)}</td></tr>
      <tr><td></td><td>${rtl ? 'ادائیگی موصول' : 'Paid'}</td><td>${cur(order.paidAmount || 0)}</td></tr>
      <tr><td></td><td class="grand">${rtl ? 'بقایا' : 'Balance'}</td><td class="grand">${cur(t.total - (order.paidAmount || 0))}</td></tr>
    </tbody></table>
    <div class="stamp"><div class="box">${rtl ? 'دستخط فروش' : 'Seller signature'}</div><div class="box">${rtl ? 'دستخط گاہک' : 'Customer signature'}</div></div>`
  return docShell(lang === 'ur' ? 'بل' : 'Invoice', body, rtl)
}

export function challanHTML({ order, customer, company, lang = 'en' }) {
  const rtl = lang === 'ur'
  const items = (order.items || [])
    .map(
      (it, i) => `<tr><td>${i + 1}</td><td>${esc(it.description || '')}</td>
      <td>${fmtNumber(it.lengthFt)} × ${fmtNumber(it.widthFt)}</td><td>${fmtNumber(it.qty)}</td></tr>`,
    )
    .join('')
  const body = `
    ${companyHeader(company, lang === 'ur' ? 'ڈیلیوری چالان' : 'DELIVERY CHALLAN', order.id, order.date)}
    ${partyBlock(lang === 'ur' ? 'وصول کنندہ' : 'Deliver to', customer)}
    <table><thead><tr><th>#</th><th>${rtl ? 'تفصیل' : 'Description'}</th><th>${rtl ? 'سائز (فٹ)' : 'Size (ft)'}</th><th>${rtl ? 'تعداد' : 'Qty'}</th></tr></thead>
    <tbody>${items}</tbody></table>
    <div style="margin-top:10px" class="muted">${rtl ? 'گاڑی نمبر' : 'Vehicle no.'}: ${esc(order.vehicleNo || '—')} — ${rtl ? 'ڈرائیور' : 'Driver'}: ${esc(order.driver || '—')}</div>
    <div class="stamp"><div class="box">${rtl ? 'دستخط وصول کنندہ' : 'Receiver signature'}</div><div class="box">${rtl ? 'چالان جاری کرنے والا' : 'Issued by'}</div></div>`
  return docShell(lang === 'ur' ? 'چالان' : 'Challan', body, rtl)
}

export function quotationHTML({ quote, customer, company, lang = 'en' }) {
  const rtl = lang === 'ur'
  const cur = (v) => fmtCurrency(v, { currency: company?.currency || 'PKR', lang })
  const items = (quote.items || [])
    .map(
      (it, i) => `<tr><td>${i + 1}</td><td>${esc(it.description || '')}</td><td>${esc(it.room || '')}</td>
      <td>${fmtNumber(it.lengthFt)} × ${fmtNumber(it.widthFt)}</td><td>${fmtNumber(it.qty)}</td>
      <td>${fmtNumber(it.sqft || it.lengthFt * it.widthFt * it.qty)}</td><td>${cur(it.rate)}</td></tr>`,
    )
    .join('')
  const total = (quote.total ?? quote.itemsTotal ?? 0)
  const body = `
    ${companyHeader(company, lang === 'ur' ? 'تخمینہ' : 'QUOTATION', quote.id, quote.date)}
    ${partyBlock(lang === 'ur' ? 'گاہک' : 'Customer', customer)}
    <table><thead><tr><th>#</th><th>${rtl ? 'تفصیل' : 'Description'}</th><th>${rtl ? 'کمرہ' : 'Room'}</th>
    <th>${rtl ? 'سائز (فٹ)' : 'Size (ft)'}</th><th>${rtl ? 'تعداد' : 'Qty'}</th><th>${rtl ? 'سکوئر فٹ' : 'Sq ft'}</th><th>${rtl ? 'ریٹ' : 'Rate'}</th></tr></thead>
    <tbody>${items}</tbody></table>
    <table class="totals"><tbody>
      <tr><td></td><td style="width:40%" class="grand">${rtl ? 'کل تخمینہ' : 'Quotation total'}</td><td style="width:20%" class="grand">${cur(total)}</td></tr>
    </tbody></table>
    <div class="muted" style="margin-top:8px">${rtl ? 'درست تک' : 'Valid until'}: ${fmtDate(quote.validUntil)}</div>`
  return docShell(lang === 'ur' ? 'تخمینہ' : 'Quotation', body, rtl)
}

export function payslipHTML({ worker, slip, company, lang = 'en' }) {
  const rtl = lang === 'ur'
  const cur = (v) => fmtCurrency(v, { currency: company?.currency || 'PKR', lang })
  const row = (label, val, strong) =>
    `<tr><td ${strong ? 'class="grand"' : ''}>${esc(label)}</td><td ${strong ? 'class="grand"' : ''} style="width:35%">${cur(val)}</td></tr>`
  const body = `
    ${companyHeader(company, lang === 'ur' ? 'تنخواہ پرچی' : 'PAYSLIP', slip.id, slip.period)}
    ${partyBlock(lang === 'ur' ? 'مزدور' : 'Worker', { name: worker?.name, phone: worker?.phone })}
    <table><tbody>
      ${row(rtl ? 'حاضری والے دن' : 'Present days', slip.presentDays)}
      ${row(rtl ? 'ٹکڑا ریٹ کمائی' : 'Piece-rate earnings', slip.pieceEarnings)}
      ${row(rtl ? 'اوور ٹائم' : 'Overtime', slip.overtimeAmount)}
      ${row(rtl ? 'پریمیم / بونس' : 'Bonus', slip.bonus)}
      ${row(rtl ? 'ایڈوانس کٹوتی' : 'Advance recovered', -slip.advances)}
      ${row(rtl ? 'قرض کی قسط' : 'Loan installment', -slip.loanInstallment)}
      ${row(rtl ? 'دیگر کٹوتیاں' : 'Other deductions', -slip.deductions)}
      ${row(rtl ? 'قابل ادائیگی' : 'Net payable', slip.netPayable, true)}
    </tbody></table>
    <div class="stamp"><div class="box">${rtl ? 'دستخط مزدور' : 'Worker signature'}</div><div class="box">${rtl ? 'دستخط انتظامیہ' : 'Management'}</div></div>`
  return docShell(lang === 'ur' ? 'تنخواہ پرچی' : 'Payslip', body, rtl)
}

export function purchaseOrderHTML({ purchase, supplier, company, lang = 'en' }) {
  const rtl = lang === 'ur'
  const cur = (v) => fmtCurrency(v, { currency: purchase.currency || 'PKR', lang })
  const line = (label, val) => `<tr><td>${esc(label)}</td><td style="width:35%">${cur(val)}</td></tr>`
  const body = `
    ${companyHeader(company, lang === 'ur' ? 'خریداری آرڈر' : 'PURCHASE ORDER', purchase.id, purchase.date)}
    ${partyBlock(lang === 'ur' ? 'سپلائر' : 'Supplier', supplier)}
    <div>${rtl ? 'لاٹ نمبر' : 'Lot no.'}: <b>${esc(purchase.lotNo || '—')}</b> — ${rtl ? 'ملک' : 'Country'}: ${esc(purchase.country || '—')}</div>
    <table><tbody>
      ${line(rtl ? 'بلاک قیمت' : 'Block cost', purchase.purchaseCost)}
      ${line(rtl ? 'مصارف (بھاڑا/کسٹم/کلئیرنگ)' : 'Freight / Customs / Clearing', (purchase.freight || 0) + (purchase.customs || 0) + (purchase.clearing || 0))}
      ${line(rtl ? 'ٹرانسپورٹ/لوڈنگ' : 'Transport / Loading', (purchase.transport || 0) + (purchase.loading || 0))}
      ${line(rtl ? 'لینڈڈ کل' : 'Landed total', purchase.landedTotal || 0, )}
      ${line(rtl ? 'ادا شدہ' : 'Paid', purchase.paidAmount || 0)}
      ${line(rtl ? 'بقایا' : 'Balance', (purchase.landedTotal || 0) - (purchase.paidAmount || 0))}
    </tbody></table>`
  return docShell(lang === 'ur' ? 'خریداری' : 'Purchase Order', body, rtl)
}

export function labelHTML({ record, qrDataUrl, kind = 'SLAB', company }) {
  const fields = kind === 'SLAB'
    ? [['ID', record.id], ['Block', record.parentBlock || '—'], ['Size', `${record.lengthFt}×${record.widthFt}×${record.thicknessMm}mm`],
       ['Area', `${record.areaSqft ?? ''} sq ft`], ['Grade', record.grade || '—'], ['Finish', record.finish || '—']]
    : [['Block', record.id], ['Lot', record.lotNo || '—'], ['Size', `${record.lengthIn}×${record.widthIn}×${record.heightIn} in`],
       ['CFT', record.cft || '—'], ['Grade', record.grade || '—']]
  const body = `<div style="text-align:center">
    <div class="label">
      <div style="font-weight:700">${esc(company?.name || '')}</div>
      <img class="qr" src="${qrDataUrl}" alt="QR ${esc(record.id)}" />
      <table style="margin-top:8px"><tbody>
        ${fields.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('')}
      </tbody></table>
    </div></div>`
  return docShell('Label', body, false)
}

export function stockReportHTML({ rows, title, lang = 'en', columns }) {
  const rtl = lang === 'ur'
  const head = columns.map((c) => `<th>${esc(c.label)}</th>`).join('')
  const bodyRows = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${esc(typeof c.format === 'function' ? c.format(r[c.key], r) : (r[c.key] ?? ''))}</td>`).join('')}</tr>`)
    .join('')
  const body = `<div class="doc-head"><div class="doc-title">${esc(title)}</div><div class="doc-sub">${fmtDate(new Date())}</div></div>
    <table><thead><tr>${head}</tr></thead><tbody>${bodyRows}</tbody></table>`
  return docShell(title, body, rtl)
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function wrapStyled(html, { title, lang = 'en' }) {
  const rtl = lang === 'ur'
  return `<style>${baseCss(rtl)}</style>${docShell(title, html, rtl)}`
}
