-- ═══════════════════════════════════════════════════════════════
-- Marble Manager — Supabase schema (run in SQL editor)
-- The app is offline-first: device storage is the source of truth
-- and this schema mirrors it to the cloud. Tables match the app
-- collections 1:1 (snake_case columns mapped automatically).
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── generic columns on every table ──
-- id text primary key (BLK-XXXX style from the app)
-- created_at / updated_at timestamptz

create table if not exists blocks (
  id text primary key,
  block_no text, lot_no text, supplier text, quarry text, country text,
  length_in numeric, width_in numeric, height_in numeric,
  cft numeric, weight_kg numeric, density numeric default 76,
  purchase_cost numeric default 0, freight numeric default 0,
  customs numeric default 0, clearing numeric default 0,
  transport numeric default 0, loading numeric default 0,
  landed_total numeric default 0,
  grade text, color text, veining text, quality_notes text,
  yard text, rack text, gate text,
  status text default 'available',
  photos jsonb default '[]',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists slabs (
  id text primary key,
  parent_block text references blocks(id) on delete set null,
  length_ft numeric, width_ft numeric, thickness_mm numeric,
  area_sqft numeric, area_sqm numeric,
  finish text default 'raw', edge text default 'none',
  grade text, defects text, patches text,
  yard text, rack text,
  status text default 'available',
  reserved_for text, order_ref text,
  price numeric default 0,
  notes text, photos jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists offcuts (
  id text primary key,
  parent_slab text references slabs(id) on delete set null,
  length_ft numeric, width_ft numeric, thickness_mm numeric,
  qty numeric default 1, area_sqft numeric,
  bundle_id text, mixed_lot boolean default false,
  sell_by text default 'sqft', price numeric default 0,
  grade text, location text,
  status text default 'available',
  notes text, photos jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists movements (
  id text primary key,
  date date, type text, ref_id text,
  qty numeric, from_location text, to_location text,
  party text, notes text, photos jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists machines (
  id text primary key,
  name text, type text, status text default 'running',
  location text, power_kw numeric, cost numeric,
  purchase_date date, notes text, photos jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists maintenance (
  id text primary key,
  date date, machine_name text, type text,
  down_hours numeric default 0, cost numeric default 0,
  parts text, technician text, next_due date, notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cutting_plans (
  id text primary key,
  block_id text references blocks(id) on delete set null,
  planned_slabs text, blade_thickness numeric,
  planned_sqft numeric default 0, actual_sqft numeric default 0,
  status text default 'planned', notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists job_cards (
  id text primary key,
  date date, machine_name text, operator text, shift text,
  start_time text, end_time text,
  output_sqft numeric default 0, wastage_sqft numeric default 0,
  block_id text, notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists suppliers (
  id text primary key,
  name text, type text default 'local', country text,
  phone text, whatsapp text, address text,
  opening_balance numeric default 0, currency text default 'PKR',
  terms text, notes text, photos jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists purchases (
  id text primary key,
  date date, supplier_name text, lot_no text, country text,
  block_ref text, currency text default 'PKR',
  purchase_cost numeric default 0, freight numeric default 0,
  customs numeric default 0, clearing numeric default 0,
  transport numeric default 0, loading numeric default 0,
  landed_total numeric default 0, paid_amount numeric default 0,
  terms text, notes text, photos jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists customers (
  id text primary key,
  name text, phone text, whatsapp text, address text,
  opening_balance numeric default 0, notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists quotations (
  id text primary key,
  date date, customer_name text, valid_until date,
  items jsonb default '[]',
  edge_charges numeric default 0, installation_charges numeric default 0,
  transport_charges numeric default 0, discount numeric default 0,
  tax_pct numeric default 0, commission_pct numeric default 0,
  total numeric default 0,
  status text default 'draft', notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists orders (
  id text primary key,
  date date, customer_name text, quote_ref text,
  items jsonb default '[]',
  edge_charges numeric default 0, installation_charges numeric default 0,
  transport_charges numeric default 0, discount numeric default 0,
  tax_pct numeric default 0, commission_pct numeric default 0,
  total numeric default 0, paid_amount numeric default 0,
  vehicle_no text, driver text,
  status text default 'pending', notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists workers (
  id text primary key,
  name text, skill text, phone text, cnic text,
  rate_type text default 'daily', daily_rate numeric default 0,
  piece_cutting numeric, piece_polishing numeric,
  piece_loading numeric, piece_installation numeric,
  advances numeric default 0, deductions numeric default 0,
  loan numeric default 0, loan_installment numeric default 0,
  address text, notes text, photos jsonb default '[]',
  status text default 'available',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists attendance (
  id text primary key,
  date date, worker_id text, worker_name text,
  status text default 'present', overtime numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists piecework (
  id text primary key,
  date date, worker_id text, worker_name text,
  work_type text, units numeric default 0,
  rate numeric default 0, earning numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payroll (
  id text primary key,
  period text, worker_id text, worker_name text,
  present_days numeric default 0, overtime_hours numeric default 0,
  overtime_amount numeric default 0, piece_earnings numeric default 0,
  bonus numeric default 0, advances numeric default 0,
  loan_installment numeric default 0, deductions numeric default 0,
  gross numeric default 0, net_payable numeric default 0,
  paid boolean default false, date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists expenses (
  id text primary key,
  date date, category text, amount numeric default 0,
  recurring boolean default false, allocate_to text,
  machine_hours numeric, vendor text, notes text, photos jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists notifications (
  id text primary key,
  kind text, severity text, title text, body text,
  read boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── indexes for the common filters ──
create index if not exists slabs_status_idx on slabs(status);
create index if not exists slabs_parent_idx on slabs(parent_block);
create index if not exists blocks_status_idx on blocks(status);
create index if not exists movements_date_idx on movements(date desc);
create index if not exists movements_type_idx on movements(type);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_customer_idx on orders(customer_name);
create index if not exists purchases_supplier_idx on purchases(supplier_name);
create index if not exists attendance_date_idx on attendance(date);
create index if not exists attendance_worker_idx on attendance(worker_id);
create index if not exists expenses_date_idx on expenses(date desc);

-- ── automatic updated_at ──
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
    execute format('drop trigger if exists trg_touch_%1$s on %1$s', t);
    execute format('create trigger trg_touch_%1$s before update on %1$s
                    for each row execute function touch_updated_at()', t);
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security
-- The desktop/yard app runs with the anon key; for a single-tenant
-- factory the simplest safe setup is permissive RLS (rows only go
-- through this app). Tighten per-role later with Supabase Auth:
--   create policy "all" on blocks for all using (auth.role() = 'authenticated');
-- ═══════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array['blocks','slabs','offcuts','movements','machines','maintenance',
    'cutting_plans','job_cards','suppliers','purchases','customers','quotations','orders',
    'workers','attendance','piecework','payroll','expenses','notifications']
  loop
    execute format('alter table %1$s enable row level security', t);
    execute format('drop policy if exists "app_all_%1$s" on %1$s', t);
    execute format('create policy "app_all_%1$s" on %1$s for all using (true) with check (true)', t);
  end loop;
end $$;
