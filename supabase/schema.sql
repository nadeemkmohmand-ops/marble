-- ═══════════════════════════════════════════════════════════════════
--  MARBLE MANAGER — COMPLETE SUPABASE SETUP (run in the SQL Editor)
--  Version 2.2 · 2026-09-21
-- ═══════════════════════════════════════════════════════════════════
--  HOW TO USE
--    1. Open your Supabase project → SQL Editor → New query
--    2. Paste this WHOLE file and press RUN (it takes a few seconds)
--    3. Reload the app — saving, editing, DELETING and cloud sync
--       now work correctly.
--
--  WHAT THIS DOES
--    • Creates ALL 19 tables the app needs with the exact columns the
--      app writes (any tables you made by hand earlier are replaced —
--      hand-made tables were missing columns like attendance.date,
--      which broke saving and deleting).
--    • Turns on Row Level Security with a policy that lets the app
--      (anon key) SELECT / INSERT / UPDATE / DELETE — this is what
--      makes "Delete" work from the app.
--    • Grants full table permissions to anon + authenticated roles.
--    • Adds automatic updated_at triggers and helpful indexes.
--
--  ⚠ NOTE: the script starts by DROPPING the app's tables. Your cloud
--    tables are currently empty or partially created, so nothing real
--    is lost — the real data lives in the app and will sync back up.
--    If you EVER have important cloud data first run:
--      select * from customers;  -- etc. and export it.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────
-- 1. Drop old / partial tables (child tables first)
-- ────────────────────────────────────────────────────────────────
drop table if exists attendance    cascade;
drop table if exists piecework     cascade;
drop table if exists payroll       cascade;
drop table if exists offcuts       cascade;
drop table if exists slabs         cascade;
drop table if exists cutting_plans cascade;
drop table if exists job_cards     cascade;
drop table if exists maintenance   cascade;
drop table if exists movements     cascade;
drop table if exists purchases     cascade;
drop table if exists quotations    cascade;
drop table if exists orders        cascade;
drop table if exists expenses      cascade;
drop table if exists workers       cascade;
drop table if exists machines      cascade;
drop table if exists suppliers     cascade;
drop table if exists customers     cascade;
drop table if exists blocks        cascade;
drop table if exists notifications cascade;

-- ────────────────────────────────────────────────────────────────
-- 2. Tables (columns match the app fields 1:1, snake_case)
-- ────────────────────────────────────────────────────────────────

