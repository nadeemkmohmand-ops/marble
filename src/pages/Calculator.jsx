import { useState } from 'react'
import { Calculator as CalculatorIcon, History, Ruler } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { Field, Input, Select } from '../components/UI/Input.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { calcHistory, pieceSizeOptions } from '../data/placeholderData.js'

/**
 * Calculator (حساب کتاب) — cutting calculator UI.
 * The form and result are UI only: pressing "حساب لگائیں" reveals a static
 * placeholder result. No real calculation is performed.
 */
export default function Calculator() {
  const { t, pick } = useAppUI()
  const [showResult, setShowResult] = useState(false)

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader title={t('nav.calculator')} en="Calculator" subtitle={t('calc.subtitle')} />

      {/* form */}
      <Card
        title={t('calc.newCalculation')}
        action={<Ruler size={18} className="text-text-light" aria-hidden="true" />}
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            setShowResult(true)
          }}
        >
          <Field label={t('calc.slabLength')} hint={t('calc.unitFeet')}>
            <Input type="number" inputMode="decimal" placeholder="8" min="0" step="0.5" />
          </Field>

          <Field label={t('calc.slabWidth')} hint={t('calc.unitFeet')}>
            <Input type="number" inputMode="decimal" placeholder="4" min="0" step="0.5" />
          </Field>

          <Field label={t('calc.pieceSize')}>
            <Select defaultValue="12 × 12">
              {pieceSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('calc.quantity')}>
            <Input type="number" inputMode="numeric" placeholder="100" min="1" step="1" />
          </Field>

          <div className="sm:col-span-2">
            <Button type="submit" variant="accent" size="lg" className="w-full">
              <CalculatorIcon size={20} />
              {t('calc.calculate')}
            </Button>
          </div>
        </form>
      </Card>

      {/* static placeholder result */}
      {showResult && (
        <Card title={t('calc.result')} className="fade-up">
          <div className="grid grid-cols-3 gap-3">
            <ResultTile label={t('calc.totalArea')} value="32" unit={t('common.sqft')} tone="primary" />
            <ResultTile label={t('calc.piecesCount')} value="32" unit={t('common.pieces')} tone="success" />
            <ResultTile label={t('calc.waste')} value="12" unit="%" tone="error" />
          </div>
          <p className="mt-3 text-center text-xs text-muted">{t('demoNote')}</p>
        </Card>
      )}

      {/* history */}
      <Card
        title={t('calc.history')}
        action={<History size={18} className="text-text-light" aria-hidden="true" />}
      >
        <ul className="divide-y divide-border dark:divide-gray-700">
          {calcHistory.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-main">
                  {pick(item.slab)} <span className="text-muted">←</span> {item.piece}
                </p>
                <p className="mt-0.5 font-english text-xs text-muted" dir="ltr">
                  {item.date}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="font-english text-sm font-bold text-main">
                  {item.pieces} <span className="text-xs font-normal text-muted">{t('common.pieces')}</span>
                </p>
                <p className="text-xs font-semibold text-error">
                  {t('calc.waste')}: <span className="font-english">{item.waste}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
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
