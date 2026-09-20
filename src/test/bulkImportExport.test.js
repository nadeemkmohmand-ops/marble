import { describe, expect, it, beforeEach } from 'vitest'
import * as XLSX from 'xlsx'
import { importableFields, parseUploadedFile, importRows } from '../utils/bulkImportExport.js'
import { db } from '../services/db.js'

// Minimal synthetic CrudPage config — mirrors the shape real pages pass,
// without depending on any specific page module.
const config = {
  collection: 'suppliers',
  i18nPrefix: 'suppliers',
  fields: [
    { key: 'name', required: true },
    { key: 'phone', type: 'tel' },
    { key: 'type', type: 'select', enumPrefix: 'supplierType', options: [{ value: 'marble_yard' }, { value: 'transport' }] },
    { key: 'balance', type: 'number' },
    { key: 'photos', type: 'photo' }, // must be excluded from the template
    { key: 'id', type: 'readonly' }, // must be excluded from the template
  ],
}

const t = (key, params) => {
  const dict = {
    'suppliers.name': 'Name',
    'suppliers.phone': 'Phone',
    'suppliers.type': 'Type',
    'suppliers.balance': 'Balance',
    'enums.supplierType.marble_yard': 'Marble yard',
    'enums.supplierType.transport': 'Transport',
    'suppliers.title': 'Suppliers',
    'import.rowMissing': `Row ${params?.row}: missing ${params?.fields}`,
    'import.emptyFile': 'The file has no rows',
  }
  return dict[key] ?? key
}

function makeXlsxFile(rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new File([buf], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

describe('bulkImportExport', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('importableFields excludes photo and readonly fields', () => {
    const fields = importableFields(config)
    const keys = fields.map((f) => f.key)
    expect(keys).toEqual(['name', 'phone', 'type', 'balance'])
  })

  it('parses a filled template back into records, matching select labels', async () => {
    const file = makeXlsxFile([
      ['Name', 'Phone', 'Type', 'Balance'],
      ['Al-Falah Traders', '03001234567', 'Marble yard', 50000],
      ['Speedy Transport', '03111234567', 'Transport', 0],
    ])
    const { rows, errors } = await parseUploadedFile(file, { config, t, lang: 'en' })
    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ name: 'Al-Falah Traders', phone: '03001234567', type: 'marble_yard', balance: 50000 })
    expect(rows[1]).toMatchObject({ name: 'Speedy Transport', type: 'transport', balance: 0 })
  })

  it('flags rows missing a required field instead of silently importing them', async () => {
    const file = makeXlsxFile([
      ['Name', 'Phone', 'Type', 'Balance'],
      ['', '03001234567', 'Marble yard', 50000], // name is required
      ['Speedy Transport', '', 'Transport', 0],
    ])
    const { rows, errors } = await parseUploadedFile(file, { config, t, lang: 'en' })
    expect(rows).toHaveLength(1)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Row 2')
  })

  it('ignores fully blank rows', async () => {
    const file = makeXlsxFile([
      ['Name', 'Phone', 'Type', 'Balance'],
      ['Al-Falah Traders', '0300', 'Marble yard', 100],
      ['', '', '', ''],
    ])
    const { rows } = await parseUploadedFile(file, { config, t, lang: 'en' })
    expect(rows).toHaveLength(1)
  })

  it('importRows actually persists to the given collection via db.save', async () => {
    const file = makeXlsxFile([
      ['Name', 'Phone', 'Type', 'Balance'],
      ['Al-Falah Traders', '0300', 'Marble yard', 100],
    ])
    const { rows } = await parseUploadedFile(file, { config, t, lang: 'en' })
    const count = importRows('suppliers', rows)
    expect(count).toBe(1)
    const saved = db.list('suppliers')
    expect(saved).toHaveLength(1)
    expect(saved[0].name).toBe('Al-Falah Traders')
    expect(saved[0].id).toBeTruthy() // got a real generated id, not left blank
  })

  it('reports an empty file instead of crashing', async () => {
    const file = makeXlsxFile([])
    const { rows, errors } = await parseUploadedFile(file, { config, t, lang: 'en' })
    expect(rows).toEqual([])
    expect(errors[0]).toBe('The file has no rows')
  })
})
