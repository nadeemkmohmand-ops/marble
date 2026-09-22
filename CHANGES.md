# Marble Manager — fix bundle (2026-09-22)

Drop these files into your project **over the existing ones** at the same
relative paths. Then run `bun run build` (or `npm run build`) again —
no other setup is needed.

---

## 1. Duplicate Wi-Fi icons in the header → fixed

**File:** `src/components/Layout/Header.jsx`

The header had **two** things that drew a Wi-Fi glyph at the same time:

1. `SyncDot` — when cloud sync had an error it rendered `<WifiOff />`.
2. The static online/offline pill — it rendered `<Wifi />` when online
   and `<WifiOff />` when offline.

When Supabase wasn't fully set up (which is exactly the state your DB
was in) `sync.lastError` was set AND the device was offline, so BOTH
icons rendered → "two Wi-Fi symbols".

**Fix:** removed the static online/offline pill entirely and changed
the `SyncDot` error icon from `WifiOff` to `AlertCircle`. The two states
are now visually distinct:

| State                  | Icon shown              |
| ---------------------- | ----------------------- |
| Sync OK, nothing pending | (nothing)             |
| Pending uploads        | spinning `RefreshCw` (amber) |
| Sync error (e.g. missing table) | red `AlertCircle` |
| Offline banner         | (handled by `OfflineBanner.jsx` if you ever render it — it's not currently mounted) |

The `useOnlineStatus` import is no longer needed in the header and has
been removed.

---

## 2. Auto-calculation in the Units tab (and every other tab) → fixed

**Files:**
- `src/components/CrudPage.jsx`
- `src/pages/Utilities.jsx`
- `src/pages/Payroll.jsx`
- `src/i18n/locales/en.js`
- `src/i18n/locales/ur.js`

### What was wrong

`CrudPage` had a `config.compute(values)` hook that pages could use to
derive fields (area, total, weight…), but it was **only called inside
`submit()`**. So as the user typed, the readonly/computed fields stayed
blank/old until they pressed Save.

### What's changed

`CrudPage` now wraps every `setField` call so that **after every
keystroke** `config.compute` runs and the derived fields are merged back
into the form. The user sees the auto-calculated value update **in real
time**.

This is a single change in `CrudPage` and it instantly fixes every page
that already had a `compute` function:

| Page         | Derived fields that now update live                  |
| ------------ | ---------------------------------------------------- |
| **Utilities** | `units = currentReading − previousReading`, `amount = units × unitPrice` |
| **Blocks**    | `cft`, `weightKg`, `landedTotal`                    |
| **Slabs**     | `areaSqft`, `areaSqm`                               |
| **Offcuts**   | `areaSqft`                                          |
| **Purchases** | `landedTotal`                                       |
| **Orders**    | `total` (also recalculates when an item line changes inside `OrderItemsEditor`) |
| **Quotations**| `total`                                              |

### Utilities tab — specifically

Old behaviour: `amount` was suggested only if it was still `0`; `units`
was never derived from the readings.

New behaviour — `compute` now does:

```js
// both readings must be filled; current must be ≥ previous
if (prev != null && cur != null && cur >= prev)
  units = cur − prev                    // auto, overrides any manual value

// amount always recomputed from units × price (if both > 0)
if (units > 0 && price > 0)
  amount = units × unitPrice           // auto, rounded to 2 decimals
```

Empty / null / undefined readings are treated as "not filled yet", so
clearing one field doesn't make `units` jump to `cur − 0` or `0 − prev`.

### Payroll → Piece work tab

The inline "add piece work" form used to compute `earning = units × rate`
only on submit — the user couldn't see the earning before saving.

Added a **live preview line** under the form:

```
12 × Rs 50 = Rs 600
```

It uses the worker's default rate for the chosen work type if the rate
field is blank, exactly like the submit path does — so the preview
always matches what will actually be saved.

### i18n

New hint key `hints.unitsAuto`:

- EN: `Auto: current reading − previous reading`
- UR: `خودکار: موجودہ ریڈنگ − پچھلی ریڈنگ`

Shown under the `units` field in the Utilities tab so the user knows
it's auto-filled.

---

## 3. Top nav + bottom nav stay visible behind the modal → fixed

**Files:**
- `src/components/UI/Modal.jsx`
- `src/components/UI/Drawer.jsx`
- `src/index.css`

### What was wrong

The modal/drawer's `fixed inset-0 z-[80]` overlay was higher than the
header's `sticky top-0 z-40`, but the overlay was `bg-black/50` (50%
opacity) with a blur — so the header was still half-visible through it.
On a phone the bottom nav also shone through, making the form look
cluttered and not "on top".

### What's changed

When a modal or drawer opens, it now adds a `modal-open` class to
`document.body`. CSS hides the header and the bottom nav while that class
is active:

```css
body.modal-open .app-header,
body.modal-open .bottom-nav {
  visibility: hidden !important;
  pointer-events: none !important;
}
```

`visibility: hidden` (rather than `display: none`) is used so the layout
doesn't shift and the modal stays anchored to the viewport — the form
just becomes the only thing visible. The class is removed on close.

This applies to **every** modal/drawer in the app: Add/Edit record
forms, the detail drawer, the QR scanner modal — they all get the clean
full-screen treatment.

---

## 4. Supabase database — upgrade SQL

**File:** `supabase/schema.sql`

The `supabase-setup.sql` you uploaded is **v2.2**. The current app
expects **v2.3**. The differences that matter for your data:

| Missing in v2.2        | Why the app needs it                          |
| ----------------------- | --------------------------------------------- |
| `utilities` table        | The whole Units / Electricity & Solar tab     |
| `partners` table        | The Partners tab                              |
| `workers.name_en` column | English name on labours                       |
| `workers.designation` column | Free-text role (Manager, Foreman, Labour) |
| `machines.work` column   | Free-text "what the machine does"             |

### How to upgrade

Open your Supabase project → SQL Editor → New query → paste the entire
contents of `supabase/schema.sql` → press **RUN**.

It's safe to run on top of your existing v2.2 database — it uses
`create table if not exists` and `alter table … add column if not
exists` everywhere, so nothing is dropped and no data is lost. It just
adds what's missing (the two tables and the three columns), rebuilds the
indexes/triggers, and re-applies the RLS policies.

After running it, the Units tab will sync to the cloud and the SyncDot
in the header will stop showing the red `AlertCircle` error.

---

## File list

```
src/components/CrudPage.jsx           (live compute wrapper)
src/components/Layout/Header.jsx      (removed duplicate wifi icon)
src/components/UI/Drawer.jsx          (modal-open body class)
src/components/UI/Modal.jsx           (modal-open body class)
src/index.css                          (hide header/nav when modal-open)
src/i18n/locales/en.js                (new hint: unitsAuto)
src/i18n/locales/ur.js                (new hint: unitsAuto)
src/pages/Payroll.jsx                  (live earning preview)
src/pages/Utilities.jsx               (units + amount auto-calc)
supabase/schema.sql                    (v2.3 — run in Supabase SQL Editor)
```

## How to apply

1. Copy the `src/` folder over your project's `src/` folder
   (overwrite existing files).
2. Copy `supabase/schema.sql` somewhere convenient.
3. Run `bun run build` (or `npm run build`) — the build will succeed
   with no errors.
4. Open Supabase → SQL Editor → paste `supabase/schema.sql` → RUN.
5. Reload the app. Done.