-- Raw marble blocks
create table blocks (
  id text primary key,
  block_no        text,
  lot_no          text,
  supplier        text,
  quarry          text,
  country         text,
  length_in       numeric,
  width_in        numeric,
  height_in       numeric,
  cft             numeric,
  weight_kg       numeric,
  density         numeric default 76,
  purchase_cost   numeric default 0,
  freight         numeric default 0,
  customs         numeric default 0,
  clearing        numeric default 0,
  transport       numeric default 0,
  loading         numeric default 0,
  landed_total    numeric default 0,
  grade           text,
  color           text,
  veining         text,
  quality_notes   text,
  yard            text,
  rack            text,
  gate            text,
  status          text default 'available',
  photos          jsonb default '[]',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Cut slabs (child of a block)
create table slabs (
  id text primary key,
  parent_block    text references blocks(id) on delete set null,
  length_ft       numeric,
  width_ft        numeric,
  thickness_mm    numeric,
  area_sqft       numeric,
  area_sqm        numeric,
  finish          text default 'raw',
  edge            text default 'none',
  grade           text,
  defects         text,
  patches         text,
  yard            text,
  rack            text,
  status          text default 'available',
  reserved_for    text,
  order_ref       text,
  price           numeric default 0,
  photos          jsonb default '[]',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Offcuts / remnants
create table offcuts (
  id text primary key,
  parent_slab     text references slabs(id) on delete set null,
  length_ft       numeric,
  width_ft        numeric,
  thickness_mm    numeric,
  qty             numeric default 1,
  area_sqft       numeric,
  bundle_id       text,
  mixed_lot       boolean default false,
  sell_by         text default 'sqft',
  price           numeric default 0,
  grade           text,
  location        text,
  status          text default 'available',
  photos          jsonb default '[]',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Stock movements (audit trail)
create table movements (
  id text primary key,
  date            date,
  type            text,
  ref_id          text,
  qty             numeric,
  from_location   text,
  to_location     text,
  party           text,
  photos          jsonb default '[]',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Machines
create table machines (
  id text primary key,
  name            text,
  type            text,
  status          text default 'running',
  location        text,
  power_kw        numeric,
  cost            numeric,
  purchase_date   date,
  photos          jsonb default '[]',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Maintenance log
create table maintenance (
  id text primary key,
  date            date,
  machine_name    text,
  type            text,
  down_hours      numeric default 0,
  cost            numeric default 0,
  parts           text,
  technician      text,
  next_due        date,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Cutting plans
create table cutting_plans (
  id text primary key,
  block_id        text references blocks(id) on delete set null,
  planned_slabs   text,
  blade_thickness numeric,
  planned_sqft    numeric default 0,
  actual_sqft     numeric default 0,
  status          text default 'planned',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Job cards
create table job_cards (
  id text primary key,
  date            date,
  machine_name    text,
  operator        text,
  shift           text,
  start_time      text,
  end_time        text,
  output_sqft     numeric default 0,
  wastage_sqft    numeric default 0,
  block_id        text,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Suppliers
create table suppliers (
  id text primary key,
  name            text,
  type            text default 'local',
  country         text,
  phone           text,
  whatsapp        text,
  address         text,
  opening_balance numeric default 0,
  currency        text default 'PKR',
  terms           text,
  photos          jsonb default '[]',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Purchases (landed cost lots)
create table purchases (
  id text primary key,
  date            date,
  supplier_name   text,
  lot_no          text,
  country         text,
  block_ref       text,
  currency        text default 'PKR',
  purchase_cost   numeric default 0,
  freight         numeric default 0,
  customs         numeric default 0,
  clearing        numeric default 0,
  transport       numeric default 0,
  loading         numeric default 0,
  landed_total    numeric default 0,
  paid_amount     numeric default 0,
  terms           text,
  photos          jsonb default '[]',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Customers
create table customers (
  id text primary key,
  name            text,
  phone           text,
  whatsapp        text,
  address         text,
  opening_balance numeric default 0,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Quotations
create table quotations (
  id text primary key,
  date            date,
  customer_name   text,
  valid_until     date,
  items           jsonb default '[]',
  edge_charges    numeric default 0,
  installation_charges numeric default 0,
  transport_charges    numeric default 0,
  discount        numeric default 0,
  tax_pct         numeric default 0,
  commission_pct  numeric default 0,
  total           numeric default 0,
  status          text default 'draft',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Orders
create table orders (
  id text primary key,
  date            date,
  customer_name   text,
  quote_ref       text,
  items           jsonb default '[]',
  edge_charges    numeric default 0,
  installation_charges numeric default 0,
  transport_charges    numeric default 0,
  discount        numeric default 0,
  tax_pct         numeric default 0,
  commission_pct  numeric default 0,
  total           numeric default 0,
  paid_amount     numeric default 0,
  vehicle_no      text,
  driver          text,
  status          text default 'pending',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Workers
create table workers (
  id text primary key,
  name            text,
  skill           text,
  phone           text,
  cnic            text,
  rate_type       text default 'daily',
  daily_rate      numeric default 0,
  piece_cutting   numeric,
  piece_polishing numeric,
  piece_loading   numeric,
  piece_installation numeric,
  advances        numeric default 0,
  deductions      numeric default 0,
  loan            numeric default 0,
  loan_installment numeric default 0,
  address         text,
  status          text default 'available',
  photos          jsonb default '[]',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Attendance
create table attendance (
  id text primary key,
  date            date,
  worker_id       text,
  worker_name     text,
  status          text default 'present',
  overtime        numeric default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Piece work
create table piecework (
  id text primary key,
  date            date,
  worker_id       text,
  worker_name     text,
  work_type       text,
  units           numeric default 0,
  rate            numeric default 0,
  earning         numeric default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Payroll (payslips)
create table payroll (
  id text primary key,
  period          text,
  worker_id       text,
  worker_name     text,
  present_days    numeric default 0,
  overtime_hours  numeric default 0,
  overtime_amount numeric default 0,
  piece_earnings  numeric default 0,
  bonus           numeric default 0,
  advances        numeric default 0,
  loan_installment numeric default 0,
  deductions      numeric default 0,
  gross           numeric default 0,
  net_payable     numeric default 0,
  paid            boolean default false,
  date            date,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Expenses
create table expenses (
  id text primary key,
  date            date,
  category        text,
  amount          numeric default 0,
  recurring       boolean default false,
  allocate_to     text,
  machine_hours   numeric,
  vendor          text,
  photos          jsonb default '[]',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Notifications
create table notifications (
  id text primary key,
  kind            text,
  severity        text,
  title           text,
  body            text,
  read            boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- 3. Indexes for the app's common filters
-- ────────────────────────────────────────────────────────────────
create index slabs_status_idx      on slabs(status);
create index slabs_parent_idx      on slabs(parent_block);
create index blocks_status_idx     on blocks(status);
create index movements_date_idx    on movements(date desc);
create index movements_type_idx    on movements(type);
create index orders_status_idx     on orders(status);
create index orders_customer_idx   on orders(customer_name);
create index purchases_supplier_idx on purchases(supplier_name);
create index attendance_date_idx   on attendance(date);
create index attendance_worker_idx on attendance(worker_id);
create index expenses_date_idx     on expenses(date desc);
create index piecework_date_idx    on piecework(date);
create index payroll_period_idx    on payroll(period);

-- ────────────────────────────────────────────────────────────────
-- 4. Automatic updated_at on every edit
-- ────────────────────────────────────────────────────────────────
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['blocks','slabs','offcuts','movements','machines','maintenance',
    'cutting_plans','job_cards','suppliers','purchases','customers','quotations','orders',
    'workers','attendance','piecework','payroll','expenses','notifications']
  loop
    execute format('create trigger trg_touch_%1$s before update on %1$s
                    for each row execute function touch_updated_at()', t);
  end loop;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 5. Permissions — THIS is what makes Delete / Edit work in the app
--    The app talks to Supabase with the public anon key, so the anon
--    role must be allowed to read and write every table.
-- ────────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['blocks','slabs','offcuts','movements','machines','maintenance',
    'cutting_plans','job_cards','suppliers','purchases','customers','quotations','orders',
    'workers','attendance','piecework','payroll','expenses','notifications']
  loop
    -- RLS on, with one fully-permissive policy for this single-tenant app.
    -- (Only this app's anon key can reach the DB; tighten per-user later.)
    execute format('alter table %1$s enable row level security', t);
    execute format('drop policy if exists "app_all_%1$s" on %1$s', t);
    execute format('create policy "app_all_%1$s" on %1$s for all
                    to anon, authenticated
                    using (true) with check (true)', t);
  end loop;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 6. Verify — run these if you want to double-check the setup
-- ────────────────────────────────────────────────────────────────
-- Should list all 19 tables:
--   select table_name from information_schema.tables
--   where table_schema = 'public' order by table_name;
--
-- Should return rows (policies exist and are permissive):
--   select tablename, policyname from pg_policies where schemaname = 'public';
--
-- Quick write/delete smoke test (safe — inserts then deletes one row):
--   insert into attendance (id, date, worker_name, status) values ('__smoke_test__', now()::date, 'test', 'present');
--   delete from attendance where id = '__smoke_test__';
