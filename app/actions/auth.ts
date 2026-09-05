'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { loginSchema, recoverSchema } from '@/lib/validations/common';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

export async function loginAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { error: 'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.' };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const ip = getClientIp(await headers());
  const limited = rateLimit(`login:${ip}:${parsed.data.email}`, 8, 10 * 60 * 1000);
  if (!limited.success) {
    return { error: 'Muitas tentativas de acesso. Aguarde alguns minutos.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { error: 'E-mail ou senha inválidos.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active, deleted_at')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile?.is_active || profile.deleted_at) {
    await supabase.auth.signOut();
    return { error: 'Usuário sem autorização para o painel. Solicite ativação ao administrador.' };
  }

  await writeAuditLog({
    actorId: data.user.id,
    action: 'login',
    entity: 'profiles',
    entityId: data.user.id,
  });

  const next = String(formData.get('next') || '/admin');
  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function recoverAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase não configurado.' };
  }
  const parsed = recoverSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'E-mail inválido.' };
  }
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/admin`,
  });
  if (error) {
    return { error: 'Não foi possível enviar o e-mail de recuperação.' };
  }
  return { ok: true as const };
}

export async function logoutAction() {
  if (!isSupabaseConfigured()) redirect('/admin/login');
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
