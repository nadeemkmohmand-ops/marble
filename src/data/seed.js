// First-run sample data so dashboards and reports are meaningful
// immediately. Runs ONCE per device; every value is fully editable
// or removable. No "demo" notices — this is working starter data.
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'
import { db } from '../services/db'

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
}

export function seedIfEmpty() {
  if (storage.get(STORAGE_KEYS.SEED_DONE, false)) return
  storage.set(STORAGE_KEYS.SEED_DONE, true)
  if (db.list('blocks').length || db.list('customers').length) return

  const suppliers = [
    { name: 'Ziarat White Quarry', type: 'quarry', country: 'Pakistan', phone: '+92 300 1112223', openingBalance: 0, currency: 'PKR' },
    { name: 'Carrara Import Co', type: 'import', country: 'Italy', phone: '+39 555 8877', openingBalance: 0, currency: 'USD' },
    { name: 'Bolan Marble Traders', type: 'local', country: 'Pakistan', phone: '+92 345 9998887', openingBalance: 0, currency: 'PKR' },
  ].map((s) => ({ ...s, ...db.save('suppliers', s), name: s.name }))

  const sup = (i) => suppliers[i].id

  const blocks = [
    { blockNo: 'BLK-0001', lotNo: 'LOT-A1', supplier: 'Ziarat White Quarry', quarry: 'Ziarat', country: 'Pakistan', lengthIn: 96, widthIn: 48, heightIn: 60, density: 76, purchaseCost: 420000, freight: 60000, customs: 0, clearing: 15000, transport: 30000, loading: 8000, grade: 'A', color: 'White', yard: 'Main yard', rack: 'R1', status: 'cutting' },
    { blockNo: 'BLK-0002', lotNo: 'LOT-A1', supplier: 'Ziarat White Quarry', quarry: 'Ziarat', country: 'Pakistan', lengthIn: 90, widthIn: 54, heightIn: 54, density: 76, purchaseCost: 380000, freight: 60000, customs: 0, clearing: 15000, transport: 30000, loading: 8000, grade: 'B', color: 'Grey', yard: 'Main yard', rack: 'R1', status: 'available' },
    { blockNo: 'BLK-0003', lotNo: 'LOT-B2', supplier: 'Carrara Import Co', quarry: 'Carrara', country: 'Italy', lengthIn: 110, widthIn: 60, heightIn: 58, density: 77, purchaseCost: 1250000, freight: 220000, customs: 180000, clearing: 45000, transport: 55000, loading: 12000, grade: 'A', color: 'White veined', yard: 'Import bay', rack: 'R2', status: 'available' },
    { blockNo: 'BLK-0004', lotNo: 'LOT-B2', supplier: 'Bolan Marble Traders', quarry: 'Bolan', country: 'Pakistan', lengthIn: 84, widthIn: 42, heightIn: 48, density: 75, purchaseCost: 260000, freight: 40000, customs: 0, clearing: 12000, transport: 22000, loading: 6000, grade: 'C', color: 'Black', yard: 'Main yard', rack: 'R3', status: 'available' },
  ].map((b) => {
    const saved = db.save('blocks', b)
    // compute derived fields
    const cft = (b.lengthIn * b.widthIn * b.heightIn) / 1728
    return db.save('blocks', { id: saved.id, cft: Math.round(cft * 1000) / 1000, weightKg: Math.round(cft * b.density), landedTotal: b.purchaseCost + b.freight + b.customs + b.clearing + b.transport + b.loading })
  })

  const customers = [
    { name: 'Ahmed Construction', phone: '+92 321 4567890', address: 'Gulberg, Lahore', openingBalance: 0 },
    { name: 'Malik Builders', phone: '+92 333 2223334', address: 'DHA, Karachi', openingBalance: 0 },
    { name: 'Sardar Interiors', phone: '+92 300 7778889', address: 'F-10, Islamabad', openingBalance: 0 },
  ].map((c) => ({ ...c, ...db.save('customers', c) }))

  const workers = [
    { name: 'Rashid Ali', skill: 'cutter', phone: '+92 301 1112345', rateType: 'daily', dailyRate: 2200, pieceCutting: 14, piecePolishing: 8, advances: 5000, loan: 0, loanInstallment: 0, deductions: 0 },
    { name: 'Imran Shah', skill: 'polisher', phone: '+92 302 5556667', rateType: 'daily', dailyRate: 2000, piecePolishing: 9, advances: 0, loan: 12000, loanInstallment: 2000, deductions: 0 },
    { name: 'Gul Zaman', skill: 'loader', phone: '+92 303 8889990', rateType: 'daily', dailyRate: 1500, pieceLoading: 60, advances: 0, loan: 0, loanInstallment: 0, deductions: 0 },
    { name: 'Noor Khan', skill: 'foreman', phone: '+92 305 3334445', rateType: 'daily', dailyRate: 3000, advances: 10000, loan: 0, loanInstallment: 0, deductions: 0 },
  ].map((w) => ({ ...w, ...db.save('workers', w) }))

  const machines = [
    { name: 'Gang Saw #1', type: 'gang_saw', status: 'running', location: 'Cutting shed', powerKw: 45, cost: 4800000 },
    { name: 'Multi Wire #1', type: 'multi_wire', status: 'running', location: 'Cutting shed', powerKw: 60, cost: 9500000 },
    { name: 'Edge Cutter #1', type: 'edge_cutter', status: 'idle', location: 'Finishing', powerKw: 12, cost: 850000 },
    { name: 'Polishing Line #1', type: 'polishing_line', status: 'running', location: 'Finishing', powerKw: 30, cost: 2600000 },
  ].map((m) => ({ ...m, ...db.save('machines', m) }))

  const b1 = blocks[0]
  const slabs = [
    { parentBlock: b1.id, lengthFt: 8, widthFt: 4, thicknessMm: 20, finish: 'polished', edge: 'none', grade: 'A', rack: 'R1-A', status: 'available', price: 34000 },
    { parentBlock: b1.id, lengthFt: 7.5, widthFt: 4, thicknessMm: 20, finish: 'polished', edge: 'none', grade: 'A', rack: 'R1-A', status: 'reserved', price: 32000, reservedFor: 'Ahmed Construction' },
    { parentBlock: b1.id, lengthFt: 8, widthFt: 3.5, thicknessMm: 20, finish: 'honed', edge: 'none', grade: 'B', rack: 'R1-B', status: 'available', price: 27000 },
    { parentBlock: b1.id, lengthFt: 6, widthFt: 4, thicknessMm: 20, finish: 'raw', edge: 'none', grade: 'B', rack: 'R1-B', status: 'available', price: 22000 },
  ].map((s) => {
    const saved = db.save('slabs', s)
    return db.save('slabs', { id: saved.id, areaSqft: Math.round(s.lengthFt * s.widthFt * 100) / 100 })
  })

  const orders = [
    { customerName: customers[0].id, date: daysAgo(40), status: 'completed', paidAmount: 168000, items: [ { description: 'Ziarat White flooring', room: 'Lounge', lengthFt: 8, widthFt: 4, qty: 6, rate: 850, wastagePct: 8 } ], edgeCharges: 6000, installationCharges: 9000, transportCharges: 5000, discount: 0, taxPct: 0, commissionPct: 0 },
    { customerName: customers[1].id, date: daysAgo(12), status: 'cutting', paidAmount: 50000, items: [ { description: 'Ziarat White stairs', room: 'Staircase', lengthFt: 7, widthFt: 3.5, qty: 14, rate: 900, wastagePct: 10 } ], edgeCharges: 8000, installationCharges: 12000, transportCharges: 6000, discount: 5000, taxPct: 0, commissionPct: 2 },
    { customerName: customers[2].id, date: daysAgo(5), status: 'pending', paidAmount: 0, items: [ { description: 'Italian White vanity tops', room: 'Bathrooms', lengthFt: 5, widthFt: 2.5, qty: 4, rate: 2600, wastagePct: 6 } ], edgeCharges: 4000, installationCharges: 0, transportCharges: 3000, discount: 0, taxPct: 0, commissionPct: 0 },
  ].map((o) => {
    const itemsTotal = o.items.reduce((a, it) => a + it.lengthFt * it.widthFt * it.qty * (1 + it.wastagePct / 100) * it.rate, 0)
    const extras = o.edgeCharges + o.installationCharges + o.transportCharges
    const taxable = itemsTotal + extras - o.discount
    const total = Math.round((taxable + taxable * (o.taxPct / 100) + taxable * (o.commissionPct / 100)) * 100) / 100
    return db.save('orders', { ...o, total })
  })

  db.save('quotations', { customerName: customers[2].id, date: daysAgo(6), validUntil: daysAgo(-9), status: 'sent', items: [ { description: 'Italian White flooring', room: 'Lounge', lengthFt: 10, widthFt: 5, qty: 1, rate: 2400, wastagePct: 8 } ], edgeCharges: 5000, installationCharges: 8000, transportCharges: 4000, discount: 0, taxPct: 0, commissionPct: 0, total: 10 * 5 * 1.08 * 2400 + 17000 })

  db.save('expenses', { date: daysAgo(3), category: 'electricity', amount: 145000, recurring: true, allocateTo: '', notes: 'Monthly electricity bill' })
  db.save('expenses', { date: daysAgo(10), category: 'diesel', amount: 38000, recurring: false, notes: 'Generator' })
  db.save('expenses', { date: daysAgo(15), category: 'blades', amount: 56000, recurring: false, notes: '2x gang saw blades' })
  db.save('expenses', { date: daysAgo(20), category: 'tea', amount: 9500, recurring: true, notes: 'Workers tea & welfare' })

  db.save('purchases', { date: daysAgo(35), supplierName: sup(0), lotNo: 'LOT-A1', country: 'Pakistan', currency: 'PKR', purchaseCost: 800000, freight: 120000, customs: 0, clearing: 30000, transport: 60000, loading: 16000, paidAmount: 700000, landedTotal: 800000 + 120000 + 0 + 30000 + 60000 + 16000, terms: '30 days' })
  db.save('purchases', { date: daysAgo(25), supplierName: sup(1), lotNo: 'LOT-B2', country: 'Italy', currency: 'USD', purchaseCost: 2500000, freight: 440000, customs: 360000, clearing: 90000, transport: 110000, loading: 24000, paidAmount: 2000000, landedTotal: 2500000 + 440000 + 360000 + 90000 + 110000 + 24000, terms: 'LC at sight' })

  db.save('movements', { date: daysAgo(35), type: 'purchase_in', refId: 'LOT-A1', qty: 2, party: 'Ziarat White Quarry', notes: '2 blocks received' })
  db.save('movements', { date: daysAgo(20), type: 'cutting_out', refId: b1.id, qty: 96, notes: 'Gang saw output sq ft' })
  db.save('movements', { date: daysAgo(12), type: 'sale', refId: orders[0].id, qty: 192, party: 'Ahmed Construction', notes: 'Delivery' })
  db.save('movements', { date: daysAgo(4), type: 'damage', refId: b1.id, qty: 4, notes: 'Broken corner slab' })

  db.save('maintenance', { date: daysAgo(9), machineName: machines[0].id, type: 'blade_change', downHours: 6, cost: 48000, parts: '2 blades', technician: 'Fitter Rafique', nextDue: daysAgo(-51) })
  db.save('maintenance', { date: daysAgo(30), machineName: machines[3].id, type: 'electrical', downHours: 3, cost: 15000, technician: 'Electrician Sajjad' })

  db.save('cuttingPlans', { blockId: b1.id, plannedSlabs: '18× 20mm slabs', bladeThickness: 6.5, plannedSqft: 690, actualSqft: 512, status: 'cutting' })

  db.save('attendance', { workerId: workers[0].id, workerName: workers[0].name, date: daysAgo(1), status: 'present', overtime: 1 })
  db.save('attendance', { workerId: workers[1].id, workerName: workers[1].name, date: daysAgo(1), status: 'present', overtime: 0 })
  db.save('attendance', { workerId: workers[2].id, workerName: workers[2].name, date: daysAgo(1), status: 'half', overtime: 0 })

  db.save('piecework', { date: daysAgo(2), workerId: workers[0].id, workerName: workers[0].name, workType: 'cutting', units: 210, rate: 14, earning: 2940 })
  db.save('piecework', { date: daysAgo(2), workerId: workers[1].id, workerName: workers[1].name, workType: 'polishing', units: 180, rate: 9, earning: 1620 })
}
