-- ═══════════════════════════════════════════════════════════════════
--  ALMAKKA FACTORY — MARBLE MANAGER · COMPLETE SUPABASE SETUP
--  Version 2.3 · 2026-09-21
-- ═══════════════════════════════════════════════════════════════════
--  HOW TO USE
--    1. Open your Supabase project → SQL Editor → New query
--    2. Paste this WHOLE file and press RUN (takes a few seconds)
--    3. Reload the app — everything works: save, edit, DELETE, cloud sync.
--
--  SAFE TO RUN AGAIN AND AGAIN (idempotent)
--    · This version NEVER drops a table and NEVER deletes data.
--      Running it on an existing database only ADDS what is missing.
--    · If you ran the earlier v2.2 script before, just run this file —
--      it upgrades your database in place.
--
--  WHAT IS NEW IN 2.3 (compared to 2.2)
--    · NEW TABLE  partners  — the rock-business register:
--        raw_lend      = gives raw rocks on credit (ادھار)
--        marble_borrow = takes cut marble on credit
--        custom_cut    = brings own rock, factory cuts it for a fee
--        transport     = brings rocks in their own vehicles
--    · NEW TABLE  utilities — electricity & solar bills with a MANUAL
--        unit price (the price changes, so it is typed on every bill).
--    · workers   + name_en (English name), designation (free text:
--        Manager / Foreman / Labour …)
--    · machines  + work (what the machine does — free text)
--    · RLS + full permissions re-applied to ALL 21 tables so Delete
--      keeps working from the app.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────
-- 1. Tables — "if not exists" so nothing is ever dropped or emptied
-- ────────────────────────────────────────────────────────────────

create table if not exists blocks (
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

create table if not exists slabs (
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

create table if not exists offcuts (
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

create table if not exists movements (
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

create table if not exists machines (
  id text primary key,
  name            text,
  work            text,
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

create table if not exists maintenance (
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

create table if not exists cutting_plans (
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

create table if not exists job_cards (
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

create table if not exists suppliers (
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

create table if not exists purchases (
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

create table if not exists customers (
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

create table if not exists quotations (
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

create table if not exists orders (
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

create table if not exists workers (
  id text primary key,
  name            text,
  name_en         text,
  designation     text,
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

create table if not exists attendance (
  id text primary key,
  date            date,
  worker_id       text,
  worker_name     text,
  status          text default 'present',
  overtime        numeric default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists piecework (
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

create table if not exists payroll (
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

create table if not exists expenses (
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

-- ★ NEW 2.3 — Partners (rock business relations)
create table if not exists partners (
  id text primary key,
  name            text,
  name_en         text,
  type            text default 'raw_lend',
  phone           text,
  whatsapp        text,
  vehicle_no      text,
  address         text,
  opening_balance numeric default 0,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ★ NEW 2.3 — Utilities (electricity & solar bills, manual unit price)
create table if not exists utilities (
  id text primary key,
  date            date,
  type            text default 'electricity',
  meter_no        text,
  bill_no         text,
  prev_reading    numeric default 0,
  cur_reading     numeric default 0,
  units           numeric default 0,
  unit_price      numeric default 0,
  amount          numeric default 0,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists notifications (
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
-- 2. Column patches — adds the 2.3 fields to databases that were
--    set up with an older script. "if not exists" = safe to re-run.
-- ────────────────────────────────────────────────────────────────
alter table workers  add column if not exists name_en     text;
alter table workers  add column if not exists designation text;
alter table machines add column if not exists work        text;

-- ────────────────────────────────────────────────────────────────
-- 3. Indexes for the app's common filters (safe to re-run)
-- ────────────────────────────────────────────────────────────────
create index if not exists slabs_status_idx      on slabs(status);
create index if not exists slabs_parent_idx      on slabs(parent_block);
create index if not exists blocks_status_idx     on blocks(status);
create index if not exists movements_date_idx    on movements(date desc);
create index if not exists movements_type_idx    on movements(type);
create index if not exists orders_status_idx     on orders(status);
create index if not exists orders_customer_idx   on orders(customer_name);
create index if not exists purchases_supplier_idx on purchases(supplier_name);
create index if not exists attendance_date_idx   on attendance(date);
create index if not exists attendance_worker_idx on attendance(worker_id);
create index if not exists expenses_date_idx     on expenses(date desc);
create index if not exists piecework_date_idx    on piecework(date);
create index if not exists payroll_period_idx    on payroll(period);
create index if not exists partners_type_idx     on partners(type);
create index if not exists utilities_date_idx    on utilities(date desc);

-- ────────────────────────────────────────────────────────────────
-- 4. Automatic updated_at on every edit (re-applied safely)
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
    'workers','attendance','piecework','payroll','expenses','partners','utilities','notifications']
  loop
    execute format('drop trigger if exists trg_touch_%1$s on %1$s', t);
    execute format('create trigger trg_touch_%1$s before update on %1$s
                    for each row execute function touch_updated_at()', t);
  end loop;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 5. Permissions + RLS — THIS is what makes Delete / Edit work
--    The app talks to Supabase with the public anon key, so the anon
--    role must be allowed to read and write every table.
-- ────────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to anon, authenticated;

-- Future tables created later are auto-granted too.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['blocks','slabs','offcuts','movements','machines','maintenance',
    'cutting_plans','job_cards','suppliers','purchases','customers','quotations','orders',
    'workers','attendance','piecework','payroll','expenses','partners','utilities','notifications']
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
-- Should list all 21 tables:
--   select table_name from information_schema.tables
--   where table_schema = 'public' order by table_name;
--
-- Should return rows (policies exist and are permissive):
--   select tablename, policyname from pg_policies where schemaname = 'public';
--
-- The two new columns must show here:
--   select column_name from information_schema.columns where table_name = 'workers';
--   select column_name from information_schema.columns where table_name = 'machines';
--
-- Quick write/delete smoke test (safe — inserts then deletes one row):
--   insert into attendance (id, date, worker_name, status) values ('__smoke_test__', now()::date, 'test', 'present');
--   delete from attendance where id = '__smoke_test__';
