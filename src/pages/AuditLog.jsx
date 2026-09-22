import React, { useMemo, useState } from 'react'
import { ScrollText, Trash2, CalendarDays, Save, Ban } from 'lucide-react'

import Toolbar from '../components/UI/Toolbar'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Table from '../components/UI/Table'
import Card from '../components/UI/Card'
import StatCard from '../components/UI/StatCard'
import Badge from '../components/UI/Badge'
import Drawer from '../components/UI/Drawer'
import ExportMenu from '../components/UI/ExportMenu'
import SearchInput from '../components/UI/SearchInput'
import EmptyState from '../components/States/EmptyState'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useAppUI } from '../context/AppUIContext'
import { useToast } from '../context/ToastContext'
import { db } from '../services/db'
import { fmtDateTime, todayISO } from '../utils/formatters'

/**
 * AuditLog — immutable, read-only trail of everything that happened in
 * the app (saves, deletes, logins, security events). No CrudPage here:
 * audit rows can never be edited, only filtered, exported and (owner
 * only) cleared wholesale. Click a row for the full before/after JSON.
 */

const PAGE_SIZE = 25

const ACTION_TONE = { save: 'info', delete: 'danger', login: 'success', security: 'warning' }

const EXPORT_COLUMNS = [
  { key: 'at', label: 'Time', format: (v) => (v ? String(v).replace('T', ' ').slice(0, 16) : '') },
  { key: 'user', label: 'User' },
  { key: 'action', label: 'Action', format: (v) => v },
  { key: 'collection', label: 'Collection', format: (v) => v },
  { key: 'recordId', label: 'Record #', format: (v) => v },
]

/** Field names touched by an entry — supports {before, after} or a list. */
function changedFields(entry) {
  const before = entry?.changes?.before ?? entry?.before ?? null
  const after = entry?.changes?.after ?? entry?.after ?? null
  if (before && after && typeof before === 'object' && typeof after === 'object') {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    return [...keys].filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
  }
  if (Array.isArray(entry?.changes)) {
    return entry.changes.map((c) => (typeof c === 'string' ? c : c?.field)).filter(Boolean)
  }
  if (after && typeof after === 'object' && !before) {
    return Object.keys(after)
  }
  if (before && typeof before === 'object' && !after) {
    return Object.keys(before) // e.g. a delete — everything was there
  }
  return []
}

