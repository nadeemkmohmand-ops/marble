import { describe, it, expect } from 'vitest'
import {
  sqftFromInches, sqftToSqm, cftFromInches, weightKg, recoveryPct,
  kerfLossSqft, costPerSqft, sellingPrice, orderProfit, breakEven,
  whatIfBlockPricing, orderTotals, landedCost, agingDays,
} from '../utils/calculations'

describe('marble formulas', () => {
  it('sq ft from inches', () => {
    expect(sqftFromInches(96, 48)).toBe(32)
    expect(sqftFromInches(12, 12)).toBe(1)
  })

  it('sq m conversion', () => {
    expect(sqftToSqm(100)).toBeCloseTo(9.2903, 3)
  })

  it('cubic feet from inches', () => {
    expect(cftFromInches(96, 48, 60)).toBeCloseTo(160, 3) // 8×4×5 ft
  })

  it('weight = cft × density', () => {
    expect(weightKg(160, 76)).toBe(12160)
  })

  it('recovery %', () => {
    expect(recoveryPct(450, 500)).toBe(90)
    expect(recoveryPct(0, 0)).toBe(0)
  })

  it('kerf loss', () => {
    // 6.5mm ≈ 0.021325 ft × 10 cuts × 10 ft ≈ 2.13 sqft
    expect(kerfLossSqft(6.5, 10, 10)).toBeCloseTo(2.13, 1)
  })

  it('landed cost sums all heads', () => {
    expect(landedCost({ purchaseCost: 100, freight: 10, customs: 5, clearing: 5, transport: 10, loading: 2 })).toBe(132)
  })

  it('cost per sq ft', () => {
    expect(costPerSqft(1000, 250)).toBe(4)
    expect(costPerSqft(100, 0)).toBe(0)
  })

  it('selling price with margin/tax/transport', () => {
    // 100 ÷ (1−0.2) = 125 + tax 0 + transport 5 = 130
    expect(sellingPrice({ cost: 100, marginPct: 20, taxPct: 0, transport: 5 })).toBe(130)
  })

  it('order profit subtracts every cost head', () => {
    expect(orderProfit({ revenue: 1000, material: 400, labour: 200, machine: 50, transport: 50, installation: 50, commission: 50 })).toBe(200)
  })

  it('break-even price', () => {
    expect(breakEven({ fixedCost: 10000, qtySqft: 500, variablePerSqft: 30 })).toBe(50)
  })

  it('what-if block pricing', () => {
    const r = whatIfBlockPricing({ blockCost: 800000, blockSqftTheoretical: 690, recoveryPct: 75, marginPct: 20 })
    expect(r.saleableSqft).toBeCloseTo(517.5, 1)
    expect(r.pricePerSqft).toBeGreaterThan(r.costPerSqft)
  })

  it('order totals with wastage & charges', () => {
    const t = orderTotals({
      items: [{ sqft: 100, qty: 1, rate: 500, wastagePct: 10 }],
      edgeCharges: 1000, installationCharges: 1000, transportCharges: 1000,
      discount: 500, taxPct: 0, commissionPct: 0,
    })
    expect(t.itemsTotal).toBe(55000)
    expect(t.extras).toBe(3000)
    expect(t.total).toBe(57500)
  })

  it('aging days', () => {
    expect(agingDays(new Date(Date.now() - 3 * 86400000).toISOString())).toBe(3)
    expect(agingDays(null)).toBe(0)
  })
})
