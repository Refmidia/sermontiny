import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, type PermissionSlug } from '@/lib/permissions';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  roleSlug: string | null;
  roleName: string | null;
  permissions: PermissionSlug[];
};

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, is_active, deleted_at, roles(slug, name), role_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !profile.is_active || profile.deleted_at) return null;

  const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
  let permissions: PermissionSlug[] = [];

  if (profile.role_id) {
    const { data: rolePermissions } = await supabase
      .from('role_permissions')
      .select('permissions(slug)')
      .eq('role_id', profile.role_id);

    permissions = (rolePermissions ?? [])
      .map((row) => {
        const permission = Array.isArray(row.permissions) ? row.permissions[0] : row.permissions;
        return permission?.slug as PermissionSlug | undefined;
      })
      .filter((slug): slug is PermissionSlug => Boolean(slug));
  }

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profile.full_name || user.email || 'Usuário',
    roleSlug: role?.slug ?? null,
    roleName: role?.name ?? null,
    permissions,
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
