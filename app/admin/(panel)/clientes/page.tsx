import Link from 'next/link';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { CustomersTable } from '@/components/admin/tables';
import { Button } from '@/components/ui/button';
import type { Customer } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission('customers.read');
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from('customers').select('*').is('deleted_at', null).order('legal_name');

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerencie clientes, unidades e contatos comerciais."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Clientes' }]}
        actions={
          <Button asChild>
            <Link href="/admin/clientes/novo">Novo cliente</Link>
          </Button>
        }
      />
      <CustomersTable data={(data ?? []) as Customer[]} initialQuery={q ?? ''} />
    </div>
  );
}
