import React, { useCallback, useMemo, useState } from 'react'
import { Plus, Search as SearchIcon, Pencil, Trash2, Eye, QrCode, ScanLine, MessageCircle, CheckSquare, ListChecks, X } from 'lucide-react'

import Toolbar from './UI/Toolbar'
import Button from './UI/Button'
import Input from './UI/Input'
import Select from './UI/Select'
import Textarea from './UI/Textarea'
import Modal from './UI/Modal'
import Table from './UI/Table'
import Badge from './UI/Badge'
import StatCard from './UI/StatCard'
import SearchInput from './UI/SearchInput'
import PhotoInput from './UI/PhotoInput'
import QRBadge from './UI/QRBadge'
import ExportMenu from './UI/ExportMenu'
import ImportButton from './UI/ImportButton'
import EmptyState from './States/EmptyState'
import Drawer from './UI/Drawer'

import { useCrud } from '../hooks/useCrud'
import { useCollection } from '../hooks/useCollection'
import { useDebounce } from '../hooks/useDebounce'
import { useLang } from '../context/LanguageContext'
import { useAppUI } from '../context/AppUIContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { cn } from '../utils/cn'
import { recordToText, whatsappText } from '../utils/exporters'
import { db } from '../services/db'
import { can as canDo } from '../utils/permissions'
import { storage } from '../utils/storage'
import { STORAGE_KEYS } from '../constants/storageKeys'

/**
 * CrudPage — generic resource manager powering Blocks, Slabs, Offcuts,
 * Movements, Machines, Maintenance, Purchases, Suppliers, Customers,
 * Quotations, Orders, Workers, Expenses …
 *
 * config = {
 *   collection, i18nPrefix, serialPrefix,
 *   columns: [{key,label,render,format,hide?}],
 *   fields:   [{key,label,type,options,required,span,step,hint,format}],
 *   searchKeys, filters:[{key,options}], stats(items), defaults,
 *   compute(values) → merged overrides, exportName,
 *   detailRender(record), rowActions(record),
 *   onSaved(rec, mode), extraToolbar,
 * }
 */
