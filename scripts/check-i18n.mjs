// Quick i18n consistency audit: finds t('x.y') keys used in src that
// are missing from either locale, and keys present in only one locale.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = new URL('../src', import.meta.url).pathname

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, files)
    else if (['.jsx', '.js'].includes(extname(p))) files.push(p)
  }
  return files
}

// collect t('…') literals
const used = new Set()
for (const f of walk(ROOT)) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(/\bt\(\s*['"`]([^'"`]+)['"`]/g)) used.add(m[1])
  for (const m of src.matchAll(/\bt\(\s*`([^`$]+)`/g)) used.add(m[1]) // template w/o vars
}
// dynamic prefixes used in pages — expand manually for known enums
for (const en of ['skill', 'rateType', 'machineType', 'maintenanceType', 'expenseCategory',
  'partnerType', 'utilityType', 'supplierType', 'sellBy', 'movement', 'finish', 'edge', 'grade', 'status']) {
  used.add(`enums.${en}`)
}

const { en } = await import(join(ROOT, 'i18n/locales/en.js')).catch(async () => await import(ROOT + '/i18n/locales/en.js'))
const { ur } = await import(join(ROOT, 'i18n/locales/ur.js'))

const get = (obj, path) => path.split('.').reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), obj)
const flatKeys = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  v && typeof v === 'object' ? flatKeys(v, prefix + k + '.') : [prefix + k])

const enKeys = new Set(flatKeys(en))
const urKeys = new Set(flatKeys(ur))

const missingInEn = [...used].filter((k) => get(en, k) === undefined && !k.includes('${'))
const missingInUr = [...used].filter((k) => get(ur, k) === undefined && !k.includes('${'))
const onlyEn = [...enKeys].filter((k) => !urKeys.has(k))
const onlyUr = [...urKeys].filter((k) => !enKeys.has(k))

console.log('used keys checked:', used.size)
console.log('MISSING IN EN  :', missingInEn.length ? missingInEn : 'none')
console.log('MISSING IN UR  :', missingInUr.length ? missingInUr : 'none')
console.log('ONLY IN EN     :', onlyEn.length ? onlyEn : 'none')
console.log('ONLY IN UR     :', onlyUr.length ? onlyUr : 'none')
