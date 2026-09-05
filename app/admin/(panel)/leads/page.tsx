import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { LeadsBoard } from '@/components/admin/leads-board';
import type { Lead } from '@/types/database';

export const dynamic = 'force-dynamic';

type LeadRow = Lead & { equipment?: { name: string } | { name: string }[] | null };

export default async function LeadsPage() {
  await requirePermission('leads.read');
  const supabase = await createClient();
  const { data } = await supabase
    .from('leads')
    .select('*, equipment(name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Contatos"
        description="Acompanhe solicitações recebidas pelo site institucional."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Contatos' }]}
      />
      <LeadsBoard data={(data ?? []) as LeadRow[]} />
    </div>
  );
}