export default function AuditLog() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const { confirm } = useAppUI()
  const toast = useToast()
  const { items } = useCollection('auditLog')

  const [query, setQuery] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [collectionFilter, setCollectionFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [detail, setDetail] = useState(null)

  const users = useMemo(() => [...new Set(items.map((r) => r.user).filter(Boolean))], [items])
  const collections = useMemo(() => [...new Set(items.map((r) => r.collection).filter(Boolean))], [items])
  const actions = useMemo(() => {
    const found = new Set(items.map((r) => r.action).filter(Boolean))
    ;['save', 'delete', 'login', 'security'].forEach((a) => found.add(a))
    return [...found]
  }, [items])

  const filtered = useMemo(() => {
    let rows = items
    const q = query.trim().toLowerCase()
    if (q) {
      rows = rows.filter((r) =>
        [r.recordId, r.user, r.summary, r.collection]
          .some((v) => String(v ?? '').toLowerCase().includes(q)),
      )
    }
    if (userFilter) rows = rows.filter((r) => r.user === userFilter)
    if (actionFilter) rows = rows.filter((r) => r.action === actionFilter)
    if (collectionFilter) rows = rows.filter((r) => r.collection === collectionFilter)
    if (from) rows = rows.filter((r) => String(r.at || '').slice(0, 10) >= from)
    if (to) rows = rows.filter((r) => String(r.at || '').slice(0, 10) <= to)
    return rows
  }, [items, query, userFilter, actionFilter, collectionFilter, from, to])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const stats = [
    { label: lang === 'ur' ? 'کل ایونٹس' : 'Total events', value: items.length, icon: ScrollText, tone: 'info' },
    { label: lang === 'ur' ? 'آج' : 'Today', value: items.filter((r) => String(r.at || '').slice(0, 10) === todayISO()).length, icon: CalendarDays, tone: 'brand' },
    { label: lang === 'ur' ? 'سیو' : 'Saves', value: items.filter((r) => r.action === 'save').length, icon: Save, tone: 'success' },
    { label: lang === 'ur' ? 'ڈیلیٹ' : 'Deletes', value: items.filter((r) => r.action === 'delete').length, icon: Ban, tone: 'danger' },
  ]

  const clearLog = async () => {
    const ok = await confirm({
      title: t('common.confirmTitle'),
      message: lang === 'ur' ? 'پوری آڈٹ لاگ صاف کریں؟ یہ واپس نہیں ہو سکتا۔' : 'Clear the entire audit log? This cannot be undone.',
      confirmLabel: lang === 'ur' ? 'صاف کریں' : 'Clear',
    })
    if (!ok) return
    db.replaceAll('auditLog', [])
    toast.success(lang === 'ur' ? 'لاگ صاف ہو گئی' : 'Audit log cleared')
  }

  const columns = [
    {
      key: 'at', label: lang === 'ur' ? 'وقت' : 'Time',
      render: (r) => <span className="num text-xs">{fmtDateTime(r.at)}</span>,
      format: (v) => (v ? String(v).replace('T', ' ').slice(0, 16) : ''),
    },
    { key: 'user', label: lang === 'ur' ? 'صارف' : 'User' },
    {
      key: 'action', label: lang === 'ur' ? 'عمل' : 'Action',
      render: (r) => <Badge status={r.action} tone={ACTION_TONE[r.action] || 'muted'} label={r.action} />,
      format: (v) => v,
    },
    { key: 'collection', label: lang === 'ur' ? 'کلیکشن' : 'Collection' },
    { key: 'recordId', label: lang === 'ur' ? 'ریکارڈ' : 'Record #', render: (r) => <span className="num">{r.recordId || '—'}</span> },
    {
      key: 'changes', label: lang === 'ur' ? 'تبدیلیاں' : 'Changes',
      render: (r) => {
        const fields = changedFields(r)
        if (!fields.length) return <span className="text-[var(--muted)]">—</span>
        return <span className="text-xs">{fields.slice(0, 2).join(', ')}{fields.length > 2 ? '…' : ''}</span>
      },
      exportFormat: (_v, r) => changedFields(r).slice(0, 2).join(', '),
    },
  ]

  return (
    <div className="fade-in">
      <Toolbar
        title={lang === 'ur' ? 'آڈٹ لاگ' : 'Audit Log'}
        description={lang === 'ur' ? 'ہر عمل کا ناقابلِ تبدیل ریکارڈ (صرف پڑھنے کے لیے)' : 'Immutable trail of every action (read-only)'}
        actions={
          <>
            <ExportMenu title={lang === 'ur' ? 'آڈٹ لاگ' : 'Audit log'} columns={EXPORT_COLUMNS} rows={filtered} />
            {user?.role === 'owner' && (
              <Button variant="danger" icon={Trash2} onClick={clearLog}>
                <span className="hidden sm:inline">{lang === 'ur' ? 'لاگ صاف کریں' : 'Clear log'}</span>
              </Button>
            )}
          </>
        }
        filters={
          <>
            <SearchInput value={query} onChange={setQuery} placeholder={lang === 'ur' ? 'ریکارڈ/صارف/خلاصہ تلاش کریں' : 'Search record, user, summary…'} />
            <Select
              className="!w-auto min-w-[8rem]"
              value={userFilter}
              onChange={(e) => { setUserFilter(e.target.value); setPage(0) }}
              placeholder={`${lang === 'ur' ? 'صارف' : 'User'}: ${t('common.all')}`}
              options={users.map((u) => ({ value: u, label: u }))}
            />
            <Select
              className="!w-auto min-w-[8rem]"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(0) }}
              placeholder={`${lang === 'ur' ? 'عمل' : 'Action'}: ${t('common.all')}`}
              options={actions.map((a) => ({ value: a, label: a }))}
            />
            <Select
              className="!w-auto min-w-[8rem]"
              value={collectionFilter}
              onChange={(e) => { setCollectionFilter(e.target.value); setPage(0) }}
              placeholder={`${lang === 'ur' ? 'کلیکشن' : 'Collection'}: ${t('common.all')}`}
              options={collections.map((c) => ({ value: c, label: c }))}
            />
            <Input type="date" className="!w-36" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0) }} />
            <Input type="date" className="!w-36" value={to} onChange={(e) => { setTo(e.target.value); setPage(0) }} />
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {stats.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
        ))}
      </div>

      <div className="card p-3 sm:p-4">
        <Table
          columns={columns}
          rows={pageRows}
          onRowClick={(row) => setDetail(row)}
          empty={<EmptyState title={lang === 'ur' ? 'کوئی ایونٹ درج نہیں' : 'No events recorded'} hint={lang === 'ur' ? 'ایپ استعمال کرتے ہی یہاں سرگزشت بنتی جائے گی' : 'History builds here as the app is used'} />}
        />

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-2 mt-3 no-print">
            <Button variant="secondary" size="sm" disabled={safePage <= 0} onClick={() => setPage(safePage - 1)}>
              {t('common.previous')}
            </Button>
            <span className="text-xs text-[var(--muted)] num">
              {lang === 'ur' ? `صفحہ ${safePage + 1} / ${totalPages}` : `Page ${safePage + 1} of ${totalPages}`}
            </span>
            <Button variant="secondary" size="sm" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>

      <Drawer open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.recordId || detail?.action || ''}>
        {detail && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-[11px] text-[var(--muted)]">{lang === 'ur' ? 'وقت' : 'Time'}</div>
                <div className="num">{fmtDateTime(detail.at)}</div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--muted)]">{lang === 'ur' ? 'صارف' : 'User'}</div>
                <div>{detail.user || '—'}</div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--muted)]">{lang === 'ur' ? 'عمل' : 'Action'}</div>
                <div><Badge status={detail.action} tone={ACTION_TONE[detail.action] || 'muted'} label={detail.action} /></div>
              </div>
              <div>
                <div className="text-[11px] text-[var(--muted)]">{lang === 'ur' ? 'کلیکشن' : 'Collection'}</div>
                <div>{detail.collection || '—'}</div>
              </div>
            </div>
            {detail.summary && (
              <div className="text-sm leading-urdu no-clip border-b border-dashed border-[var(--border)] pb-2">
                {detail.summary}
              </div>
            )}
            <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap bg-[var(--border)]/30 rounded-xl p-3 leading-relaxed">
              {JSON.stringify(
                {
                  before: detail.changes?.before ?? detail.before ?? null,
                  after: detail.changes?.after ?? detail.after ?? null,
                },
                null,
                2,
              )}
            </pre>
          </div>
        )}
      </Drawer>
    </div>
  )
}
