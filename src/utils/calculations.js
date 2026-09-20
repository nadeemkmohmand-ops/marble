import { num, round } from './numbers'

// ─────────────────────────────────────────────────────────────────
// calculations.js — every marble-math formula in one pure module.
// All functions are side-effect free so they're trivially testable
// and reusable in pages, exports, reports and print templates.
// ─────────────────────────────────────────────────────────────────

/** Sq ft from inches: L(in) × W(in) ÷ 144 */
export const sqftFromInches = (lIn, wIn) => round((num(lIn) * num(wIn)) / 144, 2)

/** Sq ft when L/W are already in feet */
export const sqftFromFeet = (lFt, wFt) => round(num(lFt) * num(wFt), 2)

/** Sq m = Sq ft × 0.092903 */
export const sqftToSqm = (sqft) => round(num(sqft) * 0.092903, 3)

/** Cubic feet: L × W × H ÷ 1728 (inches) */
export const cftFromInches = (lIn, wIn, hIn) => round((num(lIn) * num(wIn) * num(hIn)) / 1728, 3)

/** Cubic feet from feet dimensions */
export const cftFromFeet = (lFt, wFt, hFt) => round(num(lFt) * num(wFt) * num(hFt), 3)

/** Weight kg ≈ CFT × density (marble ≈ 76 kg/cft) */
export const weightKg = (cft, density = 76) => round(num(cft) * num(density, 76), 1)

/** Theoretical slab output of a block: block cft ÷ slab thickness(cft) */
export function theoreticalSqft(blockLIn, blockWIn, blockHIn, slabThicknessCm) {
  const cft = cftFromInches(blockLIn, blockWIn, blockHIn)
  const thicknessCft = Math.max(num(slabThicknessCm) / 30.48, 0.01) // cm → ft
  return round(cft / thicknessCft, 1)
}

/** Recovery % = saleable sq ft ÷ theoretical sq ft × 100 */
export const recoveryPct = (saleableSqft, theoreticalSqft) =>
  num(theoreticalSqft) > 0 ? round((num(saleableSqft) / num(theoreticalSqft)) * 100, 1) : 0

/** Kerf loss (cft) = blade thickness(cm→ft) × cut height(ft) × cut width... simplified: blade mm × cuts */
export function kerfLossSqft(bladeThicknessMm, cuts, cutLengthFt) {
  const bladeFt = num(bladeThicknessMm) / 304.8
  return round(bladeFt * num(cuts) * num(cutLengthFt), 2)
}

/** Landed cost = block + freight + customs + clearing + transport + loading */
export function landedCost({ purchaseCost = 0, freight = 0, customs = 0, clearing = 0, transport = 0, loading = 0 } = {}) {
  return round(num(purchaseCost) + num(freight) + num(customs) + num(clearing) + num(transport) + num(loading), 2)
}

/** Cost per sq ft = total lot cost ÷ saleable sq ft */
export const costPerSqft = (totalCost, saleableSqft) =>
  num(saleableSqft) > 0 ? round(num(totalCost) / num(saleableSqft), 2) : 0

/** Selling price = cost ÷ (1 − margin) + tax + transport (margin as %, e.g. 20) */
export function sellingPrice({ cost = 0, marginPct = 0, taxPct = 0, transport = 0 } = {}) {
  const m = clampPct(marginPct)
  const base = num(cost) / (1 - m / 100)
  return round(base + num(cost) * (num(taxPct) / 100) + num(transport), 2)
}

/** Order profit = revenue − material − labour − machine − transport − installation − commission */
export function orderProfit({ revenue = 0, material = 0, labour = 0, machine = 0, transport = 0, installation = 0, commission = 0 } = {}) {
  return round(num(revenue) - num(material) - num(labour) - num(machine) - num(transport) - num(installation) - num(commission), 2)
}

/** Break-even price per sq ft = fixed ÷ qty + variable per sq ft */
export function breakEven({ fixedCost = 0, qtySqft = 0, variablePerSqft = 0 } = {}) {
  const qty = Math.max(num(qtySqft), 0.0001)
  return round(num(fixedCost) / qty + num(variablePerSqft), 2)
}

/** What-if: block cost + expected yield + target margin → price per sq ft */
export function whatIfBlockPricing({ blockCost = 0, blockSqftTheoretical = 0, recoveryPct = 70, marginPct = 20, otherCosts = 0 } = {}) {
  const saleable = num(blockSqftTheoretical) * (clampPct(recoveryPct) / 100)
  const perSqftCost = costPerSqft(num(blockCost) + num(otherCosts), saleable)
  const price = sellingPrice({ cost: perSqftCost, marginPct })
  return {
    saleableSqft: round(saleable, 1),
    costPerSqft: perSqftCost,
    pricePerSqft: price,
    profitPerSqft: round(price - perSqftCost, 2),
  }
}

/** Order totals with wastage, charges, discount, tax, commission. */
export function orderTotals(order) {
  const items = order?.items || []
  const itemsTotal = items.reduce((acc, it) => {
    const area = num(it.sqft) || sqftFromFeet(it.lengthFt, it.widthFt) * num(it.qty, 1)
    const wastage = 1 + num(it.wastagePct, 0) / 100
    return acc + area * wastage * num(it.rate)
  }, 0)
  const extras = num(order?.edgeCharges) + num(order?.installationCharges) + num(order?.transportCharges)
  const discount = num(order?.discount)
  const taxable = itemsTotal + extras - discount
  const tax = taxable * (num(order?.taxPct) / 100)
  const commission = taxable * (num(order?.commissionPct) / 100)
  const total = round(taxable + tax + commission, 2)
  return {
    itemsTotal: round(itemsTotal, 2),
    extras: round(extras, 2),
    discount: round(discount, 2),
    tax: round(tax, 2),
    commission: round(commission, 2),
    total,
  }
}

/** Balance helpers */
export const balanceOf = (total, paid) => round(num(total) - num(paid), 2)

export function agingDays(dateStr) {
  if (!dateStr) return 0
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

function clampPct(p) {
  return Math.min(Math.max(num(p), 0), 95)
}

/** Area of a slab record (already in sq ft) */
export const slabArea = (lengthFt, widthFt) => sqftFromFeet(lengthFt, widthFt)

/** Offcut area with qty */
export function offcutArea(lengthFt, widthFt, qty = 1) {
  return round(sqftFromFeet(lengthFt, widthFt) * Math.max(num(qty), 1), 2)
}
