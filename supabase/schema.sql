-- HotelFlow database setup. Run this complete file in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'employee' check (role in ('super_admin','branch_manager','employee')),
  branch_name text,
  created_at timestamptz not null default now()
);
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  full_name text not null,
  phone text,
  branch_name text not null,
  pay_type text not null check (pay_type in ('daily','monthly')),
  daily_rate numeric(12,2) check (daily_rate is null or daily_rate >= 0),
  monthly_salary numeric(12,2) check (monthly_salary is null or monthly_salary >= 0),
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id),
  work_date date not null,
  status text not null check (status in ('present','absent','leave','half_day')),
  notes text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(employee_id,work_date)
);
create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id),
  entry_date date not null default current_date,
  entry_type text not null check (entry_type in ('earning','advance','payment','deduction','adjustment')),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists employees_branch_active_idx on public.employees(branch_name,active);
create index if not exists attendance_date_employee_idx on public.attendance(work_date,employee_id);
create index if not exists ledger_employee_date_idx on public.ledger_entries(employee_id,entry_date desc);
create or replace function public.current_role() returns text language sql stable security definer set search_path=public as $$
  select role from public.profiles where id=auth.uid()
$$;
create or replace function public.current_branch() returns text language sql stable security definer set search_path=public as $$
  select branch_name from public.profiles where id=auth.uid()
$$;
create or replace function public.can_manage_branch(target_branch text) returns boolean language sql stable security definer set search_path=public as $$
  select coalesce(public.current_role()='super_admin' or (public.current_role()='branch_manager' and public.current_branch()=target_branch),false)
$$;
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.ledger_entries enable row level security;
drop policy if exists "profile self or super admin read" on public.profiles;
create policy "profile self or super admin read" on public.profiles for select to authenticated using (id=auth.uid() or public.current_role()='super_admin');
-- Profile roles and branch assignments are changed by a trusted administrator in SQL,
-- not by users updating their own profile from the client.
drop policy if exists "profile self update" on public.profiles;
drop policy if exists "employees read by role" on public.employees;
create policy "employees read by role" on public.employees for select to authenticated using (public.current_role()='super_admin' or (public.current_role()='branch_manager' and branch_name=public.current_branch()));
drop policy if exists "employees manager insert" on public.employees;
create policy "employees manager insert" on public.employees for insert to authenticated with check (public.can_manage_branch(branch_name));
drop policy if exists "employees manager update" on public.employees;
create policy "employees manager update" on public.employees for update to authenticated using (public.can_manage_branch(branch_name)) with check (public.can_manage_branch(branch_name));
drop policy if exists "attendance read by role" on public.attendance;
create policy "attendance read by role" on public.attendance for select to authenticated using (exists(select 1 from public.employees e where e.id=attendance.employee_id and public.can_manage_branch(e.branch_name)));
drop policy if exists "attendance managers write" on public.attendance;
create policy "attendance managers write" on public.attendance for all to authenticated using (exists(select 1 from public.employees e where e.id=attendance.employee_id and public.can_manage_branch(e.branch_name))) with check (exists(select 1 from public.employees e where e.id=attendance.employee_id and public.can_manage_branch(e.branch_name)));
drop policy if exists "ledger read by role" on public.ledger_entries;
create policy "ledger read by role" on public.ledger_entries for select to authenticated using (public.current_role()='super_admin' or exists(select 1 from public.employees e where e.id=ledger_entries.employee_id and public.can_manage_branch(e.branch_name)));
drop policy if exists "ledger managers write" on public.ledger_entries;
create policy "ledger managers write" on public.ledger_entries for insert to authenticated with check (exists(select 1 from public.employees e where e.id=ledger_entries.employee_id and public.can_manage_branch(e.branch_name)));
drop policy if exists "ledger no update delete" on public.ledger_entries;
create policy "ledger no update delete" on public.ledger_entries for update to authenticated using (false);
drop policy if exists "ledger no delete" on public.ledger_entries;
create policy "ledger delete blocked" on public.ledger_entries for delete to authenticated using (false);
-- Create the first account in Supabase Authentication first, then insert its profile:
-- insert into public.profiles(id,full_name,role) values ('AUTH-USER-UUID','Your name','super_admin');
