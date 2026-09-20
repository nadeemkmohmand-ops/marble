import React from 'react'

export default class ErrorBoundary extends React.Component {
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

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center p-6">
          <div className="card p-6 max-w-md text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/15 text-red-500 grid place-items-center text-2xl">⚠</div>
            <h1 className="mt-3 font-bold text-lg">Something went wrong</h1>
            <p dir="rtl" className="mt-1 text-sm urdu-text">کچھ غلط ہو گیا — براہ کرم دوبارہ کوشش کریں</p>
            <pre className="mt-3 text-[11px] text-start whitespace-pre-wrap text-[var(--muted)] max-h-32 overflow-auto">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              className="btn btn-primary min-h-10 px-5 text-sm mt-4"
              onClick={() => {
                this.setState({ error: null })
                window.location.hash = '#/'
                window.location.reload()
              }}
            >
              Reload / دوبارہ
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
