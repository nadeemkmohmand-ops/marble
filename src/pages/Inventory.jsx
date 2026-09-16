import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import ConfirmDialog from '../components/Feedback/ConfirmDialog.jsx'
import ErrorState from '../components/States/ErrorState.jsx'
import Modal from '../components/UI/Modal.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { Field, Input, Select } from '../components/UI/Input.jsx'
import Table from '../components/UI/Table.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { inventoryApi } from '../services/apiClient.js'

/** Bilingual labels for the material enum (schema.sql check constraint). */
const MATERIALS = ['white', 'grey', 'yellow', 'black', 'other']

const BLANK_FORM = {
  material: 'white',
  length_ft: '8',
  width_ft: '4',
  thickness_mm: '18',
  quantity: '0',
  low_stock_threshold: '5',
  location: '',
}

/**
 * Inventory (ذخیرہ) — live slab stock from Supabase with search, filters,
 * add/edit modal and delete. low-stock flag = quantity <= threshold
 * (computed by the database itself).
 */
export default function Inventory() {
  const { t } = useAppUI()
  const { toast } = useToast()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [materialFilter, setMaterialFilter] = useState('all')
  const [thicknessFilter, setThicknessFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null) // row being edited, or null = create
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await inventoryApi.list())
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const thicknessValues = useMemo(
    () => [...new Set(rows.map((row) => row.thickness_mm))].sort((a, b) => a - b),
    [rows]
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (materialFilter !== 'all' && row.material !== materialFilter) return false
      if (thicknessFilter !== 'all' && String(row.thickness_mm) !== thicknessFilter) return false
      if (!q) return true
      const haystack = [
        row.id,
        row.material,
        row.location || '',
        `${row.length_ft} × ${row.width_ft}`,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [rows, search, materialFilter, thicknessFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      material: row.material,
      length_ft: String(row.length_ft),
      width_ft: String(row.width_ft),
      thickness_mm: String(row.thickness_mm),
      quantity: String(row.quantity),
      low_stock_threshold: String(row.low_stock_threshold),
      location: row.location || '',
    })
    setFormOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    const values = {
      material: form.material,
      length_ft: Number(form.length_ft),
      width_ft: Number(form.width_ft),
      thickness_mm: Number(form.thickness_mm),
      quantity: Number(form.quantity),
      low_stock_threshold: Number(form.low_stock_threshold),
      location: form.location.trim() || null,
    }
    try {
      if (editing) {
        await inventoryApi.update(editing.id, values)
      } else {
        await inventoryApi.create(values)
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
      await inventoryApi.remove(deleteTarget.id)
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
      key: 'material',
      header: t('inv.material'),
      render: (row) => t(`inv.material_${row.material}`) || row.material,
    },
    {
      key: 'size',
      header: t('common.size'),
      render: (row) => (
        <span className="font-english" dir="ltr">
          {row.length_ft} × {row.width_ft} {t('calc.unitFeet')}
        </span>
      ),
    },
    {
      key: 'thickness',
      header: t('common.thickness'),
      render: (row) => (
        <span className="font-english" dir="ltr">
          {row.thickness_mm} {t('calc.unitMm')}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: t('common.quantity'),
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-english font-semibold">{row.quantity}</span>
          {row.is_low_stock && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning-dark dark:text-warning">
              {t('inv.low')}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'location',
      header: t('inv.location'),
      render: (row) => row.location || '—',
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
        title={t('nav.inventory')}
        en="Inventory"
        subtitle={t('inv.subtitle')}
        action={
          <Button variant="accent" onClick={openCreate}>
            <Plus size={18} />
            {t('inv.addNewSlab')}
          </Button>
        }
      />

      {/* search + filters */}
      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute start-3.5 top-1/2 -translate-y-1/2 text-text-light"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={t('inv.searchPlaceholder')}
              className="ps-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select
            value={materialFilter}
            onChange={(event) => setMaterialFilter(event.target.value)}
            aria-label={t('inv.filterSize')}
          >
            <option value="all">{t('inv.material')}: {t('common.all')}</option>
            {MATERIALS.map((material) => (
              <option key={material} value={material}>
                {t(`inv.material_${material}`)}
              </option>
            ))}
          </Select>

          <Select
            value={thicknessFilter}
            onChange={(event) => setThicknessFilter(event.target.value)}
            aria-label={t('inv.filterThickness')}
          >
            <option value="all">{t('common.thickness')}: {t('common.all')}</option>
            {thicknessValues.map((value) => (
              <option key={value} value={String(value)}>
                {value} {t('calc.unitMm')}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* table / loading / error */}
      {loading ? (
        <Card>
          <p className="py-10 text-center text-sm text-muted">{t('states.loading')}</p>
        </Card>
      ) : error ? (
        <ErrorState title={t('db.error')} description={error.message} retryLabel={t('db.retry')} onRetry={load} />
      ) : visible.length > 0 ? (
        <Table columns={columns} rows={visible} />
      ) : (
        <Card>
          <p className="py-10 text-center text-sm text-muted">{t('states.empty')}</p>
        </Card>
      )}

      {/* add / edit slab modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t('inv.editTitle') : t('inv.modalTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="slab-form" disabled={saving}>
              {saving ? t('db.saving') : t('common.save')}
            </Button>
          </>
        }
      >
        <form id="slab-form" className="grid gap-4" onSubmit={handleSubmit}>
          <Field label={t('inv.material')} required>
            <Select
              value={form.material}
              onChange={(event) => setForm({ ...form, material: event.target.value })}
            >
              {MATERIALS.map((material) => (
                <option key={material} value={material}>
                  {t(`inv.material_${material}`)}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('calc.slabLength')} hint={t('calc.unitFeet')} required>
              <Input
                type="number"
                inputMode="decimal"
                min="0.5"
                step="0.25"
                value={form.length_ft}
                onChange={(event) => setForm({ ...form, length_ft: event.target.value })}
                required
              />
            </Field>
            <Field label={t('calc.slabWidth')} hint={t('calc.unitFeet')} required>
              <Input
                type="number"
                inputMode="decimal"
                min="0.5"
                step="0.25"
                value={form.width_ft}
                onChange={(event) => setForm({ ...form, width_ft: event.target.value })}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('common.thickness')} hint={t('calc.unitMm')} required>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.thickness_mm}
                onChange={(event) => setForm({ ...form, thickness_mm: event.target.value })}
                required
              />
            </Field>
            <Field label={t('common.quantity')} required>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                required
              />
            </Field>
          </div>

          <Field label={t('inv.threshold')} hint={t('common.optional')}>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={form.low_stock_threshold}
              onChange={(event) => setForm({ ...form, low_stock_threshold: event.target.value })}
            />
          </Field>

          <Field label={t('inv.location')} hint={t('common.optional')}>
            <Input
              type="text"
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
            />
          </Field>
        </form>
      </Modal>

      {/* delete confirmation — really deletes from Supabase */}
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
