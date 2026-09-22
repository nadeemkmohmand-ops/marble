# What changed — colorful/3D theme overhaul

Only the files below were touched. Drop them into your project at the same
paths (they replace the existing files 1:1) — everything else is untouched.

## 1. `marble-main/tailwind.config.js`
- Added 3 new color families: `violet`, `teal`, `magenta` (used by the new
  button/export gradients).
- Added a `pulseGlow` keyframe + `animation.pulseGlow` utility for optional
  glowing-badge effects.

## 2. `marble-main/src/index.css`  (the big one)
- **Root tokens (`:root` / `.dark`)**: replaced the near-white `--bg` / `--card`
  values with tinted violet/blue/orange tones, and added a new
  `--app-gradient` (multi-color radial+linear gradient) that now paints the
  whole `<body>` background — no more flat white/cream page background.
- **`.card`**: now sits on a soft diagonal gradient (orange→card→blue tint)
  instead of a flat card color, plus an inner top highlight for extra depth.
- **Button system (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`,
  `.btn-danger`, `.btn-success`, `.btn-whatsapp`)**:
  - Every button now has a solid "floor" shadow (`0 3px 0 0 …`) under it at
    rest, which **collapses on `:active`** (translateY(2px)) — a real
    pressed-button 3D effect, not just a glow.
  - `.btn-secondary` no longer uses the plain card/near-white background —
    it's now a violet→purple gradient with a light-sweep hover, matching the
    depth treatment of `.btn-primary`.
  - `.btn-ghost` now turns into a solid teal gradient chip on hover (was a
    faint tint before).
  - **Two new variants added**: `.btn-info` (cyan/blue gradient) and
    `.btn-teal` (teal gradient) — usable via `<Button variant="info">` /
    `<Button variant="teal">`.
- **`.icon-btn`**: resting state changed from flat `var(--card)` (near white)
  to a violet→blue gradient with its own floor shadow; hover turns teal;
  press turns orange and depresses.
- **`.input`**: subtle violet-tinted gradient background + inset shadow
  instead of flat card color, so form fields read as recessed, not blank.
- **`.data-table thead th`**: header gradient now spans
  orange → violet → blue (was orange → blue only) with a thicker 3px
  bottom accent line for more visual pop.
- **New utility classes added**:
  - `.fab-3d` — round floating-action-button style with gradient, drop
    shadow "floor", gentle float animation, and a press-down interaction.
  - `.export-menu` / `.export-item` / `.export-item-xlsx` /
    `.export-item-pdf` / `.export-item-doc` / `.export-item-csv` /
    `.export-item-whatsapp` / `.export-item-share` — each export-format row
    now has its own solid gradient color (green for Excel, red for PDF, blue
    for Word, amber for CSV, WhatsApp green, violet for Share) instead of
    plain ghost-gray rows.
- Updated the `prefers-reduced-motion` block so the new press/hover
  transforms are correctly disabled too, and added `.fab-3d` to the
  animation-off list.

## 3. `marble-main/src/components/UI/Button.jsx`
- Registered the two new variants (`info`, `teal`) in the `VARIANTS` map so
  `<Button variant="info">` / `<Button variant="teal">` work anywhere in the
  app.

## 4. `marble-main/src/components/UI/ExportMenu.jsx`
- Trigger button switched from `btn-secondary` (now violet) to `btn-teal`
  for visual distinction from other secondary buttons.
- Dropdown now uses the new `.export-menu` wrapper (gradient background) and
  each row uses `.export-item` + its own `.export-item-<type>` color class
  instead of the old flat `.btn.btn-ghost` rows — every export
  option (Excel/PDF/Word/CSV/WhatsApp/Share) is now a distinct colored
  gradient chip with hover-lift and press-down depth.

## 5. `marble-main/src/components/UI/Tooltip.jsx`
- Tooltip background changed from plain `bg-gray-900` / `dark:bg-gray-700`
  to a violet→indigo gradient with a matching glow shadow.

## 6. `marble-main/src/components/Layout/BackgroundFX.jsx`
- Bubble field doubled (10 → 20 bubbles) with more varied sizes/speeds for a
  denser floating-bubble background effect.
- Added two more animated background blobs (violet and teal) alongside the
  existing orange/blue/amber ones, so the ambient background now cycles
  through 5 colors instead of 3.

---

## Intentionally left white (by design, not missed)
A few `#fff` / `bg-white` spots were **not** changed because turning them
colorful would break their function:
- `src/utils/qr.js` — QR code light color. QR codes need strong light/dark
  contrast to scan; a colored background risks unreadable codes.
- `src/components/UI/QRBadge.jsx` — the white card behind the QR code, same
  scanability reason.
- `src/pages/PrintPreview.jsx`, `src/utils/printTemplates.js`,
  `src/utils/exporters.js` — these render the **printed/exported PDF page**,
  which should look like white paper/a normal document, not a themed UI
  screen.

Everything else in the app UI (buttons, cards, tables, inputs, tooltips,
export menu, background) is now gradient-colored with 3D depth as requested.

## Verified
Ran `npm install && npm run build` inside the full project after applying
these changes — it builds cleanly with no errors, and the compiled CSS
confirms `.btn-secondary`, `.btn-teal`, `.export-item-xlsx`, `.fab-3d`, etc.
are all present in the output bundle.
