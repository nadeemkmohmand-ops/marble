import React from 'react'
import Spinner from './Spinner'

export default function PageLoader({ label }) {
  return (
    <div className="py-24 grid place-items-center gap-3">
      <Spinner size={28} />
      {label && <p className="text-xs text-[var(--muted)]">{label}</p>}
    </div>
  )
}
