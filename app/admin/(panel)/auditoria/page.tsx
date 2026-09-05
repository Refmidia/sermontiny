import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { AuditBoard, type AuditRow } from '@/components/admin/audit-board';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  await requirePermission('audit.read');
  const supabase = await createClient();
  const { data } = await supabase
    .from('audit_logs')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Registre e consulte as ações realizadas no painel."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Auditoria' }]}
      />
      <AuditBoard data={(data ?? []) as AuditRow[]} />
    </div>
  );
}
