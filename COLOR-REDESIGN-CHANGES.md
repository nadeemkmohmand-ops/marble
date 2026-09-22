# COLOR REDESIGN — FULL CHANGE MAP
**Project:** marble-main (Marble Manager — React 18 + Vite 5 + Tailwind 3 PWA)
**Theme:** Cream Editorial Modern — cream background, orange accents, bright-blue gradient buttons, warm charcoal dark mode, animated 3D background.

> No publishing, no logic changes — colors, styles and decorative animation only.
> Every changed file and WHERE inside it is listed below.

---

## 1. DESIGN SYSTEM CORE

### `tailwind.config.js` (whole file rewritten)
- **colors** (lines 7–54): removed old white/gray/slate palette. New tokens:
  - `cream` 50–900 → warm editorial surfaces (replaces ALL white backgrounds)
  - `flame` 50–700 → signature orange (accents, active states)
  - `azure` 50–700 → bright blue (primary buttons, links)
  - `surface.light #faf6ee / surface.dark #1b1713`
  - Legacy aliases kept so every existing utility resolves (`primary`, `accent`, `border`, `main`, `muted`…)
- **boxShadow** (lines 67–73): soft warm shadows + `glow-orange` / `glow-blue`
- **keyframes + animation** (lines 74–108): `floatSlow`, `floatSlower`, `bubbleRise`, `spinSlow`, `popIn`, `slideUpFade`

### `src/index.css` (main stylesheet — see section anchors)
| Lines | Section | What it does |
|---|---|---|
| 6–42 | **Root / theme tokens** | Cream light theme (`--bg #f6f1e6`, `--card #fffdf8`) + warm charcoal dark theme (`--bg #171310`) — never navy. Orange `--accent #f97316`, blue `--blue #2563eb` |
| 44–70 | Body / selection / focus | Cream body background, orange text selection, orange focus rings |
| 72–163 | **Urdu/Nastaliq no-clip rules** | PRESERVED unchanged (line-height 2.2, overflow visible, bidi plaintext) |
| 186–203 | RTL polish + warm scrollbars | Orange-tinted scrollbar thumbs |
| 209–267 | **Surfaces** | `.card`, `.card-hover` (3D lift + warm border glow), `.surface`, `.top-hairline` (orange→blue gradient line) |
| 269–432 | **BUTTON SYSTEM** | `.btn` base (springy transitions); `.btn-primary` = **bright blue gradient + thin luminous white border + diagonal light-sweep on hover + lift + glow**; **`.btn:active` = orange gradient** (EVERY button turns orange when pressed); `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-success`, `.btn-whatsapp`; `.btn-active-orange` (persistent selected state); `.icon-btn` (orange press) |
| 434–452 | **Inputs** | Orange hover border, orange focus ring + warm inner tint |
| 454–465 | Badges | Soft translucent tints, thin borders |
| 467–499 | Skeleton / fadeIn | Orange-tinted shimmer |
| 501–562 | **Animated background FX** | `.bgfx` fixed layer, 3 gradient blobs, editorial dot grid, `.bgfx-bubble` (3D soap bubbles with inner highlights) rising with `bubbleRise` keyframes |
| **564–660** | **DATA TABLES** ⭐ NEW | `.data-table`: gradient header band (orange→blue tint, rounded ends, 2px orange→blue hairline under header), rounded "card rows", faint warm zebra, **hover = warm orange tint + glowing border + gradient tick that scales in on the first cell**, dark-mode variants |
| **661–684** | **Gradient-ring utility** ⭐ NEW | `.gradient-border`: premium 1px orange→blue gradient ring (double-background border-box trick), light + dark |
| **686–750** | **Floating 3D shapes** ⭐ NEW | `.shape3d-sphere` (glass ball with specular highlight), `.shape3d-ring` (tilted gyroscope ring spinning via `ringSpin`), `.shape3d-gem` (gradient diamond tumbling via `gemFloat`) |
| 752–776 | 3D cube | `.cube3d` — 6-face spinning CSS cube (orange/blue faces) |
| 777–787 | 3D float | `.float3d` — perspective float for hero cards |
| 788–800 | Gradient text | `.text-gradient-flame`, `.text-gradient-blue` |
| 802–826 | Reduced motion | NEW shapes added to the kill-list (accessibility) |
| 830–856 | Print | PRESERVED (white print paper, hides `.bgfx` / nav) |

---

## 2. ANIMATED BACKGROUND

### `src/components/Layout/BackgroundFX.jsx` (NEW component)
- Fixed `z-index:-1` layer, `aria-hidden`, pointer-events none, hidden in print
- 3 drifting gradient blobs — orange (top-left), blue (right), amber (bottom)
- Editorial dot grid fading towards the fold
- **10 rising 3D soap bubbles** (deterministic layout, sizes 7–18px, varied speed/drift)
- ⭐ NEW (this update): **3 floating 3D shapes** — glass sphere (top-left), spinning gyroscope ring (bottom-right), gradient gem (right). Wrapper/inner structure so float + spin animations compose. Honours `prefers-reduced-motion`.

