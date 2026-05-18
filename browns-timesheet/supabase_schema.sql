-- Browns Electrical Timesheet — Supabase Schema
-- Run this in your Supabase SQL editor

create table employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text default 'Electrician',
  created_at timestamptz default now()
);

create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  extras_rate numeric default 5,
  created_at timestamptz default now()
);

create table site_prices (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,
  house_type text not null,
  stage text not null,
  price numeric default 0
);

create table plots (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,
  plot_number text not null,
  house_type text not null,
  created_at timestamptz default now()
);

create table stage_claims (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid references plots(id) on delete cascade,
  site_id uuid references sites(id) on delete cascade,
  employee_name text not null,
  stage text not null,
  extras_qty integer default 0,
  locked boolean default false,
  month text not null,
  created_at timestamptz default now(),
  unique(plot_id, stage)
);

create table day_rate_entries (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  entry_date date not null,
  hours numeric not null,
  rate numeric not null,
  total numeric not null,
  note text not null,
  month text not null,
  created_at timestamptz default now()
);

-- Seed initial employees
insert into employees (name, role) values
  ('Harry', 'Electrician'),
  ('Ryan', 'Electrician'),
  ('Krys', 'Electrician');
