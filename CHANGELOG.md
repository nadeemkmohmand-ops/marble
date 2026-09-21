# Marble App — Bug Fix & Feature Changelog

---

## ROUND 3 — 2026-09-21 (this update, v2.2.0)

Verified the whole app end-to-end in a real browser (delete, add, save,
export menu, PDF, template download, upload import, Urdu/English,
mobile viewport). Found and fixed the remaining root-cause bugs:

### 1. DELETE finally works everywhere (root cause found)

**Files:** `src/context/AppUIContext.jsx`, `src/components/Feedback/ConfirmDialog.jsx`

- Root cause: `<ConfirmDialog />` was rendered in `App.jsx` WITHOUT the
  `state` / `onResolve` props it required, and the context never
  exposed them. So the confirmation dialog could never appear and the
  promise behind `confirm()` never resolved → **clicking delete did
  nothing, records looked "locked"** (example records included).
- Fix: the context now exposes `confirmState` + `resolveConfirm`, and
  `ConfirmDialog` reads them itself. Verified in the browser: confirm
  dialog appears, record is deleted (also from the cloud via the
  tombstoned delete queue).

### 2. Save button reachable at the end of long forms (root cause found)

**Files:** `src/index.css`

- Root cause: the page-wide `fade-in` animation animated
  `transform: translateY(6px)` with fill-mode `both`. A transform
  animation makes the page div the CSS *containing block* for
  `position:fixed` descendants — so the Add/Edit modal anchored to the
  PAGE instead of the viewport. On any page taller than the screen,
  the sticky Save/Cancel footer sat **below the visible area** — this
  is the "no submit button when I reach the end" bug.
- Fix: the keyframes now animate opacity only (same look, no broken
  fixed positioning). Verified on a 390×844 mobile viewport: full-width
  محفوظ کریں / Save button is visible at the bottom of every form.

### 3. PDF downloads are no longer blank (root cause found)

**Files:** `src/utils/exporters.js`, `src/utils/printTemplates.js`

- Root cause: `downloadPDF` handed the off-screen wrapper
  (`position:fixed; left:-99999px`) to html2pdf. html2pdf keeps the
  source's own `position:fixed` in its render copy; a fixed clone
  escapes the render container's flow → container height 0 → **blank
  PDF** (measured canvas height 0 in a live browser).
- Fix: render the inner, in-flow `.print-doc` element instead
  (width 718px = exact A4 inner width 190mm), verified: canvas now
  1438×358+ with real content.
- Style leak fixed too: the document CSS used to target bare `body`,
  `table`, `th`, `td` — restyling the whole live app while a document
  was on screen. All rules are scoped under `.print-doc` now.

### 4. Untranslated labels in Urdu mode

**Files:** `src/i18n/locales/ur.js`, `src/i18n/locales/en.js`

- Added the missing `fields.*` keys found by an automated audit of
  every form on every page: `notes` (نوٹس — shown raw as "notes" on 12
  pages), `amount`, `vendor`, `blockRef`, `pieceCutting`,
  `piecePolishing`, `pieceLoading`, `pieceInstallation`.

### Files changed in this round

| File | Change |
|------|--------|
| `src/context/AppUIContext.jsx` | expose confirmState/resolveConfirm |
| `src/components/Feedback/ConfirmDialog.jsx` | self-contained dialog (fixes delete) |
| `src/index.css` | fadeIn = opacity only (fixes Save off-screen) |
| `src/utils/exporters.js` | downloadPDF renders inner static element (no blank PDF) |
| `src/utils/printTemplates.js` | all CSS scoped under .print-doc |
| `src/i18n/locales/en.js` / `ur.js` | 8 missing field labels |
| `package.json` | version 2.2.0 |

---

## ROUND 2 — 2026-09-21

Fixes applied on top of round 1, targeting the issues confirmed from
your screenshots and from probing your live Supabase project.

### A. Supabase backend actually working now (THE BIG ONE)

**Files:** `supabase/schema.sql`, `src/services/sync.js`, `src/services/db.js`,
`src/constants/storageKeys.js`, `src/App.jsx`, `src/components/Layout/Header.jsx`

Diagnosis by connecting to your Supabase project with the app's keys:

- Only 5 of the 19 tables existed (`customers, orders, workers,
  attendance, expenses`) and they were hand-made with the WRONG
  columns (e.g. `attendance` had no `date`, `worker_name`, `overtime`).
  The other 14 tables (blocks, slabs, …) did not exist at all.
