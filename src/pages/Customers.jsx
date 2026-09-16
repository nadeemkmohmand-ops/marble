import { useCallback, useEffect, useMemo, useState } from 'react'
import { BanknoteIcon, Pencil, Plus, Trash2, Users } from 'lucide-react'
import Badge from '../components/UI/Badge.jsx'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import ConfirmDialog from '../components/Feedback/ConfirmDialog.jsx'
import EmptyState from '../components/States/EmptyState.jsx'
import ErrorState from '../components/States/ErrorState.jsx'
import Modal from '../components/UI/Modal.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { Field, Input, Select } from '../components/UI/Input.jsx'
import { Textarea } from '../components/UI/Textarea.jsx'
import Table from '../components/UI/Table.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { customersApi, todayISO } from '../services/apiClient.js'
import { formatCurrency } from '../utils/formatters.js'

const PAYMENT_METHODS = ['cash', 'bank', 'easypaisa', 'jazzcash', 'other']

const BLANK_CUSTOMER = { name: '', phone: '', area: '', notes: '' }
const BLANK_PAYMENT = { amount: '', method: 'cash', paid_at: '', note: '' }

/**
 * Customers (گاہک) — live ledger from Supabase.
 * Balance is NEVER stored: it comes from the customer_balances view
 * (SUM of order items − SUM of payments) and updates the moment an
 * order or payment is recorded.
 */
export default function Customers() {
  const { t, lang } = useAppUI()
  const { toast } = useToast()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK_CUSTOMER)
  const [saving, setSaving] = useState(false)

  const [paymentTarget, setPaymentTarget] = useState(null) // customer row
  const [payment, setPayment] = useState(BLANK_PAYMENT)
  const [savingPayment, setSavingPayment] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await customersApi.listWithBalances())
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      [row.name, row.phone || '', row.area || ''].join(' ').toLowerCase().includes(q)
    )
  }, [rows, search])

  const openCreate = () => {
    setEditing(null)
    setForm(BLANK_CUSTOMER)
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ name: row.name, phone: row.phone || '', area: row.area || '', notes: '' })
    setFormOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await customersApi.update(editing.id, {
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          area: form.area.trim() || null,
        })
      } else {
        await customersApi.create({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          area: form.area.trim() || null,
          notes: form.notes.trim() || null,
        })
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

  const openPayment = (row) => {
    setPaymentTarget(row)
    setPayment({ ...BLANK_PAYMENT, paid_at: todayISO() })
  }

  const handlePayment = async (event) => {
    event.preventDefault()
    setSavingPayment(true)
    try {
      await customersApi.addPayment({
        customer_id: paymentTarget.id,
        amount: Number(payment.amount),
        method: payment.method,
        paid_at: payment.paid_at || todayISO(),
        note: payment.note.trim() || null,
      })
      toast({ type: 'success', message: t('db.saved') })
      setPaymentTarget(null)
      await load()
    } catch (payError) {
      toast({ type: 'error', message: `${t('db.saveFailed')}: ${payError.message}` })
    } finally {
      setSavingPayment(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await customersApi.remove(deleteTarget.id)
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
      key: 'name',
      header: t('common.name'),
      render: (row) => <span className="font-semibold">{row.name}</span>,
    },
    {
      key: 'phone',
      header: t('common.phone'),
      render: (row) => (
        <span className="font-english" dir="ltr">
          {row.phone || '—'}
        </span>
      ),
    },
    { key: 'area', header: t('common.area'), render: (row) => row.area || '—' },
    {
      key: 'orders',
      header: t('customers.orderTotal'),
      render: (row) => (
        <span className="font-english" dir="ltr">
          {formatCurrency(row.order_total, lang)}
        </span>
      ),
    },
    {
      key: 'paid',
      header: t('customers.paidTotal'),
      render: (row) => (
        <span className="font-english text-success" dir="ltr">
          {formatCurrency(row.paid_total, lang)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: t('common.balance'),
      render: (row) =>
        Number(row.balance) > 0 ? (
          <Badge variant="warning">{formatCurrency(row.balance, lang)}</Badge>
        ) : (
          <Badge variant="success">✓</Badge>
        ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-end',
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          <button
            type="button"
            className="icon-btn hover:!text-success dark:hover:!text-success"
            aria-label={t('customers.paymentBtn')}
            onClick={() => openPayment(row)}
          >
            <BanknoteIcon size={16} />
          </button>
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
        title={t('nav.customers')}
        en="Customers"
        subtitle={t('customers.subtitle')}
        action={
          <Button variant="accent" onClick={openCreate}>
            <Plus size={18} />
            {t('customers.newCustomer')}
          </Button>
        }
      />

      <Card>
        <Input
          type="search"
          placeholder={t('customers.searchPlaceholder')}
          aria-label={t('common.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Card>

      {loading ? (
        <Card>
          <p className="py-10 text-center text-sm text-muted">{t('states.loading')}</p>
        </Card>
      ) : error ? (
        <ErrorState title={t('db.error')} description={error.message} retryLabel={t('db.retry')} onRetry={load} />
      ) : visible.length > 0 ? (
        <Table columns={columns} rows={visible} />
      ) : (
        <EmptyState icon={Users} title={t('states.empty')} description={t('states.emptyHint')} />
      )}

      <p className="pb-2 text-center text-xs leading-relaxed text-muted">{t('customers.balanceHint')}</p>

      {/* add / edit customer */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t('customers.editTitle') : t('customers.newCustomer')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="customer-form" disabled={saving}>
              {saving ? t('db.saving') : t('common.save')}
            </Button>
          </>
        }
      >
        <form id="customer-form" className="grid gap-4" onSubmit={handleSubmit}>
          <Field label={t('common.name')} required>
            <Input
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </Field>
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
            <Field label={t('common.area')} hint={t('common.optional')}>
              <Input
                type="text"
                value={form.area}
                onChange={(event) => setForm({ ...form, area: event.target.value })}
              />
            </Field>
          </div>
          {!editing && (
            <Field label={t('common.note')} hint={t('common.optional')}>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </Field>
          )}
        </form>
      </Modal>

      {/* record a payment */}
      <Modal
        open={Boolean(paymentTarget)}
        onClose={() => setPaymentTarget(null)}
        title={`${t('customers.paymentBtn')} — ${paymentTarget?.name || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="payment-form" disabled={savingPayment}>
              {savingPayment ? t('db.saving') : t('common.save')}
            </Button>
          </>
        }
      >
        <form id="payment-form" className="grid gap-4" onSubmit={handlePayment}>
          <Field label={t('common.amount')} required>
            <Input
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={payment.amount}
              onChange={(event) => setPayment({ ...payment, amount: event.target.value })}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('customers.method')}>
              <Select
                value={payment.method}
                onChange={(event) => setPayment({ ...payment, method: event.target.value })}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {t(`customers.method_${method}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('common.date')}>
              <Input
                type="date"
                className="font-english"
                value={payment.paid_at}
                onChange={(event) => setPayment({ ...payment, paid_at: event.target.value })}
              />
            </Field>
          </div>
          <Field label={t('common.note')} hint={t('common.optional')}>
            <Input
              type="text"
              value={payment.note}
              onChange={(event) => setPayment({ ...payment, note: event.target.value })}
            />
          </Field>
          {paymentTarget && (
            <p className="rounded-xl bg-secondary p-3 text-center text-xs text-muted dark:bg-gray-700/40">
              {t('customers.currentBalance')}:{' '}
              <span className="font-english font-bold" dir="ltr">
                {formatCurrency(paymentTarget.balance, lang)}
              </span>
            </p>
          )}
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
