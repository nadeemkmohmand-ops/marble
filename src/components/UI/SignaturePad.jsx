import React, { useEffect, useRef, useState } from 'react'
import { Eraser, PenLine } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

/**
 * SignaturePad — capture a handwritten signature (delivery sign-off,
 * gate pass receiver, installation sign-off…). Pointer-events based,
 * so it works with finger, stylus and mouse. Emits a compact PNG
 * dataURL through onChange('data:image/png…' | '').
 *
 * Usage inside CrudPage config.fields:
 *   { key: 'receiverSign', type: 'custom', component: SignaturePad, span: 'full' }
 * The custom field contract passes { value, form, onChange, label }.
 */
export default function SignaturePad({ value, onChange, label, width = 460, height = 160 }) {
  const { t } = useLang()
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const [dirty, setDirty] = useState(false)
  const [empty, setEmpty] = useState(!value)

  // Paint an existing signature back onto the canvas (edit mode).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.4
    ctx.strokeStyle = '#0f172a'
    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = value
      setEmpty(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasRef.current.width,
      y: ((e.clientY - rect.top) / rect.height) * canvasRef.current.height,
    }
  }

  const start = (e) => {
    e.preventDefault()
    canvasRef.current.setPointerCapture?.(e.pointerId)
    drawing.current = true
    last.current = pos(e)
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    if (!dirty) setDirty(true)
    if (empty) setEmpty(false)
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    if (dirty && canvasRef.current) {
      try {
        onChange?.(canvasRef.current.toDataURL('image/png'))
      } catch {
        /* tainted canvas — ignore */
      }
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setDirty(false)
    setEmpty(true)
    onChange?.('')
  }

  return (
    <div className="sm:col-span-2">
      {label && <div className="text-xs font-medium text-[var(--muted)] mb-1.5 leading-urdu no-clip">{label}</div>}
      <div className="relative rounded-xl border border-[var(--border)] bg-white dark:bg-slate-50 overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-[130px] sm:h-[160px] block cursor-crosshair"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
        {empty && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none text-slate-400">
            <span className="flex items-center gap-2 text-xs font-medium">
              <PenLine size={15} />
              {t('common.signatureHint') || 'Sign here with finger or stylus'}
            </span>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-1">
        <button type="button" className="btn btn-ghost h-8 px-2 text-xs text-[var(--muted)]" onClick={clear}>
          <Eraser size={13} /> {t('common.clear') || 'Clear'}
        </button>
      </div>
    </div>
  )
}
