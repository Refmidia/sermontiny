'use server';

import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';
import { companySettingsSchema } from '@/lib/validations/common';
import { emptyToNull } from '@/lib/forms';
import { sanitizeMultiline, sanitizePlainText } from '@/lib/sanitize';

export async function saveCompanySettings(formData: FormData) {
  const user = await assertPermission('settings.write');
  const parsed = companySettingsSchema.safeParse({
    legal_name: formData.get('legal_name'),
    trade_name: formData.get('trade_name'),
    cnpj: formData.get('cnpj'),
    state_registration: formData.get('state_registration') || '',
    street: formData.get('street') || '',
    number: formData.get('number') || '',
    complement: formData.get('complement') || '',
    district: formData.get('district') || '',
    city: formData.get('city') || '',
    state: formData.get('state') || '',
    zip: formData.get('zip') || '',
    phones_text: formData.get('phones_text') || '',
    whatsapp: formData.get('whatsapp') || '',
    email: formData.get('email') || '',
    website: formData.get('website') || '',
    bank_name: formData.get('bank_name') || '',
    bank_agency: formData.get('bank_agency') || '',
    bank_account: formData.get('bank_account') || '',
    pix_key: formData.get('pix_key') || '',
    default_payment_terms: formData.get('default_payment_terms') || '',
    default_commercial_terms: formData.get('default_commercial_terms') || '',
    default_responsibilities: formData.get('default_responsibilities') || '',
    quote_prefix: formData.get('quote_prefix'),
    contract_prefix: formData.get('contract_prefix'),
    show_public_prices: formData.get('show_public_prices') === 'on',
    whatsapp_provider: formData.get('whatsapp_provider'),
    quote_whatsapp_template: formData.get('quote_whatsapp_template'),
    contract_whatsapp_template: formData.get('contract_whatsapp_template'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    legal_name: sanitizePlainText(parsed.data.legal_name),
    trade_name: sanitizePlainText(parsed.data.trade_name),
    cnpj: parsed.data.cnpj,
    state_registration: emptyToNull(parsed.data.state_registration),
    street: emptyToNull(parsed.data.street),
    number: emptyToNull(parsed.data.number),
    complement: emptyToNull(parsed.data.complement),
    district: emptyToNull(parsed.data.district),
    city: emptyToNull(parsed.data.city),
    state: emptyToNull(parsed.data.state),
    zip: emptyToNull(parsed.data.zip),
    phones: parsed.data.phones_text
      ? parsed.data.phones_text.split('\n').map((item) => item.trim()).filter(Boolean)
      : [],
    whatsapp: emptyToNull(parsed.data.whatsapp),
    email: emptyToNull(parsed.data.email),
    website: emptyToNull(parsed.data.website),
    bank_name: emptyToNull(parsed.data.bank_name),
    bank_agency: emptyToNull(parsed.data.bank_agency),
    bank_account: emptyToNull(parsed.data.bank_account),
    pix_key: emptyToNull(parsed.data.pix_key),
    default_payment_terms: parsed.data.default_payment_terms
      ? sanitizeMultiline(parsed.data.default_payment_terms)
      : null,
    default_commercial_terms: parsed.data.default_commercial_terms
      ? sanitizeMultiline(parsed.data.default_commercial_terms)
      : null,
    default_responsibilities: parsed.data.default_responsibilities
      ? sanitizeMultiline(parsed.data.default_responsibilities)
      : null,
    quote_prefix: parsed.data.quote_prefix,
    contract_prefix: parsed.data.contract_prefix,
    show_public_prices: parsed.data.show_public_prices,
    whatsapp_provider: parsed.data.whatsapp_provider,
    quote_whatsapp_template: parsed.data.quote_whatsapp_template,
    contract_whatsapp_template: parsed.data.contract_whatsapp_template,
  };

  const logo = formData.get('logo');
  if (logo instanceof File && logo.size > 0) {
    const path = `logo-${Date.now()}-${logo.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const { error } = await supabase.storage.from('logos').upload(path, logo, { upsert: true });
    if (error) return { error: 'Falha ao enviar o logo.' };
    payload.logo_path = path;
  }

  const { error } = await supabase
    .from('company_settings')
    .update(payload)
    .eq('id', '00000000-0000-0000-0000-000000000001');
  if (error) return { error: 'Não foi possível salvar as configurações.' };
  await writeAuditLog({ actorId: user.id, action: 'update', entity: 'company_settings' });
  revalidatePath('/admin/configuracoes');
  revalidatePath('/');
  return { ok: true as const };
}

export async function updateUserRole(formData: FormData) {
  const user = await assertPermission('users.write');
  const profileId = String(formData.get('profile_id') || '');
  const roleId = String(formData.get('role_id') || '');
  const isActive = formData.get('is_active') === 'on';
  if (!profileId || !roleId) return { error: 'Usuário ou perfil inválido.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role_id: roleId, is_active: isActive })
    .eq('id', profileId);
  if (error) return { error: 'Não foi possível atualizar o usuário.' };
  await writeAuditLog({ actorId: user.id, action: 'update', entity: 'profiles', entityId: profileId });
  revalidatePath('/admin/configuracoes');
  return { ok: true as const };
}
