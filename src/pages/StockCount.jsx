import React, { useMemo, useState } from 'react'
import { ClipboardList, Printer, Save, Layers, CheckSquare, GitCompareArrows, Sigma } from 'lucide-react'

import Toolbar from '../components/UI/Toolbar'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Textarea from '../components/UI/Textarea'
import Table from '../components/UI/Table'
import Card from '../components/UI/Card'
import StatCard from '../components/UI/StatCard'
import ExportMenu from '../components/UI/ExportMenu'
import EmptyState from '../components/States/EmptyState'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { useAppUI } from '../context/AppUIContext'
import { useToast } from '../context/ToastContext'
import { db } from '../services/db'
import { STOCK_COUNT_SCOPE } from '../constants/enums'
import { fmtNumber, todayISO } from '../utils/formatters'

/**
 * StockCount — physical stock audit sheet. Pick a scope (slabs / blocks /
 * offcuts / consumables), optionally narrow to a yard, enter the counted
 * quantity against the system quantity and save the sheet. Saved sheets
 * stay in the 'stockCounts' collection for export / print / history.
 *
 * System quantity per scope: slabs → areaSqft · blocks → cft ·
 * offcuts → areaSqft · consumables → stockQty.
 */

/** Display label + system qty resolver per scope. */
const SCOPE = {
  slabs: {
    label: (r) => r.rack || r.grade || '',
    qty: (r) => Number(r.areaSqft || 0),
    unit: 'sq ft',
  },
  blocks: {
    label: (r) => r.lotNo || '',
    qty: (r) => Number(r.cft || 0),
    unit: 'cft',
  },
  offcuts: {
    label: (r) => r.parentSlab || '',
    qty: (r) => Number(r.areaSqft || 0),
    unit: 'sq ft',
  },
  consumables: {
    label: (r) => r.name || '',
    qty: (r) => Number(r.stockQty || 0),
    unit: '',
  },
}

const MAX_ROWS = 200 // safety cap for very large scopes

const SHEET_EXPORT_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'label', label: 'Item' },
  { key: 'systemQty', label: 'System' },
  { key: 'countedQty', label: 'Counted' },
  { key: 'variance', label: 'Variance' },
]

const PRINT_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'label', label: 'Item' },
  { key: 'systemQty', label: 'System' },
  { key: 'countedQty', label: 'Counted' },
  { key: 'variance', label: 'Variance' },
]