- The app was sending **camelCase** fields (`blockNo`, `landedTotal`,
  `paidAmount`…) straight to Postgres, whose columns are
  **snake_case** (`block_no`, `landed_total`, `paid_amount`) — so EVERY
  cloud save silently failed.
- Deletes were fire-and-forget: if the cloud delete failed, the record
  was re-pulled later — this is exactly why the example records
  "can't be deleted".

What changed in code:

1. **`sync.js` (rewritten)** — every record is now converted
   camelCase → snake_case before upload and snake_case → camelCase
   after download (generic, covers all fields). Collection → table
   name mapping handled (`cuttingPlans` → `cutting_plans`).
2. **Deletion queue + tombstones** — deleting a record now queues the
   cloud delete and remembers the id ("tombstone") until Supabase
   confirms. A deleted record can NEVER come back, even if the delete
   has to retry while offline. Failed operations stay queued and retry
   automatically; the header now shows a red icon if cloud sync has an
   error, so problems are visible on mobile too.
3. **Cloud pull wired up** — `pullRemote()` was dead code; it is now
   called at startup and when the network returns, so your data
   syncs across devices. Tombstones are respected during pull.
4. **`supabase/schema.sql` (complete rewrite)** — one paste-and-run
   script that creates ALL 19 tables with the exact columns the app
   writes, plus indexes, auto `updated_at`, full GRANTs to the anon
   role, and permissive RLS policies — this is what makes Save, Edit
   and DELETE actually work against Supabase. Run it once in the
   Supabase SQL Editor (your current cloud tables are empty, so
   nothing is lost).

### B. Print removed everywhere — PDF = real download

**Files:** `src/components/UI/ExportMenu.jsx`, `src/hooks/useExport.js`,
`src/pages/PrintPreview.jsx`, `src/utils/exporters.js`, `src/pages/Orders.jsx`,
`src/pages/Payroll.jsx`, `src/i18n/locales/{en,ur}.js`

- The Export menu no longer has a "Print" item (Excel / PDF / Word /
  CSV / WhatsApp / Share remain).
- Clicking **PDF downloads a real .pdf file** instantly — no print
  dialog, no "Save as PDF" step.
- The old "Print Preview" page is now "PDF Preview" — it has a
  **Back button that is always visible on every screen size** (before
  it was icon-only on mobile, so people got stuck there) plus a
  fallback to the dashboard if there is no history. Invoices,
  challans, payslips and QR labels all download as PDF files.

### C. Enum dropdowns fully in Urdu, shorter and meaningful

**Files:** `src/i18n/locales/{en,ur}.js`, `src/pages/Blocks.jsx`,
`src/pages/Slabs.jsx`

- New `enums.grade` bucket — grades now show **الف / ب / ج** in Urdu
  (they were hard-coded as English "A / B / C" labels in Blocks).
- Stock-movement labels shortened: خرید، کٹنگ، منتقلی، فروخت، خرابی،
  واپسی، درستی. Also shortened: پالش، چائے، باقی.
- If a translation is ever missing the app now falls back to the raw
  value (never an ugly dotted key like `enums.movement.type.…`).

### D. Upload + template download on every tab (improved)

**Files:** `src/components/UI/ImportButton.jsx`, `src/utils/bulkImportExport.js`

- The **اپ لوڈ / Upload** button label is now visible on mobile too
  (it was icon-only before, so the feature was invisible).
- The import panel explains the flow in your language.
- **The template's example row is now auto-skipped on upload** — you
  can type your data straight below the example row and upload; the
  filled rows go into the tab, the example row does not create a junk
  record.
- Import confirmation dialog got full-width stacked buttons on phones.

### E. Add-form save button always reachable (mobile)

**Files:** `src/components/CrudPage.jsx`, `src/components/UI/Modal.jsx`

- The modal keeps its sticky footer (dvh fix from round 1) and the
  Save/Cancel buttons are now stacked full-width on phones — reaching
  the end of a long form, the big Save button is right there, no
  scrolling past it, no hunting for it.

### Verification

- `npm run build` — passes.
- `npm test` — same results as before this round (no regressions);
  the import/export tests (6) pass.

---

All changes were made against `marble-main.zip` as uploaded. The app
builds cleanly (`npm run build`) and the existing test suite passes
at the same baseline as before (11 pre-existing/unrelated test-file
failures — same count before and after these changes — plus 6 new
passing tests for the import feature).

