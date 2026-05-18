create table if not exists public.restaurant_customers (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.guests(id),
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text,
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.restaurant_categories(id),
  supplier_id uuid references public.restaurant_suppliers(id),
  sku text unique,
  name text not null,
  description text,
  unit text not null default 'un',
  cost_price integer not null default 0 check (cost_price >= 0),
  sale_price integer not null default 0 check (sale_price >= 0),
  stock_quantity numeric(12, 3) not null default 0,
  min_stock numeric(12, 3) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.restaurant_products(id),
  movement_type text not null check (movement_type in ('in', 'out', 'adjustment', 'waste')),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_cost integer not null default 0 check (unit_cost >= 0),
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  location text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_tabs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  table_id uuid references public.restaurant_tables(id),
  booking_id uuid references public.bookings(id),
  customer_id uuid references public.restaurant_customers(id),
  status text not null default 'open' check (status in ('open', 'pending_payment', 'paid', 'cancelled')),
  subtotal integer not null default 0 check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  service_fee integer not null default 0 check (service_fee >= 0),
  total integer not null default 0 check (total >= 0),
  opened_by uuid references auth.users(id),
  closed_by uuid references auth.users(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_orders (
  id uuid primary key default gen_random_uuid(),
  tab_id uuid references public.restaurant_tabs(id),
  booking_id uuid references public.bookings(id),
  order_number text not null unique,
  origin text not null default 'restaurant',
  status text not null default 'new' check (status in ('new', 'preparing', 'ready', 'delivered', 'cancelled')),
  notes text,
  total integer not null default 0 check (total >= 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.restaurant_orders(id) on delete cascade,
  product_id uuid references public.restaurant_products(id),
  name text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  total integer generated always as ((quantity * unit_price)::integer) stored,
  status text not null default 'new' check (status in ('new', 'preparing', 'ready', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_sales (
  id uuid primary key default gen_random_uuid(),
  tab_id uuid references public.restaurant_tabs(id),
  booking_id uuid references public.bookings(id),
  sale_number text not null unique,
  status text not null default 'paid' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  subtotal integer not null default 0 check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null default 0 check (total >= 0),
  payment_method text not null default 'room' check (payment_method in ('cash', 'card', 'pix', 'room', 'courtesy')),
  sold_by uuid references auth.users(id),
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_cash_sessions (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid references auth.users(id),
  closed_by uuid references auth.users(id),
  status text not null default 'open' check (status in ('open', 'closed')),
  opening_amount integer not null default 0 check (opening_amount >= 0),
  closing_amount integer check (closing_amount >= 0),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  notes text
);

create table if not exists public.restaurant_payables (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.restaurant_suppliers(id),
  description text not null,
  amount integer not null check (amount >= 0),
  due_date date not null,
  status text not null default 'open' check (status in ('open', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_receivables (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.restaurant_sales(id),
  description text not null,
  amount integer not null check (amount >= 0),
  due_date date not null,
  status text not null default 'open' check (status in ('open', 'received', 'cancelled')),
  received_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists restaurant_products_active_idx on public.restaurant_products(active);
create index if not exists restaurant_products_stock_idx on public.restaurant_products(stock_quantity, min_stock);
create index if not exists restaurant_orders_status_idx on public.restaurant_orders(status);
create index if not exists restaurant_orders_created_at_idx on public.restaurant_orders(created_at desc);
create index if not exists restaurant_tabs_status_idx on public.restaurant_tabs(status);
create index if not exists restaurant_sales_sold_at_idx on public.restaurant_sales(sold_at desc);
create index if not exists restaurant_payables_due_idx on public.restaurant_payables(due_date, status);
create index if not exists restaurant_receivables_due_idx on public.restaurant_receivables(due_date, status);

alter table public.restaurant_customers enable row level security;
alter table public.restaurant_suppliers enable row level security;
alter table public.restaurant_categories enable row level security;
alter table public.restaurant_products enable row level security;
alter table public.restaurant_stock_movements enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.restaurant_tabs enable row level security;
alter table public.restaurant_orders enable row level security;
alter table public.restaurant_order_items enable row level security;
alter table public.restaurant_sales enable row level security;
alter table public.restaurant_cash_sessions enable row level security;
alter table public.restaurant_payables enable row level security;
alter table public.restaurant_receivables enable row level security;

create or replace function public.can_access_restaurant()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'guest') in ('master', 'admin', 'manager', 'kitchen')
    or coalesce((auth.jwt() -> 'app_metadata' -> 'permissions' ->> 'kitchen')::boolean, false)
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'restaurant_customers',
    'restaurant_suppliers',
    'restaurant_categories',
    'restaurant_products',
    'restaurant_stock_movements',
    'restaurant_tables',
    'restaurant_tabs',
    'restaurant_orders',
    'restaurant_order_items',
    'restaurant_sales',
    'restaurant_cash_sessions',
    'restaurant_payables',
    'restaurant_receivables'
  ]
  loop
    execute format('drop policy if exists "Restaurant staff can read %I" on public.%I', table_name, table_name);
    execute format('create policy "Restaurant staff can read %I" on public.%I for select using (public.can_access_restaurant())', table_name, table_name);
  end loop;
end $$;

insert into public.restaurant_categories (name)
values ('Bebidas'), ('Snacks'), ('Pratos'), ('Experiencias')
on conflict (name) do nothing;
