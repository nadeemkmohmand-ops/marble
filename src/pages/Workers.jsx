import { useCallback, useEffect, useState } from 'react'
import { CalendarCheck, Check, HardHat, Pencil, Trash2, UserPlus, X } from 'lucide-react'
import Badge from '../components/UI/Badge.jsx'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import ConfirmDialog from '../components/Feedback/ConfirmDialog.jsx'
import EmptyState from '../components/States/EmptyState.jsx'
import ErrorState from '../components/States/ErrorState.jsx'
import Modal from '../components/UI/Modal.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { Field, Input, Select } from '../components/UI/Input.jsx'
import Table from '../components/UI/Table.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { attendanceApi, todayISO, workersApi } from '../services/apiClient.js'
import { formatCurrency } from '../utils/formatters.js'

const SHIFTS = ['morning', 'evening', 'night']

const BLANK_FORM = {
  name: '',
  role: '',
  shift: 'morning',
  phone: '',
  daily_wage: '0',
  is_active: true,
}

/**
 * Workers (ورکرز) — live staff list from Supabase + REAL attendance:
 * a dedicated attendance table (one row per worker per day, upserted),
 * not a boolean. Mark present/absent for any date from the table.
 */
export default function Workers() {
  const { t, lang } = useAppUI()
  const { toast } = useToast()

  const [rows, setRows] = useState([])
  const [attendance, setAttendance] = useState({}) // worker_id → status
  const [attendanceDate, setAttendanceDate] = useState(todayISO())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [markingId, setMarkingId] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(
    async (date) => {
      setLoading(true)
      setError(null)
      try {
        const [workerRows, attendanceRows] = await Promise.all([
          workersApi.list(),
          attendanceApi.listForDate(date),
        ])
        setRows(workerRows)
        const byWorker = {}
        for (const record of attendanceRows) byWorker[record.worker_id] = record.status
        setAttendance(byWorker)
      } catch (loadError) {
        setError(loadError)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    load(attendanceDate)
  }, [load, attendanceDate])

  const openCreate = () => {
    setEditing(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      name: row.name,
      role: row.role || '',
      shift: row.shift,
      phone: row.phone || '',
      daily_wage: String(row.daily_wage ?? 0),
      is_active: row.is_active,
    })
    setFormOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    const values = {
      name: form.name.trim(),
      role: form.role.trim() || null,
      shift: form.shift,
      phone: form.phone.trim() || null,
      daily_wage: Number(form.daily_wage || 0),
      is_active: form.is_active,
    }
    try {
      if (editing) {
        await workersApi.update(editing.id, values)
      } else {
        await workersApi.create(values)
      }
      toast({ type: 'success', message: t('db.saved') })
      setFormOpen(false)
      await load(attendanceDate)
    } catch (saveError) {
      toast({ type: 'error', message: `${t('db.saveFailed')}: ${saveError.message}` })
    } finally {
      setSaving(false)
    }
  }

  const markAttendance = async (row, status) => {
    setMarkingId(row.id)
    try {
      await attendanceApi.mark(row.id, attendanceDate, status)
      setAttendance((prev) => ({ ...prev, [row.id]: status }))
      toast({ type: 'success', message: t('db.saved') })
    } catch (markError) {
      toast({ type: 'error', message: `${t('db.saveFailed')}: ${markError.message}` })
    } finally {
      setMarkingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await workersApi.remove(deleteTarget.id)
      toast({ type: 'success', message: t('db.deleted') })
      await load(attendanceDate)
    } catch (deleteError) {
      toast({ type: 'error', message: `${t('db.deleteFailed')}: ${deleteError.message}` })
    } finally {
      setDeleteTarget(null)
    }
  }

  const activeRows = rows.filter((row) => row.is_active)
  const presentCount = activeRows.filter((row) => attendance[row.id] === 'present').length

  const columns = [
    {
      key: 'id',
      header: t('inv.id'),
      render: (row) => <span className="font-english font-semibold">#{row.id}</span>,
    },
    {
      key: 'name',
      header: t('common.name'),
      render: (row) => (
        <span className="font-semibold">
          {row.name}
          {!row.is_active && (
            <span className="ms-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {t('workers.inactive')}
            </span>
          )}
        </span>
      ),
    },
    { key: 'role', header: t('common.role'), render: (row) => row.role || '—' },
    {
      key: 'shift',
      header: t('common.shift'),
      render: (row) => t(`workers.shift_${row.shift}`),
    },
    {
      key: 'wage',
      header: t('workers.wage'),
      render: (row) => (
        <span className="font-english" dir="ltr">
          {formatCurrency(row.daily_wage, lang)}
        </span>
      ),
    },
    {
      key: 'attendance',
      header: t('common.attendance'),
      render: (row) => {
        const status = attendance[row.id]
        return (
          <span className="inline-flex items-center gap-1.5">
            <button
              type="button"
              disabled={markingId === row.id}
              onClick={() => markAttendance(row, 'present')}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                status === 'present'
                  ? 'bg-success text-white'
                  : 'bg-secondary text-main hover:bg-success hover:text-white dark:bg-gray-700'
              }`}
              aria-pressed={status === 'present'}
            >
              <Check size={12} />
              {t('workers.present')}
            </button>
            <button
              type="button"
              disabled={markingId === row.id}
              onClick={() => markAttendance(row, 'absent')}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                status === 'absent'
                  ? 'bg-error text-white'
                  : 'bg-secondary text-main hover:bg-error hover:text-white dark:bg-gray-700'
              }`}
              aria-pressed={status === 'absent'}
            >
              <X size={12} />
              {t('workers.absent')}
            </button>
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-end',
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          <button type="button" className="icon-btn" aria-label={t('common.edit')} onClick={() => openEdit(row)}>
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="icon-btn hover:!text-error dark:hover:!text-error"
            aria-label={t('common.delete')}
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 size={16} />
          </button>
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={t('nav.workers')}
        en="Workers"
        subtitle={t('workers.subtitle')}
        action={
          <Button variant="accent" onClick={openCreate}>
            <UserPlus size={18} />
            {t('workers.addWorker')}
          </Button>
        }
      />

      {/* attendance date + summary */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Field label={t('workers.attendanceDate')} className="w-44">
            <Input
              type="date"
              className="font-english"
              value={attendanceDate}
              onChange={(event) => setAttendanceDate(event.target.value)}
            />
          </Field>
          <div className="flex items-center gap-3">
            <CalendarCheck size={20} className="text-text-light" aria-hidden="true" />
            <span className="text-sm font-semibold text-main">{t('workers.attendanceToday')}</span>
            <Badge variant="info">
              {presentCount} / {activeRows.length}
            </Badge>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card>
          <p className="py-10 text-center text-sm text-muted">{t('states.loading')}</p>
        </Card>
      ) : error ? (
        <ErrorState title={t('db.error')} description={error.message} retryLabel={t('db.retry')} onRetry={() => load(attendanceDate)} />
      ) : activeRows.length > 0 ? (
        <Table columns={columns} rows={rows} />
      ) : (
        <EmptyState icon={HardHat} title={t('states.empty')} description={t('states.emptyHint')} />
      )}

      {/* add / edit worker */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t('workers.editTitle') : t('workers.addWorker')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="worker-form" disabled={saving}>
              {saving ? t('db.saving') : t('common.save')}
            </Button>
          </>
        }
      >
        <form id="worker-form" className="grid gap-4" onSubmit={handleSubmit}>
          <Field label={t('common.name')} required>
            <Input
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('common.role')} hint={t('common.optional')}>
              <Input
                type="text"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              />
            </Field>
            <Field label={t('common.shift')}>
              <Select
                value={form.shift}
                onChange={(event) => setForm({ ...form, shift: event.target.value })}
              >
                {SHIFTS.map((shift) => (
                  <option key={shift} value={shift}>
                    {t(`workers.shift_${shift}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('common.phone')} hint={t('common.optional')}>
              <Input
                type="tel"
                dir="ltr"
                className="font-english"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>
            <Field label={t('workers.wage')} hint={t('common.optional')}>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.daily_wage}
                onChange={(event) => setForm({ ...form, daily_wage: event.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-main">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              className="h-4 w-4 accent-[color:var(--color-primary)]"
            />
            {t('workers.active')}
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteTitle')}
        message={`${t('confirm.deleteMessage')} ${deleteTarget ? deleteTarget.name : ''}`}
        confirmLabel={t('confirm.confirmDelete')}
      />
    </div>
  )
}
