/** Static About-page placeholder data. */
import { CheckCircle2 } from 'lucide-react'

export const appFeatures = [
  { ur: 'سلیب کٹنگ کا آسان حساب کتاب', en: 'Easy slab cutting calculator' },
  { ur: 'ذخیرے کی مکمل نگرانی', en: 'Complete inventory tracking' },
  { ur: 'ہفتہ وار اور ماہانہ رپورٹس', en: 'Weekly and monthly reports' },
  { ur: 'آف لائن استعمال کی سہولت (PWA)', en: 'Works offline (PWA)' },
  { ur: 'مکمل اردو انٹرفیس (RTL)', en: 'Full Urdu interface (RTL)' },
]

export const factoryInfo = {
  name: { ur: 'المکہ ماربل فیکٹری', en: 'Al-Makkah Marble Factory' },
  address: { ur: 'خیبر پختونخوا، پاکستان', en: 'KPK, Pakistan' },
  phone: '+92 000 000 0000',
  email: 'info@marblefactory.pk',
}

/**
 * Management team — co-founders first, then further designations.
 * names/designations render with .urdu-text (Nastaliq-safe spacing).
 */
export const managementTeam = [
  {
    name: { ur: 'زیاد خان', en: 'Ziyad Khan' },
    designation: { ur: 'شریک بانی', en: 'Co-Founder' },
    founder: true,
  },
  {
    name: { ur: 'امتیاز خان', en: 'Imtiaz Khan' },
    designation: { ur: 'شریک بانی', en: 'Co-Founder' },
    founder: true,
  },
]

/** Further factory designations shown on the About page. */
export const factoryDesignations = [
  { ur: 'فیکٹری مینیجر', en: 'Factory Manager' },
  { ur: 'اکاؤنٹنٹ', en: 'Accountant' },
  { ur: 'سپروائزر', en: 'Supervisor' },
  { ur: 'ماسٹر مہرم', en: 'Master Craftsman' },
  { ur: 'سیلز انچارج', en: 'Sales In-charge' },
  { ur: 'ذخیرہ نگار', en: 'Store Keeper' },
]

export const featureIcon = CheckCircle2
