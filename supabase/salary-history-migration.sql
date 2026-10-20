-- Salary history: preserve each monthly salary rate with its effective start date.
create table if not exists public.employee_salary_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  monthly_salary numeric(12,2) not null check (monthly_salary >= 0),
  effective_from date not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (employee_id, effective_from)
);
create index if not exists employee_salary_history_lookup_idx
  on public.employee_salary_history(employee_id, effective_from desc);
alter table public.employee_salary_history enable row level security;
drop policy if exists "salary history read by branch managers" on public.employee_salary_history;
create policy "salary history read by branch managers"
  on public.employee_salary_history for select to authenticated
  using (exists (select 1 from public.employees e where e.id=employee_salary_history.employee_id and public.can_manage_branch(e.branch_name)));
drop policy if exists "salary history insert by branch managers" on public.employee_salary_history;
create policy "salary history insert by branch managers"
  on public.employee_salary_history for insert to authenticated
  with check (exists (select 1 from public.employees e where e.id=employee_salary_history.employee_id and public.can_manage_branch(e.branch_name)));
-- Backfill one starting salary record for existing employees. Past salary changes before this feature cannot be inferred.
insert into public.employee_salary_history(employee_id, monthly_salary, effective_from)
select id, coalesce(monthly_salary,0), created_at::date
from public.employees
on conflict (employee_id, effective_from) do nothing;
