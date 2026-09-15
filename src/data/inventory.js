/** Static inventory placeholder data + form dropdown options. */

export const inventoryItems = [
  { id: 'MB-001', size: { ur: '8 × 4 فٹ', en: '8 × 4 ft' }, thickness: { ur: '18 ملی میٹر', en: '18 mm' }, quantity: 25, location: { ur: 'گودام اے', en: 'Warehouse A' }, low: false },
  { id: 'MB-002', size: { ur: '10 × 5 فٹ', en: '10 × 5 ft' }, thickness: { ur: '20 ملی میٹر', en: '20 mm' }, quantity: 12, location: { ur: 'گودام ب', en: 'Warehouse B' }, low: false },
  { id: 'MB-003', size: { ur: '7 × 3.5 فٹ', en: '7 × 3.5 ft' }, thickness: { ur: '16 ملی میٹر', en: '16 mm' }, quantity: 4, location: { ur: 'کٹنگ ایریا', en: 'Cutting Area' }, low: true },
  { id: 'MB-004', size: { ur: '9 × 4 فٹ', en: '9 × 4 ft' }, thickness: { ur: '18 ملی میٹر', en: '18 mm' }, quantity: 18, location: { ur: 'گودام اے', en: 'Warehouse A' }, low: false },
  { id: 'MB-005', size: { ur: '6 × 3 فٹ', en: '6 × 3 ft' }, thickness: { ur: '15 ملی میٹر', en: '15 mm' }, quantity: 3, location: { ur: 'لڈنگ زون', en: 'Loading Zone' }, low: true },
  { id: 'MB-006', size: { ur: '12 × 6 فٹ', en: '12 × 6 ft' }, thickness: { ur: '25 ملی میٹر', en: '25 mm' }, quantity: 9, location: { ur: 'گودام ب', en: 'Warehouse B' }, low: false },
]

export const sizeOptions = [
  { ur: '8 × 4 فٹ', en: '8 × 4 ft' },
  { ur: '10 × 5 فٹ', en: '10 × 5 ft' },
  { ur: '7 × 3.5 فٹ', en: '7 × 3.5 ft' },
  { ur: '9 × 4 فٹ', en: '9 × 4 ft' },
  { ur: '6 × 3 فٹ', en: '6 × 3 ft' },
  { ur: '12 × 6 فٹ', en: '12 × 6 ft' },
]

export const thicknessOptions = [
  { ur: '15 ملی میٹر', en: '15 mm' },
  { ur: '16 ملی میٹر', en: '16 mm' },
  { ur: '18 ملی میٹر', en: '18 mm' },
  { ur: '20 ملی میٹر', en: '20 mm' },
  { ur: '25 ملی میٹر', en: '25 mm' },
]

export const locationOptions = [
  { ur: 'گودام اے', en: 'Warehouse A' },
  { ur: 'گودام ب', en: 'Warehouse B' },
  { ur: 'کٹنگ ایریا', en: 'Cutting Area' },
  { ur: 'لڈنگ زون', en: 'Loading Zone' },
]
