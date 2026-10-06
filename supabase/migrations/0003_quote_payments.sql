-- Recebimentos / pagamentos vinculados a orçamentos
create table if not exists public.quote_payments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  kind text not null default 'Sinal',
  paid_at timestamptz not null default now(),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists quote_payments_quote_idx
  on public.quote_payments (quote_id, paid_at desc)
  where deleted_at is null;

alter table public.quote_payments enable row level security;

create policy quote_payments_read on public.quote_payments
  for select to authenticated
  using (deleted_at is null and public.has_permission('quotes.read'));

create policy quote_payments_insert on public.quote_payments
  for insert to authenticated
  with check (public.has_permission('quotes.write'));

create policy quote_payments_update on public.quote_payments
  for update to authenticated
  using (public.has_permission('quotes.write'))
  with check (public.has_permission('quotes.write'));
