-- Run once in Supabase SQL Editor to enable linked advance adjustment records.
alter table public.ledger_entries drop constraint if exists ledger_entries_entry_type_check;
alter table public.ledger_entries add constraint ledger_entries_entry_type_check
  check (entry_type in ('earning','advance','payment','deduction','adjustment','advance_adjustment'));
