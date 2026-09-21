import React, { useMemo, useState } from 'react'
import { Banknote, FileSpreadsheet, HandCoins } from 'lucide-react'
import Toolbar from '../components/UI/Toolbar'
import Card from '../components/UI/Card'
import Tabs from '../components/UI/Tabs'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Button from '../components/UI/Button'
import Table from '../components/UI/Table'
import ExportMenu from '../components/UI/ExportMenu'
import EmptyState from '../components/States/EmptyState'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { fmtCurrency, fmtNumber, todayISO } from '../utils/formatters'

/**
 * Payroll — three tabs:
 *  1. Payslips: auto-generate from attendance + piece work − advances − loans
 *  2. Piece work: cutting/polishing/loading/installation entries
 *  3. Advances & loans overview
 */
export default function Payroll() {
  const { t, lang, fmtNum } = useLang()
  const toast = useToast()
  const { items: workers } = useCollection('workers')
  const { items: attendance } = useCollection('attendance')
  const { items: piecework, add: addPiece } = useCollection('piecework')
  const { items: payslips, add: addSlip, update: updateSlip } = useCollection('payroll')
  const [period, setPeriod] = useState(todayISO().slice(0, 7))
  const [tab, setTab] = useState(0)

  const DAILY_RATE_FALLBACK = 0

  const generate = () => {
    if (!workers.length) return toast.error(t('payroll.nothingToGenerate'))
    workers.forEach((w) => {
      const rows = attendance.filter((a) => a.workerId === w.id && (a.date || '').startsWith(period))
      const presentDays = rows.filter((r) => r.status === 'present').length + rows.filter((r) => r.status === 'half').length * 0.5
      const overtimeHours = rows.reduce((a, r) => a + (r.overtime || 0), 0)
      const overtimeAmount = overtimeHours * ((w.dailyRate || DAILY_RATE_FALLBACK) / 8)
      const pw = piecework.filter((p) => p.workerId === w.id && (p.date || '').startsWith(period))
      const pieceEarnings = pw.reduce((a, p) => a + (p.earning || 0), 0)
      const bonus = 0
      const advances = w.advances || 0
      const loanInstallment = w.loanInstallment || 0
      const deductions = w.deductions || 0
      const gross = presentDays * (w.dailyRate || 0) + overtimeAmount + pieceEarnings + bonus
      const netPayable = Math.max(0, gross - advances - loanInstallment - deductions)
      addSlip({
        workerId: w.id, workerName: w.name, period,
        presentDays, overtimeHours, overtimeAmount, pieceEarnings, bonus,
        advances, loanInstallment, deductions,
        gross: Math.round(gross * 100) / 100, netPayable,
        paid: false, date: todayISO(),
      })
    })
    toast.success(t('payroll.generated'))
  }

  const slipColumns = useMemo(
    () => [
      { key: 'workerName', label: t('attendance.worker'), render: (r) => <span className="font-semibold">{r.workerName}</span> },
      { key: 'period', label: t('fields.period'), render: (r) => <span className="num">{r.period}</span> },
      { key: 'presentDays', label: t('fields.presentDays'), render: (r) => <span className="num">{fmtNum(r.presentDays, 1)}</span>, format: (v) => v },
      { key: 'pieceEarnings', label: t('fields.pieceEarnings'), render: (r) => <span className="num">{fmtCurrency(r.pieceEarnings)}</span>, format: (v) => fmtNumber(v) },
      { key: 'overtimeAmount', label: t('fields.overtime'), render: (r) => <span className="num">{fmtCurrency(r.overtimeAmount)}</span>, format: (v) => fmtNumber(v) },
      { key: 'advances', label: t('fields.advances'), render: (r) => <span className="num">-{fmtCurrency(r.advances)}</span>, format: (v) => fmtNumber(v) },
      { key: 'loanInstallment', label: t('fields.loanInstallment'), render: (r) => <span className="num">-{fmtCurrency(r.loanInstallment)}</span>, format: (v) => fmtNumber(v) },
      { key: 'netPayable', label: t('fields.netPayable'), render: (r) => <span className="num font-bold">{fmtCurrency(r.netPayable)}</span>, format: (v) => fmtNumber(v) },
      {
        key: 'paid', label: t('common.status'),
        render: (r) => (
          <button
            className={`btn min-h-8 px-3 text-xs rounded-lg ${r.paid ? 'bg-emerald-500 text-white' : 'btn-secondary'}`}
            onClick={() => updateSlip(r.id, { ...r, paid: !r.paid })}
          >
            {r.paid ? t('enums.status.paid') : t('payroll.markPaid')}
          </button>
        ),
        exportFormat: (_v, r) => (r.paid ? 'Paid' : 'Unpaid'),
      },
    ],
    [t, fmtNum, updateSlip],
  )

  const pieceColumns = [
    { key: 'date', label: t('common.date'), render: (r) => <span className="num">{r.date}</span> },
    { key: 'workerName', label: t('attendance.worker') },
    { key: 'workType', label: t('payroll.workType'), format: (v) => v },
    { key: 'units', label: t('payroll.sqftDone'), render: (r) => <span className="num">{fmtNum(r.units)}</span>, format: (v) => fmtNumber(v) },
    { key: 'rate', label: t('common.rate'), render: (r) => <span className="num">{fmtCurrency(r.rate)}</span>, format: (v) => fmtNumber(v) },
    { key: 'earning', label: t('payroll.earning'), render: (r) => <span className="num font-semibold">{fmtCurrency(r.earning)}</span>, format: (v) => fmtNumber(v) },
  ]

  const advanceColumns = [
    { key: 'name', label: t('attendance.worker'), render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'advances', label: t('fields.advances'), render: (r) => <span className="num">{fmtCurrency(r.advances)}</span>, format: (v) => fmtNumber(v) },
    { key: 'loan', label: t('fields.loan'), render: (r) => <span className="num">{fmtCurrency(r.loan)}</span>, format: (v) => fmtNumber(v) },
    { key: 'loanInstallment', label: t('fields.loanInstallment'), render: (r) => <span className="num">{fmtCurrency(r.loanInstallment)}</span>, format: (v) => fmtNumber(v) },
  ]

  return (
    <div className="fade-in">
      <Toolbar
        title={t('payroll.title')}
        description={t('payroll.subtitle')}
        actions={
          <>
            <ExportMenu
              title={`${t('payroll.title')} ${period}`}
              columns={tab === 0 ? slipColumns : tab === 1 ? pieceColumns : advanceColumns}
              rows={tab === 0 ? payslips.filter((s) => s.period === period) : tab === 1 ? piecework.filter((p) => (p.date || '').startsWith(period)) : workers}
            />
            {tab === 0 && <Button icon={FileSpreadsheet} onClick={generate}>{t('payroll.generate')}</Button>}
          </>
        }
        filters={
          <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="!w-auto" />
        }
      />

      <Tabs
        className="mb-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { label: t('payroll.payslips') },
          { label: t('payroll.piecework') },
          { label: t('payroll.advancesTab') },
        ]}
      />

      {tab === 0 && (
        <Card>
          <Table
            columns={slipColumns}
            rows={payslips.filter((s) => s.period === period)}
            empty={<EmptyState title={t('common.noData')} hint={t('payroll.subtitle')} />}
          />
        </Card>
      )}

      {tab === 1 && <PieceWork period={period} workers={workers} addPiece={addPiece} piecework={piecework} columns={pieceColumns} />}

      {tab === 2 && (
        <Card>
          <Table columns={advanceColumns} rows={workers} keyOf={(r) => r.id} empty={<EmptyState title={t('common.noData')} />} />
        </Card>
      )}
    </div>
  )
}

