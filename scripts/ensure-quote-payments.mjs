/**
 * Garante a tabela quote_payments no Supabase (migration 0003).
 * Uso: node scripts/ensure-quote-payments.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SQL = `
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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'quote_payments' and policyname = 'quote_payments_read'
  ) then
    create policy quote_payments_read on public.quote_payments
      for select to authenticated
      using (deleted_at is null and public.has_permission('quotes.read'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'quote_payments' and policyname = 'quote_payments_insert'
  ) then
    create policy quote_payments_insert on public.quote_payments
      for insert to authenticated
      with check (public.has_permission('quotes.write'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'quote_payments' and policyname = 'quote_payments_update'
  ) then
    create policy quote_payments_update on public.quote_payments
      for update to authenticated
      using (public.has_permission('quotes.write'))
      with check (public.has_permission('quotes.write'));
  end if;
end $$;

grant select, insert, update on public.quote_payments to authenticated;
`;

async function tableExists() {
  const { error } = await supabase.from('quote_payments').select('id').limit(1);
  if (!error) return true;
  if (error.code === 'PGRST205' || error.code === '42P01' || /quote_payments/i.test(error.message)) {
    return false;
  }
  // Outro erro: tabela pode existir, mas RLS/permissão falhou
  console.warn('Aviso ao consultar quote_payments:', error.message);
  return true;
}

async function runSqlViaPgMeta() {
  const endpoints = [
    `${url}/pg/query`,
    `${url}/pg-meta/default/query`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
        },
        body: JSON.stringify({ query: SQL }),
      });
      const text = await res.text();
      if (res.ok) {
        console.log('SQL aplicado via', endpoint);
        return true;
      }
      console.log('Endpoint', endpoint, '->', res.status, text.slice(0, 200));
    } catch (err) {
      console.log('Falha em', endpoint, String(err));
    }
  }
  return false;
}

const exists = await tableExists();
if (exists) {
  console.log('OK: tabela quote_payments já existe.');
  process.exit(0);
}

console.log('Tabela quote_payments não encontrada. Tentando criar...');
const applied = await runSqlViaPgMeta();
if (!applied) {
  console.error(`
Não foi possível criar a tabela automaticamente.
Abra o SQL Editor do Supabase e rode o arquivo:
  supabase/migrations/0003_quote_payments.sql
`);
  process.exit(1);
}

const ok = await tableExists();
if (!ok) {
  console.error('SQL rodou, mas a tabela ainda não responde. Verifique no Supabase.');
  process.exit(1);
}

console.log('OK: quote_payments criada e acessível.');
