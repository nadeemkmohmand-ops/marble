# Supabase setup — Marble Manager v2.4

## One-time setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the whole contents of [`schema.sql`](./schema.sql) → **Run**.
   - Creates all 45 tables (existing 21 + 24 new modules), triggers, indexes, RLS policies, ledger/trial-balance views and the seeded chart of accounts.
   - Idempotent — safe to run again on an existing project.
3. Copy **Project URL** and **anon public key** from Project Settings → API into your environment:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

4. Restart the app. It pulls remote rows on start and pushes every local change through the sync queue (offline-first — nothing is ever lost while offline).

## What syncs

Every module in the app mirrors to its own snake_case table — including the
new Work Orders, Gate Passes, Receipts, GRN, Ledgers, Accounting (accounts /
vouchers / credit notes / debit notes), Vehicles & Trips, Consumables,
Agents & Commissions, Price Lists, Complaints & Returns, Installation,
Stock Counts, Lots, Follow-ups, Branches and the append-only Audit Log.

Display-only fields (the `_`-prefixed helpers like `_balance`) are stripped
before upload; they are page decorations, not data.

## Security notes

- RLS is **enabled on every table**. The default policies allow the app's
  anon key full access — that matches a single-factory deployment where the
  anon key is effectively the factory key.
- `audit_log` is **append-only**: it has insert + select policies only, so
  even the service-side cannot silently rewrite history.
- If you ever expose the project beyond your own devices (customer portal,
  public dashboard), switch the anon policies to authenticated policies and
  enable Supabase Auth — the schema needs no changes for that.

## Handy views (SQL dashboards, Metabase, Grafana…)

| View | Purpose |
|------|---------|
| `v_customer_ledger` | Running balance per customer from invoices + receipts + credit notes + manual entries |
| `v_supplier_ledger` | Running balance per supplier |
| `v_trial_balance`  | Debit/credit totals and closing balance per account |
| `v_stock_valuation` | Total stock value across blocks, slabs and offcuts |
