# Almakka Factory — Marble Manager v2.3.0 (Round 4)

Files with locations. Nothing is published — these are just the files.
Build on top of the previous fixed version (v2.2), so every earlier fix
(delete working, PDF download instead of print, upload + template per
tab, mobile-friendly layout) is still included.

---

## 0. THE ZIP — what changed inside

**File:** `marble-main-fixed-v2.3.zip`

### NEW files (3)

| File location | What it is |
|---|---|
| `src/utils/factory.js` | Factory identity — "Almakka Factory" / "المکہ فیکٹری". Used on EVERY download (PDF letterhead, Excel/CSV banner rows, Word title, WhatsApp text, filenames). A custom name in Settings always wins. |
| `src/pages/Partners.jsx` | NEW tab **Partners / کاروباری ساتھی** — the rock business register: raw-rock lenders (ادھار), cut-marble borrowers, own-rock custom cutting, vehicle suppliers, other. Names in Urdu AND English, phone, vehicle no, balance. |
| `src/pages/Utilities.jsx` | NEW tab **Electricity & Solar / بجلی و سولر** — bills with units, and a MANUAL unit price (tariff changes → type the new price on each bill). Amount auto-fills from units × price but you can overwrite it. Meter no, bill no, previous/current reading. |
| `scripts/check-i18n.mjs` | Urdu/English consistency auditor (463 keys, both languages, 0 missing). Run: `node scripts/check-i18n.mjs` |

### CHANGED files (16)

| File location | What was fixed |
|---|---|
| `src/utils/printTemplates.js` | **PDF bottom text cut** fixed (Nastaliq paints below the line-box → reserved bottom padding + `avoid-all` page breaks). **")in(" fixed** — every Latin run in documents is now wrapped in `<span dir="ltr">` because the PDF rasterizer mirrors brackets inside RTL text. Factory letterhead on all documents (invoice, challan, quotation, payslip, purchase order, reports). |
| `src/utils/exporters.js` | Factory name in every Excel/CSV/Word/WhatsApp export + `Almakka-Factory-…` filename prefix. Unicode isolate marks on XLSX/CSV cells (Excel shows `60×48×96`, `L×W×H (in)` correctly in Urdu sheets). `avoid-all` page-break mode in the PDF pipeline. |
| `src/hooks/useExport.js` | Table PDFs get the same bidi-safe escaping + factory letterhead. |
| `src/utils/formatters.js` | New `bidiSafe()` helper (Unicode isolates for Excel/CSV). |
| `src/index.css` | On-screen tables: `unicode-bidi: plaintext` so `L×W×H (in)` never mirrors in the Urdu UI either. |
| `src/pages/Workers.jsx` | **Labours & Staff**: new "Name in English" + manual **Designation** field (Manager / Foreman / Labour / anything — free text). |
| `src/pages/Machines.jsx` | **Machineries**: new "Work / purpose" field, machine type now optional — add any machine by hand. |
| `src/constants/enums.js` | New enums: partner types (5), utility types, maintenance type **burned/fire**, expense categories **food** & **solar**. |
| `src/constants/routes.js` | + `/partners`, `/utilities` |
| `src/constants/navigation.js` | Partners in Purchases group (handshake icon), Utilities in Finance group (bolt icon). |
| `src/constants/storageKeys.js` | + storage keys `partners`, `utilities` |
| `src/services/db.js` | + collections `partners`, `utilities` (auto-sync to the new Supabase tables) |
| `src/utils/id.js` | + serial prefixes `PTR-`, `UTL-` |
| `src/routes.jsx` | + lazy routes for the two new pages |
| `src/i18n/locales/en.js`, `src/i18n/locales/ur.js` | ~60 new keys each, all mirrored 1:1. Also fixed 38 keys that were MISSING before and showed as raw text on screen (e.g. the dashboard column that literally displayed "FIELDS.QUANTITY" — now تعداد / Qty). |
| `package.json` | version 2.3.0 |
| `CHANGELOG.md` | ROUND 4 entry with all details |
| `supabase/schema.sql` | Complete Supabase setup v2.3 (see below) |

---

## 1. SUPABASE — run this once in the SQL Editor

**File:** `supabase-setup.sql` (also inside the zip at `supabase/schema.sql`)

```
Supabase Dashboard → SQL Editor → New query → paste the WHOLE file → RUN
```

Version 2.3 — **SAFE for your existing database**:
- It does NOT drop or empty any table — it only ADDS what is missing.
- Safe to re-run as many times as you like (idempotent).
- Adds:
  - table `partners` (the Partners tab data)
  - table `utilities` (the Electricity & Solar tab data)
  - columns `workers.name_en`, `workers.designation`
  - column `machines.work`
  - RLS policies + full anon permissions on all 21 tables (keeps Delete working)
  - updated_at triggers + indexes

After RUN: reload the app — the two new tabs store data in the cloud
and sync across devices like every other tab.

---

## 2. HOW TO RUN

```bash
unzip marble-main-fixed-v2.3.zip
cd marble-main
npm install
npm run dev          # development
npm run build        # production build in dist/
```

Your `.env` (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) stays as it is.

---

## 3. VERIFIED (real browser, both languages, desktop + 390×844 mobile)

- PDF of Blocks: header **المکہ فیکٹری / Almakka Factory**, footer complete
  (not cut), `L×W×H (in)` with correct brackets, date "21 Sept 2026" correct.
- Partners tab: add record "حاجی عبدالرحيم / Haji Abdul Rehman" → saved, listed.
- Utilities tab: 1200 units × 65.50 = 78,600 auto-amount, saved, stats update.
- Workers: Urdu name + English name + free-text designation in the add form.
- Urdu mode shows Urdu everywhere; English mode shows English everywhere.
- File downloaded as `Almakka-Factory-بلاک انوینٹری.pdf`.
