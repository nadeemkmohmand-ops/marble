# Marble Factory Management — ماربل فیکٹری مینجمنٹ

A mobile-first, installable **PWA UI skeleton** for marble factories in **Mohmand, Pakistan**.
Urdu is the primary language with a full **RTL** layout (English toggle included in Settings).

> **Important:** This is a **UI framework only**. There is **no business logic, no
> calculations, no data storage and no real reporting**. Every number, list and chart
> is a hardcoded placeholder. The app is fully navigable and visually complete.
> All framework seams (hooks, contexts, services, states) are in place so real
> logic can be added later without restructuring.

## What's in the framework (v1.1.0)

| Area | Additions |
|---|---|
| **Router** | `React.lazy` code-splitting per page, `<Suspense>` with `PageLoader`, bilingual **404 page** (dedicated route, no silent redirect), route metadata `{ title: { ur, en } }` → `document.title` via `usePageTitle`, `ScrollToTop`, `Breadcrumbs`, `ProtectedRoute` placeholder, **HashRouter** (works on any static host / offline PWA) |
| **Error handling** | `ErrorBoundary` (app level in `main.jsx` + route level in `Layout.jsx`), `window.onerror` + `unhandledrejection` listeners → dev toast via a CustomEvent bridge, `ErrorState` / `EmptyState` / `Skeleton` graceful-degradation components |
| **Contexts** | `AppUIContext` split into `ThemeContext` + `LanguageContext` (+ new `SidebarContext`, `ToastContext`), composed in one `<AppProviders>` wrapper. Legacy `useAppUI()` shim keeps old imports working |
| **UI kit** | New: `Badge`, `Tabs`, `Accordion`, `Drawer`, `Tooltip`, `Pagination`, `FormField`, `Textarea`, `Checkbox`, `RadioGroup`, `ConfirmDialog`, `Toast` (+ aria-live). Modal upgraded with **focus trap + focus return** |
| **Hooks** | `useLocalStorage`, `useMediaQuery`, `useClickOutside`, `useDebounce`, `useOnlineStatus`, `usePageTitle`, `useKeyboard`, `useFocusTrap` |
| **Utils / constants / config** | `utils/` (cn, formatters with Urdu digits ۰۱۲۳, safe storage wrapper, numbers), `constants/` (routes, storageKeys, languages, breakpoints, appInfo), `config/app.config.js` + `.env.example` |
| **i18n** | Dictionary split into `locales/ur.js` + `locales/en.js` (nested namespaces), `{{param}}` interpolation, plurals convention, fallback chain ur → en → key |
| **Data layer** | `placeholderData.js` split per domain (`home`, `reports`, `inventory`, `calculator`, `orders`, `customers`, `workers`, `expenses`, `notifications`, `app`), `services/apiClient.js` — an empty fetch wrapper (env base URL, timeout, error normalization) with **no endpoints yet** |
| **New pages** | `Login` (auth shell placeholder), `Orders`, `Customers`, `Workers`, `Expenses`, `Notifications`, `PrintPreview`, `NotFound` |
| **PWA** | Offline banner ("آف لائن موڈ"), `UpdatePrompt` (new-version toast with reload action), manifest `shortcuts` (Calculator/Inventory), **self-hosted fonts** (`@fontsource/*`) — now precached for a correct first *offline* launch, removed Google Fonts CDN |
| **A11y** | Skip-to-content link, `aria-live` toast region, focus trap/return in Modal & Drawer, `prefers-reduced-motion` support, `.focus-ring` utility |
| **Tooling** | ESLint 9 flat config, Prettier + `.editorconfig`, husky + lint-staged, Vitest + Testing Library (smoke test per page), `@` path alias, manualChunks, GitHub Actions CI (lint → test → build) |

## Features (original)

- Urdu-first RTL interface using **Noto Nastaliq Urdu** (Inter fallback for English/digits)
- Language toggle (اردو / English) — switches `dir` (RTL/LTR), fonts and every label
- Light / Dark theme toggle (Tailwind `class` strategy, persisted in `localStorage`)
- Dashboard with summary cards, quick actions, recent activity and a CSS bar chart
- Cutting calculator UI (form + static result + history list)
- Inventory UI (search, filters, table, "Add New Slab" modal, delete-confirm demo)
- Reports UI (weekly/monthly/custom selector, date range, charts, export buttons)
- About, Settings and the new placeholder pages (Orders/Customers/Workers/Expenses/…)
- Installable PWA: manifest + service worker (offline caching) via `vite-plugin-pwa`
- Responsive: bottom nav (<768px), collapsible sidebar (768–1024px), fixed sidebar (≥1024px)

