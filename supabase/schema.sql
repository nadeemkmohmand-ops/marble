-- ═══════════════════════════════════════════════════════════════════
-- Marble Manager v2.4 — Supabase / PostgreSQL schema
-- ═══════════════════════════════════════════════════════════════════
-- Run this ONCE in the Supabase SQL editor (or `psql`).
-- Idempotent: safe to re-run (CREATE TABLE IF NOT EXISTS …).
--
-- The app is offline-first: device storage is the source of truth and
-- every change is mirrored here through the sync queue (upsert by id).
-- All ids are human serials (BLK-0001, ORD-0007 …) generated on the
-- device, so no sequences are needed.
--
-- Tables = app collections (camelCase → snake_case).
-- Every table carries created_at / updated_at (ISO strings from the
-- device are cast by PostgREST automatically).
--
-- SECURITY MODEL
--   RLS is enabled on every table. Out of the box the app talks to
--   Supabase with the anon key (single-factory deployment), so the
--   default policies below are anon-permissive. If you expose the
--   project beyond your own devices, tighten them (see README).
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── helpers ────────────────────────────────────────────────────────
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

-- Convenience: apply RLS + anon policies to a table
create or replace function grant_anon(table_name text) returns void as $$
begin
  execute format('alter table if exists %I enable row level security', table_name);
  execute format('drop policy if exists anon_all on %I', table_name);
  execute format('create policy anon_all on %I for all using (true) with check (true)', table_name);
end $$ language plpgsql;

-- ═══════════════════ CORE INVENTORY ════════════════════════════════

