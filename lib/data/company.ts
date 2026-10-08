import { unstable_cache } from 'next/cache';
import { SITE } from '@/lib/site';
import { isDatabaseConfigured } from '@/lib/db/pool';
import { createPublicReader, withPublicReadBreaker } from '@/lib/db/public-reader';
import { createClient } from '@/lib/db/server';
import type { CompanySettings } from '@/types/database';

export const COMPANY_SETTINGS_TAG = 'company-settings';
const COMPANY_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

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
    phones: [SITE.phone],
    whatsapp: SITE.phone,
    email: SITE.email,
    website: SITE.website,
    logo_path: null,
    signature_path: null,
    bank_name: null,
    bank_agency: null,
    bank_account: null,
    pix_key: SITE.cnpj,
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
  if (!isDatabaseConfigured()) return fallbackCompanySettings();
  try {
    const db = await createClient();
    const { data } = await db
      .from('company_settings')
      .select('*')
      .eq('id', COMPANY_SETTINGS_ID)
      .maybeSingle();
    return (data as CompanySettings | null) ?? fallbackCompanySettings();
  } catch {
    return fallbackCompanySettings();
  }
}

// Falhas lançam erro para não ficarem guardadas no cache.
const loadPublicCompanySettings = unstable_cache(
  async () => {
    const client = createPublicReader();
    if (!client) return null;
    const { data, error } = await client.from('company_settings').select('*').eq('id', COMPANY_SETTINGS_ID).maybeSingle();
    if (error) throw new Error(error.message);
    return data as CompanySettings | null;
  },
  ['public-company-settings'],
  { revalidate: 300, tags: [COMPANY_SETTINGS_TAG] },
);

/** Versão em cache para o site público; o painel usa getCompanySettings (sempre atual). */
export async function getPublicCompanySettings() {
  if (!isDatabaseConfigured()) return fallbackCompanySettings();
  const settings = await withPublicReadBreaker(loadPublicCompanySettings, null);
  if (!settings) return fallbackCompanySettings();
  return {
    ...settings,
    phones: settings.phones?.length ? settings.phones : [SITE.phone],
    whatsapp: settings.whatsapp || SITE.phone,
  };
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
