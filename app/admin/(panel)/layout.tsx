import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, subject, created_at')
    .eq('status', 'new')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <AdminShell
      name={user.fullName}
      roleName={user.roleName}
      email={user.email}
      permissions={user.permissions}
      notifications={(leads ?? []).map((lead) => ({
        id: lead.id,
        title: lead.name,
        text: lead.subject || 'Novo contato pelo site',
        href: '/admin/leads',
        createdAt: lead.created_at,
      }))}
    >
      {children}
    </AdminShell>
  );
}
