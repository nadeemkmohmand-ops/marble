import React, { useMemo, useState } from 'react'
import { CalendarCheck, CalendarDays, Users } from 'lucide-react'
import Toolbar from '../components/UI/Toolbar'
import Card from '../components/UI/Card'
import Select from '../components/UI/Select'
import Input from '../components/UI/Input'
import Button from '../components/UI/Button'
import Table from '../components/UI/Table'
import ExportMenu from '../components/UI/ExportMenu'
import Badge from '../components/UI/Badge'
import EmptyState from '../components/States/EmptyState'
import { useCollection } from '../hooks/useCollection'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { ATTENDANCE_STATUS } from '../constants/enums'
import { todayISO } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

/**
 * Attendance — daily register (present/absent/half/leave + overtime)
 * plus a monthly summary per worker. Exportable + shareable.
 */
export default function Attendance() {
  const { t, fmtNum, lang } = useLang()
  const toast = useToast()
  const { add, update, items } = useCollection('attendance')
  const { items: workers } = useCollection('workers')
  const [date, setDate] = useState(todayISO())

  const dayRecords = useMemo(() => {
    const map = new Map(items.filter((a) => a.date === date).map((a) => [a.workerId, a]))
    return workers.map((w) => ({ worker: w, rec: map.get(w.id) }))
  }, [items, workers, date])

  const setStatus = (worker, status) => {
    const existing = dayRecords.find((d) => d.worker.id === worker.id)?.rec
    const payload = { workerId: worker.id, workerName: worker.name, date, status, overtime: existing?.overtime || 0 }
    if (existing) update(existing.id, payload)
    else add(payload)
  }

  const setOvertime = (worker, hours) => {
    const existing = dayRecords.find((d) => d.worker.id === worker.id)?.rec
    const payload = { workerId: worker.id, workerName: worker.name, date, status: existing?.status || 'present', overtime: Number(hours) || 0 }
    if (existing) update(existing.id, payload)
    else add(payload)
  }

  const markAllPresent = () => {
    workers.forEach((w) => {
      const existing = dayRecords.find((d) => d.worker.id === w.id)?.rec
      if (!existing || existing.status !== 'present') setStatus(w, 'present')
    })
    toast.success(t('attendance.markAll'))
  }

  // monthly summary
  const monthPrefix = date.slice(0, 7)
  const summary = useMemo(
    () =>
      workers.map((w) => {
        const rows = items.filter((a) => a.workerId === w.id && (a.date || '').startsWith(monthPrefix))
        const count = (s) => rows.filter((r) => r.status === s).length
        return {
          name: w.name,
          present: count('present'),
          half: count('half'),
          absent: count('absent'),
          leave: count('leave'),
          overtime: rows.reduce((a, r) => a + (r.overtime || 0), 0),
          paidDays: count('present') + count('half') * 0.5,
        }
      }),
    [workers, items, monthPrefix],
  )

  const columns = [
    { key: 'name', label: t('attendance.worker'), render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'present', label: t('enums.status.present'), render: (r) => <span className="num">{fmtNum(r.present)}</span>, format: (v) => v },
    { key: 'half', label: t('enums.status.half'), render: (r) => <span className="num">{fmtNum(r.half)}</span>, format: (v) => v },
    { key: 'absent', label: t('enums.status.absent'), render: (r) => <span className="num">{fmtNum(r.absent)}</span>, format: (v) => v },
    { key: 'leave', label: t('enums.status.leave'), render: (r) => <span className="num">{fmtNum(r.leave)}</span>, format: (v) => v },
    { key: 'paidDays', label: lang === 'ur' ? 'ادا شدہ دن' : 'Paid days', render: (r) => <span className="num font-semibold">{fmtNum(r.paidDays, 1)}</span>, format: (v) => v },
    { key: 'overtime', label: t('attendance.overtimeHrs'), render: (r) => <span className="num">{fmtNum(r.overtime)}</span>, format: (v) => v },
  ]

  return (
    <div className="fade-in">
      <Toolbar
        title={t('attendance.title')}
        description={t('attendance.subtitle')}
        actions={
          <>
            <ExportMenu title={t('attendance.monthly')} columns={columns} rows={summary} />
            <Button icon={CalendarCheck} onClick={markAllPresent}>{t('attendance.markAll')}</Button>
          </>
        }
        filters={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="!w-auto min-w-[10rem]" />}
      />

      <Card className="mb-4">
        <h3 className="font-semibold mb-3 leading-urdu no-clip">
          {t('attendance.day')} — <span className="num">{date}</span>
        </h3>
        {workers.length === 0 ? (
          <EmptyState title={t('common.noData')} hint={t('common.addFirst')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dayRecords.map(({ worker, rec }) => (
              <div key={worker.id} className="border border-[var(--border)] rounded-xl p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-sm leading-urdu no-clip">{worker.name}</span>
                  <Badge status={rec?.status || 'idle'} label={rec?.status ? undefined : '—'} />
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {ATTENDANCE_STATUS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(worker, s)}
                      className={`btn min-h-8 px-1 text-[11px] rounded-lg ${
                        rec?.status === s ? 'bg-[var(--accent)] text-white' : 'btn-secondary'
                      }`}
                    >
                      {t(`enums.status.${s}`)}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    label={t('attendance.overtimeHrs')}
                    value={rec?.overtime ?? ''}
                    onChange={(e) => setOvertime(worker, e.target.value)}
                    className="!w-24"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-[var(--accent)]" />
          <h3 className="font-semibold leading-urdu no-clip">{t('attendance.monthly')}</h3>
        </div>
        <Table columns={columns} rows={summary} keyOf={(r) => r.name} empty={<EmptyState title={t('common.noData')} />} />
      </Card>
    </div>
  )
}