export default function CrudPage({ config }) {
  const { t, lang, fmtNum, fmtMoney } = useLang()
  const toast = useToast()
  const { items } = useCollection(config.collection)
  const crud = useCrud(config.collection, { onSaved: config.onSaved })
  const { confirm, requestScan } = useAppUI()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({})
  const [detail, setDetail] = useState(null)
  const debounced = useDebounce(query)

  // ── granular permissions + bulk edit/delete state ──
  const settings = storage.get(STORAGE_KEYS.SETTINGS, {}) || {}
  const moduleKey = config.permissionModule || config.i18nPrefix || config.collection
  const allowed = (action) => canDo(user, settings, moduleKey, action)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [bulkEditOpen, setBulkEditOpen] = useState(false)

  const label = (prefix, key, fallback) => {
    const v = t(`${prefix}.${key}`)
    if (v !== `${prefix}.${key}`) return v
    const v2 = t(`fields.${key}`)
    if (v2 !== `fields.${key}`) return v2
    return fallback || key
  }

  const fieldLabel = (f) => f.label || label(config.i18nPrefix, f.key)

  const transformed = useMemo(() => (config.transform ? config.transform(items) : items), [items, config])

  const filtered = useMemo(() => {
    let rows = transformed
    const q = debounced.trim().toLowerCase()
    if (q) {
      const keys = config.searchKeys || []
      rows = rows.filter((r) => keys.some((k) => String(r[k] ?? '').toLowerCase().includes(q)))
    }
    Object.entries(filters).forEach(([k, v]) => {
      if (v) rows = rows.filter((r) => String(r[k]) === v)
    })
    return rows
  }, [items, debounced, filters, config.searchKeys])

  const columns = useMemo(() => {
    const resolveColumnLabel = (c) => {
      if (c.labelKey) return t(c.labelKey)
      // standard fields translate automatically; custom labels stay as-is
      const f = t(`fields.${c.key}`)
      if (f !== `fields.${c.key}`) return f
      return c.label || c.key
    }
    const cols = (config.columns || []).map((c) => ({
      ...c,
      label: resolveColumnLabel(c),
      render: c.render || (c.enumKey ? (row) => (row[c.key] ? t(`${c.enumKey}.${row[c.key]}`) : '—') : undefined),
    }))
    if (selecting) {
      cols.unshift({
        key: '_select',
        label: '',
        render: (row) => (
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--accent)]"
            checked={selected.has(row.id)}
            onChange={(e) => {
              const next = new Set(selected)
              if (e.target.checked) next.add(row.id)
              else next.delete(row.id)
              setSelected(next)
            }}
            aria-label={`Select ${row.id}`}
          />
        ),
      })
    }
    if (allowed('view')) {
      cols.push({
        key: '_actions',
        label: t('common.actions'),
        render: (row) => (
          <div className="flex items-center gap-0.5 sm:gap-1 justify-end no-print">
            {config.qrField && (
              <button className="btn btn-ghost h-10 w-10 sm:h-8 sm:w-8 justify-center" title="QR" onClick={(e) => { e.stopPropagation(); setDetail(row) }}>
                <QrCode size={15} />
              </button>
            )}
            <button className="btn btn-ghost h-10 w-10 sm:h-8 sm:w-8 justify-center" title={t('common.view')} onClick={(e) => { e.stopPropagation(); setDetail(row) }}>
              <Eye size={15} />
            </button>
            {allowed('edit') && (
              <button className="btn btn-ghost h-10 w-10 sm:h-8 sm:w-8 justify-center" title={t('common.edit')} onClick={(e) => { e.stopPropagation(); crud.openEdit(row) }}>
                <Pencil size={15} />
              </button>
            )}
            {allowed('delete') && (
              <button
                className="btn btn-ghost h-10 w-10 sm:h-8 sm:w-8 justify-center text-red-500"
                title={t('common.delete')}
                onClick={async (e) => {
                  e.stopPropagation()
                  const ok = await confirm({ message: t('common.confirmDelete') })
                  if (ok) crud.destroy(row)
                }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ),
      })
    }
    return cols
  }, [config, crud, confirm, t, label, selecting, selected, allowed])

  const exportColumns = useMemo(
    () =>
      (config.columns || []).map((c) => {
        const f = t(`fields.${c.key}`)
        return {
          key: c.key,
          label: c.labelKey ? t(c.labelKey) : f !== `fields.${c.key}` ? f : (c.label || c.key),
          format: c.exportFormat || c.format || (c.enumKey ? (v) => (v ? t(`${c.enumKey}.${v}`) : '') : undefined),
        }
      }),
    [config.columns, t],
  )

  const stats = config.stats?.(transformed, filtered) || null

  /* ───────────────────────────────────────────────────────────────
     LIVE COMPUTE — every keystroke runs config.compute and merges the
     derived fields back into the form so the user sees auto-calculated
     totals (units, amount, area, cft, landedTotal, order total …)
     update in real time as they type the inputs.
     ─────────────────────────────────────────────────────────────── */
  const setFieldLive = useCallback(
    (key, value) => {
      crud.setForm((prev) => {
        const next = { ...prev, [key]: value }
        const computed = config.compute?.(next) || {}
        return { ...next, ...computed }
      })
    },
    [config, crud],
  )

  // ── form submit ──
  const submit = async (e) => {
    e.preventDefault()
    const missing = (config.fields || []).filter((f) => f.required && (crud.form[f.key] === undefined || crud.form[f.key] === '' || crud.form[f.key] === null))
    if (missing.length) {
      toast.error(t('common.requiredFields'))
      return
    }
    const computed = config.compute?.(crud.form) || {}
    const candidate = { ...crud.form, ...computed }
    // amount-based approval gate (discount %, big receipts)
    const gate = config.beforeSave?.(candidate)
    if (gate && gate.ok === false) {
      toast.error(gate.reason || t('common.error'))
      return
    }
    await crud.save(computed)
  }

  const scan = async () => {
    const code = await requestScan()
    if (code) setQuery(String(code).split(/[/?#]/).pop())
  }

  const shareRecord = (record) => {
    const fields = (config.fields || [])
      .filter((f) => !f.type || !['photo'].includes(f.type))
      .map((f) => ({ key: f.key, label: fieldLabel(f), format: f.format }))
    const text = recordToText({
      title: `${t(config.i18nPrefix + '.title')} — ${record.id || ''}`,
      fields,
      record,
      lang,
    })
    whatsappText(text, record.whatsapp || record.phone)
  }

  return (
    <div className="fade-in">
      <Toolbar
        title={t(`${config.i18nPrefix}.title`)}
        description={t(`${config.i18nPrefix}.subtitle`)}
        actions={
          <>
            {allowed('delete') && (
              <Button
                variant={selecting ? 'primary' : 'secondary'}
                icon={selecting ? X : CheckSquare}
                onClick={() => { setSelecting((v) => !v); setSelected(new Set()) }}
                size="md"
              >
                <span className="hidden sm:inline">{t('common.select')}</span>
              </Button>
            )}
            {config.scan && (
              <Button variant="secondary" icon={ScanLine} onClick={scan} size="md">
                <span className="hidden sm:inline">{t('common.scan')}</span>
              </Button>
            )}
            {allowed('export') && (
              <ExportMenu
                title={t(`${config.i18nPrefix}.title`)}
                columns={exportColumns}
                rows={filtered}
                meta={{ phone: null, company: null }}
              />
            )}
            {allowed('add') && <ImportButton config={config} />}
            {allowed('add') && <Button icon={Plus} onClick={() => crud.openAdd(config.defaults?.())}>
              <span className="hidden sm:inline">{t('common.add')}</span>
            </Button>}
          </>
        }
        filters={
          <>
            <SearchInput value={query} onChange={setQuery} placeholder={t('common.search')} />
            {(config.filters || []).map((f) => {
              const allLabel = `${f.label || label(config.i18nPrefix, f.key)}: ${t('common.all')}`
              const opts = (f.options || []).map((opt) => {
                const v = opt.value ?? opt
                if (opt.label) return { value: v, label: opt.label }
                const prefix = f.enumPrefix && f.enumPrefix !== 'none' ? f.enumPrefix : f.key
                const key = `enums.${prefix}.${v}`
                const translated = t(key)
                return { value: v, label: translated === key ? String(v) : translated }
              })
              return (
                <Select
                  key={f.key}
                  className="!w-auto min-w-[9rem]"
                  value={filters[f.key] || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={allLabel}
                  options={opts}
                />
              )
            })}
            {config.extraToolbar?.(items, filtered)}
          </>
        }
      />

      {selecting && selected.size > 0 && (
        <div className="card mb-4 p-3 flex flex-wrap items-center gap-2 border-[var(--accent)]/50">
          <span className="text-sm font-semibold num">{selected.size} {t('common.selected')}</span>
          <Button size="sm" variant="secondary" icon={ListChecks} onClick={() => setBulkEditOpen(true)}>{t('common.bulkEdit')}</Button>
          <Button
            size="sm"
            variant="danger"
            icon={Trash2}
            onClick={async () => {
              const ok = await confirm({ message: `${t('common.confirmDelete')} (${selected.size})` })
              if (!ok) return
              selected.forEach((id) => db.remove(config.collection, id))
              toast.success(t('common.deleted'))
              setSelected(new Set())
            }}
          >
            {t('common.delete')}
          </Button>
          <Button size="sm" variant="secondary" icon={X} onClick={() => setSelected(new Set())}>{t('common.clear')}</Button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <StatCard key={i} label={s.label} value={s.value} sub={s.sub} icon={s.icon} tone={s.tone} />
          ))}
        </div>
      )}

      <div className="card p-3 sm:p-4">
        <Table
          columns={columns}
          rows={filtered}
          onRowClick={(row) => (selecting ? (() => {
            const next = new Set(selected)
            if (next.has(row.id)) next.delete(row.id)
            else next.add(row.id)
            setSelected(next)
          })() : setDetail(row))}
          empty={<EmptyState title={t('common.noData')} hint={t('common.addFirst')} />}
        />
      </div>

      {/* ── Bulk edit modal ── */}
      <BulkEditModal
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        config={config}
        ids={[...selected]}
        t={t}
        lang={lang}
        done={() => { setBulkEditOpen(false); setSelected(new Set()); setSelecting(false); toast.success(t('common.saved')) }}
      />

      {/* ── Add / Edit modal ── */}
      <Modal
        open={crud.isOpen}
        onClose={crud.close}
        title={crud.editingId ? t('common.edit') : t('common.add')}
        size={config.modalSize || 'md'}
        footer={
          /* Stacked, full-width Save/Cancel on phones — the Save button
             is always visible (sticky footer) and easy to tap. */
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={crud.close} className="w-full sm:w-auto">{t('common.cancel')}</Button>
            <Button onClick={submit} loading={crud.saving} className="w-full sm:w-auto">{t('common.save')}</Button>
          </div>
        }
      >
        {crud.form && (
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" autoComplete="off">
            {(config.fields || []).map((f) => (
              <FieldControl
                key={f.key}
                field={f}
                value={crud.form[f.key]}
                form={crud.form}
                label={fieldLabel(f)}
                onChange={(v) => setFieldLive(f.key, v)}
                setForm={crud.setForm}
                t={t}
                lang={lang}
                fmtNum={fmtNum}
              />
            ))}
          </form>
        )}
      </Modal>

      {/* ── Detail drawer ── */}
      <Drawer open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.id || ''}>
        {detail && (
          <div className="space-y-4">
            {config.qrField && (
              <div className="flex items-center gap-4">
                <QRBadge value={detail.id} size={92} />
                <div>
                  <div className="font-bold num text-lg">{detail.id}</div>
                  <div className="text-xs text-[var(--muted)]">{t('common.qrHint')}</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {(config.fields || [])
                .filter((f) => f.type !== 'photo')
                .map((f) => {
                  let v = detail[f.key]
                  if (f.type === 'select' && f.options) {
                    const found = f.options.find((o) => (o.value ?? o) === v)
                    if (found?.label) {
                      v = found.label
                    } else if (v !== '' && v !== null && v !== undefined) {
                      const prefix = f.enumPrefix && f.enumPrefix !== 'none' ? f.enumPrefix : f.key
                      const key = `enums.${prefix}.${v}`
                      const translated = t(key)
                      v = translated === key ? String(v) : translated
                    }
                  }
                  else if (f.format) v = f.format(v, detail)
                  return (
                    <div key={f.key} className="border-b border-dashed border-[var(--border)] pb-1.5">
                      <div className="text-[11px] text-[var(--muted)] leading-urdu no-clip">{fieldLabel(f)}</div>
                      <div className="text-sm leading-urdu no-clip break-words">{v === '' || v === null || v === undefined ? '—' : String(v)}</div>
                    </div>
                  )
                })}
            </div>
            {Array.isArray(detail.photos) && detail.photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {detail.photos.map((src, i) => (
                  <img key={i} src={src} alt="" className="h-20 w-20 object-cover rounded-lg border border-[var(--border)]" />
                ))}
              </div>
            )}
            {config.detailRender?.(detail)}
            <div className="flex flex-wrap gap-2 pt-2 no-print">
              <Button variant="whatsapp" icon={MessageCircle} onClick={() => shareRecord(detail)} size="sm">
                WhatsApp
              </Button>
              <Button variant="secondary" icon={Pencil} onClick={() => { setDetail(null); crud.openEdit(detail) }} size="sm">
                {t('common.edit')}
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                size="sm"
                onClick={async () => {
                  const ok = await confirm({ message: t('common.confirmDelete') })
                  if (ok) {
                    await crud.destroy(detail)
                    setDetail(null)
                  }
                }}
              >
                {t('common.delete')}
              </Button>
              {config.rowActions?.(detail, { setDetail })}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

/* ───────────────────────── Field renderer ───────────────────────── */
function FieldControl({ field: f, value, form, label, onChange, setForm, t, lang, fmtNum }) {
  const span = f.span === 'full' ? 'sm:col-span-2' : ''
  const common = { label, required: f.required, className: span }

  if (f.type === 'select') {
    const options =
      f.options ||
      (f.enumKey ? [] : [])
    return (
      <Select
        {...common}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        options={options.map((o) => {
          const v = o.value ?? o
          if (o.label) return { value: v, label: o.label }
          const prefix = f.enumPrefix && f.enumPrefix !== 'none' ? f.enumPrefix : f.key
          const key = `enums.${prefix}.${v}`
          const translated = t(key)
          return { value: v, label: translated === key ? String(v) : translated }
        })}
        placeholder={f.placeholder ?? ''}
      />
    )
  }
  if (f.type === 'textarea') {
    return <Textarea {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={f.rows || 3} />
  }
  if (f.type === 'photo') {
    return (
      <div className={cn('sm:col-span-2')}>
        <div className="text-xs font-medium text-[var(--muted)] mb-1.5 leading-urdu no-clip">{label}</div>
        <PhotoInput photos={Array.isArray(value) ? value : []} onChange={onChange} max={f.max || 6} />
      </div>
    )
  }
  if (f.type === 'readonly') {
    return (
      <div className={span}>
        <div className="text-xs font-medium text-[var(--muted)] mb-1.5">{label}</div>
        <div className="input bg-[var(--border)]/40 font-semibold num">{f.format ? f.format(value, form) : (value ?? '—')}</div>
        {f.hint && <p className="text-[11px] text-[var(--muted)] mt-1">{f.hint}</p>}
      </div>
    )
  }
  if (f.type === 'checkbox') {
    return (
      <label className={cn('flex items-center gap-2.5 min-h-10 cursor-pointer select-none', span)}>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
        <span className="text-sm leading-urdu no-clip">{label}</span>
      </label>
    )
  }
  if (f.type === 'ref') {
    // dynamic options loader: f.refCollection, f.refLabel
    return <RefField f={f} value={value} onChange={onChange} label={label} className={span} />
  }
  if (f.type === 'custom' && f.component) {
    const Comp = f.component
    return <Comp value={value} form={form} onChange={onChange} setForm={setForm} label={label} />
  }
  return (
    <Input
      {...common}
      type={f.type || 'text'}
      value={value ?? ''}
      step={f.step}
      min={f.min}
      onChange={(e) => onChange(f.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value)}
      hint={f.hint}
      placeholder={f.placeholder}
    />
  )
}

function RefField({ f, value, onChange, label, className }) {
  const { items } = useCollection(f.refCollection)
  return (
    <Select
      className={className}
      label={label}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={f.placeholder ?? ''}
      options={items.map((r) => ({ value: r.id, label: r[f.refLabel || 'name'] || r.id }))}
    />
  )
}

/* ───────────────────────── Bulk edit ───────────────────────── */
function BulkEditModal({ open, onClose, config, ids, t, lang, done }) {
  const [fieldKey, setFieldKey] = useState('')
  const [value, setValue] = useState('')
  const editable = (config.fields || []).filter(
    (f) => !f.type || ['text', 'number', 'select', 'textarea', 'date', 'tel'].includes(f.type),
  )
  const field = editable.find((f) => f.key === fieldKey)

  const apply = () => {
    if (!fieldKey) return
    const parsed = field?.type === 'number' ? parseFloat(value) || 0 : value
    ids.forEach((id) => {
      const rec = db.get(config.collection, id)
      if (rec) db.save(config.collection, { ...rec, [fieldKey]: parsed })
    })
    done()
    setFieldKey('')
    setValue('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${lang === 'ur' ? 'بلک ایڈٹ' : 'Bulk edit'} (${ids.length})`}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">{t('common.cancel')}</Button>
          <Button onClick={apply} disabled={!fieldKey} className="w-full sm:w-auto">{t('common.save')}</Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Select
          label={lang === 'ur' ? 'فیلڈ چنیں' : 'Field to change'}
          value={fieldKey}
          onChange={(e) => { setFieldKey(e.target.value); setValue('') }}
          options={editable.map((f) => ({ value: f.key, label: f.label || f.key }))}
        />
        {field?.type === 'select' ? (
          <Select
            label={lang === 'ur' ? 'نئی ویلیو' : 'New value'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            options={(field.options || []).map((o) => ({ value: o.value ?? o, label: o.label || String(o.value ?? o) }))}
          />
        ) : (
          <Input
            label={lang === 'ur' ? 'نئی ویلیو' : 'New value'}
            type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        <p className="text-xs text-[var(--muted)]">{lang === 'ur' ? 'یہ ویلیو منتخب تمام ریکارڈز پر لگ جائے گی۔' : 'This value will be applied to all selected records.'}</p>
      </div>
    </Modal>
  )
}
