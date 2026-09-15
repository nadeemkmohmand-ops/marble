import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * ErrorBoundary — app-wide safety net (main.jsx) and per-route net (Layout.jsx).
 * Bilingual fallback UI; shows the raw error message in dev builds only.
 * Pass `fallback(renderProps)` for a custom fallback: ({ error, reset }) => …
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleReset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    if (typeof this.props.fallback === 'function') {
      return this.props.fallback({ error, reset: this.handleReset })
    }

    return (
      <div className="m-4 sm:m-6">
        <div className="surface mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-error/10 text-error">
            <AlertTriangle size={26} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-main">کچھ غلط ہو گیا</h2>
            <p className="text-sm font-semibold text-muted">Something went wrong</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              براہ کرم دوبارہ کوشش کریں — مسئلہ برقرار رہے تو صفحہ ری لوڈ کریں۔
              <br />
              Please try again — reload the page if the problem persists.
            </p>
            {import.meta.env.DEV && (
              <pre
                dir="ltr"
                className="mt-3 max-h-32 overflow-auto rounded-xl bg-secondary p-3 text-start font-english text-[11px] text-error dark:bg-gray-700/50"
              >
                {String(error?.message || error)}
              </pre>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
            >
              <RotateCcw size={16} />
              دوبارہ کوشش کریں
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-text-dark transition-colors hover:bg-secondary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              ری لوڈ / Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
