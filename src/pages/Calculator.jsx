/* eslint-disable react-refresh/only-export-components -- calculateCutting is a pure function exported for reuse/tests */
import { useCallback, useEffect, useState } from 'react'
import { Calculator as CalculatorIcon, History, Ruler, Trash2 } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { Field, Input } from '../components/UI/Input.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { calculatorApi } from '../services/apiClient.js'
import { formatDate } from '../utils/formatters.js'

/**
 * REAL slab-cutting math (this was 100% fake before).
 *
 * 1. Convert the slab to inches and try BOTH orientations of the piece —
 *    the better packing wins (whole pieces only, no half cuts):
 *      fitA = floor(slabL / pieceL) × floor(slabW / pieceW)
 *      fitB = floor(slabL / pieceW) × floor(slabW / pieceL)
 * 2. Apply the cutting-waste allowance: net = floor(gross × (1 − waste%))
 * 3. Slabs needed = ceil(requested pieces ÷ net per slab)
 * 4. Actual waste % is measured by AREA, so leftover strips count too.
 *
 * Every calculation is logged to calculator_history in Supabase.
 */

/** Core math — pure, unit-tested logic. */
export function calculateCutting({ slabL, slabW, pieceL, pieceW, wastePct, requested }) {
  const slabLIn = slabL * 12
  const slabWIn = slabW * 12

  const fitA = Math.floor(slabLIn / pieceL) * Math.floor(slabWIn / pieceW)
  const fitB = Math.floor(slabLIn / pieceW) * Math.floor(slabWIn / pieceL)
  const grossPerSlab = Math.max(fitA, fitB)

  const netPerSlab = Math.floor(grossPerSlab * (1 - wastePct / 100))

  const slabsNeeded =
    requested > 0 && netPerSlab > 0 ? Math.ceil(requested / netPerSlab) : netPerSlab > 0 ? 1 : 0
  const totalPieces = slabsNeeded * netPerSlab

  const slabAreaIn2 = slabLIn * slabWIn
  const pieceAreaIn2 = pieceL * pieceW
  const usedArea = totalPieces * pieceAreaIn2
  const totalArea = slabAreaIn2 * slabsNeeded
  const actualWastePct = totalArea > 0 ? ((totalArea - usedArea) / totalArea) * 100 : 0

  return {
    grossPerSlab,
    netPerSlab,
    slabsNeeded,
    totalPieces,
    actualWastePct: Math.round(actualWastePct * 10) / 10,
    totalAreaFt2: Math.round(((slabAreaIn2 * slabsNeeded) / 144) * 10) / 10,
  }
}

const BLANK = {
  slabL: '8',
  slabW: '4',
  pieceL: '12',
  pieceW: '12',
  wastePct: '10',
  requested: '100',
}

