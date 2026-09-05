-- Sermontiny — schema inicial
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create type person_type as enum ('pj', 'pf');
create type record_status as enum ('active', 'inactive');
create type equipment_status as enum ('available', 'rented', 'maintenance', 'inactive');
create type quote_status as enum (
  'draft',
  'in_review',
  'sent',
  'viewed',
  'approved',
  'change_requested',
  'rejected',
  'expired',
  'converted'
);
create type contract_status as enum (
  'draft',
  'in_review',
  'sent',
  'awaiting_signature',
  'signed',
  'active',
  'suspended',
  'closed',
  'cancelled'
);
create type quote_item_unit as enum ('daily', 'hour', 'month', 'kilometer', 'unit', 'fixed');
create type quote_item_kind as enum ('equipment', 'service', 'additional');
create type whatsapp_provider as enum ('wa_me', 'cloud_api');
create type whatsapp_message_status as enum ('pending', 'sent', 'failed');
create type document_kind as enum ('quote_pdf', 'contract_pdf', 'signed_contract', 'certificate', 'other');
create type responsibility_party as enum ('contratante', 'contratada', 'compartilhado', 'nao_aplicavel');
create type lead_status as enum ('new', 'in_progress', 'converted', 'archived');
create type audit_action as enum (
  'login',
  'create',
  'update',
  'soft_delete',
  'price_change',
  'pdf_generate',
  'whatsapp_send',
  'approve',
  'convert_contract'
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role_id uuid references public.roles(id),
  phone text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.company_settings (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text not null,
  cnpj text not null,
  state_registration text,
  street text,
  number text,
  complement text,
  district text,
  city text,
  state text,
  zip text,
  phones text[] not null default '{}',
  whatsapp text,
  email text,
  website text,
  logo_path text,
  signature_path text,
  bank_name text,
  bank_agency text,
  bank_account text,
  pix_key text,
  default_payment_terms text,
  default_commercial_terms text,
  default_responsibilities text,
  quote_prefix text not null default 'ORC',
  contract_prefix text not null default 'CTR',
  quote_next_seq integer not null default 1,
  contract_next_seq integer not null default 1,
  numbering_year integer not null default extract(year from now()),
  show_public_prices boolean not null default false,
  whatsapp_provider public.whatsapp_provider not null default 'wa_me',
  quote_whatsapp_template text not null default 'Olá, {nome}. Segue o orçamento {numero}, referente a {titulo}. A proposta possui validade até {validade}. Permanecemos à disposição.',
  contract_whatsapp_template text not null default 'Olá, {nome}. Segue o contrato {numero}, referente a {objeto}. Por favor, confirme o recebimento. Permanecemos à disposição.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_settings_single_row check (id = '00000000-0000-0000-0000-000000000001')
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  person_type public.person_type not null default 'pj',
  legal_name text not null,
  trade_name text,
  document text not null,
  state_registration text,
  email text,
  phone text,
  whatsapp_ddi text not null default '55',
  whatsapp_number text,
  zip text,
  street text,
  number text,
  complement text,
  district text,
  city text,
  state text,
  notes text,
  status public.record_status not null default 'active',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index customers_document_active_idx
  on public.customers (document)
  where deleted_at is null;

create table public.customer_units (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  internal_code text,
  street text,
  number text,
  complement text,
  district text,
  city text,
  state text,
  zip text,
  manager_name text,
  phone text,
  whatsapp text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  unit_id uuid references public.customer_units(id) on delete set null,
  name text not null,
  role text,
  email text,
  phone text,
  whatsapp text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand text,
  model text,
  capacity_tons numeric(10,2),
  plate text,
  year integer,
  asset_number text,
  description text,
  technical_features text,
  photo_path text,
  status public.equipment_status not null default 'available',
  available_for_quote boolean not null default true,
  show_on_website boolean not null default true,
  show_availability_public boolean not null default false,
  daily_cents bigint not null default 0,
  monthly_cents bigint not null default 0,
  hourly_cents bigint not null default 0,
  km_cents bigint not null default 0,
  min_hours_per_day numeric(6,2) not null default 10,
  notes text,
  name_needs_confirmation boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint equipment_money_non_negative check (
    daily_cents >= 0 and monthly_cents >= 0 and hourly_cents >= 0 and km_cents >= 0
  )
);

create table public.equipment_price_history (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  daily_cents bigint not null default 0,
  monthly_cents bigint not null default 0,
  hourly_cents bigint not null default 0,
  km_cents bigint not null default 0,
  min_hours_per_day numeric(6,2) not null default 10,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index equipment_price_history_current_idx
  on public.equipment_price_history (equipment_id, valid_from desc)
  where valid_to is null;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  whatsapp text,
  company text,
  subject text,
  equipment_id uuid references public.equipment(id) on delete set null,
  message text not null,
  status public.lead_status not null default 'new',
  source text not null default 'contact_form',
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  customer_id uuid not null references public.customers(id),
  unit_id uuid references public.customer_units(id),
  contact_id uuid references public.customer_contacts(id),
  owner_id uuid references public.profiles(id),
  current_version_id uuid,
  status public.quote_status not null default 'draft',
  title text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  version_number integer not null,
  issued_at date not null default current_date,
  valid_until date,
  title text not null,
  description text,
  scope text,
  activity_code text,
  start_date date,
  end_date date,
  payment_terms text,
  payment_deadline text,
  internal_notes text,
  customer_notes text,
  status public.quote_status not null default 'draft',
  subtotal_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  surcharge_cents bigint not null default 0,
  tax_cents bigint not null default 0,
  total_cents bigint not null default 0,
  total_extenso text not null default '',
  locked boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quote_id, version_number)
);

alter table public.quotes
  add constraint quotes_current_version_fk
  foreign key (current_version_id) references public.quote_versions(id) on delete set null;

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid not null references public.quote_versions(id) on delete cascade,
  equipment_id uuid references public.equipment(id),
  kind public.quote_item_kind not null default 'equipment',
  additional_code text,
  description text not null,
  unit public.quote_item_unit not null default 'daily',
  quantity numeric(12,3) not null default 1,
  unit_price_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  surcharge_cents bigint not null default 0,
  subtotal_cents bigint not null default 0,
  sort_order integer not null default 0,
  monthly_recommendation boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.clause_library (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null,
  is_active boolean not null default true,
  requires_responsibility boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  quote_id uuid references public.quotes(id),
  quote_version_id uuid references public.quote_versions(id),
  customer_id uuid not null references public.customers(id),
  unit_id uuid references public.customer_units(id),
  object text not null,
  scope text,
  starts_on date,
  ends_on date,
  signed_at date,
  billing_method text,
  payment_deadline text,
  total_cents bigint not null default 0,
  food_party public.responsibility_party,
  lodging_party public.responsibility_party,
  fuel_party public.responsibility_party,
  transport_party public.responsibility_party,
  helper_party public.responsibility_party,
  rigging_party public.responsibility_party,
  notes text,
  status public.contract_status not null default 'draft',
  current_version_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  version_number integer not null,
  object text not null,
  scope text,
  responsibilities text,
  payment_terms text,
  total_cents bigint not null default 0,
  locked boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (contract_id, version_number)
);

alter table public.contracts
  add constraint contracts_current_version_fk
  foreign key (current_version_id) references public.contract_versions(id) on delete set null;

create table public.contract_clauses (
  id uuid primary key default gen_random_uuid(),
  contract_version_id uuid not null references public.contract_versions(id) on delete cascade,
  library_id uuid references public.clause_library(id),
  title text not null,
  body text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  kind public.document_kind not null,
  customer_id uuid references public.customers(id),
  quote_id uuid references public.quotes(id),
  quote_version_id uuid references public.quote_versions(id),
  contract_id uuid references public.contracts(id),
  contract_version_id uuid references public.contract_versions(id),
  storage_path text not null,
  file_name text not null,
  mime_type text not null default 'application/pdf',
  is_immutable boolean not null default false,
  access_token text unique,
  token_expires_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  provider public.whatsapp_provider not null,
  to_number text not null,
  template_used text,
  body text not null,
  document_id uuid references public.documents(id),
  quote_id uuid references public.quotes(id),
  contract_id uuid references public.contracts(id),
  status public.whatsapp_message_status not null default 'pending',
  provider_message_id text,
  error_message text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action public.audit_action not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index customers_search_idx on public.customers using gin (legal_name gin_trgm_ops, document gin_trgm_ops);
create index equipment_search_idx on public.equipment using gin (name gin_trgm_ops, brand gin_trgm_ops);
create index quotes_customer_idx on public.quotes (customer_id, created_at desc);
create index contracts_customer_idx on public.contracts (customer_id, created_at desc);
create index contracts_ends_on_idx on public.contracts (ends_on) where deleted_at is null;
create index leads_created_idx on public.leads (created_at desc);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index documents_token_idx on public.documents (access_token);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger customer_units_updated_at before update on public.customer_units for each row execute function public.set_updated_at();
create trigger customer_contacts_updated_at before update on public.customer_contacts for each row execute function public.set_updated_at();
create trigger equipment_updated_at before update on public.equipment for each row execute function public.set_updated_at();
create trigger leads_updated_at before update on public.leads for each row execute function public.set_updated_at();
create trigger quotes_updated_at before update on public.quotes for each row execute function public.set_updated_at();
create trigger quote_versions_updated_at before update on public.quote_versions for each row execute function public.set_updated_at();
create trigger contracts_updated_at before update on public.contracts for each row execute function public.set_updated_at();
create trigger company_settings_updated_at before update on public.company_settings for each row execute function public.set_updated_at();
create trigger clause_library_updated_at before update on public.clause_library for each row execute function public.set_updated_at();
create trigger whatsapp_messages_updated_at before update on public.whatsapp_messages for each row execute function public.set_updated_at();

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where id = auth.uid()
    and deleted_at is null
  limit 1;
$$;

create or replace function public.has_permission(permission_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role_id = p.role_id
    join public.permissions perm on perm.id = rp.permission_id
    where p.id = auth.uid()
      and p.is_active = true
      and p.deleted_at is null
      and perm.slug = permission_slug
  );
$$;

create or replace function public.next_document_number(doc_kind text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  settings public.company_settings;
  current_year integer := extract(year from now())::integer;
  seq integer;
  prefix text;
begin
  if not (
    public.has_permission('quotes.write')
    or public.has_permission('contracts.write')
    or public.has_permission('settings.write')
  ) then
    raise exception 'Sem permissão para gerar numeração.';
  end if;

  select * into settings from public.company_settings where id = '00000000-0000-0000-0000-000000000001' for update;

  if settings.numbering_year <> current_year then
    update public.company_settings
      set numbering_year = current_year,
          quote_next_seq = 1,
          contract_next_seq = 1
      where id = settings.id;
    settings.quote_next_seq := 1;
    settings.contract_next_seq := 1;
    settings.numbering_year := current_year;
  end if;

  if doc_kind = 'quote' then
    seq := settings.quote_next_seq;
    prefix := settings.quote_prefix;
    update public.company_settings set quote_next_seq = quote_next_seq + 1 where id = settings.id;
  elsif doc_kind = 'contract' then
    seq := settings.contract_next_seq;
    prefix := settings.contract_prefix;
    update public.company_settings set contract_next_seq = contract_next_seq + 1 where id = settings.id;
  else
    raise exception 'Tipo de documento inválido.';
  end if;

  return prefix || '-' || current_year::text || '-' || lpad(seq::text, 4, '0');
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_role uuid;
begin
  select id into viewer_role from public.roles where slug = 'viewer';
  insert into public.profiles (id, full_name, role_id, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    viewer_role,
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.record_equipment_price_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT'
     or new.daily_cents is distinct from old.daily_cents
     or new.monthly_cents is distinct from old.monthly_cents
     or new.hourly_cents is distinct from old.hourly_cents
     or new.km_cents is distinct from old.km_cents
     or new.min_hours_per_day is distinct from old.min_hours_per_day then
    update public.equipment_price_history
      set valid_to = now()
      where equipment_id = new.id
        and valid_to is null;
    insert into public.equipment_price_history (
      equipment_id, daily_cents, monthly_cents, hourly_cents, km_cents, min_hours_per_day, changed_by
    ) values (
      new.id, new.daily_cents, new.monthly_cents, new.hourly_cents, new.km_cents, new.min_hours_per_day, auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger equipment_price_history_trg
  after insert or update of daily_cents, monthly_cents, hourly_cents, km_cents, min_hours_per_day
  on public.equipment
  for each row execute function public.record_equipment_price_history();

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.company_settings enable row level security;
alter table public.customers enable row level security;
alter table public.customer_units enable row level security;
alter table public.customer_contacts enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_price_history enable row level security;
alter table public.leads enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_versions enable row level security;
alter table public.quote_items enable row level security;
alter table public.clause_library enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_versions enable row level security;
alter table public.contract_clauses enable row level security;
alter table public.documents enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.audit_logs enable row level security;

create policy roles_read on public.roles for select to authenticated using (public.has_permission('users.read') or public.has_permission('dashboard.read'));
create policy permissions_read on public.permissions for select to authenticated using (public.has_permission('users.read') or public.has_permission('dashboard.read'));
create policy role_permissions_read on public.role_permissions for select to authenticated using (public.has_permission('users.read') or public.has_permission('dashboard.read'));

create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.has_permission('users.read'));
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_write on public.profiles for update to authenticated using (public.has_permission('users.write')) with check (public.has_permission('users.write'));

create policy company_settings_public_read on public.company_settings for select to anon, authenticated using (true);
create policy company_settings_write on public.company_settings for update to authenticated using (public.has_permission('settings.write')) with check (public.has_permission('settings.write'));

create policy customers_read on public.customers for select to authenticated using (deleted_at is null and public.has_permission('customers.read'));
create policy customers_write on public.customers for insert to authenticated with check (public.has_permission('customers.write'));
create policy customers_update on public.customers for update to authenticated using (public.has_permission('customers.write')) with check (public.has_permission('customers.write'));
create policy customers_delete on public.customers for update to authenticated using (public.has_permission('customers.delete')) with check (public.has_permission('customers.delete'));

create policy customer_units_read on public.customer_units for select to authenticated using (deleted_at is null and public.has_permission('customers.read'));
create policy customer_units_write on public.customer_units for insert to authenticated with check (public.has_permission('customers.write'));
create policy customer_units_update on public.customer_units for update to authenticated using (public.has_permission('customers.write')) with check (public.has_permission('customers.write'));

create policy customer_contacts_read on public.customer_contacts for select to authenticated using (deleted_at is null and public.has_permission('customers.read'));
create policy customer_contacts_write on public.customer_contacts for insert to authenticated with check (public.has_permission('customers.write'));
create policy customer_contacts_update on public.customer_contacts for update to authenticated using (public.has_permission('customers.write')) with check (public.has_permission('customers.write'));

create policy equipment_public_read on public.equipment
  for select to anon, authenticated
  using (deleted_at is null and show_on_website = true);
create policy equipment_admin_read on public.equipment
  for select to authenticated
  using (public.has_permission('equipment.read'));
create policy equipment_write on public.equipment for insert to authenticated with check (public.has_permission('equipment.write'));
create policy equipment_update on public.equipment for update to authenticated using (public.has_permission('equipment.write')) with check (public.has_permission('equipment.write'));

create policy price_history_read on public.equipment_price_history for select to authenticated using (public.has_permission('equipment.read'));
create policy price_history_write on public.equipment_price_history for all to authenticated using (public.has_permission('prices.write')) with check (public.has_permission('prices.write'));

create policy leads_insert_public on public.leads for insert to anon, authenticated with check (true);
create policy leads_read on public.leads for select to authenticated using (deleted_at is null and public.has_permission('leads.read'));
create policy leads_update on public.leads for update to authenticated using (public.has_permission('leads.write')) with check (public.has_permission('leads.write'));

create policy quotes_read on public.quotes for select to authenticated using (deleted_at is null and public.has_permission('quotes.read'));
create policy quotes_write on public.quotes for insert to authenticated with check (public.has_permission('quotes.write'));
create policy quotes_update on public.quotes for update to authenticated using (public.has_permission('quotes.write')) with check (public.has_permission('quotes.write'));

create policy quote_versions_read on public.quote_versions for select to authenticated using (public.has_permission('quotes.read'));
create policy quote_versions_write on public.quote_versions for insert to authenticated with check (public.has_permission('quotes.write'));
create policy quote_versions_update on public.quote_versions for update to authenticated using (public.has_permission('quotes.write') and locked = false) with check (public.has_permission('quotes.write'));

create policy quote_items_read on public.quote_items for select to authenticated using (public.has_permission('quotes.read'));
create policy quote_items_write on public.quote_items for all to authenticated using (public.has_permission('quotes.write')) with check (public.has_permission('quotes.write'));

create policy clause_library_read on public.clause_library for select to authenticated using (public.has_permission('contracts.read'));
create policy clause_library_write on public.clause_library for all to authenticated using (public.has_permission('settings.write') or public.has_permission('contracts.write')) with check (public.has_permission('settings.write') or public.has_permission('contracts.write'));

create policy contracts_read on public.contracts for select to authenticated using (deleted_at is null and public.has_permission('contracts.read'));
create policy contracts_write on public.contracts for insert to authenticated with check (public.has_permission('contracts.write'));
create policy contracts_update on public.contracts for update to authenticated using (public.has_permission('contracts.write')) with check (public.has_permission('contracts.write'));

create policy contract_versions_read on public.contract_versions for select to authenticated using (public.has_permission('contracts.read'));
create policy contract_versions_write on public.contract_versions for insert to authenticated with check (public.has_permission('contracts.write'));
create policy contract_versions_update on public.contract_versions for update to authenticated using (public.has_permission('contracts.write') and locked = false) with check (public.has_permission('contracts.write'));

create policy contract_clauses_read on public.contract_clauses for select to authenticated using (public.has_permission('contracts.read'));
create policy contract_clauses_write on public.contract_clauses for all to authenticated using (public.has_permission('contracts.write')) with check (public.has_permission('contracts.write'));

create policy documents_read on public.documents for select to authenticated using (deleted_at is null and public.has_permission('documents.read'));
create policy documents_write on public.documents for insert to authenticated with check (public.has_permission('documents.write'));
create policy documents_update on public.documents for update to authenticated using (public.has_permission('documents.write')) with check (public.has_permission('documents.write'));

create policy whatsapp_read on public.whatsapp_messages for select to authenticated using (public.has_permission('whatsapp.send') or public.has_permission('audit.read'));
create policy whatsapp_write on public.whatsapp_messages for insert to authenticated with check (public.has_permission('whatsapp.send'));
create policy whatsapp_update on public.whatsapp_messages for update to authenticated using (public.has_permission('whatsapp.send')) with check (public.has_permission('whatsapp.send'));

create policy audit_read on public.audit_logs for select to authenticated using (public.has_permission('audit.read'));
create policy audit_insert on public.audit_logs for insert to authenticated with check (true);

insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('equipment', 'equipment', true),
  ('certificates', 'certificates', true),
  ('documents', 'documents', false)
on conflict (id) do nothing;

create policy storage_logos_public on storage.objects for select to anon, authenticated using (bucket_id = 'logos');
create policy storage_equipment_public on storage.objects for select to anon, authenticated using (bucket_id = 'equipment');
create policy storage_certificates_public on storage.objects for select to anon, authenticated using (bucket_id = 'certificates');
create policy storage_documents_admin on storage.objects for select to authenticated using (bucket_id = 'documents' and public.has_permission('documents.read'));
create policy storage_write_admin on storage.objects for insert to authenticated with check (
  bucket_id in ('logos', 'equipment', 'certificates', 'documents')
  and public.has_permission('documents.write')
);
create policy storage_update_admin on storage.objects for update to authenticated using (
  bucket_id in ('logos', 'equipment', 'certificates', 'documents')
  and public.has_permission('documents.write')
);
