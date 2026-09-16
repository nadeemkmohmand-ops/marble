import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react'
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
import { expensesApi, monthStartISO, todayISO } from '../services/apiClient.js'
import { formatCurrency, formatNumber } from '../utils/formatters.js'

const CATEGORIES = ['electricity', 'labor', 'transport', 'material', 'maintenance', 'rent', 'other']

const BLANK_FORM = {
  category: 'other',
  amount: '',
  expense_date: '',
  note: '',
}

/**
 * Expenses (اخراجات) — live expense record from Supabase.
 * The monthly summary tiles are computed from REAL current-month rows
 * (grouped by category), not hardcoded numbers.
 */
export default function Expenses() {
  const { t, lang } = useAppUI()
  const { toast } = useToast()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await expensesApi.list())
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /** Current-month totals grouped by category (real data). */
  const monthSummary = useMemo(() => {
    const monthStart = monthStartISO()
    const totals = {}
    let total = 0
    for (const row of rows) {
      if (row.expense_date < monthStart) continue
      totals[row.category] = (totals[row.category] || 0) + Number(row.amount || 0)
      total += Number(row.amount || 0)
    }
    return { totals, total }
  }, [rows])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...BLANK_FORM, expense_date: todayISO() })
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      category: row.category,
      amount: String(row.amount),
      expense_date: row.expense_date,
      note: row.note || '',
    })
    setFormOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    const values = {
      category: form.category,
      amount: Number(form.amount),
      expense_date: form.expense_date || todayISO(),
      note: form.note.trim() || null,
    }
    try {
      if (editing) {
        await expensesApi.update(editing.id, values)
      } else {
        await expensesApi.create(values)
      }
      toast({ type: 'success', message: t('db.saved') })
      setFormOpen(false)
      await load()
    } catch (saveError) {
      toast({ type: 'error', message: `${t('db.saveFailed')}: ${saveError.message}` })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await expensesApi.remove(deleteTarget.id)
      toast({ type: 'success', message: t('db.deleted') })
      await load()
    } catch (deleteError) {
      toast({ type: 'error', message: `${t('db.deleteFailed')}: ${deleteError.message}` })
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns = [
    {
      key: 'id',
      header: t('inv.id'),
      render: (row) => <span className="font-english font-semibold">#{row.id}</span>,
    },
    {
      key: 'date',
      header: t('common.date'),
      render: (row) => (
        <span className="font-english" dir="ltr">
          {row.expense_date}
        </span>
      ),
    },
    {
      key: 'category',
      header: t('common.category'),
      render: (row) => t(`expenses.cat_${row.category}`),
    },
    {
      key: 'amount',
      header: t('common.amount'),
      render: (row) => (
        <span className="font-english font-semibold text-error" dir="ltr">
          {formatCurrency(row.amount, lang)}
        </span>
      ),
    },
    { key: 'note', header: t('common.note'), render: (row) => row.note || '—' },
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
        title={t('nav.expenses')}
        en="Expenses"
        subtitle={t('expenses.subtitle')}
        action={
          <Button variant="accent" onClick={openCreate}>
            <Plus size={18} />
            {t('expenses.addExpense')}
          </Button>
        }
      />

      {/* monthly summary — computed from real current-month rows */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {CATEGORIES.filter((category) => monthSummary.totals[category] > 0)
          .slice(0, 3)
          .map((category) => (
            <div key={category} className="surface p-4">
              <p className="text-xs font-medium text-muted">{t(`expenses.cat_${category}`)}</p>
              <p className="mt-2 font-english text-xl font-bold text-main sm:text-2xl" dir="ltr">
                {formatNumber(monthSummary.totals[category], 'en')}
              </p>
            </div>
          ))}
        <div className="surface border-accent/40 p-4">
          <p className="text-xs font-medium text-muted">{t('expenses.monthTotal')}</p>
          <p className="mt-2 font-english text-xl font-bold text-accent-dark dark:text-accent-light sm:text-2xl" dir="ltr">
            {formatNumber(monthSummary.total, 'en')}
          </p>
        </div>
      </section>

      {loading ? (
        <Card>
          <p className="py-10 text-center text-sm text-muted">{t('states.loading')}</p>
        </Card>
      ) : error ? (
        <ErrorState title={t('db.error')} description={error.message} retryLabel={t('db.retry')} onRetry={load} />
      ) : rows.length > 0 ? (
        <Table columns={columns} rows={rows} />
      ) : (
        <EmptyState icon={Wallet} title={t('states.empty')} description={t('states.emptyHint')} />
      )}

      {/* add / edit expense */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t('expenses.editTitle') : t('expenses.addExpense')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="expense-form" disabled={saving}>
              {saving ? t('db.saving') : t('common.save')}
            </Button>
          </>
        }
      >
        <form id="expense-form" className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('common.category')} required>
              <Select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t(`expenses.cat_${category}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('common.amount')} required>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                required
              />
            </Field>
          </div>
          <Field label={t('common.date')} required>
            <Input
              type="date"
              className="font-english"
              value={form.expense_date}
              onChange={(event) => setForm({ ...form, expense_date: event.target.value })}
              required
            />
          </Field>
          <Field label={t('common.note')} hint={t('common.optional')}>
            <Input
              type="text"
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteTitle')}
        message={`${t('confirm.deleteMessage')} ${deleteTarget ? `#${deleteTarget.id}` : ''}`}
        confirmLabel={t('confirm.confirmDelete')}
      />
    </div>
  )
}
