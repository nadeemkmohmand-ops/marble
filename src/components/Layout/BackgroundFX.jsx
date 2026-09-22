import React, { useMemo } from 'react'

/**
 * BackgroundFX — decorative animated backdrop.
 *
 * Three soft gradient blobs (orange / blue / amber) drifting slowly,
 * a faint editorial dot grid at the top, and tiny soap-style bubbles
 * rising from the bottom. Purely CSS-animated (GPU transforms only),
 * pointer-events: none, aria-hidden, honours prefers-reduced-motion.
 *
 * The layer is `position: fixed; z-index: -1`, so it sits behind the
 * whole app without affecting layout or stacking of fixed UI (modals,
 * sheets) and is hidden in print.
 */

/* Deterministic bubble layout — no flicker between re-renders,
   evenly scattered across the width with varied size/speed. */
const BUBBLES = [
  { left: '4%', size: 10, duration: 17, delay: 0, drift: '1.2rem' },
  { left: '12%', size: 16, duration: 23, delay: 3.5, drift: '-1.8rem' },
  { left: '21%', size: 8, duration: 15, delay: 7, drift: '0.9rem' },
  { left: '30%', size: 13, duration: 20, delay: 1.6, drift: '-1.1rem' },
  { left: '41%', size: 7, duration: 14, delay: 9.5, drift: '1.6rem' },
  { left: '52%', size: 18, duration: 26, delay: 5, drift: '-1.4rem' },
  { left: '63%', size: 9, duration: 16, delay: 11.5, drift: '1rem' },
  { left: '72%', size: 14, duration: 21, delay: 2.6, drift: '-0.8rem' },
  { left: '83%', size: 8, duration: 15.5, delay: 6.5, drift: '1.5rem' },
  { left: '93%', size: 12, duration: 19, delay: 4.2, drift: '-1.3rem' },
]

export default function BackgroundFX() {
  const bubbles = useMemo(() => BUBBLES, [])

  return (
    <div className="bgfx no-print" aria-hidden="true">
      {/* Faint editorial dot grid, fades out towards the fold */}
      <div className="bgfx-dots" />

      {/* Soft gradient blobs — warm orange, bright blue, amber */}
      <div
        className="bgfx-blob animate-floatSlow"
        style={{
          width: '34rem',
          height: '34rem',
          top: '-12rem',
          insetInlineStart: '-10rem',
          background: 'radial-gradient(circle at 35% 35%, rgba(249,115,22,0.55), rgba(249,115,22,0.12) 55%, transparent 72%)',
        }}
      />
      <div
        className="bgfx-blob animate-floatSlower"
        style={{
          width: '30rem',
          height: '30rem',
          top: '22%',
          insetInlineEnd: '-12rem',
          background: 'radial-gradient(circle at 60% 40%, rgba(59,130,246,0.42), rgba(59,130,246,0.10) 55%, transparent 72%)',
        }}
      />
      <div
        className="bgfx-blob animate-floatSlow"
        style={{
          width: '26rem',
          height: '26rem',
          bottom: '-10rem',
          insetInlineStart: '28%',
          animationDelay: '-8s',
          background: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.35), rgba(251,191,36,0.08) 55%, transparent 72%)',
        }}
      />

      {/* Tiny rising bubbles with an inner highlight = subtle 3D feel */}
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="bgfx-bubble"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            '--drift': b.drift,
          }}
        />
      ))}
    </div>
  )
}
