import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, Plus, Search, Trash2, X } from 'lucide-react'
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
import { customersApi, inventoryApi, ordersApi, ORDER_STATUSES, todayISO } from '../services/apiClient.js'
import { formatCurrency } from '../utils/formatters.js'

/** Order status → Badge variant mapping. */
const STATUS_VARIANTS = {
  pending: 'warning',
  cutting: 'info',
  ready: 'success',
  delivered: 'neutral',
}

const BLANK_ITEM = { inventory_item_id: '', description: '', quantity: '1', unit_price: '0' }
const BLANK_FORM = {
  customer_id: '',
  order_date: '',
  due_date: '',
  notes: '',
  items: [{ ...BLANK_ITEM }],
}

/**
 * Orders (آرڈرز) — live orders from Supabase with the real status workflow
 * (pending → cutting → ready → delivered), a multi-item "New Order" modal
 * and delete. Order totals come from order_items.line_total (DB-computed).
 */
export default function Orders() {
  const { t, lang } = useAppUI()
  const { toast } = useToast()

  const [rows, setRows] = useState([])
  const [customers, setCustomers] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [orderRows, customerRows, inventoryRows] = await Promise.all([
        ordersApi.list(),
        customersApi.listWithBalances(),
        inventoryApi.list(),
      ])
      setRows(orderRows)
      setCustomers(customerRows)
      setInventory(inventoryRows)
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
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (!q) return true
      const customerName = row.customer?.name || ''
      const itemText = (row.items || []).map((item) => item.description).join(' ')
      return `${row.id} ${customerName} ${itemText}`.toLowerCase().includes(q)
    })
  }, [rows, search, statusFilter])

  const orderTotal = (row) =>
    (row.items || []).reduce((sum, item) => sum + Number(item.line_total || 0), 0)

  const openCreate = () => {
    setForm({ ...BLANK_FORM, order_date: todayISO() })
    setFormOpen(true)
  }

  const setItem = (index, patch) => {
    setForm((prev) => {
      const items = prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item))
      return { ...prev, items }
    })
  }

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...BLANK_ITEM }] }))
  const removeItem = (index) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : prev.items,
    }))

  /** Picking an inventory item prefills description from the slab's real data. */
  const applyInventoryChoice = (index, inventoryId) => {
    const slab = inventory.find((entry) => String(entry.id) === String(inventoryId))
    if (!slab) {
      setItem(index, { inventory_item_id: '' })
      return
    }
    const materialLabel = t(`inv.material_${slab.material}`)
    const description = `${materialLabel} ${slab.length_ft} × ${slab.width_ft} ft — ${slab.thickness_mm} mm`
    setItem(index, { inventory_item_id: String(slab.id), description })
  }

  const formTotal = form.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    const items = form.items
      .map((item) => ({
        inventory_item_id: item.inventory_item_id || null,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price || 0),
      }))
      .filter((item) => item.quantity > 0)
    if (items.length === 0) {
      toast({ type: 'error', message: t('orders.noItems') })
      return
    }
    setSaving(true)
    try {
      await ordersApi.create({
        customerId: Number(form.customer_id),
        items,
        dueDate: form.due_date || null,
        notes: form.notes.trim() || null,
      })
      toast({ type: 'success', message: t('db.saved') })
      setFormOpen(false)
      await load()
    } catch (saveError) {
      toast({ type: 'error', message: `${t('db.saveFailed')}: ${saveError.message}` })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (row, status) => {
    setBusyId(row.id)
    try {
      await ordersApi.setStatus(row.id, status)
      await load()
      toast({ type: 'success', message: t('db.saved') })
    } catch (statusError) {
      toast({ type: 'error', message: `${t('db.saveFailed')}: ${statusError.message}` })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await ordersApi.remove(deleteTarget.id)
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
      render: (row) => (
        <span className="font-english font-semibold text-primary dark:text-primary-light">
          #{row.id}
        </span>
      ),
    },
    {
      key: 'customer',
      header: t('common.customer'),
      render: (row) => <span className="font-semibold">{row.customer?.name || '—'}</span>,
    },
    {
      key: 'item',
      header: t('common.item'),
      render: (row) =>
        (row.items || []).length > 0 ? (
          <span className="block max-w-[220px] truncate text-start" title={row.items.map((i) => i.description).join(', ')}>
            {row.items[0].description || '—'}
            {row.items.length > 1 && (
              <span className="font-english text-muted"> +{row.items.length - 1}</span>
            )}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'quantity',
      header: t('common.quantity'),
      render: (row) => (
        <span className="font-english font-semibold">
          {(row.items || []).reduce((sum, item) => sum + item.quantity, 0)}
        </span>
      ),
    },
    {
      key: 'total',
      header: t('common.total'),
      render: (row) => (
        <span className="font-english" dir="ltr">
          {formatCurrency(orderTotal(row), lang)}
        </span>
      ),
    },
    {
      key: 'date',
      header: t('common.date'),
      render: (row) => <span className="font-english" dir="ltr">{row.order_date}</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row) => {
        const statusIndex = ORDER_STATUSES.indexOf(row.status)
        const nextStatus = ORDER_STATUSES[statusIndex + 1]
        return (
          <span className="inline-flex items-center gap-2">
            <Badge variant={STATUS_VARIANTS[row.status]} dot>
              {t(`orders.status_${row.status}`)}
            </Badge>
            {nextStatus && (
              <button
                type="button"
                className="rounded-lg bg-secondary px-2 py-1 text-[11px] font-bold text-main transition-colors hover:bg-accent hover:text-white dark:bg-gray-700"
                disabled={busyId === row.id}
                onClick={() => handleStatusChange(row, nextStatus)}
                title={t('orders.advanceHint')}
              >
                {t(`orders.status_${nextStatus}`)} →
              </button>
            )}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-end',
      render: (row) => (
        <button
          type="button"
          className="icon-btn hover:!text-error dark:hover:!text-error"
          aria-label={t('common.delete')}
          onClick={() => setDeleteTarget(row)}
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={t('nav.orders')}
        en="Orders"
        subtitle={t('orders.subtitle')}
        action={
          <Button variant="accent" onClick={openCreate} disabled={customers.length === 0}>
            <Plus size={18} />
            {t('orders.newOrder')}
          </Button>
        }
      />

      {customers.length === 0 && !loading && (
        <Card>
          <p className="text-center text-sm text-muted">{t('orders.noCustomer')}</p>
        </Card>
      )}

      {/* status filter */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search
              size={18}
              className="absolute start-3.5 top-1/2 -translate-y-1/2 text-text-light"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder={t('common.search')}
              className="field-input ps-10"
              aria-label={t('common.search')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label={t('common.status')}
          >
            <option value="all">{t('common.status')}: {t('common.all')}</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`orders.status_${status}`)}
              </option>
            ))}
          </Select>
        </div>
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
        <EmptyState icon={ClipboardList} title={t('states.empty')} description={t('states.emptyHint')} />
      )}

      {/* new order modal — one order, many items, atomic save via RPC */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={t('orders.newOrder')}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="order-form" disabled={saving}>
              {saving ? t('db.saving') : t('common.save')}
            </Button>
          </>
        }
      >
        <form id="order-form" className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('common.customer')} required>
              <Select
                value={form.customer_id}
                onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
                required
              >
                <option value="">—</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('common.date')} required>
              <Input
                type="date"
                className="font-english"
                value={form.order_date}
                onChange={(event) => setForm({ ...form, order_date: event.target.value })}
                required
              />
            </Field>
            <Field label={t('orders.dueDate')} hint={t('common.optional')}>
              <Input
                type="date"
                className="font-english"
                value={form.due_date}
                onChange={(event) => setForm({ ...form, due_date: event.target.value })}
              />
            </Field>
          </div>

          {/* line items */}
          <div className="space-y-3">
            {form.items.map((item, index) => (
              <div key={index} className="rounded-xl bg-secondary p-3 dark:bg-gray-700/40">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-muted">
                    {t('common.item')} {index + 1}
                  </p>
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      className="icon-btn h-6 w-6"
                      aria-label={t('common.delete')}
                      onClick={() => removeItem(index)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t('orders.fromInventory')} hint={t('common.optional')}>
                    <Select
                      value={item.inventory_item_id}
                      onChange={(event) => applyInventoryChoice(index, event.target.value)}
                    >
                      <option value="">—</option>
                      {inventory.map((slab) => (
                        <option key={slab.id} value={slab.id}>
                          #{slab.id} — {t(`inv.material_${slab.material}`)} {slab.length_ft}×{slab.width_ft}ft ({slab.quantity})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t('orders.itemDescription')} required>
                    <Input
                      type="text"
                      value={item.description}
                      onChange={(event) => setItem(index, { description: event.target.value })}
                      required
                    />
                  </Field>
                  <Field label={t('common.quantity')} required>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) => setItem(index, { quantity: event.target.value })}
                      required
                    />
                  </Field>
                  <Field label={t('orders.unitPrice')}>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(event) => setItem(index, { unit_price: event.target.value })}
                    />
                  </Field>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addItem} className="w-full">
              <Plus size={16} />
              {t('orders.addItem')}
            </Button>
          </div>

          <Field label={t('common.note')} hint={t('common.optional')}>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </Field>

          <p className="text-center text-sm font-bold text-main">
            {t('orders.orderTotal')}:{' '}
            <span className="font-english" dir="ltr">
              {formatCurrency(formTotal, lang)}
            </span>
          </p>
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
