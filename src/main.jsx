import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AppProviders } from './context/index.jsx'
import { GLOBAL_ERROR_EVENT } from './context/ToastContext.jsx'

// Self-hosted fonts (bundled + precached by the PWA service worker —
// replaces the Google Fonts CDN links that used to sit in index.html)
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/noto-nastaliq-urdu/400.css'
import '@fontsource/noto-nastaliq-urdu/500.css'
import '@fontsource/noto-nastaliq-urdu/600.css'
import '@fontsource/noto-nastaliq-urdu/700.css'
import './index.css'

// ── Global error listeners → dev-only toast via the GLOBAL_ERROR_EVENT bridge ──
const reportGlobalError = (message) => {
  window.dispatchEvent(new CustomEvent(GLOBAL_ERROR_EVENT, { detail: { message } }))
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('[unhandledrejection]', event.reason)
  if (import.meta.env.DEV) {
    reportGlobalError(`Unhandled promise rejection: ${event.reason?.message || event.reason}`)
  }
})

window.addEventListener('error', (event) => {
  console.error('[window.onerror]', event.error || event.message)
  if (import.meta.env.DEV) {
    reportGlobalError(event.message)
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HashRouter: works from any static file server / offline PWA —
        BrowserRouter would need server rewrites on every host. */}
    <HashRouter>
      <ErrorBoundary>
        <AppProviders>
          <App />
        </AppProviders>
      </ErrorBoundary>
    </HashRouter>
  </React.StrictMode>
)
