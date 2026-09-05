import Link from 'next/link';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { ContractsTable, type ContractRow } from '@/components/admin/tables';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission('contracts.read');
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from('contracts')
    .select('id, number, object, status, total_cents, starts_on, ends_on, signed_at, customers(legal_name), quotes(number)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Contratos"
        description="Acompanhe contratos, vigências e documentos."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Contratos' }]}
        actions={
          <Button asChild>
            <Link href="/admin/orcamentos?status=approved">Novo contrato</Link>
          </Button>
        }
      />
      <ContractsTable data={(data ?? []) as ContractRow[]} initialQuery={q ?? ''} />
    </div>
  );
}