Two deliverables are attached:
- `marble-changed-files.zip` — only the files that changed or are
  new, with their original folder paths, so you can diff/merge them
  into your own copy.
- `marble-main-fixed.zip` — the full project with all fixes applied,
  ready to `npm install && npm run dev` / deploy as-is.

---

## 1. Enum dropdowns showing raw text like `enums.movement.type.adjustmen`

**File:** `src/components/CrudPage.jsx`

The Add/Edit form's select fields and the detail-view renderer built
the Urdu/English translation lookup as
`enums.<prefix>.<fieldKey>.<value>`, but every enum bucket in the
locale files is flat: `enums.<prefix>.<value>` (no field-key
segment). The lookup always missed, and the app's translator
function falls back to returning the raw key string — exactly what
you were seeing.

Fixed in two places (the form dropdown and the read-only detail
view) to use the correct flat path, with a safe fallback to the
plain value (never the ugly dotted key) if a translation is ever
genuinely missing.

## 2. Long, untranslated English hint text under Urdu

**Files:** `src/pages/{Blocks,Expenses,Offcuts,Purchases,Slabs,
StockMovements,Workers}.jsx`, `src/i18n/locales/{en,ur}.js`

18 field hints were hardcoded in English (e.g. `"qty, sq ft or cft
moved"`), so they showed in English even in Urdu mode. Added a new
`hints` bucket to both locale files with short, meaningful Urdu
translations, and pointed every affected field at `t('hints.xxx')`
instead of a literal string.

## 3. No visible Save/Submit button on long Add forms (mobile)

**File:** `src/components/UI/Modal.jsx`

The modal used `max-h-[92vh]`. On mobile, `vh` doesn't shrink when
the on-screen keyboard opens, so a long form could extend past the
visible viewport and push the Save button off-screen with no way to
reach it. There was also a missing `min-h-0` on the scrollable
content area — a flexbox quirk that can prevent a flex child from
actually scrolling inside its parent.

Fixed by switching to `dvh` (dynamic viewport height — shrinks with
the keyboard) with a `vh` fallback for older browsers, adding
`min-h-0`/`shrink-0` in the right places, and giving the footer an
explicit background so it's never visually lost.

## 4. PDF export just opened the print dialog, not a real download

**Files:** `src/utils/exporters.js`, `src/hooks/useExport.js`,
`src/pages/PrintPreview.jsx`, `src/components/UI/ExportMenu.jsx`,
`package.json` (added `html2pdf.js`)

"PDF (Print)" in every export menu, and "Print / Save PDF" on the
print-preview page, both just opened the browser's print dialog —
you had to manually choose "Save as PDF" yourself. This was actually
a deliberate tradeoff in the original code (there's a comment
explaining that browser-print keeps Urdu text shaping correct, since
most PDF-generation libraries handle Urdu/Nastaliq very poorly).

Fixed by adding a genuine one-click PDF **download** using
`html2canvas` + `jsPDF` (via the `html2pdf.js` package): it renders
the already-correct HTML off-screen and rasterizes it into the PDF,
so Urdu shaping stays perfect (it's a picture of real, working HTML)
while still producing an actual file with no manual step. "Print"
is now a separate, honestly-labeled button for anyone who wants to
print on paper; "Download PDF" is the new direct-download button.

`html2pdf.js` was checked with `npm audit` — it introduces no new
vulnerabilities beyond what the project already had in its toolchain
(vite/vitest/xlsx, pre-existing).

## 5. "Can't delete" records

**File:** `src/components/CrudPage.jsx`

Root cause: opening a record's detail view (the natural way to look
at something before deleting it) only offered **Edit** and
**WhatsApp** buttons — there was no Delete option there at all. The
only way to delete was a small 32px trash icon in the table row,
easy to miss or mis-tap next to Edit/View on a phone.

Fixed by adding a Delete button (with the same confirm dialog) to
the detail view, and enlarging the row-action icons to 40px tap
targets on mobile (was 32px) with slightly more spacing between them.

Note: nothing in the data layer ever protected example/seed records
from deletion — they were always deletable at the data level. The
above was the actual UX gap.

## 6. Garbled Urdu text in dropdown menus

**File:** `src/components/UI/Select.jsx` (fully rewritten),
`src/components/CrudPage.jsx` (toolbar filter dropdown), `src/
index.css`

