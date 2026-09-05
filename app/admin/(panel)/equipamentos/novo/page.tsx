import { requirePermission } from '@/lib/auth/session';
import { PageHeader } from '@/components/admin/page-header';
import { EquipmentForm } from '@/components/admin/equipment-form';

export default async function NewEquipmentPage() {
  await requirePermission('equipment.write');
  return (
    <div>
      <PageHeader
        title="Novo equipamento"
        description="Cadastre a frota, capacidades e valores de locação."
        crumbs={[
          { href: '/admin', label: 'Painel' },
          { href: '/admin/equipamentos', label: 'Equipamentos' },
          { label: 'Novo' },
        ]}
      />
      <EquipmentForm />
    </div>
  );
}
