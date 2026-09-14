import { SITE } from '@/lib/site';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import type { CompanySettings } from '@/types/database';

export function fallbackCompanySettings(): CompanySettings {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    legal_name: SITE.legalName,
    trade_name: SITE.name,
    cnpj: SITE.cnpj,
    state_registration: SITE.stateRegistration,
    street: SITE.address.street,
    number: SITE.address.number,
    complement: null,
    district: SITE.address.district,
    city: SITE.address.city,
    state: SITE.address.state,
    zip: SITE.address.zip,
    phones: [],
    whatsapp: null,
    email: SITE.email,
    website: SITE.website,
    logo_path: null,
    signature_path: null,
    bank_name: null,
    bank_agency: null,
    bank_account: null,
    pix_key: '16.592.847/0001-72',
    default_payment_terms: null,
    default_commercial_terms: null,
    default_responsibilities: null,
    quote_prefix: 'ORC',
    contract_prefix: 'CTR',
    quote_next_seq: 1,
    contract_next_seq: 1,
    numbering_year: new Date().getFullYear(),
    show_public_prices: false,
    whatsapp_provider: 'wa_me',
    quote_whatsapp_template:
      'Olá, {nome}. Segue o orçamento {numero}, referente a {titulo}. A proposta possui validade até {validade}. Permanecemos à disposição.',
    contract_whatsapp_template:
      'Olá, {nome}. Segue o contrato {numero}, referente a {objeto}. Por favor, confirme o recebimento. Permanecemos à disposição.',
  };
}

export async function getCompanySettings() {
  if (!isSupabaseConfigured()) return fallbackCompanySettings();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .maybeSingle();
    return (data as CompanySettings | null) ?? fallbackCompanySettings();
  } catch {
    return fallbackCompanySettings();
  }
}

export function companyAddress(settings: CompanySettings) {
  return [
    settings.street,
    settings.number,
    settings.district,
    settings.city && settings.state ? `${settings.city}/${settings.state}` : settings.city,
    settings.zip ? `CEP ${settings.zip}` : null,
  ]
    .filter(Boolean)
    .join(', ');
}

export { publicStorageUrl } from '@/lib/storage-url';
