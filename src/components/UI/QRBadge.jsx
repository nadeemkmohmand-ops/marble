import React, { useEffect, useState } from 'react'
import { makeQR } from '../../utils/qr'
import { cn } from '../../utils/cn'

/** Inline QR image for slab/block IDs. Click enlarges. */
export default function QRBadge({ value, size = 56, className }) {
  const [src, setSrc] = useState('')
  const [big, setBig] = useState(false)

  useEffect(() => {
    let alive = true
    makeQR(value, { size: size * 2 }).then((url) => alive && setSrc(url))
    return () => {
      alive = false
    }
  }, [value, size])

  return (
    <>
      {src && (
        <img
          src={src}
          alt={`QR ${value}`}
          onClick={() => setBig(true)}
          className={cn('rounded-lg border border-[var(--border)] bg-white p-0.5 cursor-zoom-in', className)}
          style={{ width: size, height: size }}
        />
      )}
      {big && (
        <div className="fixed inset-0 z-[90] bg-black/70 grid place-items-center p-6" onClick={() => setBig(false)}>
          <div className="card p-4 bg-white">
            <img src={src} alt={`QR ${value}`} className="w-64 h-64" />
            <div className="text-center mt-2 text-sm font-semibold num text-slate-900">{value}</div>
          </div>
        </div>
      )}
    </>
  )
}
