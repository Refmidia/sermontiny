'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createUserClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { loginSchema, recoverSchema } from '@/lib/validations/common';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import {
  BOOTSTRAP_COOKIE,
  bootstrapCookieOptions,
  createBootstrapToken,
  isBootstrapConfigured,
  verifyBootstrapPassword,
} from '@/lib/auth/bootstrap';

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
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

  if (verifyBootstrapPassword(parsed.data.email, parsed.data.password)) {
    const token = await createBootstrapToken(parsed.data.email);
    const cookieStore = await cookies();
    cookieStore.set(BOOTSTRAP_COOKIE, token, bootstrapCookieOptions());
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createUserClient();
        await supabase.auth.signInWithPassword(parsed.data);
      } catch {
        // O painel já entra pelo cookie de emergência.
      }
    }
    const next = String(formData.get('next') || '/admin');
    redirect(next.startsWith('/admin') ? next : '/admin');
  }

  if (!isSupabaseConfigured()) {
    return {
      error: isBootstrapConfigured()
        ? 'E-mail ou senha inválidos.'
        : 'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    };
  }

  const supabase = await createUserClient();
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
  const supabase = await createUserClient();
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
  const cookieStore = await cookies();
  cookieStore.set(BOOTSTRAP_COOKIE, '', { ...bootstrapCookieOptions(), maxAge: 0 });
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createUserClient();
      await supabase.auth.signOut();
    } catch {
      // O Auth pode estar indisponível; a sessão local já foi encerrada.
    }
  }
  redirect('/admin/login');
}
