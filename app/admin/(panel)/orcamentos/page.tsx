import Link from 'next/link';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { QuotesTable, type QuoteRow } from '@/components/admin/tables';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission('quotes.read');
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from('quotes')
    .select(
      'id, number, title, status, created_at, customers(legal_name), customer_units(name), quote_versions:current_version_id(total_cents, version_number, valid_until)',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Crie, acompanhe e converta propostas comerciais."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Orçamentos' }]}
        actions={
          <Button asChild>
            <Link href="/admin/orcamentos/novo">Novo orçamento</Link>
          </Button>
        }
      />
      <QuotesTable data={(data ?? []) as QuoteRow[]} initialQuery={q ?? ''} />
    </div>
  );
}
