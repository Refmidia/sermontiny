-- CRM Contatos: novos status + observações internas
do $$ begin
  alter type public.lead_status add value 'proposal_sent';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.lead_status add value 'lost';
exception when duplicate_object then null;
end $$;

alter table public.leads
  add column if not exists notes text,
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null;

create index if not exists leads_status_idx on public.leads (status) where deleted_at is null;
create index if not exists leads_assigned_idx on public.leads (assigned_to) where deleted_at is null;
