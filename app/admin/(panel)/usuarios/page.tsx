import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { listAdminUsers } from '@/app/actions/users';
import { UsersManager } from '@/components/admin/users-manager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await requirePermission('users.read');
  const canWrite = user.permissions.includes('users.write');
  const supabase = await createClient();
  const [{ data: roles }, users] = await Promise.all([
    supabase.from('roles').select('id, name, slug').order('name'),
    listAdminUsers(),
  ]);

  return <UsersManager users={users} roles={roles ?? []} canWrite={canWrite} />;
}