create table if not exists blocks (
  id text primary key,
  block_no text, lot_no text, supplier text, quarry text, country text,
  length_in numeric, width_in numeric, height_in numeric, density numeric,
  purchase_cost numeric default 0, freight numeric default 0,
  customs numeric default 0, clearing numeric default 0,
  transport numeric default 0, loading numeric default 0,
  landed_total numeric default 0, cft numeric, weight_kg numeric,
  grade text, color text, veining text, quality_notes text,
  yard text, rack text, gate text, branch text,
  status text default 'available',
  photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists slabs (
  id text primary key,
  parent_block text, lot_id text,
  length_ft numeric, width_ft numeric, thickness_mm numeric,
  area_sqft numeric, area_sqm numeric, weight_kg numeric, cost_per_sqft_slab numeric,
  finish text default 'polished', edge text default 'none', grade text,
  defects text, patches text, rack text, yard text, branch text,
  status text default 'available', reserved_for text, order_ref text, quote_ref text,
  price numeric default 0,
  notes text, photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists lots (
  id text primary key,
  name text, shade text, slab_count numeric default 0, total_sqft numeric default 0,
  grade text, finish text, bundle_id text, yard text, rack text,
  status text default 'open', notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists offcuts (
  id text primary key,
  parent_slab text, length_ft numeric, width_ft numeric, thickness_mm numeric,
  area_sqft numeric, qty numeric default 1, grade text, finish text, edge text,
  price numeric default 0, sell_by text default 'sqft', status text default 'available',
  rack text, yard text, bundle_id text, mixed_lot boolean, location text,
  notes text, photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists movements (
  id text primary key,
  date text, type text, ref_id text, qty numeric, party text,
  from_location text, to_location text, notes text,
  photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists stock_counts (
  id text primary key,
  date text, scope text, counted_by text,
  lines jsonb default '[]'::jsonb, total_variance numeric default 0,
  notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ═══════════════════ PRODUCTION ════════════════════════════════════

create table if not exists machines (
  id text primary key,
  name text, work text, type text, status text default 'idle', location text,
  power_kw numeric, cost numeric default 0, salvage_value numeric default 0,
  depreciation_years numeric, annual_hours numeric default 3000,
  annual_maintenance_cost numeric default 0, avg_output_sqft_hr numeric,
  purchase_date text, notes text,
  photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists cutting_plans (
  id text primary key,
  date text, block_id text, planned_slabs text, blade_thickness numeric,
  planned_sqft numeric default 0, actual_sqft numeric default 0,
  status text default 'cutting',
  optimizer_sizes text, optimizer_used_pct numeric, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists job_cards (
  id text primary key,
  date text, job_type text default 'cutting', status text default 'pending', shift text,
  machine_name text, operator text, blade_type text, block_id text, slab_id text,
  start_time text, end_time text, hours numeric default 0,
  downtime_hrs numeric default 0, output_slabs numeric default 0,
  output_sqft numeric default 0, wastage_sqft numeric default 0,
  notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists maintenance (
  id text primary key,
  date text, machine_name text, type text, down_hours numeric, cost numeric default 0,
  parts text, technician text, next_due text, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists consumables (
  id text primary key,
  name text, type text, unit text, stock_qty numeric default 0, min_qty numeric default 0,
  unit_cost numeric default 0, supplier_id text, location text,
  last_purchased_at text, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists consumable_moves (
  id text primary key,
  date text, item_id text, direction text default 'out', qty numeric default 0,
  unit_cost numeric default 0, total numeric default 0,
  machine_name text, job_ref text, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ═══════════════════ SALES & CRM ═══════════════════════════════════

create table if not exists customers (
  id text primary key,
  name text, phone text, whatsapp text, address text,
  customer_type text default 'retail', cnic text, ntn text,
  credit_limit numeric default 0, credit_days numeric default 0,
  opening_balance numeric default 0, lost_reason text,
  branch text, notes text, photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists followups (
  id text primary key,
  date text, customer_id text, customer_name text, type text default 'call',
  notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists quotations (
  id text primary key,
  customer_name text, date text, valid_until text, status text default 'draft',
  items jsonb default '[]'::jsonb,
  edge_charges numeric default 0, installation_charges numeric default 0,
  transport_charges numeric default 0, discount numeric default 0,
  tax_pct numeric default 0, commission_pct numeric default 0,
  total numeric default 0, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists orders (
  id text primary key,
  customer_name text, date text, status text default 'pending', quote_ref text,
  items jsonb default '[]'::jsonb,
  edge_charges numeric default 0, installation_charges numeric default 0,
  transport_charges numeric default 0, discount numeric default 0,
  tax_pct numeric default 0, commission_pct numeric default 0,
  wht_type text default 'none', wht_pct numeric default 0, wht_amount numeric default 0,
  total numeric default 0, paid_amount numeric default 0,
  vehicle_no text, driver text, delivery_sign text, branch text,
  notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists work_orders (
  id text primary key,
  date text, status text default 'draft', priority text default 'normal',
  customer_name text, order_ref text, block_id text, supervisor text, machine_name text,
  slabs_qty numeric default 0, slab_size text, thickness_mm numeric, finish text,
  due_date text, produced_slabs numeric default 0, planned_sqft numeric default 0,
  progress_pct numeric default 0,
  instructions text, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists agents (
  id text primary key,
  name text, type text default 'salesman', phone text, cnic text, address text,
  commission_pct numeric default 2, bank_name text, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists commissions (
  id text primary key,
  date text, agent_id text, order_ref text,
  sale_amount numeric default 0, commission_pct numeric default 0,
  commission_amount numeric default 0, status text default 'earned',
  paid_at text, paid_amount numeric default 0, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists price_lists (
  id text primary key,
  name text, customer_type text, size_text text, thickness_mm numeric,
  finish text, grade text, rate_per_sqft numeric default 0, min_rate_per_sqft numeric default 0,
  effective_from text, effective_to text, active boolean default true, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists installation_jobs (
  id text primary key,
  date text, customer_id text, order_ref text, site_address text,
  measure_date text, measured_by text, team_leader text, team_members text,
  scheduled_date text, started_at text, completed_at text,
  area_sqft numeric default 0, charges numeric default 0, expenses numeric default 0,
  profit numeric default 0, status text default 'scheduled',
  customer_sign text, sign_date text, notes text,
  photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists complaints (
  id text primary key,
  date text, customer_id text, slab_id text, order_ref text,
  category text, severity text default 'medium', description text,
  status text default 'open', resolved_at text, resolution text,
  compensation_amount numeric default 0, credit_note_ref text,
  photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists returns (
  id text primary key,
  date text, customer_id text, order_id text, slab_id text,
  qty numeric default 0, sqft numeric default 0, reason text, condition text,
  restock_qty numeric default 0, scrap_qty numeric default 0,
  credit_amount numeric default 0, credit_note_id text, status text default 'requested',
  notes text, photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ═══════════════════ DOCUMENTS ═════════════════════════════════════

create table if not exists gate_passes (
  id text primary key,
  date text, type text default 'delivery', order_ref text, customer_name text,
  vehicle_no text, driver text, driver_phone text,
  goods_desc text, qty numeric, unit text, sqft numeric, destination text,
  receiver_name text, receiver_phone text, receiver_sign text, issued_by text,
  notes text, photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists receipts (
  id text primary key,
  date text, direction text default 'in', party_type text, party_name text,
  customer_id text, supplier_id text, worker_id text,
  amount numeric default 0, method text default 'cash', reference_no text,
  bank_name text, cheque_date text, order_ref text, received_by text,
  notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists grn (
  id text primary key,
  date text, purchase_ref text, supplier_name text, lot_no text,
  qty_blocks numeric default 0, qty_slabs numeric default 0,
  condition text, received_by text, verified_by text, status text default 'received',
  discrepancies text, notes text, photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ═══════════════════ PURCHASES & LOGISTICS ═════════════════════════

create table if not exists suppliers (
  id text primary key,
  name text, name_en text, type text default 'local', phone text, whatsapp text,
  country text, address text, opening_balance numeric default 0,
  currency text default 'PKR', terms text, branch text,
  notes text, photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists purchases (
  id text primary key,
  date text, supplier_name text, lot_no text, country text, block_ref text,
  currency text default 'PKR', promised_date text,
  purchase_cost numeric default 0, freight numeric default 0, customs numeric default 0,
  clearing numeric default 0, transport numeric default 0, loading numeric default 0,
  landed_total numeric default 0, paid_amount numeric default 0,
  terms text, notes text, photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists vehicles (
  id text primary key,
  reg_no text, type text, make text, model text, year numeric,
  owner_type text default 'own', rent_monthly numeric default 0,
  driver_name text, driver_phone text, driver_cnic text,
  fuel_type text, tank_capacity_litres numeric,
  notes text, photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists trips (
  id text primary key,
  date text, vehicle_id text, driver_name text, status text default 'planned',
  from_loc text, to_loc text, order_ref text,
  freight numeric default 0, fuel_litres numeric default 0, fuel_cost numeric default 0,
  tolls numeric default 0, other_expense numeric default 0, driver_pay numeric default 0,
  total_cost numeric default 0, profit numeric default 0,
  notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ═══════════════════ HR & PAYROLL ══════════════════════════════════

create table if not exists workers (
  id text primary key,
  name text, name_en text, skill text, phone text, address text, cnic text,
  designation text, rate_type text default 'daily', daily_rate numeric default 0,
  piece_cutting numeric, piece_polishing numeric, piece_loading numeric, piece_installation numeric,
  advances numeric default 0, loan numeric default 0, loan_installment numeric default 0,
  deductions numeric default 0, branch text,
  notes text, photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists attendance (
  id text primary key,
  worker_id text, worker_name text, date text, status text default 'present',
  overtime numeric default 0, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists piecework (
  id text primary key,
  date text, worker_id text, worker_name text, work_type text,
  units numeric default 0, rate numeric default 0, earning numeric default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists payroll (
  id text primary key,
  date text, period text, worker_id text, worker_name text,
  present_days numeric default 0, paid_days numeric default 0,
  piece_earnings numeric default 0, overtime_amount numeric default 0,
  bonus numeric default 0, advances numeric default 0,
  loan_installment numeric default 0, deductions numeric default 0,
  net_payable numeric default 0, paid boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ═══════════════════ FINANCE & ACCOUNTING ══════════════════════════

create table if not exists expenses (
  id text primary key,
  date text, category text, amount numeric default 0, vendor text,
  allocate_to text, machine_hours numeric, recurring boolean default false,
  branch text, notes text, photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists utilities (
  id text primary key,
  type text default 'electricity', date text, meter_no text, bill_no text,
  prev_reading numeric, cur_reading numeric, units numeric,
  unit_price numeric default 0, amount numeric default 0, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists partners (
  id text primary key,
  name text, name_en text, type text default 'other', phone text, whatsapp text,
  address text, opening_balance numeric default 0, vehicle_no text,
  notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists ledger_entries (
  id text primary key,
  date text, party_type text, party_id text, description text,
  debit numeric default 0, credit numeric default 0, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists accounts (
  id text primary key,
  code text, name text, type text default 'asset', parent_code text,
  opening_balance numeric default 0, active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists vouchers (
  id text primary key,
  date text, type text default 'journal', debit_account text, credit_account text,
  amount numeric default 0, narration text, ref_doc text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists credit_notes (
  id text primary key,
  date text, customer_id text, order_ref text, reason text,
  amount numeric default 0, gst_amount numeric default 0, status text default 'draft',
  notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists debit_notes (
  id text primary key,
  date text, supplier_id text, purchase_ref text, reason text,
  amount numeric default 0, gst_amount numeric default 0,
  notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ═══════════════════ SYSTEM ════════════════════════════════════════

create table if not exists notifications (
  id text primary key,
  type text, level text, title text, message text, ref_id text,
  read boolean default false, date text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- audit_log is APPEND-ONLY: insert + select policies only, no update,
-- no delete. Records who changed what, before/after values, when.
create table if not exists audit_log (
  id text primary key,
  at timestamptz default now(),
  "user" text, action text, collection text, record_id text,
  changes jsonb, before jsonb, after jsonb, meta text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists branches (
  id text primary key,
  name text, address text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ═══════════════════ triggers — keep updated_at fresh ══════════════

do $$
declare t text;
declare tables text[] := array[
  'blocks','slabs','lots','offcuts','movements','stock_counts',
  'machines','cutting_plans','job_cards','maintenance','consumables','consumable_moves',
  'customers','followups','quotations','orders','work_orders','agents','commissions',
  'price_lists','installation_jobs','complaints','returns',
  'gate_passes','receipts','grn',
  'suppliers','purchases','vehicles','trips',
  'workers','attendance','piecework','payroll',
  'expenses','utilities','partners','ledger_entries','accounts','vouchers',
  'credit_notes','debit_notes','notifications','audit_log','branches'
];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_touch_%1$s on %1$I', t);
    execute format('create trigger trg_touch_%1$s before update on %1$I for each row execute procedure touch_updated_at()', t);
  end loop;
end $$;

-- ═══════════════════ indexes — the queries the app actually runs ═════

create index if not exists idx_slabs_parent      on slabs(parent_block);
create index if not exists idx_slabs_status      on slabs(status);
create index if not exists idx_orders_customer   on orders(customer_name);
create index if not exists idx_orders_status     on orders(status);
create index if not exists idx_receipts_customer on receipts(customer_id);
create index if not exists idx_receipts_supplier on receipts(supplier_id);
create index if not exists idx_purchases_supplier on purchases(supplier_name);
create index if not exists idx_jobcards_machine  on job_cards(machine_name);
create index if not exists idx_jobcards_block    on job_cards(block_id);
create index if not exists idx_ledger_party      on ledger_entries(party_type, party_id);
create index if not exists idx_vouchers_accounts on vouchers(debit_account, credit_account);
create index if not exists idx_audit_at          on audit_log(at desc);
create index if not exists idx_audit_record      on audit_log(collection, record_id);
create index if not exists idx_workorders_block  on work_orders(block_id);
create index if not exists idx_trips_vehicle     on trips(vehicle_id);
create index if not exists idx_commissions_agent on commissions(agent_id);
create index if not exists idx_followups_customer on followups(customer_id);

-- ═══════════════════ row level security ════════════════════════════
-- Single-factory deployment: the anon key is the app key. One policy
-- per table keeps every operation permitted for the app while still
-- gating direct SQL clients. Tighten for multi-tenant use (see README).

do $$
declare t text;
declare tables text[] := array[
  'blocks','slabs','lots','offcuts','movements','stock_counts',
  'machines','cutting_plans','job_cards','maintenance','consumables','consumable_moves',
  'customers','followups','quotations','orders','work_orders','agents','commissions',
  'price_lists','installation_jobs','complaints','returns',
  'gate_passes','receipts','grn',
  'suppliers','purchases','vehicles','trips',
  'workers','attendance','piecework','payroll',
  'expenses','utilities','partners','ledger_entries','accounts','vouchers',
  'credit_notes','debit_notes','notifications','branches'
];
begin
  foreach t in array tables loop
    perform grant_anon(t);
  end loop;
end $$;

-- audit_log: append-only for anon (insert + select, never update/delete)
alter table audit_log enable row level security;
drop policy if exists audit_select on audit_log;
create policy audit_select on audit_log for select using (true);
drop policy if exists audit_insert on audit_log;
create policy audit_insert on audit_log for insert with check (true);
drop policy if exists anon_all on audit_log;

-- ═══════════════════ views (optional, for SQL dashboards) ══════════

-- Customer ledger from documents (orders + receipts + credit notes + manual entries)
create or replace view v_customer_ledger as
with docs as (
  select o.customer_name as party_id, o.date::timestamptz as d, o.id as ref,
         'Invoice' as doc_type, o.total as debit, 0::numeric as credit
  from orders o where o.status <> 'cancelled'
  union all
  select r.customer_id, r.date::timestamptz, r.id, 'Receipt', 0, r.amount
  from receipts r where r.direction = 'in' and r.customer_id is not null
  union all
  select cn.customer_id, cn.date::timestamptz, cn.id, 'Credit Note', 0, cn.amount
  from credit_notes cn
  union all
  select le.party_id, le.date::timestamptz, le.id, le.description, le.debit, le.credit
  from ledger_entries le where le.party_type = 'customer'
)
select party_id, d, ref, doc_type, debit, credit,
       sum(debit - credit) over (partition by party_id order by d, ref) as running_balance
from docs;

-- Supplier ledger
create or replace view v_supplier_ledger as
with docs as (
  select p.supplier_name as party_id, p.date::timestamptz as d, p.id as ref,
         'Purchase' as doc_type, p.landed_total as debit, 0::numeric as credit
  from purchases p
  union all
  select r.supplier_id, r.date::timestamptz, r.id, 'Payment', 0, r.amount
  from receipts r where r.direction = 'out' and r.supplier_id is not null
  union all
  select dn.supplier_id, dn.date::timestamptz, dn.id, 'Debit Note', dn.amount, 0
  from debit_notes dn
)
select party_id, d, ref, doc_type, debit, credit,
       sum(debit - credit) over (partition by party_id order by d, ref) as running_balance
from docs;

-- Trial balance from vouchers + account openings
create or replace view v_trial_balance as
select a.id, a.code, a.name, a.type, a.opening_balance,
       coalesce(sum(v.amount) filter (where v.debit_account = a.id), 0)  as debit_total,
       coalesce(sum(v.amount) filter (where v.credit_account = a.id), 0) as credit_total,
       a.opening_balance
         + coalesce(sum(v.amount) filter (where v.debit_account = a.id), 0)
         - coalesce(sum(v.amount) filter (where v.credit_account = a.id), 0) as closing
from accounts a
left join vouchers v on v.debit_account = a.id or v.credit_account = a.id
group by a.id, a.code, a.name, a.type, a.opening_balance;

-- Stock valuation (blocks at landed cost, slabs at inherited cost)
create or replace view v_stock_valuation as
select 'block' as kind, count(*) as qty, coalesce(sum(landed_total), 0) as value
from blocks where status <> 'sold'
union all
select 'slab', count(*), coalesce(sum(cost_per_sqft_slab * coalesce(area_sqft, 0)), 0)
from slabs where status in ('available','reserved')
union all
select 'offcut', count(*), coalesce(sum(price * coalesce(qty, 1)), 0)
from offcuts where status = 'available';

-- ═══════════════════ seed chart of accounts ════════════════════════
insert into accounts (id, code, name, type) values
  ('ACC-1000','1000','Cash in Hand','asset'),
  ('ACC-1010','1010','Bank Account','asset'),
  ('ACC-1100','1100','Accounts Receivable','asset'),
  ('ACC-1200','1200','Inventory — Blocks','asset'),
  ('ACC-1210','1210','Inventory — Slabs','asset'),
  ('ACC-1300','1300','Inventory — Consumables','asset'),
  ('ACC-1500','1500','Vehicles','asset'),
  ('ACC-2000','2000','Accounts Payable','liability'),
  ('ACC-2100','2100','GST / Sales Tax Payable','liability'),
  ('ACC-2200','2200','WHT Payable','liability'),
  ('ACC-3000','3000','Owner Capital','equity'),
  ('ACC-3100','3100','Retained Earnings','equity'),
  ('ACC-4000','4000','Sales Revenue','income'),
  ('ACC-4100','4100','Installation Income','income'),
  ('ACC-4200','4200','Commission Income','income'),
  ('ACC-5000','5000','Cost of Goods Sold','expense'),
  ('ACC-5100','5100','Wages & Salaries','expense'),
  ('ACC-5200','5200','Electricity & Fuel','expense'),
  ('ACC-5300','5300','Freight & Transport','expense'),
  ('ACC-5400','5400','Repairs & Maintenance','expense'),
  ('ACC-5500','5500','Consumables & Blades','expense'),
  ('ACC-5600','5600','Rent','expense'),
  ('ACC-5700','5700','Miscellaneous Expense','expense'),
  ('ACC-5800','5800','Agent Commission Expense','expense'),
  ('ACC-5900','5900','WHT Expense','expense')
on conflict (id) do nothing;

-- Done. Reload the app — it will pull and push automatically.
