import { cache } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createUserClient } from '@/lib/supabase/server';
import { hasPermission, ROLE_PERMISSIONS, type PermissionSlug } from '@/lib/permissions';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { BOOTSTRAP_COOKIE, BOOTSTRAP_USER_ID, readBootstrapToken } from '@/lib/auth/bootstrap';

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  roleSlug: string | null;
  roleName: string | null;
  permissions: PermissionSlug[];
};

type RoleRow = {
  slug: string | null;
  name: string | null;
  role_permissions?: Array<{ permissions: { slug: string } | { slug: string }[] | null }> | null;
};

function permissionsFromRole(role: RoleRow | null | undefined): PermissionSlug[] {
  return (role?.role_permissions ?? [])
    .map((row) => {
      const permission = Array.isArray(row.permissions) ? row.permissions[0] : row.permissions;
      return permission?.slug as PermissionSlug | undefined;
    })
    .filter((slug): slug is PermissionSlug => Boolean(slug));
}

/** Layout, página e server actions da mesma requisição compartilham o resultado. */
export const getSessionUser = cache(loadSessionUser);

async function loadSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const bootstrap = await readBootstrapToken(cookieStore.get(BOOTSTRAP_COOKIE)?.value);
  if (bootstrap) {
    return {
      id: BOOTSTRAP_USER_ID,
      email: bootstrap.email,
      fullName: 'Eduardo Pinheiro',
      roleSlug: 'administrator',
      roleName: 'Administrador',
      permissions: [...ROLE_PERMISSIONS.administrator],
    };
  }

  if (!isSupabaseConfigured()) return null;

  const supabase = await createUserClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = typeof claims?.sub === 'string' ? claims.sub : null;
  if (!userId) return null;
  const email = typeof claims?.email === 'string' ? claims.email : '';

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, is_active, deleted_at, role_id, roles(slug, name, role_permissions(permissions(slug)))')
    .eq('id', userId)
    .maybeSingle();

  if (!profile || !profile.is_active || profile.deleted_at) return null;

  const role = (Array.isArray(profile.roles) ? profile.roles[0] : profile.roles) as RoleRow | null;

  return {
    id: userId,
    email,
    fullName: profile.full_name || email || 'Usuário',
    roleSlug: role?.slug ?? null,
    roleName: role?.name ?? null,
    permissions: profile.role_id ? permissionsFromRole(role) : [],
  };
}

export async function requireSession() {
  const user = await getSessionUser();
  if (!user) redirect('/admin/login');
  return user;
}

export async function requirePermission(permission: PermissionSlug | PermissionSlug[]) {
  const user = await requireSession();
  if (!hasPermission(user.permissions, permission)) {
    redirect('/admin/sem-permissao');
  }
  return user;
}

export async function assertPermission(
  permission: PermissionSlug | PermissionSlug[],
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Sessão expirada. Entre novamente.');
  }
  if (!hasPermission(user.permissions, permission)) {
    throw new Error('Você não possui permissão para esta ação.');
  }
  return user;
}
