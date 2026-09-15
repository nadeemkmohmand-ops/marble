import { useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import ConfirmDialog from '../components/Feedback/ConfirmDialog.jsx'
import Modal from '../components/UI/Modal.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { Field, Input, Select } from '../components/UI/Input.jsx'
import Table from '../components/UI/Table.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import {
  inventoryItems,
  locationOptions,
  sizeOptions,
  thicknessOptions,
} from '../data/placeholderData.js'

/**
 * Inventory (ذخیرہ) — stock management UI with search, filters,
 * a static table and an "Add New Slab" modal (no save logic).
 */
export default function Inventory() {
  const { t, pick } = useAppUI()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const columns = [
    {
      key: 'id',
      header: t('inv.id'),
      render: (row) => (
        <span className="font-english font-semibold text-primary dark:text-primary-light">{row.id}</span>
      ),
    },
    { key: 'size', header: t('common.size'), render: (row) => pick(row.size) },
    { key: 'thickness', header: t('common.thickness'), render: (row) => pick(row.thickness) },
    {
      key: 'quantity',
      header: t('common.quantity'),
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-english font-semibold">{row.quantity}</span>
          {row.low && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning-dark dark:text-warning">
              {t('inv.low')}
            </span>
          )}
        </span>
      ),
    },
    { key: 'location', header: t('inv.location'), render: (row) => pick(row.location) },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-end',
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          <button type="button" className="icon-btn" aria-label={t('common.edit')}>
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
          <Button variant="accent" onClick={() => setModalOpen(true)}>
            <Plus size={18} />
            {t('inv.addNewSlab')}
          </Button>
        }
      />

      {/* search + filters (UI only) */}
      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute start-3.5 top-1/2 -translate-y-1/2 text-text-light"
              aria-hidden="true"
            />
            <Input type="search" placeholder={t('inv.searchPlaceholder')} className="ps-10" />
          </div>

          <Select defaultValue="all" aria-label={t('inv.filterSize')}>
            <option value="all">{t('common.size')}: {t('common.all')}</option>
            {sizeOptions.map((option, index) => (
              <option key={index} value={pick(option)}>
                {pick(option)}
              </option>
            ))}
          </Select>

          <Select defaultValue="all" aria-label={t('inv.filterThickness')}>
            <option value="all">{t('common.thickness')}: {t('common.all')}</option>
            {thicknessOptions.map((option, index) => (
              <option key={index} value={pick(option)}>
                {pick(option)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* table */}
      <Table columns={columns} rows={inventoryItems} />

      {/* add new slab modal (no save logic) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('inv.modalTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="add-slab-form">
              {t('common.save')}
            </Button>
          </>
        }
      >
        <form
          id="add-slab-form"
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            setModalOpen(false)
          }}
        >
          <Field label={t('common.size')} required>
            <Select defaultValue={pick(sizeOptions[0])}>
              {sizeOptions.map((option, index) => (
                <option key={index} value={pick(option)}>
                  {pick(option)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('common.thickness')} required>
            <Select defaultValue={pick(thicknessOptions[0])}>
              {thicknessOptions.map((option, index) => (
                <option key={index} value={pick(option)}>
                  {pick(option)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('common.quantity')} required>
            <Input type="number" inputMode="numeric" placeholder="10" min="1" step="1" />
          </Field>

          <Field label={t('inv.location')}>
            <Select defaultValue={pick(locationOptions[0])}>
              {locationOptions.map((option, index) => (
                <option key={index} value={pick(option)}>
                  {pick(option)}
                </option>
              ))}
            </Select>
          </Field>
        </form>

        <p className="mt-4 rounded-xl bg-secondary p-3 text-xs leading-relaxed text-muted dark:bg-gray-700/40">
          {t('inv.modalNote')}
        </p>
      </Modal>

      {/* delete confirmation — demo only, nothing is actually removed */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          setDeleteTarget(null)
          toast({ type: 'success', message: t('toast.demoDeleted') })
        }}
        title={t('confirm.deleteTitle')}
        message={`${t('confirm.deleteMessage')}${deleteTarget ? ` (${deleteTarget.id})` : ''}`}
        confirmLabel={t('confirm.confirmDelete')}
      />
    </div>
  )
}
