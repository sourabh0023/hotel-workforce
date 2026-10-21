-- Run once in Supabase SQL Editor to fix the missing employee joining_date column.
alter table public.employees
add column if not exists joining_date date;

update public.employees
set joining_date = coalesce(joining_date, created_at::date, current_date)
where joining_date is null;

alter table public.employees
alter column joining_date set default current_date;

alter table public.employees
alter column joining_date set not null;
