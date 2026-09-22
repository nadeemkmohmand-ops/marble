import React, { useMemo, useState } from 'react'
import {
  Blocks, ArrowUpDown, ArrowUp, ArrowDown, Save, Printer, FolderOpen, X, Database, Columns3, Filter, Wand2,
} from 'lucide-react'

import Toolbar from '../components/UI/Toolbar'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Table from '../components/UI/Table'
import Card from '../components/UI/Card'
import StatCard from '../components/UI/StatCard'
import ExportMenu from '../components/UI/ExportMenu'
import EmptyState from '../components/States/EmptyState'
import { useLang } from '../context/LanguageContext'
import { useAppUI } from '../context/AppUIContext'
import { useToast } from '../context/ToastContext'
import { db } from '../services/db'
import { storage } from '../utils/storage'
import { fmtNumber } from '../utils/formatters'
import { cn } from '../utils/cn'

/**
 * ReportBuilder — pick any whitelisted collection, choose columns,
 * optionally filter (equals / not equals / contains / > / < / empty /
 * not empty), sort, then preview, export, print or save the report
 * layout for reuse (localStorage 'marble.savedReports').
 */
const REPORT_SOURCES = [
  ['slabs', 'Slabs'], ['blocks', 'Blocks'], ['offcuts', 'Offcuts'], ['orders', 'Orders'],
  ['quotations', 'Quotations'], ['customers', 'Customers'], ['suppliers', 'Suppliers'],
  ['purchases', 'Purchases'], ['workers', 'Workers'], ['expenses', 'Expenses'],
  ['receipts', 'Receipts'], ['vehicles', 'Vehicles'], ['trips', 'Trips'],
  ['installationJobs', 'Installation'], ['complaints', 'Complaints'], ['jobCards', 'Job Cards'],
]

const OPS = [
  ['equals', 'equals'], ['not_equals', 'not equals'], ['contains', 'contains'],
  ['gt', '>'], ['lt', '<'], ['empty', 'is empty'], ['not_empty', 'is not empty'],
]

const SAVED_REPORTS_KEY = 'marble.savedReports'
const PREVIEW_CAP = 100
const PRINT_CAP = 300

const isEmpty = (v) => v === '' || v === null || v === undefined
const bothNumeric = (a, b) => !isEmpty(a) && !isEmpty(b) && !Number.isNaN(Number(a)) && !Number.isNaN(Number(b))

/** Apply one filter op against a row value. Numbers compare numerically when both sides are numeric. */
function matchOp(value, op, raw) {
  switch (op) {
    case 'equals':
      return bothNumeric(value, raw) ? Number(value) === Number(raw) : String(value ?? '') === String(raw)
    case 'not_equals':
      return bothNumeric(value, raw) ? Number(value) !== Number(raw) : String(value ?? '') !== String(raw)
    case 'contains':
      return String(value ?? '').toLowerCase().includes(String(raw ?? '').toLowerCase())
    case 'gt':
      return bothNumeric(value, raw) ? Number(value) > Number(raw) : String(value ?? '') > String(raw ?? '')
    case 'lt':
      return bothNumeric(value, raw) ? Number(value) < Number(raw) : String(value ?? '') < String(raw ?? '')
    case 'empty':
      return isEmpty(value)
    case 'not_empty':
      return !isEmpty(value)
    default:
      return true
  }
}

/** Cell renderer — numbers keep the num class, objects stringify. */
function Cell({ value }) {
  if (isEmpty(value)) return <span className="text-[var(--muted)]">—</span>
  if (typeof value === 'number') return <span className="num">{fmtNumber(value)}</span>
  if (typeof value === 'boolean') return <span>{value ? '✓' : '—'}</span>
  if (typeof value === 'object') return <span className="text-xs">[{Array.isArray(value) ? `${value.length} items` : 'object'}]</span>
  return <span>{String(value)}</span>
}

function Step({ n, title, icon: Icon, children }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="h-6 w-6 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] grid place-items-center text-xs font-bold num">{n}</span>
        <h3 className="font-semibold text-sm leading-urdu no-clip">{title}</h3>
        {Icon && <Icon size={14} className="text-[var(--muted)]" />}
      </div>
      {children}
    </div>
  )
}

