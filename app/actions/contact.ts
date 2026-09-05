'use server';

import { contactSchema } from '@/lib/validations/common';
import { sanitizeMultiline, sanitizePlainText } from '@/lib/sanitize';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function submitContact(formData: FormData): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    whatsapp: formData.get('whatsapp') || '',
    company: formData.get('company') || '',
    subject: formData.get('subject'),
    equipmentId: formData.get('equipmentId') || '',
    message: formData.get('message'),
    consent: formData.get('consent') === 'on' || formData.get('consent') === 'true',
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const limited = rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
  if (!limited.success) {
    return { ok: false, error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: 'O formulário está pronto, mas o banco ainda não foi conectado. Configure o Supabase.',
    };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('leads').insert({
      name: sanitizePlainText(parsed.data.name),
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      company: parsed.data.company ? sanitizePlainText(parsed.data.company) : null,
      subject: sanitizePlainText(parsed.data.subject),
      equipment_id: parsed.data.equipmentId || null,
      message: sanitizeMultiline(parsed.data.message),
      source: 'contact_form',
    });
    if (error) {
      return { ok: false, error: 'Não foi possível enviar a mensagem. Tente novamente.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Não foi possível enviar a mensagem. Tente novamente.' };
  }
}