### `src/components/Layout/Layout.jsx`
- `<BackgroundFX />` mounted inside the app shell (behind sidebar/header/content)

### `src/pages/Login.jsx`
- `<BackgroundFX />` mounted on the auth screen
- Login card: `float3d` gentle 3D tilt animation
- Page title: orange flame gradient text
- Tiny spinning CSS 3D cube decoration

---

## 3. UI COMPONENTS

| File | Location inside file | Change |
|---|---|---|
| `src/components/UI/Button.jsx` | `variantClasses` map | All variants remapped to the new button system (blue gradient / orange active) |
| `src/components/UI/Tabs.jsx` | active tab classes | Selected tab = persistent orange gradient |
| `src/components/UI/Pagination.jsx` | current-page button | Current page = persistent orange gradient |
| `src/components/UI/Toggle.jsx` | checked track | Checked = orange gradient; knob keeps white (functional) |
| `src/components/UI/ProgressBar.jsx` | default fill | Orange gradient fill |
| `src/components/UI/StatCard.jsx` | root button className | ⭐ `gradient-border` premium ring added + `card-hover` 3D lift; icon tones flame/azure/emerald/amber/red |
| `src/components/UI/Badge.jsx` | tone map | Soft translucent tints with thin borders |
| `src/components/UI/Modal.jsx` | panel className | Gradient top hairline + `popIn` entrance |
| `src/components/UI/Select.jsx` | popup listbox | `popIn` entrance animation |
| `src/components/UI/Spinner.jsx` | spinner color | Signature orange |
| `src/components/UI/EmptyState.jsx` | icon wrapper | Orange tinted circle |
| `src/components/UI/Accordion.jsx` | item className | Removed dead class (visual bug) |
| `src/components/UI/Table.jsx` | ⭐ **WHOLE FILE** | Rebuilt on the new `.data-table` system: gradient header band + accent hairline, rounded card rows, warm zebra, hover glow + animated gradient tick on first cell. **Urdu safety kept** (`leading-urdu`, `no-clip`, no fixed heights). Affects Inventory, Blocks, Slabs, Orders, Payroll, Attendance, Reports, Production, Home, and all CrudPages |
| `src/components/UI/ChartPlaceholder.jsx` | donut center | Uses `var(--card)` instead of hardcoded white |

### Layout components
| File | Location | Change |
|---|---|---|
| `src/components/Layout/Sidebar.jsx` | nav item + logo tile | Active item = orange gradient + glow, hover slide, `slideUpFade` entry, gradient logo tile |
| `src/components/Layout/BottomNav.jsx` | active item | Orange active + top indicator pill + gradient hairline |
| `src/components/Layout/Header.jsx` | app header | Stronger glass blur + soft warm shadow |
| `src/components/Layout/UserMenu.jsx` | avatar + dropdown | Orange gradient avatar (was invisible white/10), `popIn` dropdown, dark hover fixed |

---

## 4. PAGES & DATA

| File | Location | Change |
|---|---|---|
| `src/pages/Home.jsx` | Recharts `<defs>` (lines ~156–165) | Bar chart = blue gradient + orange gradient fills; pie palette → blue/orange/amber/emerald (violet removed) |
| `src/pages/Reports.jsx` | line chart series colors | Updated to azure/flame family |
| `src/pages/Inventory.jsx` | tone classes | Violet → azure |
| `src/components/Feedback/Toast.jsx` | accent classes | sky → azure |
| `src/pages/Notifications.jsx` | accent classes | sky → azure |
| `src/data/home.js` | `quickActions[1].cls` (line ~52) | ⭐ Removed hardcoded `bg-white … dark:bg-gray-800` → theme tokens (`var(--card)` / `var(--border)`) |
| `index.html` | `<meta name="theme-color">` | `#f6f1e6` (cream) — browser chrome matches the theme |

---

## 5. INTENTIONALLY KEPT WHITE (functional, not theme)
- `src/index.css` print block — paper must be white for printing
- `src/pages/PrintPreview.jsx` — simulates printed paper
- `src/utils/printTemplates.js`, `src/utils/exporters.js` — print/export rendering surfaces
- `src/components/UI/QRBadge.jsx` — QR codes need white to scan
- `src/components/UI/Toggle.jsx` knob — standard switch handle

---

## 6. VERIFICATION
- `npx vite build` — ✅ passes (PWA precache OK)
- Visual QA (headless browser): dashboard, inventory table (light + dark), row hover, mobile 390px — no horizontal overflow, Urdu text intact
- App logic, routes, i18n, tests untouched

## 7. HOW TO USE THE NEW TOKENS
- Backgrounds: always `var(--bg)` / `var(--card)` — never `white` / `bg-white`
- Buttons: `<Button>` → blue gradient; pressed/selected → orange automatically (`:active`, `.btn-active-orange`)
- Accents: `var(--accent)` (orange), `var(--blue)` (bright blue)
- New utilities available anywhere: `.gradient-border`, `.data-table`, `.top-hairline`, `.text-gradient-flame`, `.text-gradient-blue`, `.float3d`, `.cube3d`, `.shape3d-*`
