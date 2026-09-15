/** Static reports placeholder data — charts and summary numbers are fake. */
import { Banknote, Layers, Percent, TrendingUp } from 'lucide-react'

export const weeklyProduction = [
  { label: { ur: 'پیر', en: 'Mon' }, value: 180 },
  { label: { ur: 'منگل', en: 'Tue' }, value: 210 },
  { label: { ur: 'بدھ', en: 'Wed' }, value: 165 },
  { label: { ur: 'جمعرات', en: 'Thu' }, value: 220 },
  { label: { ur: 'جمعہ', en: 'Fri' }, value: 195 },
  { label: { ur: 'ہفتہ', en: 'Sat' }, value: 240 },
  { label: { ur: 'اتوار', en: 'Sun' }, value: 120 },
]

export const monthlyProduction = [
  { label: { ur: 'اپریل', en: 'Apr' }, value: 3200 },
  { label: { ur: 'مئی', en: 'May' }, value: 3100 },
  { label: { ur: 'جون', en: 'Jun' }, value: 3800 },
  { label: { ur: 'جولائی', en: 'Jul' }, value: 3550 },
  { label: { ur: 'اگست', en: 'Aug' }, value: 3900 },
  { label: { ur: 'ستمبر', en: 'Sep' }, value: 4150 },
]

export const slabTypes = [
  { label: { ur: 'سفید ماربل', en: 'White Marble' }, value: 45, color: '#1E3A8A' },
  { label: { ur: 'سرمئی ماربل', en: 'Grey Marble' }, value: 30, color: '#D97706' },
  { label: { ur: 'زرد ماربل', en: 'Yellow Marble' }, value: 15, color: '#10B981' },
  { label: { ur: 'دیگر اقسام', en: 'Others' }, value: 10, color: '#6B7280' },
]

export const reportSummary = [
  {
    labelKey: 'rep.totalProduction',
    value: '1,240',
    unit: { ur: 'ٹکڑے', en: 'pieces' },
    icon: TrendingUp,
    cls: 'text-primary dark:text-primary-light',
  },
  {
    labelKey: 'rep.slabsUsed',
    value: '86',
    unit: { ur: 'سلیبز', en: 'slabs' },
    icon: Layers,
    cls: 'text-accent dark:text-accent-light',
  },
  {
    labelKey: 'rep.revenue',
    value: '1,250,000',
    unit: { ur: 'روپے', en: 'PKR' },
    icon: Banknote,
    cls: 'text-success',
  },
  {
    labelKey: 'rep.wasteRate',
    value: '8.5',
    unit: '%',
    icon: Percent,
    cls: 'text-error',
  },
]
