import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { LeadsBoard, type LeadRow } from '@/components/admin/leads-board';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const user = await requirePermission('leads.read');
  const canWrite = user.permissions.includes('leads.write');
  const supabase = await createClient();

  let rows: LeadRow[] = [];
  const withAssignee = await supabase
    .from('leads')
    .select('*, equipment(name), assignee:assigned_to(full_name, roles(name))')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (withAssignee.error) {
    const fallback = await supabase
      .from('leads')
      .select('*, equipment(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    rows = (fallback.data ?? []) as LeadRow[];
  } else {
    rows = (withAssignee.data ?? []) as LeadRow[];
  }

  return <LeadsBoard data={rows} canWrite={canWrite} />;
}
