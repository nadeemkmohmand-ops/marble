# Marble Manager v2.4 — Upgrade Notes

## What was delivered

### 1. Amazing new login page
- Animated **aurora gradient background** (drifting multi-colour radial layers, GPU only)
- **Floating 3D objects**: two marble slabs with real 6-face 3D rotation, a spinning gradient cube, glass sphere, gyroscope ring, gem and colourful orbs — all with pointer **parallax** on desktop
- **Glassmorphism card** with conic-gradient logo halo, gradient headline
- **Gradient "shine" sign-in button** + spectrum buttons
- **One-tap fingerprint unlock** button (appears once enrolled in Settings → Security)
- Email + PIN sign-in (works in English & اردو, fully mobile-first, honours reduced-motion)

### 2. Single-owner app with email access grants
- Login is now **email + PIN**. The owner grants/revoke access to **any email** in
  **Settings → Email access grants** (each grant gets a role + PIN; existing
  devices are auto-migrated to `role@factory.local` emails).

### 3. Security Center (Settings → Security Center)
- **Fingerprint unlock** — WebAuthn platform authenticator (Touch ID / Android
  fingerprint / Windows Hello). Register once; a fingerprint button appears on
  the login page and on the lock screen.
- **PIN lock** — re-opening the app asks for PIN or fingerprint.
- **Auto-lock** after N minutes idle, **session timeout** after N minutes.
- **2FA (TOTP)** — works with Google Authenticator / Authy: scan QR, verify once,
  then every login asks for the 6-digit code (pure Web Crypto, ±30 s drift).
- **Login device history** — last 20 sign-ins with user agent.
- **Granular permissions** — per-module View/Add/Edit/Delete/Export matrix per
  role (owner is always full), enforced inside every table.
- **Approval rules** — discount % above limit and big receipts above an amount
  require the owner (blocked at save with a clear message).

### 4. New modules (24 new pages/collections)
| Module | What it covers |
|---|---|
| Work Orders | "cut X slabs of size S from block B" floor documents with supervisor, machine, progress % and printable PDF |
| Gate Passes | Anything leaving the factory — delivery/return/transfer/waste, vehicle, driver, **captured signature**, printable |
| Receipts | Formal receipts: method (cash/bank/cheque/online), reference no., auto-posts onto the order's paid amount |
| Ledgers | Customer / supplier / worker **transaction-by-transaction statements** with running balance, **PDF statement** + WhatsApp share |
| Accounting | Chart of accounts (pre-seeded), journal/payment/receipt vouchers, cash-book, **trial balance**, credit notes, debit notes |
| Vehicles & Trip Log | Fleet register + per-trip freight, fuel, tolls, driver pay, trip profit |
| Consumables | Blades/belts/bearings/chemicals stock in-out linked to jobs & machines, reorder points, **cost-per-sq-ft** |
| Agents & Commissions | Agent master + commission per order (earned/approved/paid) |
| Price Lists | Rate cards per size/finish/grade/customer-type with effective dates + margin floors |
| Complaints & Returns | Quality issues with photos, warranty/resolution, restock-vs-scrap, credit notes |
| Installation Jobs | Site measurement, team, schedule, **customer sign-off capture** |
| Stock Count | Physical audit sheet with live variance report + print/export |
| Audit Log | **Who changed what, before/after, when** — append-only, owner-only clear |
| Report Builder | Build custom reports from any module: pick columns, filter, sort, save, export/print |
| Lots & Bundles | Shade-batch groups + transport bundles (vein-consistent orders) |
| Cutting Optimizer (in Production) | Kerf-aware slab count + face packing with suggested cut sequence → one-click cutting plan |
| Job Cards (in Production) | Cutting/polishing/edge/chamfer jobs with machine, operator, blade, start/end, downtime |

### 5. Upgrades to existing pages
- **Orders** — tax invoice (NTN/STRN auto from Settings), GST %, **WHT**, **batch print (many invoices → one PDF)**, delivery signature, auto gate-pass when an order becomes ready
- **Purchases** — promised delivery date, PKR conversion for USD/EUR lots, **GRN tab**
- **Customers** — CRM: type (retail/wholesale/builder/government), credit limit & days, CNIC/NTN, follow-up call log, **duplicate detection & merge**
- **Suppliers** — scorecards: on-time delivery % and average landed cost
- **Machines** — **machine-hour rate** (electricity + depreciation + maintenance, and per-sq-ft)
- **Slabs** — **inherit weight & cost-per-sq-ft from the parent block**, shade-batch lot reference
- **Quotations** — **margin alert** when a line's rate falls below the price-list floor / cost+margin
- **Dashboard** — customizable widgets (show/hide/reorder, saved per device)
- **Reports** — new tabs: seasonal 12-month demand, dead stock, reorder suggestions, agent commissions, GST/WHT summary
- **Every table** — bulk select → **bulk edit** and **bulk delete**
- **Search boxes** — voice input where the browser supports it (English & Urdu)
- **Big-button mode** — larger touch targets for yard workers (Settings → Appearance)
- **Invoice print** — now titled TAX INVOICE with NTN/STRN and WHT row

### 6. Supabase (see `supabase/`)
- `supabase/schema.sql` — all 45 tables with RLS, updated_at triggers, indexes,
  **append-only audit_log**, ledger/trial-balance/valuation views, seeded chart of accounts
- `supabase/README.md` — setup steps + security notes

### 7. Bug fixes found along the way
- Fixed the 404 page crash (`t` taken from the wrong context)
- Fixed sync pushing display-only `_`-prefixed fields to the cloud (poisoned upserts)
- Repaired 11 broken test files — the suite now runs **40/40 green**

## Try this first
1. `npm install && npm run dev`
2. Open Settings → **Security Center** → register your fingerprint, set a PIN lock, enable 2FA
3. Settings → **Email access grants** → grant access to any email you want
4. Production → **Optimizer** → pick a block → *Create cutting plan*
5. Orders → select a few → **Batch print**
6. Supabase: run `supabase/schema.sql`, add your URL + anon key to `.env`, restart
