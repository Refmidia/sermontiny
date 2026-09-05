import Link from 'next/link';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { EquipmentCatalog } from '@/components/admin/equipment-catalog';
import { Button } from '@/components/ui/button';
import type { Equipment } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function EquipmentAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission('equipment.read');
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from('equipment').select('*').is('deleted_at', null).order('sort_order');

  return (
    <div>
      <PageHeader
        title="Equipamentos"
        description="Gerencie a frota, capacidades e valores de locação."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Equipamentos' }]}
        actions={
          <Button asChild>
            <Link href="/admin/equipamentos/novo">Novo equipamento</Link>
          </Button>
        }
      />
      <EquipmentCatalog data={(data ?? []) as Equipment[]} initialQuery={q ?? ''} />
    </div>
  );
}