## Tech Stack

| Purpose      | Library                                    |
| ------------ | ------------------------------------------ |
| Framework    | React 18                                   |
| Build tool   | Vite 5                                     |
| Styling      | Tailwind CSS 3.4 (custom design tokens)    |
| Routing      | React Router v6 (HashRouter + lazy routes) |
| PWA          | vite-plugin-pwa (Workbox)                  |
| Icons        | Lucide React                               |
| State        | Split React contexts (theme / language / sidebar / toast) |
| Testing      | Vitest + @testing-library/react + jsdom    |
| Lint/format  | ESLint 9 flat config + Prettier            |

## Getting Started

Prerequisites: **Node.js 18+** and npm.

```bash
# 1. install dependencies
npm install

# 2. start the dev server (http://localhost:5173)
npm run dev

# 3. production build (generates dist/ with the service worker + manifest)
npm run build

# 4. preview the production build locally (http://localhost:4173)
npm run preview
```

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build + PWA SW/manifest |
| `npm run preview` | Serve the production build |
| `npm run lint` / `lint:fix` | ESLint 9 (flat config) |
| `npm run format` / `format:check` | Prettier |
| `npm test` / `test:watch` / `test:coverage` | Vitest (jsdom) |
| `npm run analyze` | Visualize the bundle (`vite-bundle-visualizer`) |

### Environment variables

Copy `.env.example` → `.env`:

```
VITE_APP_NAME        # display name (English reference)
VITE_APP_VERSION     # shown in About/Settings
VITE_DEFAULT_LANG    # 'ur' (default, RTL) | 'en'
VITE_DATA_SOURCE     # 'mock' | 'local' | 'api'  — seam for future data layers
VITE_API_BASE_URL    # used by src/services/apiClient.js when source = 'api'
```

## i18n — How to add a key

Labels live in **`src/i18n/locales/ur.js`** and **`src/i18n/locales/en.js`** as
nested namespaces. Add the key to BOTH files, then use it anywhere:

```js
// locales/en.js
export default {
  inventory: { title: 'Inventory' },
}

// locales/ur.js
export default {
  inventory: { title: 'ذخیرہ' },
}

// any component
const { t } = useAppUI()          // or useLanguage()
t('inventory.title')
```

- **Interpolation:** `t('welcome', { name })` replaces `{{name}}` in the string.
- **Plurals convention:** provide `key_one` / `key_other` variants and call
  `t('cart.items', { count: 3 })` — the engine picks `key_one` (count === 1) or
  `key_other`, then falls back to the plain key.
- **Fallback chain:** requested language → English → the raw key.
- The old flat `translations.js` is kept as a deprecated shim that re-exports
  the merged dictionary for backward compatibility.

## Project Structure

```
marble-factory-app/
├── public/icons/                  # PWA icons (192 / 512, maskable)
├── src/
│   ├── assets/                    # (empty — reserved)
│   ├── components/
│   │   ├── Layout/                # Header, Sidebar, BottomNav, Layout,
│   │   │                          # Breadcrumbs, ScrollToTop, UserMenu, OfflineBanner
│   │   ├── UI/                    # Button, Card, Input(…), Modal, Table, PageHeader,
│   │   │                          # ChartPlaceholder + Badge, Tabs, Accordion, Drawer,
│   │   │                          # Tooltip, Pagination, FormField, Textarea,
│   │   │                          # Checkbox, RadioGroup (+ index.js barrel)
│   │   ├── States/                # Skeleton, EmptyState, ErrorState, PageLoader, Spinner
│   │   ├── Feedback/              # Toast (viewport), ConfirmDialog
│   │   ├── PWA/                   # InstallPrompt, UpdatePrompt
│   │   ├── ProtectedRoute.jsx     # auth placeholder wrapper
│   │   └── ErrorBoundary.jsx      # app + route level safety net
│   ├── pages/                     # Home, Calculator, Inventory, Orders, Reports,
│   │                              # Customers, Workers, Expenses, Notifications,
│   │                              # PrintPreview, About, Settings, Login, NotFound
│   ├── hooks/                     # useLocalStorage, useMediaQuery, useClickOutside,
│   │                              # useDebounce, useOnlineStatus, usePageTitle,
│   │                              # useKeyboard, useFocusTrap (+ index.js)
│   ├── utils/                     # cn, formatters (Urdu digits), storage, numbers
│   ├── constants/                 # routes, storageKeys, languages, breakpoints, appInfo
│   ├── config/app.config.js       # import.meta.env reader (see .env.example)
│   ├── context/                   # Theme, Language, Sidebar, Toast + index.jsx (AppProviders)
│   ├── i18n/                      # index.js engine + locales/{ur,en}.js
│   ├── data/                      # per-domain static placeholder data
│   ├── services/apiClient.js      # empty fetch wrapper (VITE_DATA_SOURCE seam)
│   ├── test/                      # setupTests.js + helpers + per-page smoke tests
│   ├── App.jsx                    # Routes (lazy) + 404 + ProtectedRoute
│   ├── main.jsx                   # HashRouter + ErrorBoundary + AppProviders + fonts
│   ├── routes.jsx                 # central route table ({ path, label, element, title })
│   └── index.css                  # Tailwind layers + shared classes (skip-link,
│                                  #   no-scrollbar, focus-ring, reduced-motion…)
├── .github/workflows/ci.yml       # lint → test → build
├── .husky/pre-commit              # lint-staged
├── eslint.config.js               # ESLint 9 flat config
├── .prettierrc / .editorconfig
├── .env.example
├── index.html                     # RTL default + no-flash theme script (fonts self-hosted)
├── vite.config.js                 # PWA manifest + shortcuts, @ alias, manualChunks, vitest
└── package.json
```

