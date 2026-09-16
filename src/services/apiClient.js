import { createClient } from '@supabase/supabase-js'

/**
 * apiClient — THE single backend seam for the whole app.
 *
 * Part 1: the shared Supabase client (this file used to be an empty fetch
 *         wrapper "for a future backend" — the future arrived: Supabase).
 * Part 2: the data-access layer (inventoryApi, customersApi, ordersApi,
 *         workersApi, attendanceApi, expensesApi, calculatorApi, reportsApi).
 * Pages NEVER call supabase directly — they import the *Api objects below.
 *
 * Credentials come from environment variables (never hardcoded):
 *   VITE_SUPABASE_URL      → Project Settings → API → Project URL
 *   VITE_SUPABASE_ANON_KEY → Project Settings → API → anon public key
 *
 * If the variables are missing (e.g. .env not copied yet) the app still
 * builds and runs: every *Api function fails gracefully with a clear
 * message, and the Login page shows a "not configured" banner.
 */

const env = import.meta.env || {}

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing.\n' +
      'Copy .env.example → .env, fill the values, then restart the dev server.\n' +
      'Database features are disabled until then.'
  )
}

/** Shared client — session is persisted in localStorage by supabase-js. */
export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true, // session survives reloads → "session persistence"
      autoRefreshToken: true,
      // HashRouter handles routing; skip Supabase's own URL session detection
      detectSessionInUrl: false,
    },
  }
)

/** Friendly message shown when the env vars are missing. */
export const NOT_CONFIGURED_MESSAGE =
  'Supabase is not configured — copy .env.example to .env and set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.'

/* ==========================================================================
 * DATA ACCESS LAYER
 * Every function:
 *   - fails gracefully (clear error) when Supabase env vars are missing
 *   - unwraps { data, error } and THROWS the error so callers can toast it
 * ======================================================================== */

function guard() {
  if (!isSupabaseConfigured) {
    throw new Error(NOT_CONFIGURED_MESSAGE)
  }
}

function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

/** Today as 'YYYY-MM-DD' (local time — attendance/expenses are date-based). */
export function todayISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** n days ago as 'YYYY-MM-DD'. */
export function daysAgoISO(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const pad = (num) => String(num).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** First day of the current month as 'YYYY-MM-DD'. */
export function monthStartISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}

/* ==========================================================================
 * INVENTORY — marble slabs
 * ======================================================================== */
export const inventoryApi = {
  async list() {
    guard()
    return unwrap(
      await supabase.from('inventory_items').select('*').order('id', { ascending: true })
    )
  },

  async create(values) {
    guard()
    return unwrap(await supabase.from('inventory_items').insert(values).select().single())
  },

  async update(id, values) {
    guard()
    return unwrap(
      await supabase.from('inventory_items').update(values).eq('id', id).select().single()
    )
  },

  async remove(id) {
    guard()
    unwrap(await supabase.from('inventory_items').delete().eq('id', id))
  },
}

/* ==========================================================================
 * CUSTOMERS + PAYMENTS — the ledger
 * balance always comes from the customer_balances VIEW
 * (orders − payments), never from a stored column
 * ======================================================================== */
export const customersApi = {
  async listWithBalances() {
    guard()
    return unwrap(
      await supabase
        .from('customer_balances')
        .select('id, name, phone, area, order_total, paid_total, balance')
        .order('id', { ascending: true })
    )
  },

  async create(values) {
    guard()
    return unwrap(await supabase.from('customers').insert(values).select().single())
  },

  async update(id, values) {
    guard()
    return unwrap(await supabase.from('customers').update(values).eq('id', id).select().single())
  },

  async remove(id) {
    guard()
    unwrap(await supabase.from('customers').delete().eq('id', id))
  },

  /** Record a payment against a customer (reduces their balance). */
  async addPayment(values) {
    guard()
    return unwrap(await supabase.from('payments').insert(values).select().single())
  },

  async listPayments(customerId) {
    guard()
    return unwrap(
      await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('paid_at', { ascending: false })
    )
  },
}

/* ==========================================================================
 * ORDERS — status workflow: pending → cutting → ready → delivered
 * ======================================================================== */
export const ORDER_STATUSES = ['pending', 'cutting', 'ready', 'delivered']

