import { requirePermission } from '@/lib/auth/session';
import { PageHeader } from '@/components/admin/page-header';
import { CustomerForm } from '@/components/admin/customer-form';

export default async function NewCustomerPage() {
  await requirePermission('customers.write');
  return (
    <div>
      <PageHeader
        title="Novo cliente"
        description="Cadastre os dados comerciais e o endereço do cliente."
        crumbs={[
          { href: '/admin', label: 'Painel' },
          { href: '/admin/clientes', label: 'Clientes' },
          { label: 'Novo' },
        ]}
      />
      <CustomerForm />
    </div>
  );
}
