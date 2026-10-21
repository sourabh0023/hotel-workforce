-- Soft-delete employee records while preserving all linked history.
-- Run once in Supabase SQL Editor.
alter table public.employees
  add column if not exists deleted_at timestamptz;

create index if not exists employees_visible_branch_idx
  on public.employees(branch_name, active)
  where deleted_at is null;

-- No rows in attendance, ledger_entries, or employee_salary_history are deleted.