function PieceWork({ period, workers, addPiece, piecework, columns }) {
  const { t, lang } = useLang()
  const toast = useToast()
  const [form, setForm] = useState({ date: todayISO(), workerId: '', workType: 'cutting', units: '', rate: '' })

  const WORK_TYPES = [
    { value: 'cutting', label: t('payroll.workTypeCutting') },
    { value: 'polishing', label: t('payroll.workTypePolishing') },
    { value: 'loading', label: t('payroll.workTypeLoading') },
    { value: 'installation', label: t('payroll.workTypeInstallation') },
  ]

  const submit = (e) => {
    e.preventDefault()
    const worker = workers.find((w) => w.id === form.workerId)
    const rate = Number(form.rate) || defaultRate(worker, form.workType)
    const units = Number(form.units) || 0
    addPiece({
      ...form,
      workerName: worker?.name || '—',
      rate,
      units,
      earning: Math.round(units * rate * 100) / 100,
    })
    toast.success(t('common.saved'))
    setForm((f) => ({ ...f, units: '', rate: '' }))
  }

  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={submit} className="grid grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <Input type="date" label={t('common.date')} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <Select label={t('attendance.worker')} value={form.workerId} onChange={(e) => setForm((f) => ({ ...f, workerId: e.target.value }))} options={workers.map((w) => ({ value: w.id, label: w.name }))} placeholder="—" />
          <Select label={t('payroll.workType')} value={form.workType} onChange={(e) => setForm((f) => ({ ...f, workType: e.target.value }))} options={WORK_TYPES} />
          <Input type="number" min="0" step="0.1" label={t('payroll.sqftDone')} value={form.units} onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))} />
          <Input type="number" min="0" step="0.1" label={t('common.rate')} value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} hint={lang === 'ur' ? 'خالی چھوڑیں تو مزدور کا ریٹ' : 'blank = worker rate'} />
          <Button type="submit" className="min-h-10">{t('payroll.addPiece')}</Button>
        </form>
      </Card>
      <Card>
        <Table
          columns={columns}
          rows={piecework.filter((p) => (p.date || '').startsWith(period))}
          empty={<EmptyState title={t('common.noData')} />}
        />
      </Card>
    </div>
  )
}

function defaultRate(worker, workType) {
  if (!worker) return 0
  return (
    {
      cutting: worker.pieceCutting,
      polishing: worker.piecePolishing,
      loading: worker.pieceLoading,
      installation: worker.pieceInstallation,
    }[workType] || 0
  )
}
