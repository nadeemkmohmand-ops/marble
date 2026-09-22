// ─────────────────────────────────────────────────────────────────
// printTemplates.js — self-contained HTML documents for print/PDF:
// invoice · delivery challan · quotation · payslip · purchase order ·
// slab/block QR label · stock report. Bilingual + RTL safe.
// These templates are also used by the PDF exporter (print dialog).
// ─────────────────────────────────────────────────────────────────
import { fmtDate, fmtCurrency, fmtNumber } from './formatters'
import { getFactoryName } from './factory'
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
         margin:24px; padding-bottom:26px; color:#111; line-height:${rtl ? '2' : '1.5'}; background:#fff; }
  .print-doc .doc-head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0f172a; padding-bottom:12px; margin-bottom:16px; }
  .print-doc .doc-title { font-size:22px; font-weight:700; }
  .print-doc .doc-sub { font-size:12px; color:#555; }
  .print-doc table { border-collapse:collapse; width:100%; margin-top:10px; }
  .print-doc th, .print-doc td { border:1px solid #999; padding:6px 9px; font-size:12px; text-align:${rtl ? 'right' : 'left'};
    /* bidi fix: each cell keeps its own natural direction, so Latin
       runs like "L×W×H (in)" keep their brackets in RTL documents
       instead of being mirrored to ")in(" */
    unicode-bidi:plaintext; }
  .print-doc th { background:#eef2f7; }
  /* page-cut fix: never slice a row, a heading or the footer in half
     when the PDF is split into A4 pages */
  .print-doc tr, .print-doc .doc-head, .print-doc .stamp,
  .print-doc .footer, .print-doc .label { page-break-inside:avoid; break-inside:avoid; }
  .print-doc table { page-break-inside:auto; }
  .print-doc h1, .print-doc h2, .print-doc h3 { page-break-after:avoid; }
  .print-doc .totals td { border:none; padding:3px 9px; font-size:13px; }
  .print-doc .grand { font-weight:700; border-top:2px solid #0f172a !important; font-size:15px; }
  .print-doc .stamp { margin-top:36px; display:flex; justify-content:space-between; font-size:12px; }
  .print-doc .stamp .box { border:1px dashed #777; padding:28px 40px 6px; }
  .print-doc .qr { width:110px; height:110px; }
  .print-doc .label { width:320px; border:2px solid #0f172a; border-radius:10px; padding:12px; text-align:center; page-break-inside:avoid; margin:8px; display:inline-block; vertical-align:top; }
  .print-doc .muted { color:#666; font-size:11px; }
  .print-doc .footer { margin-top:26px; border-top:1px solid #bbb; padding-top:8px; padding-bottom:10px; font-size:11px; color:#666; text-align:center; }
`

// Urdu Nastaliq paints word tails BELOW the text line-box; when a
// document's last line sits flush with the element bottom, the PDF
// canvas ends mid-glyph and the footer looks "cut in half". The
// padding-bottom above reserves that painted space.
//
// html2canvas (the PDF rasterizer) implements its own simplified
// bidi: inside RTL documents it mirrors brackets — "(in)" becomes
// ")in(" — and reorders Latin words. CSS unicode-bidi is ignored by
// it, so every pure-Latin run is wrapped in <span dir="ltr"> at
// HTML-build time. In a real browser the span changes nothing.
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

function esc(s) {
  const raw = String(s ?? '')
  const out = raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  if (raw && !ARABIC_RE.test(raw) && /[A-Za-z0-9]/.test(raw)) return `<span dir="ltr">${out}</span>`
  return out
}

/** Escape for HTML attributes — never wraps in a span. */
function escAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Dates & numbers inside RTL documents keep LTR order in the PDF. */
function ltrDate(value) {
  return `<span dir="ltr">${escAttr(value ?? '')}</span>`
}

function docShell(title, bodyHtml, rtl) {
  return `<div class="print-doc" dir="${rtl ? 'rtl' : 'ltr'}">${bodyHtml}<div class="footer">${esc(title)}</div></div>`
}

// Every document carries the factory name — "Almakka Factory" in
// English mode, "المکہ فیکٹری" in Urdu mode (Settings override wins).
function companyHeader(company, docType, docNo, dateVal, lang = 'en') {
  const name = companyDisplayName(company, lang)
  return `<div class="doc-head">
    <div>
      <div class="doc-title">${esc(name)}</div>
      <div class="doc-sub">${esc(company?.address || '')}</div>
      <div class="doc-sub">${esc(company?.phone || '')}</div>
    </div>
    <div style="text-align:end">
      <div class="doc-title" style="font-size:18px">${esc(docType)}</div>
      <div class="doc-sub"># ${esc(docNo)}</div>
      <div class="doc-sub">${ltrDate(fmtDate(dateVal))}</div>
    </div>
  </div>`
}

function companyDisplayName(company, lang = 'en') {
  const custom = String(company?.name || '').trim()
  const builtin = ['marble manager', 'marble factory', 'almakka factory', 'المکہ فیکٹری']
  if (custom && !builtin.includes(custom.toLowerCase())) return custom
  return getFactoryName(lang)
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
  const taxIds = (company?.ntn || company?.strn)
    ? `<div class="muted">${company?.ntn ? `NTN: ${esc(company.ntn)}  ` : ''}${company?.strn ? `STRN: ${esc(company.strn)}` : ''}</div>`
    : ''
  const wht = Number(order.whtAmount) || 0
  const body = `
    ${companyHeader(company, lang === 'ur' ? 'بل' : 'TAX INVOICE', order.id, order.date, lang)}
    ${taxIds}
    ${partyBlock(lang === 'ur' ? 'گاہک' : 'Customer', customer)}
    <table><thead><tr><th>#</th><th>${rtl ? 'تفصیل' : 'Description'}</th><th>${rtl ? 'لمبائی × چوڑائی (فٹ)' : 'L × W (ft)'}</th>
    <th>${rtl ? 'تعداد' : 'Qty'}</th><th>${rtl ? 'سکوئر فٹ' : 'Sq ft'}</th><th>${rtl ? 'ریٹ' : 'Rate'}</th><th>${rtl ? 'رقم' : 'Amount'}</th></tr></thead>
    <tbody>${items}</tbody></table>
    <table class="totals"><tbody>
      <tr><td></td><td style="width:40%">${rtl ? 'آئٹمز کل' : 'Items total'}</td><td style="width:20%">${cur(t.itemsTotal)}</td></tr>
      <tr><td></td><td>${rtl ? 'کنارہ/تنصیب/ٹرانسپورٹ' : 'Edge / Installation / Transport'}</td><td>${cur(t.extras)}</td></tr>
      <tr><td></td><td>${rtl ? 'رعایت' : 'Discount'}</td><td>- ${cur(t.discount)}</td></tr>
      <tr><td></td><td>${rtl ? 'ٹیکس' : 'Tax'}</td><td>${cur(t.tax)}</td></tr>
      ${wht ? `<tr><td></td><td>${rtl ? 'وائیچ ایچ ٹی (WHT)' : 'WHT withheld'}</td><td>${cur(wht)}</td></tr>` : ''}
      <tr><td></td><td class="grand">${rtl ? 'کل' : 'Grand total'}</td><td class="grand">${cur(t.total + wht)}</td></tr>
      <tr><td></td><td>${rtl ? 'ادائیگی موصول' : 'Paid'}</td><td>${cur(order.paidAmount || 0)}</td></tr>
      <tr><td></td><td class="grand">${rtl ? 'بقایا' : 'Balance'}</td><td class="grand">${cur(t.total + wht - (order.paidAmount || 0))}</td></tr>
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
    ${companyHeader(company, lang === 'ur' ? 'ڈیلیوری چالان' : 'DELIVERY CHALLAN', order.id, order.date, lang)}
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
    ${companyHeader(company, lang === 'ur' ? 'تخمینہ' : 'QUOTATION', quote.id, quote.date, lang)}
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
    ${companyHeader(company, lang === 'ur' ? 'تنخواہ پرچی' : 'PAYSLIP', slip.id, slip.period, lang)}
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
    ${companyHeader(company, lang === 'ur' ? 'خریداری آرڈر' : 'PURCHASE ORDER', purchase.id, purchase.date, lang)}
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
      <img class="qr" src="${qrDataUrl}" alt="QR ${escAttr(record.id)}" />
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
  const body = `
    ${companyHeader(null, title, '', new Date(), lang)}
    <table><thead><tr>${head}</tr></thead><tbody>${bodyRows}</tbody></table>`
  return docShell(title, body, rtl)
}

/** Shared with useExport — escape + LTR-isolate pure-Latin runs. */
export { esc as escBidi }

/** Generic table PDFs get the same factory letterhead as invoices. */
export function wrapStyled(html, { title, lang = 'en' }) {
  const rtl = lang === 'ur'
  const head = companyHeader(null, title, '', new Date(), lang)
  return `<style>${baseCss(rtl)}</style>${docShell(title, head + html, rtl)}`
}

/* ═════════════ v2.4 documents — work order · gate pass · receipt ·
   statement of account · GRN · batch invoices ═════════════ */

export function workOrderHTML({ workOrder, customer, company, lang = 'en' }) {
  const rtl = lang === 'ur'
  const row = (label, val) => `<tr><td style="width:35%"><b>${esc(label)}</b></td><td>${esc(val ?? '—')}</td></tr>`
  const body = `
    ${companyHeader(company, rtl ? 'ورک آرڈر' : 'WORK ORDER', workOrder.id, workOrder.date, lang)}
    ${partyBlock(rtl ? 'گاہک' : 'Customer', customer)}
    <table><tbody>
      ${row(rtl ? 'بلاک' : 'Block', workOrder.blockId)}
      ${row(rtl ? 'سائز' : 'Slab size', workOrder.slabSize)}
      ${row(rtl ? 'موشتائی (mm)' : 'Thickness (mm)', workOrder.thicknessMm)}
      ${row(rtl ? 'فنش' : 'Finish', workOrder.finish)}
      ${row(rtl ? 'تعداد (سلابز)' : 'Slabs to cut', workOrder.slabsQty)}
      ${row(rtl ? 'پلانڈ sq ft' : 'Planned sq ft', workOrder.plannedSqft)}
      ${row(rtl ? 'سپروائزر' : 'Supervisor', workOrder.supervisor)}
      ${row(rtl ? 'مشین' : 'Machine', workOrder.machineName)}
      ${row(rtl ? 'ترجیح' : 'Priority', workOrder.priority)}
      ${row(rtl ? 'آخری تاریخ' : 'Due date', fmtDate(workOrder.dueDate))}
    </tbody></table>
    ${workOrder.instructions ? `<div style="margin-top:10px"><b>${rtl ? 'ہدایات' : 'Instructions'}:</b><div class="muted">${esc(workOrder.instructions)}</div></div>` : ''}
    <div class="stamp"><div class="box">${rtl ? 'سپروائزر دستخط' : 'Supervisor'}</div><div class="box">${rtl ? 'فیکٹری مینیجر' : 'Factory manager'}</div></div>`
  return docShell(rtl ? 'ورک آرڈر' : 'Work Order', body, rtl)
}

export function gatePassHTML({ pass, company, lang = 'en' }) {
  const rtl = lang === 'ur'
  const row = (label, val) => `<tr><td style="width:35%"><b>${esc(label)}</b></td><td>${esc(val ?? '—')}</td></tr>`
  const body = `
    ${companyHeader(company, rtl ? 'گیٹ پاس' : 'GATE PASS', pass.id, pass.date, lang)}
    <table><tbody>
      ${row(rtl ? 'قسم' : 'Type', pass.type)}
      ${row(rtl ? 'آرڈر' : 'Order ref', pass.orderRef)}
      ${row(rtl ? 'گاہک' : 'Customer', pass.customerName)}
      ${row(rtl ? 'سامان' : 'Goods', pass.goodsDesc)}
      ${row(rtl ? 'تعداد' : 'Qty', `${pass.qty ?? '—'} ${pass.unit || ''}`)}
      ${row(rtl ? 'سکوئر فٹ' : 'Sq ft', pass.sqft)}
      ${row(rtl ? 'گاڑی نمبر' : 'Vehicle no.', pass.vehicleNo)}
      ${row(rtl ? 'ڈرائیور' : 'Driver', pass.driver ? `${pass.driver} — ${pass.driverPhone || ''}` : '—')}
      ${row(rtl ? 'منزل' : 'Destination', pass.destination)}
      ${row(rtl ? 'وصول کنندہ' : 'Receiver', pass.receiverName ? `${pass.receiverName} — ${pass.receiverPhone || ''}` : '—')}
      ${row(rtl ? 'جاری کرنے والا' : 'Issued by', pass.issuedBy)}
    </tbody></table>
    ${pass.receiverSign ? `<div style="margin-top:14px"><b>${rtl ? 'دستخط' : 'Receiver signature'}:</b><br/><img src="${escAttr(pass.receiverSign)}" style="height:70px" /></div>` : ''}
    <div class="stamp"><div class="box">${rtl ? 'گیٹ کیپر' : 'Gate keeper'}</div><div class="box">${rtl ? 'وارنٹ' : 'Stamp'}</div></div>`
  return docShell(rtl ? 'گیٹ پاس' : 'Gate Pass', body, rtl)
}

export function receiptHTML({ receipt, party, company, lang = 'en' }) {
  const rtl = lang === 'ur'
  const cur = (v) => fmtCurrency(v, { currency: company?.currency || 'PKR', lang })
  const body = `
    ${companyHeader(company, rtl ? 'رسید' : 'RECEIPT', receipt.id, receipt.date, lang)}
    ${partyBlock(rtl ? 'فریق' : 'Party', party || { name: receipt.partyName })}
    <table><tbody>
      <tr><td><b>${rtl ? 'قسم' : 'Direction'}</b></td><td>${receipt.direction === 'in' ? (rtl ? 'وصول شدہ' : 'Received FROM party') : (rtl ? 'ادا شدہ' : 'Paid TO party')}</td></tr>
      <tr><td><b>${rtl ? 'رقم' : 'Amount'}</b></td><td class="grand">${cur(receipt.amount)}</td></tr>
      <tr><td><b>${rtl ? 'طریقہ' : 'Method'}</b></td><td>${esc(receipt.method)}${receipt.referenceNo ? ` — ${esc(receipt.referenceNo)}` : ''}</td></tr>
      ${receipt.bankName ? `<tr><td><b>${rtl ? 'بینک' : 'Bank'}</b></td><td>${esc(receipt.bankName)}</td></tr>` : ''}
      ${receipt.orderRef ? `<tr><td><b>${rtl ? 'آرڈر' : 'Against order'}</b></td><td>${esc(receipt.orderRef)}</td></tr>` : ''}
      ${receipt.receivedBy ? `<tr><td><b>${rtl ? 'وصول کنندہ' : 'Received by'}</b></td><td>${esc(receipt.receivedBy)}</td></tr>` : ''}
      ${receipt.notes ? `<tr><td><b>${rtl ? 'نوٹس' : 'Notes'}</b></td><td>${esc(receipt.notes)}</td></tr>` : ''}
    </tbody></table>
    <div class="stamp"><div class="box">${rtl ? 'دستخط' : 'Signature'}</div><div class="box">${rtl ? 'مہر' : 'Company stamp'}</div></div>`
  return docShell(rtl ? 'رسید' : 'Receipt', body, rtl)
}

export function statementHTML({ party, type, rows, opening, closing, company, lang = 'en' }) {
  const rtl = lang === 'ur'
  const cur = (v) => fmtCurrency(v, { currency: company?.currency || 'PKR', lang })
  const title = rtl
    ? `اکاؤنٹ اسٹیٹمنٹ — ${type === 'customer' ? 'گاہک' : type === 'supplier' ? 'سپلائر' : 'مزدور'}`
    : `Statement of account — ${type}`
  const bodyRows = (rows || []).map((r) =>
    `<tr><td>${ltrDate(fmtDate(r.date))}</td><td>${esc(r.type)}</td><td>${esc(r.ref || '')}</td>
     <td>${r.debit ? cur(r.debit) : ''}</td><td>${r.credit ? cur(r.credit) : ''}</td><td><b>${cur(r.balance)}</b></td></tr>`).join('')
  const body = `
    ${companyHeader(company, title, party?.id || '', new Date(), lang)}
    ${partyBlock(rtl ? 'فریق' : 'Party', party)}
    <table><thead><tr>
      <th>${rtl ? 'تاریخ' : 'Date'}</th><th>${rtl ? 'تفصیل' : 'Description'}</th><th>${rtl ? 'ہوالا' : 'Ref'}</th>
      <th>${rtl ? 'اس پر' : 'Debit'}</th><th>${rtl ? 'اس کو' : 'Credit'}</th><th>${rtl ? 'بیلنس' : 'Balance'}</th>
    </tr></thead><tbody>
      <tr><td></td><td><b>${rtl ? 'ابتدائی بیلنس' : 'Opening balance'}</b></td><td></td><td></td><td></td><td><b>${cur(opening)}</b></td></tr>
      ${bodyRows}
    </tbody></table>
    <table class="totals"><tbody>
      <tr><td></td><td style="width:40%" class="grand">${rtl ? 'اختتامی بیلنس' : 'Closing balance'}</td><td style="width:20%" class="grand">${cur(closing)}</td></tr>
    </tbody></table>
    <div class="stamp"><div class="box">${rtl ? 'مہر' : 'Company stamp'}</div><div class="box">${rtl ? 'دستخط' : 'Authorised signature'}</div></div>`
  return docShell(title, body, rtl)
}

export function grnHTML({ grn, supplier, company, lang = 'en' }) {
  const rtl = lang === 'ur'
  const row = (label, val) => `<tr><td style="width:35%"><b>${esc(label)}</b></td><td>${esc(val ?? '—')}</td></tr>`
  const body = `
    ${companyHeader(company, rtl ? 'گوڈز ریسیوڈ نوٹ' : 'GOODS RECEIVED NOTE', grn.id, grn.date, lang)}
    ${partyBlock(rtl ? 'سپلائر' : 'Supplier', supplier)}
    <table><tbody>
      ${row(rtl ? 'خریداری آرڈر' : 'Against PO', grn.purchaseRef)}
      ${row(rtl ? 'لاٹ' : 'Lot', grn.lotNo)}
      ${row(rtl ? 'بلاکس وصول' : 'Blocks received', grn.qtyBlocks)}
      ${row(rtl ? 'سلابز وصول' : 'Slabs received', grn.qtySlabs)}
      ${row(rtl ? 'حالت' : 'Condition', grn.condition)}
      ${row(rtl ? 'وصول کنندہ' : 'Received by', grn.receivedBy)}
      ${row(rtl ? 'تصدیق' : 'Verified by', grn.verifiedBy)}
      ${row(rtl ? 'فرق' : 'Discrepancies', grn.discrepancies)}
    </tbody></table>
    <div class="stamp"><div class="box">${rtl ? 'یارڈ سپروائزر' : 'Yard supervisor'}</div><div class="box">${rtl ? 'ڈرائیور' : 'Driver'}</div></div>`
  return docShell(rtl ? 'GRN' : 'GRN', body, rtl)
}

/** Batch invoices — many orders, one combined PDF. */
export function batchInvoicesHTML({ orders = [], company, lang = 'en' }) {
  const rtl = lang === 'ur'
  const parts = orders.map((o, i) => {
    const inner = invoiceHTML({
      order: o,
      customer: company?.customerById?.[o.customerName] || { name: o.customerName },
      company,
      lang,
    })
    const sep = i < orders.length - 1 ? '<div style="page-break-after:always"></div>' : ''
    return inner + sep
  })
  return `<div dir="${rtl ? 'rtl' : 'ltr'}">${parts.join('')}</div>`
}
