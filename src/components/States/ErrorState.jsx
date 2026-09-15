import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from '../UI/Button.jsx'

/**
 * ErrorState — graceful degradation UI for failed sections/pages.
 * Compose it inside ErrorBoundary fallbacks or per-page try/catch seams.
 */
export default function ErrorState({ title, description, retryLabel, onRetry, className = '' }) {
  return (
    <div
      className={`surface flex flex-col items-center justify-center gap-3 border-error/30 px-6 py-12 text-center ${className}`}
    >
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-error/10 text-error">
        <AlertTriangle size={26} aria-hidden="true" />
      </span>
      <div>
        <p className="text-base font-bold text-main">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={16} />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
