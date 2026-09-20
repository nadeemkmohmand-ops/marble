import QRCode from 'qrcode'

/** QR data-URL for slab/block labels. Falls back to blank on failure. */
export async function makeQR(text, { size = 220, dark = '#0f172a', light = '#ffffff' } = {}) {
  try {
    return await QRCode.toDataURL(String(text || ''), {
      width: size,
      margin: 1,
      color: { dark, light },
      errorCorrectionLevel: 'M',
    })
  } catch {
    return ''
  }
}

/** Resolve a scanned/typed code to { collection, id } — e.g. SLB-XXXX or a full URL. */
export function parseScanCode(raw) {
  const s = String(raw || '').trim()
  if (!s) return null
  const idLike = s.split(/[/?#]/).filter(Boolean).pop()
  const m = idLike?.match(/^(BLK|SLB|OFF|ORD|QTN|CUS|WRK|PUR|SUP|MCH|EXP|MOV)-/i)
  if (!m) return null
  const table = { BLK: 'blocks', SLB: 'slabs', OFF: 'offcuts', ORD: 'orders', QTN: 'quotations', CUS: 'customers', WRK: 'workers', PUR: 'purchases', SUP: 'suppliers', MCH: 'machines', EXP: 'expenses', MOV: 'movements' }
  const key = m[1].toUpperCase()
  return { collection: table[key], id: idLike }
}
