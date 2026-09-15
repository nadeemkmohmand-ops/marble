import Spinner from './Spinner.jsx'

/**
 * PageLoader — full-area loader used as the <Suspense> fallback for
 * lazy-loaded routes (see Layout.jsx).
 */
export default function PageLoader({ label }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status">
      <Spinner size={36} />
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  )
}
