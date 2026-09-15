/** Static expenses placeholder data (Expenses page — placeholder only). */

export const expenseSummary = [
  { labelKey: 'expenses.electricity', value: 85000 },
  { labelKey: 'expenses.labor', value: 320000 },
  { labelKey: 'expenses.transport', value: 60000 },
]

export const expenseRows = [
  {
    id: 'EX-41',
    date: '2026-09-12',
    category: { ur: 'بجلی', en: 'Electricity' },
    amount: 45000,
    note: { ur: 'سپٹ کلیمپنگ بل', en: 'Split + clamping bill' },
  },
  {
    id: 'EX-40',
    date: '2026-09-10',
    category: { ur: 'مزدوری', en: 'Labor' },
    amount: 80000,
    note: { ur: 'ہفتہ وار اجرت', en: 'Weekly wages' },
  },
  {
    id: 'EX-39',
    date: '2026-09-08',
    category: { ur: 'ٹرانسپورٹ', en: 'Transport' },
    amount: 25000,
    note: { ur: 'ڈیلیوری ٹرک دیزل', en: 'Delivery truck diesel' },
  },
  {
    id: 'EX-38',
    date: '2026-09-05',
    category: { ur: 'دیگر', en: 'Other' },
    amount: 12000,
    note: { ur: 'مشین آئل', en: 'Machine oil' },
  },
]
