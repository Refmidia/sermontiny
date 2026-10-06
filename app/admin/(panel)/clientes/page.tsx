import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { CustomersBoard, type CustomerRow } from '@/components/admin/customers-board';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const user = await requirePermission('customers.read');
  const canWrite = user.permissions.includes('customers.write');
  const supabase = await createClient();

  let rows: CustomerRow[] = [];
  const withRelations = await supabase
    .from('customers')
    .select('*, customer_contacts(*), contracts(id, status, deleted_at)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (withRelations.error) {
    const fallback = await supabase
      .from('customers')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    rows = (fallback.data ?? []) as CustomerRow[];
  } else {
    rows = ((withRelations.data ?? []) as CustomerRow[]).map((customer) => ({
      ...customer,
      customer_contacts: (customer.customer_contacts ?? []).filter((contact) => !contact.deleted_at),
      contracts: (customer.contracts ?? []).filter((contract) => !contract.deleted_at),
    }));
  }

  return <CustomersBoard data={rows} canWrite={canWrite} canDelete={user.permissions.includes('customers.delete')} />;
}
