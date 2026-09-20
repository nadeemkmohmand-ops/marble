# Marble App — Bug Fix & Feature Changelog

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