All dropdowns were native `<select>` elements. On Android/iOS, the
OS renders the native popup list with its own system font,
completely ignoring the page's custom Nastaliq font — so Urdu
glyphs disconnect/garble in the open dropdown even though the closed
control looks fine. This is a known platform limitation, not
something fixable with CSS alone.

Per your request, this is now a **fully custom-built dropdown** (not
a native `<select>`) — its own popup list, rendered entirely with
the app's own fonts and styling, so Urdu always displays correctly.
It's a drop-in replacement: every existing place that used `<Select>`
keeps working unchanged (same props, same `onChange` event shape),
plus the one leftover native `<select>` in the toolbar's quick-filter
was switched over too.

It's keyboard accessible (arrow keys, Enter, Escape, Home/End),
closes on outside click, and matches the app's RTL layout
automatically.

## 7. Urdu text getting cut off / not fully visible in boxes

**Files:** `src/index.css`, `src/components/Layout/Sidebar.jsx`,
`src/components/UI/Select.jsx`

Two separate causes, both fixed:

- The CSS rule that gives form controls extra height/line-height for
  Nastaliq's taller glyphs only covered native `input`/`select`/
  `textarea` — it missed the new custom dropdown's trigger button and
  its popup list items, and missed `.no-clip` co-applied with
  `.truncate` (used by the sidebar nav and breadcrumbs). Extended the
  rule to cover all of these.
- Nav labels in the sidebar and breadcrumbs used `truncate`, which
  forces single-line + ellipsis — for longer Urdu labels (e.g.
  "بچے ہوئے ٹکڑے", "اسٹاک موومنٹ") this could cut a glyph chain
  mid-ligature, which can visually change which letters appear. In
  Urdu mode, `.no-clip` now overrides `.truncate`'s single-line
  behavior so long labels wrap onto a second line instead of getting
  cut.

## 8. New: Excel template download + upload-to-import, on every tab

**Files:** `src/utils/bulkImportExport.js` (new),
`src/components/UI/ImportButton.jsx` (new), `src/components/
CrudPage.jsx`, `src/i18n/locales/{en,ur}.js`, `src/test/
bulkImportExport.test.js` (new)

Added to all 13 data-entry tabs (Blocks, Slabs, Offcuts, Stock
Movements, Machines, Maintenance, Purchases, Suppliers, Customers,
Quotations, Orders, Workers, Expenses) automatically, since they all
share the same `CrudPage` component:

- **Download template** — an `.xlsx` file with a header row (the
  same field names shown in that tab's Add form, in whichever
  language you're using) and one filled-in example row underneath,
  so the expected format is obvious.
- **Upload filled file** — pick a filled-in `.xlsx`/`.xls`/`.csv`
  file; it matches columns back to fields (by header text, in either
  language, so a template downloaded in Urdu still uploads fine
  after switching to English), shows how many rows will be imported
  and flags any rows missing a required field, then saves them as
  new records after you confirm.

Fields that aren't meaningful in a spreadsheet (photos,
auto-computed read-only values, the custom order line-items editor)
are automatically left out of the template — only the fields you'd
actually fill in by hand are included.

This is new functionality (nothing like it existed before), so it
has its own test file covering the round-trip (template shape,
required-field validation, blank-row handling, and actually saving
to storage) — 6 tests, all passing. Writing these caught a real bug
before it shipped: `File.arrayBuffer()` isn't available in some
older/embedded mobile browsers, so the upload now falls back to
`FileReader` automatically.

---

## Known dead code (found, not touched)

While auditing for Urdu-clipping issues, found several UI components
that are never imported/used anywhere in the app (`UserMenu.jsx`,
`Accordion.jsx`, the CSS-only `Tooltip.jsx`, `Checkbox.jsx`,
`RadioGroup.jsx`, `Pagination.jsx`). Some of these reference a
different design system (classes/hooks that don't exist in this
codebase) and would likely error if ever wired up. They're inert —
not affecting anything you see — so left alone rather than risk
unrelated changes, but flagging in case you want them cleaned up
later.

## Out of scope for this pass

- `Attendance.jsx`, `Payroll.jsx`, `Production.jsx` have their own
  bespoke UI (not the shared `CrudPage`), so they didn't get the
  Excel import feature in this pass — they'd need a similar feature
  built specifically for their shape of data if you want it there
  too.