export default function ReportBuilder() {
  const { lang, fmtNum } = useLang()
  const { requestPrint } = useAppUI()
  const toast = useToast()

  const [col, setCol] = useState('')
  const [rows, setRows] = useState([])
  const [selectedCols, setSelectedCols] = useState([])
  const [fField, setFField] = useState('')
  const [fOp, setFOp] = useState('equals')
  const [fValue, setFValue] = useState('')
  const [sortCol, setSortCol] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [reportName, setReportName] = useState('')
  const [saved, setSaved] = useState(() => storage.get(SAVED_REPORTS_KEY, []))

  const sourceLabel = (key) => REPORT_SOURCES.find(([k]) => k === key)?.[1] || key

  const pickCollection = (key) => {
    setCol(key)
    setRows(key ? db.list(key) : [])
    setSelectedCols([])
    setFField('')
    setFOp('equals')
    setFValue('')
    setSortCol('')
    setSortDir('asc')
  }

  const availableCols = useMemo(() => {
    const set = new Set()
    rows.slice(0, 50).forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k)))
    return [...set]
  }, [rows])

  const toggleCol = (c) =>
    setSelectedCols((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const filtered = useMemo(() => {
    if (!fField || fOp === 'empty' || fOp === 'not_empty') {
      if (!fField) return rows
      return rows.filter((r) => matchOp(r[fField], fOp, ''))
    }
    return rows.filter((r) => matchOp(r[fField], fOp, fValue))
  }, [rows, fField, fOp, fValue])

  const sorted = useMemo(() => {
    if (!sortCol) return filtered
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const va = a[sortCol]
      const vb = b[sortCol]
      if (bothNumeric(va, vb)) return (Number(va) - Number(vb)) * dir
      return String(va ?? '').localeCompare(String(vb ?? '')) * dir
    })
  }, [filtered, sortCol, sortDir])

  const previewRows = sorted.slice(0, PREVIEW_CAP)
  const previewColumns = selectedCols.map((c) => ({
    key: c,
    label: c,
    render: (r) => <Cell value={r ? r[c] : undefined} />,
  }))

  const saveReport = () => {
    if (!col || selectedCols.length === 0) {
      toast.error(lang === 'ur' ? 'پہلے کلیکشن اور کالم منتخب کریں' : 'Pick a collection and columns first')
      return
    }
    const config = {
      name: reportName.trim() || `${sourceLabel(col)} report`,
      collection: col,
      columns: selectedCols,
      filter: fField ? { field: fField, op: fOp, value: fValue } : null,
      sort: sortCol ? { col: sortCol, dir: sortDir } : null,
    }
    const next = [...saved.filter((r) => r.name !== config.name), config]
    storage.set(SAVED_REPORTS_KEY, next)
    setSaved(next)
    setReportName('')
    toast.success(lang === 'ur' ? 'رپورٹ محفوظ ہو گئی' : 'Report saved')
  }

  const loadReport = (rep) => {
    setCol(rep.collection)
    setRows(rep.collection ? db.list(rep.collection) : [])
    setSelectedCols(Array.isArray(rep.columns) ? rep.columns : [])
    setFField(rep.filter?.field || '')
    setFOp(rep.filter?.op || 'equals')
    setFValue(rep.filter?.value ?? '')
    setSortCol(rep.sort?.col || '')
    setSortDir(rep.sort?.dir || 'asc')
  }

  const deleteReport = (rep) => {
    const next = saved.filter((r) => r.name !== rep.name)
    storage.set(SAVED_REPORTS_KEY, next)
    setSaved(next)
  }

  const printReport = () => {
    requestPrint({
      template: 'stockReport',
      title: reportName.trim() || sourceLabel(col),
      lang,
      data: {
        rows: sorted.slice(0, PRINT_CAP),
        columns: selectedCols.map((c) => ({ key: c, label: c })),
        title: reportName.trim() || sourceLabel(col),
      },
    })
  }

  const stats = [
    { label: lang === 'ur' ? 'کل قطاریں' : 'Rows total', value: rows.length, icon: Database, tone: 'info' },
    { label: lang === 'ur' ? 'فلٹر کے بعد' : 'After filter', value: filtered.length, icon: Filter, tone: 'brand' },
    { label: lang === 'ur' ? 'منتخب کالم' : 'Columns selected', value: selectedCols.length, icon: Columns3, tone: 'warning' },
    { label: lang === 'ur' ? 'محفوظ رپورٹس' : 'Saved reports', value: saved.length, icon: Wand2, tone: 'success' },
  ]

  return (
    <div className="fade-in">
      <Toolbar
        title={lang === 'ur' ? 'رپورٹ بلڈر' : 'Report Builder'}
        description={lang === 'ur' ? 'کسی بھی ڈیٹا سے اپنی رپورٹ بنائیں — کالم، فلٹر، ترتیب' : 'Build a custom report from any collection — columns, filter, sort'}
        actions={
          <>
            {col && selectedCols.length > 0 && (
              <ExportMenu
                title={reportName.trim() || sourceLabel(col)}
                columns={selectedCols.map((c) => ({ key: c, label: c }))}
                rows={sorted}
              />
            )}
            {col && selectedCols.length > 0 && (
              <Button variant="secondary" icon={Printer} onClick={printReport}>
                <span className="hidden sm:inline">{lang === 'ur' ? 'پرنٹ' : 'Print'}</span>
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {stats.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <Step n={1} title={lang === 'ur' ? 'کلیکشن منتخب کریں' : 'Pick a collection'} icon={Blocks}>
          <Select
            value={col}
            onChange={(e) => pickCollection(e.target.value)}
            placeholder={lang === 'ur' ? 'کلیکشن…' : 'Collection…'}
            options={REPORT_SOURCES.map(([value, label]) => ({ value, label }))}
          />
        </Step>

        <Step n={2} title={lang === 'ur' ? 'کالم چنیں' : 'Choose columns'} icon={Columns3}>
          {col ? (
            availableCols.length ? (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {availableCols.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      'btn btn-ghost h-7 px-2 text-xs',
                      selectedCols.includes(c) && 'bg-[var(--accent-soft)] text-[var(--accent)]',
                    )}
                    onClick={() => toggleCol(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title={lang === 'ur' ? 'اس کلیکشن میں ڈیٹا نہیں' : 'No data in this collection'} />
            )
          ) : (
            <p className="text-xs text-[var(--muted)]">{lang === 'ur' ? 'پہلے کلیکشن منتخب کریں' : 'Pick a collection first'}</p>
          )}
        </Step>

        <Step n={3} title={lang === 'ur' ? 'فلٹر (اختیاری)' : 'Filter (optional)'} icon={Filter}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select
              value={fField}
              onChange={(e) => setFField(e.target.value)}
              placeholder={lang === 'ur' ? 'کالم…' : 'Column…'}
              options={selectedCols.map((c) => ({ value: c, label: c }))}
            />
            <Select
              value={fOp}
              onChange={(e) => setFOp(e.target.value)}
              options={OPS.map(([value, label]) => ({ value, label }))}
            />
            {fOp !== 'empty' && fOp !== 'not_empty' && (
              <Input value={fValue} onChange={(e) => setFValue(e.target.value)} placeholder={lang === 'ur' ? 'قدر…' : 'Value…'} />
            )}
          </div>
        </Step>

        <Step n={4} title={lang === 'ur' ? 'ترتیب (اختیاری)' : 'Sort (optional)'} icon={ArrowUpDown}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select
              value={sortCol}
              onChange={(e) => setSortCol(e.target.value)}
              placeholder={lang === 'ur' ? 'کالم…' : 'Column…'}
              options={selectedCols.map((c) => ({ value: c, label: c }))}
            />
            <Button
              variant="secondary"
              icon={sortDir === 'asc' ? ArrowUp : ArrowDown}
              disabled={!sortCol}
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="justify-start"
            >
              {sortDir === 'asc' ? (lang === 'ur' ? 'بڑھتی ہوئی' : 'Ascending') : lang === 'ur' ? 'گھٹتی ہوئی' : 'Descending'}
            </Button>
          </div>
        </Step>
      </div>

      <div className="card p-3 sm:p-4 mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm leading-urdu no-clip">
            {lang === 'ur' ? 'پیش منظر' : 'Preview'}
            {sorted.length > PREVIEW_CAP && (
              <span className="text-xs font-normal text-[var(--muted)]">
                {' '}({lang === 'ur' ? `پہلی ${PREVIEW_CAP} قطاریں` : `first ${PREVIEW_CAP} rows`})
              </span>
            )}
          </h3>
          {col && <span className="text-xs text-[var(--muted)] num">{fmtNum(sorted.length)} {lang === 'ur' ? 'قطاریں' : 'rows'}</span>}
        </div>
        {col && selectedCols.length > 0 ? (
          <Table
            columns={previewColumns}
            rows={previewRows}
            keyOf={(r) => r?.id ?? `row-${previewRows.indexOf(r)}`}
            empty={<EmptyState title={lang === 'ur' ? 'کوئی قطار فلٹر سے میچ نہیں ہوئی' : 'No rows match the filter'} />}
          />
        ) : (
          <EmptyState
            title={lang === 'ur' ? 'کلیکشن اور کالم منتخب کریں' : 'Pick a collection and choose columns'}
            hint={lang === 'ur' ? 'پیش منظر یہاں دکھائی دے گا' : 'The live preview appears here'}
          />
        )}
      </div>

      <Card>
        <h3 className="font-semibold text-sm leading-urdu no-clip mb-3">
          {lang === 'ur' ? 'رپورٹ محفوظ کریں / لوڈ کریں' : 'Save / load reports'}
        </h3>
        <div className="flex flex-wrap items-end gap-2 mb-3">
          <Input
            className="!w-56"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder={lang === 'ur' ? 'رپورٹ کا نام…' : 'Report name…'}
          />
          <Button icon={Save} onClick={saveReport}>{t('common.save')}</Button>
        </div>
        {saved.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {saved.map((rep) => (
              <span
                key={rep.name}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--accent-soft)] ps-3 pe-1.5 py-1 text-xs"
              >
                <button type="button" className="font-medium leading-urdu no-clip" onClick={() => loadReport(rep)}>
                  {rep.name}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost h-5 px-1.5 text-[10px] text-[var(--accent)] font-semibold"
                  title={lang === 'ur' ? 'لوڈ کریں' : 'Load'}
                  onClick={() => loadReport(rep)}
                >
                  <FolderOpen size={12} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost h-5 px-1.5 text-[10px] text-[var(--muted)] hover:text-red-500"
                  title={lang === 'ur' ? 'حذف کریں' : 'Delete'}
                  onClick={() => deleteReport(rep)}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