export const ordersApi = {
  async list() {
    guard()
    return unwrap(
      await supabase
        .from('orders')
        .select(
          `id, status, order_date, due_date, notes,
           customer:customers(id, name),
           items:order_items(id, description, quantity, unit_price, line_total,
             inventory_item:inventory_items(id, material, length_ft, width_ft, thickness_mm))`
        )
        .order('id', { ascending: false })
    )
  },

  /** Atomic insert of order + items via the create_order RPC (see schema.sql). */
  async create({ customerId, items, dueDate, notes }) {
    guard()
    const orderId = unwrap(
      await supabase.rpc('create_order', {
        p_customer_id: customerId,
        p_items: items,
        p_due_date: dueDate || null,
        p_notes: notes || null,
      })
    )
    return orderId
  },

  /** Move an order through the workflow (forward only). */
  async setStatus(id, status) {
    guard()
    if (!ORDER_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`)
    return unwrap(
      await supabase.from('orders').update({ status }).eq('id', id).select().single()
    )
  },

  async remove(id) {
    guard()
    unwrap(await supabase.from('orders').delete().eq('id', id))
  },
}

/* ==========================================================================
 * WORKERS + ATTENDANCE — attendance is a separate table, one row per day
 * ======================================================================== */
export const workersApi = {
  async list() {
    guard()
    return unwrap(
      await supabase.from('workers').select('*').order('id', { ascending: true })
    )
  },

  async create(values) {
    guard()
    return unwrap(await supabase.from('workers').insert(values).select().single())
  },

  async update(id, values) {
    guard()
    return unwrap(await supabase.from('workers').update(values).eq('id', id).select().single())
  },

  async remove(id) {
    guard()
    unwrap(await supabase.from('workers').delete().eq('id', id))
  },
}

export const attendanceApi = {
  /** All attendance rows for one date, joined with worker info. */
  async listForDate(date) {
    guard()
    return unwrap(
      await supabase
        .from('attendance')
        .select('id, worker_id, work_date, status, note')
        .eq('work_date', date)
    )
  },

  /** Upsert one worker's status for one date (unique constraint on worker+date). */
  async mark(workerId, date, status) {
    guard()
    return unwrap(
      await supabase
        .from('attendance')
        .upsert(
          { worker_id: workerId, work_date: date, status },
          { onConflict: 'worker_id,work_date' }
        )
        .select()
        .single()
    )
  },
}

/* ==========================================================================
 * EXPENSES
 * ======================================================================== */
export const expensesApi = {
  async list() {
    guard()
    return unwrap(
      await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .order('id', { ascending: false })
    )
  },

  async create(values) {
    guard()
    return unwrap(await supabase.from('expenses').insert(values).select().single())
  },

  async update(id, values) {
    guard()
    return unwrap(await supabase.from('expenses').update(values).eq('id', id).select().single())
  },

  async remove(id) {
    guard()
    unwrap(await supabase.from('expenses').delete().eq('id', id))
  },
}

/* ==========================================================================
 * CALCULATOR — real math lives in the page; this just stores/loads history
 * ======================================================================== */
export const calculatorApi = {
  async history(limit = 15) {
    guard()
    return unwrap(
      await supabase
        .from('calculator_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
    )
  },

  async save(entry) {
    guard()
    return unwrap(await supabase.from('calculator_history').insert(entry).select().single())
  },

  async remove(id) {
    guard()
    unwrap(await supabase.from('calculator_history').delete().eq('id', id))
  },
}

/* ==========================================================================
 * REPORTS — every number below is computed from real table data
 * ======================================================================== */
export const reportsApi = {
  /**
   * Pieces ordered per day between two ISO dates (from orders + order_items).
   * Returns [{ date: 'YYYY-MM-DD', pieces: n }].
   */
  async piecesPerDay(fromISO, toISO) {
    guard()
    const rows = unwrap(
      await supabase
        .from('orders')
        .select('order_date, items:order_items(quantity)')
        .gte('order_date', fromISO)
        .lte('order_date', toISO)
    )
    const byDay = new Map()
    for (const order of rows) {
      const pieces = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
      byDay.set(order.order_date, (byDay.get(order.order_date) || 0) + pieces)
    }
    return Array.from(byDay.entries())
      .map(([date, pieces]) => ({ date, pieces }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },

  /** Stock quantity grouped by marble material (for the donut chart). */
  async inventoryByMaterial() {
    guard()
    const rows = unwrap(await supabase.from('inventory_items').select('material, quantity'))
    const byMaterial = new Map()
    for (const row of rows) {
      byMaterial.set(row.material, (byMaterial.get(row.material) || 0) + (row.quantity || 0))
    }
    return Array.from(byMaterial.entries()).map(([material, quantity]) => ({
      material,
      quantity,
    }))
  },

  /** Headline numbers for the summary tiles, all inside [fromISO, toISO]. */
  async summary(fromISO, toISO) {
    guard()
    const [payments, orderCount, pieces, waste] = await Promise.all([
      // revenue = real money received
      unwrap(
        await supabase
          .from('payments')
          .select('amount')
          .gte('paid_at', fromISO)
          .lte('paid_at', toISO)
      ),
      // number of orders in range
      unwrap(
        await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .gte('order_date', fromISO)
          .lte('order_date', toISO)
      ),
      reportsApi.piecesPerDay(fromISO, toISO),
      // average cutting waste from logged calculations
      unwrap(
        await supabase
          .from('calculator_history')
          .select('waste_percent')
          .gte('created_at', `${fromISO}T00:00:00`)
          .lte('created_at', `${toISO}T23:59:59`)
      ),
    ])

    const revenue = payments.reduce((sum, row) => sum + Number(row.amount || 0), 0)
    const totalPieces = pieces.reduce((sum, day) => sum + day.pieces, 0)
    const avgWaste =
      waste.length > 0
        ? waste.reduce((sum, row) => sum + Number(row.waste_percent || 0), 0) / waste.length
        : 0

    return { revenue, orderCount, totalPieces, avgWaste }
  },
}
