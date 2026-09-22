// Human friendly serial numbers: BLK-0001, SLB-0034, ORD-0007 …
const PREFIXES = {
  blocks: 'BLK', slabs: 'SLB', offcuts: 'OFF', movements: 'MOV', machines: 'MCH',
  maintenance: 'MNT', purchases: 'PUR', suppliers: 'SUP', customers: 'CUS',
  quotations: 'QTN', orders: 'ORD', workers: 'WRK', attendance: 'ATT',
  piecework: 'PWK', payroll: 'PAY', expenses: 'EXP', cuttingPlans: 'CUT', jobCards: 'JOB',
  notifications: 'NTF', partners: 'PTR', utilities: 'UTL',
  // v2.4 expansion
  workOrders: 'WOR', gatePasses: 'GTP', receipts: 'RCP', ledgerEntries: 'LED',
  accounts: 'ACC', vouchers: 'VCH', creditNotes: 'CRN', debitNotes: 'DBN',
  vehicles: 'VEH', trips: 'TRP', consumables: 'CON', consumableMoves: 'CSM',
  agents: 'AGT', commissions: 'COM', priceLists: 'PRL', complaints: 'CMP',
  returns: 'RTN', grn: 'GRN', installationJobs: 'INS', stockCounts: 'STC',
  auditLog: 'AUD', followups: 'FLW', branches: 'BRN', lots: 'LOT',
}

function rand() {
  return Math.random().toString(36).slice(2, 8)
}

export function uid(collection = 'rec') {
  const prefix = PREFIXES[collection] || 'REC'
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${rand().toUpperCase()}`
}

uid.prefixFor = function prefixFor(collection) {
  return PREFIXES[collection] || 'REC'
}

uid.serial = function serial(prefix, count) {
  return `${prefix}-${String(count + 1).padStart(4, '0')}`
}

export default uid