export default function Calculator() {
  const { t, lang } = useAppUI()
  const { toast } = useToast()

  const [form, setForm] = useState(BLANK)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [saving, setSaving] = useState(false)

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await calculatorApi.history())
    } catch {
      // history is a bonus — the calculator itself works without it
      setHistory([])
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleCalculate = (event) => {
    event.preventDefault()
    const slabL = Number(form.slabL)
    const slabW = Number(form.slabW)
    const pieceL = Number(form.pieceL)
    const pieceW = Number(form.pieceW)
    const wastePct = Number(form.wastePct || 0)
    const requested = Number(form.requested || 0)

    if (!(slabL > 0 && slabW > 0 && pieceL > 0 && pieceW > 0) || wastePct < 0 || wastePct >= 100) {
      toast({ type: 'error', message: t('calc.invalidInput') })
      return
    }

    setResult(calculateCutting({ slabL, slabW, pieceL, pieceW, wastePct, requested }))
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      await calculatorApi.save({
        slab_length_ft: Number(form.slabL),
        slab_width_ft: Number(form.slabW),
        piece_length_in: Number(form.pieceL),
        piece_width_in: Number(form.pieceW),
        waste_percent: Number(form.wastePct || 0),
        pieces_per_slab: result.netPerSlab,
        slabs_needed: result.slabsNeeded,
        requested_pieces: Number(form.requested || 0),
      })
      toast({ type: 'success', message: t('calc.savedToHistory') })
      await loadHistory()
    } catch (saveError) {
      toast({ type: 'error', message: `${t('db.saveFailed')}: ${saveError.message}` })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteHistory = async (id) => {
    try {
      await calculatorApi.remove(id)
      await loadHistory()
    } catch (deleteError) {
      toast({ type: 'error', message: `${t('db.deleteFailed')}: ${deleteError.message}` })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader title={t('nav.calculator')} en="Calculator" subtitle={t('calc.subtitle')} />

      {/* form */}
      <Card
        title={t('calc.newCalculation')}
        action={<Ruler size={18} className="text-text-light" aria-hidden="true" />}
      >
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCalculate}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('calc.slabLength')} hint={t('calc.unitFeet')}>
              <Input type="number" inputMode="decimal" placeholder="8" min="0.5" step="0.25" value={form.slabL} onChange={set('slabL')} required />
            </Field>
            <Field label={t('calc.slabWidth')} hint={t('calc.unitFeet')}>
              <Input type="number" inputMode="decimal" placeholder="4" min="0.5" step="0.25" value={form.slabW} onChange={set('slabW')} required />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('calc.pieceLength')} hint={t('calc.unitInch')}>
              <Input type="number" inputMode="decimal" placeholder="12" min="1" step="0.5" value={form.pieceL} onChange={set('pieceL')} required />
            </Field>
            <Field label={t('calc.pieceWidth')} hint={t('calc.unitInch')}>
              <Input type="number" inputMode="decimal" placeholder="12" min="1" step="0.5" value={form.pieceW} onChange={set('pieceW')} required />
            </Field>
          </div>

          <Field label={t('calc.wastePercent')} hint={t('calc.wasteHint')}>
            <Input type="number" inputMode="decimal" placeholder="10" min="0" max="95" step="1" value={form.wastePct} onChange={set('wastePct')} />
          </Field>

          <Field label={t('calc.requested')}>
            <Input type="number" inputMode="numeric" placeholder="100" min="0" step="1" value={form.requested} onChange={set('requested')} />
          </Field>

          <div className="sm:col-span-2">
            <Button type="submit" variant="accent" size="lg" className="w-full">
              <CalculatorIcon size={20} />
              {t('calc.calculate')}
            </Button>
          </div>
        </form>
      </Card>

      {/* real result */}
      {result && (
        <Card title={t('calc.result')} className="fade-up">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ResultTile label={t('calc.perSlab')} value={String(result.netPerSlab)} unit={t('common.pieces')} tone="primary" />
            <ResultTile label={t('calc.slabsNeeded')} value={String(result.slabsNeeded)} unit={t('common.slabs')} tone="success" />
            <ResultTile label={t('calc.totalArea')} value={String(result.totalAreaFt2)} unit={t('common.sqft')} tone="primary" />
            <ResultTile label={t('calc.actualWaste')} value={String(result.actualWastePct)} unit="%" tone="error" />
          </div>

          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              <History size={16} />
              {saving ? t('db.saving') : t('calc.saveHistory')}
            </Button>
          </div>
        </Card>
      )}

      {/* history — saved in Supabase */}
      <Card
        title={t('calc.history')}
        action={<History size={18} className="text-text-light" aria-hidden="true" />}
      >
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t('calc.historyEmpty')}</p>
        ) : (
          <ul className="divide-y divide-border dark:divide-gray-700">
            {history.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-english text-sm font-semibold text-main" dir="ltr">
                    {item.slab_length_ft} × {item.slab_width_ft} {t('calc.unitFeet')} ←{' '}
                    {item.piece_length_in} × {item.piece_width_in} {t('calc.unitInch')}
                  </p>
                  <p className="mt-0.5 font-english text-xs text-muted" dir="ltr">
                    {formatDate(item.created_at, lang)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-end">
                    <p className="font-english text-sm font-bold text-main">
                      {item.slabs_needed} <span className="text-xs font-normal text-muted">{t('common.slabs')}</span>
                    </p>
                    <p className="font-english text-xs text-muted">
                      {item.pieces_per_slab} {t('common.pieces')} / {t('calc.perSlab')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="icon-btn hover:!text-error dark:hover:!text-error"
                    aria-label={t('common.delete')}
                    onClick={() => handleDeleteHistory(item.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

const TONES = {
  primary: 'text-primary dark:text-primary-light',
  success: 'text-success',
  error: 'text-error',
}

function ResultTile({ label, value, unit, tone }) {
  return (
    <div className="rounded-xl bg-secondary p-3 text-center dark:bg-gray-700/40">
      <p className={`font-english text-xl font-bold sm:text-2xl ${TONES[tone]}`}>
        {value}
        <span className="text-xs font-medium text-muted"> {unit}</span>
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted">{label}</p>
    </div>
  )
}
