-- Add an actual joining date so salary does not start on the record creation date.
alter table public.employees
  add column if not exists joining_date date;

-- Existing employees were already working from the start of the month.
-- Backfill using the first day of each employee's record-creation month.
update public.employees
set joining_date = date_trunc('month', created_at)::date
where joining_date is null;

alter table public.employees
  alter column joining_date set default current_date;

alter table public.employees
  alter column joining_date set not null;
