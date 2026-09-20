# Marble Manager — ماربل منیجر

Complete marble-factory management PWA: blocks, slabs, offcuts, stock movements, production & cutting, purchases, sales, labour & payroll, expenses, machines, reports — bilingual **Urdu (RTL, default) + English**, installable & offline-capable, cloud-sync ready (Supabase), deployable on Vercel as a static app.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # vitest
npm run build      # production build → dist/
```

## Deploy (Vercel)

1. Push to GitHub — Vercel auto-detects Vite (build `npm run build`, output `dist`).
2. (Optional cloud sync) Add environment variables in Vercel → Project → Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run `supabase/schema.sql` in your Supabase project's SQL editor once.
4. Redeploy. Without env vars the app still works 100% offline on device storage.

## First run

The app seeds a small starter dataset (blocks, slabs, orders, workers…) so dashboards are meaningful. Erase it any time in **Settings → Danger zone** or edit records freely. Login PINs (default): owner `1111`, manager `2222`, accountant `3333`, supervisor `4444` — login is optional unless `VITE_REQUIRE_AUTH=true`.

## Feature map

| Module | Where |
|---|---|
| Block inventory (dimensions, CFT, weight, landed cost, photos, yard/rack, statuses) | `/blocks` |
| Slab inventory (unique ID + QR, finish, edge, grade, reservations) | `/slabs` |
| Offcuts / remnants / bundles (sell by sq ft / running ft / piece) | `/offcuts` |
| Stock movements (purchase, cutting, transfer, sale, damage, return, adjustment) | `/movements` |
| Production: cutting plans, job cards, yield/recovery %, kerf | `/production` |
| Machines & maintenance register with downtime | `/machines`, `/maintenance` |
| Purchases with landed cost & multi-currency | `/purchases` |
| Supplier ledgers + WhatsApp share | `/suppliers` |
| Customers with ledger & statement | `/customers` |
| Quotations (room-wise items, wastage %, convert → order) | `/quotations` |
| Orders (pipeline, advance, challan, invoice) | `/orders` |
| Workers, attendance, payroll (Urdu payslips), piece work | `/workers`, `/attendance`, `/payroll` |
| Expenses (recurring, allocation) | `/expenses` |
| Reports (P&L, profit per order/customer, receivables, valuation, aging, downtime) | `/reports` |
| Calculator (area, volume/weight, recovery, kerf, cost, price, profit, break-even, what-if) | `/calculator` |
| Export every table: Excel, PDF, Word, CSV, WhatsApp, native share | everywhere (⬇ button) |
| QR labels + camera scanning | slab/block rows, Scan button |
| Backup / restore (JSON) | `/settings` |

## Export & WhatsApp

- **Excel (.xlsx)** — SheetJS, RTL sheet for Urdu titles.
- **PDF** — opens the print dialog with a styled document (perfect Urdu shaping via browser text stack). Choose *Save as PDF*.
- **Word (.doc)** — Word/Google-Docs compatible HTML document.
- **CSV** — UTF-8 with BOM (Excel opens Urdu correctly).
- **WhatsApp** — full readable record/report text via `wa.me`; on phones the share button uses the native share sheet and can attach the generated file.

## Urdu / RTL notes

Nastaliq glyphs need generous vertical space — the app ships with a clipping fix in `src/index.css` (`line-height: 2.2`, `min-height` instead of fixed heights, `overflow: visible` on labels/badges/cells). If you add new components, prefer `min-h-*` over `h-*` and keep the `no-clip` / `leading-urdu` classes on text that can be Urdu.

## Tech

React 18 · Vite 5 · Tailwind 3 · react-router-dom (HashRouter — zero server config) · vite-plugin-pwa · SheetJS · qrcode + html5-qrcode · recharts · @supabase/supabase-js · self-hosted fonts (@fontsource Inter + Noto Nastaliq Urdu) · Vitest.