export default function StockCount() {
  const { lang, fmtNum } = useLang()
  const { requestPrint } = useAppUI()
  const toast = useToast()

  const [scope, setScope] = useState('slabs')
  const [yard, setYard] = useState('')
  const [filterText, setFilterText] = useState('')
  const [countedBy, setCountedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({})

  const { items: sheets } = useCollection('stockCounts')
  const { items: slabs } = useCollection('slabs')
  const yards = useMemo(() => [...new Set(slabs.map((s) => s.yard).filter(Boolean))], [slabs])

  const scopeLabel = (v) =>
    ({
      slabs: lang === 'ur' ? 'اسلیبس' : 'Slabs',
      blocks: lang === 'ur' ? 'بلاکس' : 'Blocks',
      offcuts: lang === 'ur' ? 'آف کٹس' : 'Offcuts',
      consumables: lang === 'ur' ? 'کانزیومبلز' : 'Consumables',
    })[v] || v

  /** Rows with a counted entry → audit lines with variance. */
  const lines = useMemo(
    () =>
      rows
        .filter((r) => counts[r.id] !== undefined && counts[r.id] !== '')
        .map((r) => {
          const systemQty = SCOPE[scope].qty(r)
          const countedQty = Number(counts[r.id])
          return { id: r.id, label: SCOPE[scope].label(r) || '—', systemQty, countedQty, variance: countedQty - systemQty }
        }),
    [rows, counts, scope],
  )

  const startCount = () => {
    let data = db.list(scope)
    if (scope === 'slabs' && yard) {
      data = data.filter((r) => r.yard === yard)
    } else if (scope !== 'slabs' && filterText.trim()) {
      const q = filterText.trim().toLowerCase()
      data = data.filter(
        (r) => String(r.id || '').toLowerCase().includes(q) || String(SCOPE[scope].label(r) || '').toLowerCase().includes(q),
      )
    }
    setRows(data)
    setCounts({})
    setLoaded(true)
  }

  const saveSheet = () => {
    if (!loaded || lines.length === 0) return
    const totalVariance = lines.reduce((a, l) => a + l.variance, 0)
    db.save('stockCounts', { date: todayISO(), scope, countedBy, lines, totalVariance, notes })
    toast.success(lang === 'ur' ? 'گنتی شیٹ محفوظ ہو گئی' : 'Count sheet saved')
    setCounts({})
    setNotes('')
  }

  const printSheet = () => {
    requestPrint({
      template: 'stockReport',
      title: 'Stock Count',
      lang,
      data: { rows: lines, columns: PRINT_COLUMNS, title: 'Stock Count' },
    })
  }

  const setCount = (id, value) => setCounts((prev) => ({ ...prev, [id]: value }))

  const countColumns = [
    { key: 'id', label: 'ID', render: (r) => <span className="num font-semibold">{r.id}</span> },
    { key: 'label', label: lang === 'ur' ? 'تفصیل' : 'Label', render: (r) => SCOPE[scope].label(r) || '—' },
    { key: 'systemQty', label: `${lang === 'ur' ? 'سسٹم مقدار' : 'System qty'}${SCOPE[scope].unit ? ` (${SCOPE[scope].unit})` : ''}`, render: (r) => <span className="num">{fmtNum(SCOPE[scope].qty(r), 1)}</span> },
    {
      key: 'countedQty', label: lang === 'ur' ? 'گنی گئی مقدار' : 'Counted qty',
      render: (r) => (
        <Input
          type="number"
          className="!w-24"
          value={counts[r.id] ?? ''}
          onChange={(e) => setCount(r.id, e.target.value)}
        />
      ),
    },
    {
      key: 'variance', label: lang === 'ur' ? 'فرق' : 'Variance',
      render: (r) => {
        if (counts[r.id] === undefined || counts[r.id] === '') return <span className="text-[var(--muted)]">—</span>
        const variance = Number(counts[r.id]) - SCOPE[scope].qty(r)
        return (
          <span className={`num font-semibold ${variance < 0 ? 'text-red-500' : variance > 0 ? 'text-emerald-600' : 'text-[var(--muted)]'}`}>
            {variance > 0 ? '+' : ''}{fmtNum(variance, 1)}
          </span>
        )
      },
    },
  ]

  const sheetColumns = [
    { key: 'id', label: 'Sheet #', render: (r) => <span className="num font-semibold">{r.id}</span> },
    { key: 'date', label: lang === 'ur' ? 'تاریخ' : 'Date', render: (r) => <span className="num">{r.date || '—'}</span> },
    { key: 'scope', label: lang === 'ur' ? 'دائرہ' : 'Scope', render: (r) => scopeLabel(r.scope) },
    { key: 'countedBy', label: lang === 'ur' ? 'گننے والا' : 'Counted by' },
    { key: 'linesCount', label: lang === 'ur' ? 'آئٹمز' : 'Lines', render: (r) => <span className="num">{(r.lines || []).length}</span>, exportFormat: (_v, r) => String((r.lines || []).length) },
    { key: 'totalVariance', label: lang === 'ur' ? 'کل فرق' : 'Total variance', render: (r) => <span className="num">{fmtNum(r.totalVariance, 1)}</span>, format: (v) => fmtNumber(v, 1) },
    {
      key: '_export', label: '',
      render: (r) => (
        <ExportMenu
          size="sm"
          title={`${scopeLabel(r.scope)} — ${r.date || ''}`}
          columns={SHEET_EXPORT_COLUMNS}
          rows={r.lines || []}
        />
      ),
    },
  ]

  const varianceLines = lines.filter((l) => l.variance !== 0).length
  const totalVarianceAbs = Math.abs(lines.reduce((a, l) => a + l.variance, 0))

  return (
    <div className="fade-in">
      <Toolbar
        title={lang === 'ur' ? 'اسٹاک گنتی' : 'Stock Count'}
        description={lang === 'ur' ? 'جسمانی اسٹاک آڈٹ — سسٹم مقدار سے موازنہ کریں' : 'Physical stock audit — count against system quantities'}
        actions={
          loaded && lines.length > 0 && (
            <>
              <ExportMenu title="Stock Count" columns={SHEET_EXPORT_COLUMNS} rows={lines} />
              <Button variant="secondary" icon={Printer} onClick={printSheet}>
                <span className="hidden sm:inline">{lang === 'ur' ? 'پرنٹ' : 'Print'}</span>
              </Button>
              <Button icon={Save} onClick={saveSheet}>
                <span className="hidden sm:inline">{lang === 'ur' ? 'گنتی شیٹ محفوظ کریں' : 'Save count sheet'}</span>
              </Button>
            </>
          )
        }
        filters={
          <>
            <Select
              className="!w-auto min-w-[9rem]"
              value={scope}
              onChange={(e) => { setScope(e.target.value); setYard(''); setFilterText('') }}
              options={STOCK_COUNT_SCOPE.map((s) => ({ value: s, label: scopeLabel(s) }))}
            />
            {scope === 'slabs' ? (
              <Select
                className="!w-auto min-w-[9rem]"
                value={yard}
                onChange={(e) => setYard(e.target.value)}
                placeholder={lang === 'ur' ? 'یارڈ: سب' : 'Yard: all'}
                options={yards.map((y) => ({ value: y, label: y }))}
              />
            ) : (
              <Input
                className="!w-44"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder={lang === 'ur' ? 'آئی ڈی / تفصیل فلٹر' : 'ID / label filter'}
              />
            )}
            <Input
              className="!w-40"
              value={countedBy}
              onChange={(e) => setCountedBy(e.target.value)}
              placeholder={lang === 'ur' ? 'گننے والا' : 'Counted by'}
            />
            <Button icon={ClipboardList} onClick={startCount}>
              {loaded
                ? lang === 'ur' ? 'دوبارہ لوڈ کریں' : 'Reload'
                : lang === 'ur' ? 'شروع / لوڈ کریں' : 'Start / Load'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label={lang === 'ur' ? 'لوڈ شدہ آئٹمز' : 'Items loaded'} value={rows.length} icon={Layers} tone="info" />
        <StatCard label={lang === 'ur' ? 'گنی گئی' : 'Counted'} value={lines.length} icon={CheckSquare} tone="success" />
        <StatCard label={lang === 'ur' ? 'فرق والی لائنیں' : 'Variance lines'} value={varianceLines} icon={GitCompareArrows} tone={varianceLines ? 'warning' : 'info'} />
        <StatCard label={lang === 'ur' ? 'کل فرق (مطلق)' : 'Total variance (abs)'} value={fmtNum(totalVarianceAbs, 1)} icon={Sigma} tone={totalVarianceAbs ? 'danger' : 'info'} />
      </div>

      <div className="card p-3 sm:p-4 mb-4">
        {loaded ? (
          <>
            {rows.length > MAX_ROWS && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                {lang === 'ur'
                  ? `پہلی ${MAX_ROWS} لائنیں دکھائی جا رہی ہیں — فلٹر سے دائرہ تنگ کریں`
                  : `Showing first ${MAX_ROWS} of ${rows.length} rows — narrow the scope with filters`}
              </p>
            )}
            <Table
              columns={countColumns}
              rows={rows.slice(0, MAX_ROWS)}
              keyOf={(r) => r.id}
              empty={<EmptyState title={lang === 'ur' ? 'اس دائرے میں کچھ نہیں' : 'Nothing in this scope'} />}
            />
            <div className="mt-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={lang === 'ur' ? 'نوٹس (اختیاری)' : 'Notes (optional)'}
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title={lang === 'ur' ? 'دائرہ منتخب کر کے گنتی شروع کریں' : 'Pick a scope and press Start / Load'}
            hint={lang === 'ur'
              ? 'گنتی شروع ہونے کے بعد ہر آئٹم کی گنی ہوئی مقدار درج کریں'
              : 'Once loaded, type the counted quantity against each item'}
          />
        )}
      </div>

      <Card>
        <h3 className="font-semibold text-base leading-urdu no-clip mb-3">
          {lang === 'ur' ? 'حالیہ گنتی شیٹس' : 'Recent count sheets'}
        </h3>
        <Table
          columns={sheetColumns}
          rows={sheets}
          empty={<EmptyState title={lang === 'ur' ? 'ابھی کوئی شیٹ محفوظ نہیں' : 'No count sheets saved yet'} />}
        />
      </Card>
    </div>
  )
}
