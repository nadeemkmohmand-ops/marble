import React from 'react'
import ReactDOM from 'react-dom/client'

// Self-hosted fonts (offline-PWA friendly — no CDN)
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/noto-nastaliq-urdu/400.css'
import '@fontsource/noto-nastaliq-urdu/500.css'
import '@fontsource/noto-nastaliq-urdu/600.css'
import '@fontsource/noto-nastaliq-urdu/700.css'

import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
