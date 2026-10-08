'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createAdminClient } from '@/lib/db/admin';
import { writeAuditLog } from '@/lib/audit';
import { loginSchema, recoverSchema } from '@/lib/validations/common';
import { isDatabaseConfigured } from '@/lib/db/pool';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { SESSION_COOKIE, createSessionToken, isAuthConfigured, sessionCookieOptions } from '@/lib/auth/token';
import { verifyCredentials } from '@/lib/auth/users';

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

  if (!isDatabaseConfigured() || !isAuthConfigured()) {
    return { error: 'Configure MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE e AUTH_SECRET.' };
  }

  let user: Awaited<ReturnType<typeof verifyCredentials>>;
  try {
    user = await verifyCredentials(parsed.data.email, parsed.data.password);
  } catch {
    return { error: 'Não foi possível conectar ao banco de dados. Tente novamente em instantes.' };
  }
  if (!user) {
    return { error: 'E-mail ou senha inválidos.' };
  }

  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('is_active, deleted_at')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_active || profile.deleted_at) {
    return { error: 'Usuário sem autorização para o painel. Solicite ativação ao administrador.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(user.id, user.email), sessionCookieOptions());

  await writeAuditLog({
    actorId: user.id,
    action: 'login',
    entity: 'profiles',
    entityId: user.id,
  });

  const next = String(formData.get('next') || '/admin');
  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function recoverAction(formData: FormData) {
  const parsed = recoverSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'E-mail inválido.' };
  }
  return {
    error: 'Para redefinir a senha, peça a um administrador do painel (Usuários → editar → nova senha).',
  };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  redirect('/admin/login');
}