## Design System

| Token          | Value     | Usage                        |
| -------------- | --------- | ---------------------------- |
| Primary        | `#1E3A8A` | headers, primary buttons     |
| Secondary      | `#F3F4F6` | page background              |
| Accent         | `#D97706` | highlights, active states    |
| Marble White   | `#FFFFFF` | cards, surfaces              |
| Text Dark      | `#1F2937` | primary text                 |
| Text Light     | `#6B7280` | secondary text               |
| Border         | `#E5E7EB` | borders, dividers            |
| Success        | `#10B981` | positive stats               |
| Warning        | `#F59E0B` | low-stock badges             |
| Error          | `#EF4444` | destructive actions, waste   |

Typography: `Noto Nastaliq Urdu` for Urdu (line-height 1.9 — Nastaliq needs extra
room), `Inter` for English/numbers (`.font-english` helper). Both are
**self-hosted** via `@fontsource` and precached by the service worker.

## RTL & Language

- `<html lang="ur" dir="rtl">` by default; an inline script in `index.html` restores
  the saved language/theme before first paint (no flash).
- Layout uses **logical CSS utilities** (`ps-*`, `pe-*`, `start-*`, `ms-auto`,
  `text-start`), so switching to English flips the whole layout to LTR automatically.
- The sidebar sits on the **start side** — right in Urdu, left in English.
- All labels live in `src/i18n/locales/{ur,en}.js`; bilingual data entries are
  `{ ur, en }` objects resolved via `pick()`.

## PWA Notes

- The **service worker and manifest are only generated in the production build**
  (`npm run build && npm run preview`).
- `registerType: 'prompt'` powers the **UpdatePrompt** toast: when a new version
  is deployed, users get "نیا ورژن دستیاب ہے" with a reload action.
  Switch to `'autoUpdate'` in `vite.config.js` for silent updates.
- The offline banner (under the header) appears whenever the device loses network.
- Manifest `shortcuts` deep-link to Calculator and Inventory (`/#/calculator`, `/#/inventory`).
- Fonts are self-hosted → they live in the **precache**, so the very first
  offline launch renders with correct typography (previously the Google Fonts
  CDN required one online visit first).
- iOS: Share menu → *Add to Home Screen* (`beforeinstallprompt` never fires there).
- To enrich the install dialog later, add `screenshots` entries to the manifest
  in `vite.config.js` (drop the images into `public/`).

## Customization

- **Colors / fonts:** `tailwind.config.js` (font stacks read CSS variables from `index.css`)
- **Labels:** `src/i18n/locales/ur.js` + `en.js`
- **Demo data:** `src/data/*` (per domain)
- **Env / data source:** `.env.example` + `src/config/app.config.js`
- **PWA manifest / offline rules:** `vite.config.js`
- **Icons:** replace `public/icons/icon-192x192.png` and `icon-512x512.png`

## Recommended build order for real functionality

1. Real cutting calculations in the Calculator (area, pieces, waste %)
2. Persistence via `localStorage` (`VITE_DATA_SOURCE=local` + `useLocalStorage`)
3. Backend via `src/services/apiClient.js` (`VITE_DATA_SOURCE=api`) — pages never call `fetch` directly
4. Real auth: implement `AuthContext`, enforce `ProtectedRoute`, wire the Login page
5. Real exports (PDF/Excel) behind the Reports / PrintPreview buttons
6. Wire `Skeleton` → `EmptyState` → `ErrorState` states as real data flows in
