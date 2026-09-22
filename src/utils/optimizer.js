// ─────────────────────────────────────────────────────────────────
// optimizer.js — cutting math for the gang saw & the polishing face.
//
//  1. slabPlan(block, opts) — how many slabs of a given thickness a
//     block yields (blade kerf-aware), with theoretical sq ft.
//  2. optimizeFace(faceIn, sizes) — guillotine shelf-packing for
//     tile/slab size mixes across the block face: piece counts, used
//     area, waste %, and a human cut sequence the supervisor can
//     follow on the floor.
//
// Units: block dimensions in INCHES, slab sizes in FEET (the app's
// convention), kerf in MM. All conversions happen here.
// ─────────────────────────────────────────────────────────────────

const IN_PER_MM = 1 / 25.4

/**
 * Slab count & theoretical yield for one block.
 * block: { lengthIn, widthIn, heightIn }
 * opts:  { thicknessMm, kerfMm }
 * The blade slices along the WIDTH dimension (standard gang-saw pass).
 */
export function slabPlan(block, { thicknessMm = 20, kerfMm = 6.5 } = {}) {
  const L = Number(block?.lengthIn) || 0
  const W = Number(block?.widthIn) || 0
  const H = Number(block?.heightIn) || 0
  const t = (Number(thicknessMm) || 0) * IN_PER_MM
  const k = (Number(kerfMm) || 0) * IN_PER_MM
  // n slabs need n*t + (n-1)*k ≤ W
  const n = t > 0 ? Math.floor((W + k) / (t + k)) : 0
  const faceSqft = (L * H) / 144
  const totalSqft = Math.round(faceSqft * n * 100) / 100
  const wastedSqft = Math.round((W / 12) * faceSqft * 100) / 100 // width consumed by kerf
  return {
    slabCount: n,
    faceSqft: Math.round(faceSqft * 100) / 100,
    totalSqft,
    kerfLossSqft: Math.round(wastedSqft * n * 100) / 100,
    thicknessMm,
    kerfMm,
  }
}

/**
 * Shelf/guillotine packing of the block face (lengthIn × heightIn)
 * with a list of sizes [{ lengthFt, widthFt, qty? }]. Pieces may be
 * rotated. Greedy by area (largest first), shelves run along the
 * face length.
 */
export function optimizeFace(face, sizes) {
  const FL = Number(face?.lengthIn) || 0
  const FH = Number(face?.heightIn) || 0
  if (!FL || !FH) return { placements: [], sequence: [], usedPct: 0, wastePct: 100, totalPieces: 0 }

  // candidate pieces: inches [l, h] + rotation
  const pieces = []
  ;(sizes || []).forEach((s, idx) => {
    const l = (Number(s.lengthFt) || 0) * 12
    const w = (Number(s.widthFt) || 0) * 12
    if (l <= 0 || w <= 0) return
    pieces.push({ id: `s${idx}`, l, w, lengthFt: s.lengthFt, widthFt: s.widthFt })
  })

  // shelves: height band across the face height; pieces placed along length
  const remainingH = FH
  const shelves = []
  let usedArea = 0

  // try to fill shelves from largest-area size down
  const sorted = [...pieces].sort((a, b) => b.l * b.w - a.l * a.w)
  let faceHLeft = FH
  let guard = 0
  while (faceHLeft >= Math.min(...sorted.map((p) => Math.min(p.l, p.w))) && guard < 50) {
    guard += 1
    // pick the biggest piece that still fits the remaining band
    let chosen = null
    for (const p of sorted) {
      const h1 = Math.min(p.l, p.w)
      if (h1 <= faceHLeft) { chosen = p; break }
    }
    if (!chosen) break
    // shelf height = piece's shorter side (rotated to fit band)
    const shelfH = Math.min(chosen.l, chosen.w)
    const pieceL = Math.max(chosen.l, chosen.w)
    let along = 0
    let count = 0
    while (along + pieceL <= FL + 1e-9) {
      along += pieceL
      count += 1
    }
    if (count === 0) { faceHLeft -= shelfH; continue }
    shelves.push({ size: chosen, shelfH, count, along: Math.round(along * 100) / 100 })
    usedArea += shelfH * along
    faceHLeft -= shelfH
  }

  const placements = shelves.map((sh) => ({
    sizeFt: `${sh.size.lengthFt}×${sh.size.widthFt}`,
    lengthFt: sh.size.lengthFt,
    widthFt: sh.size.widthFt,
    piecesPerRow: sh.count,
    rows: 1,
    total: sh.count,
  }))

  // If the remaining band fits a second row of the same size, report rows too
  const faceSqft = (FL * FH) / 144
  const usedSqft = usedArea / 144
  const usedPct = faceSqft ? Math.min(100, Math.round((usedSqft / faceSqft) * 1000) / 10) : 0
  const totalPieces = placements.reduce((a, p) => a + p.total, 0)

  const sequence = shelves.map((sh, i) => ({
    step: i + 1,
    text: `Rip strips of ${fmt(sh.shelfH)} in across the face, then cross-cut ${sh.count} × ${fmt(Math.max(sh.size.l, sh.size.w))} in (${sh.size.lengthFt}×${sh.size.widthFt} ft) per strip — ${sh.count} pieces`,
  }))

  return {
    placements,
    sequence,
    faceSqft: Math.round(faceSqft * 100) / 100,
    usedSqft: Math.round(usedSqft * 100) / 100,
    usedPct,
    wastePct: Math.round((100 - usedPct) * 10) / 10,
    totalPieces,
  }
}

function fmt(inches) {
  return Math.round(inches * 10) / 10
}

/**
 * Best blade recommendation — aggregates job cards per blade type:
 * most output with least wastage wins (blade-to-block matching).
 * jobs: jobCards with { bladeType, outputSqft, wastageSqft, jobType:'cutting' }
 */
export function bladeScoreboard(jobs = []) {
  const byBlade = {}
  jobs.filter((j) => j.bladeType).forEach((j) => {
    const key = j.bladeType
    const row = byBlade[key] || { bladeType: key, jobs: 0, outputSqft: 0, wastageSqft: 0 }
    row.jobs += 1
    row.outputSqft += Number(j.outputSqft) || 0
    row.wastageSqft += Number(j.wastageSqft) || 0
    byBlade[key] = row
  })
  return Object.values(byBlade)
    .map((r) => ({
      ...r,
      wastePct: r.outputSqft ? Math.round((r.wastageSqft / r.outputSqft) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.outputSqft - a.outputSqft)
}

export default { slabPlan, optimizeFace, bladeScoreboard }
