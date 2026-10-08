import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/db/server';
import { ContractsBoard, type ContractBoardRow } from '@/components/admin/contracts-board';

export const dynamic = 'force-dynamic';

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requirePermission('contracts.read');
  const { q } = await searchParams;
  const canWrite = user.permissions.includes('contracts.write');
  const canDelete = user.permissions.includes('contracts.delete');
  const db = await createClient();

  let data: ContractBoardRow[] = [];
  try {
    const result = await db
      .from('contracts')
      .select(
        `
        id, number, object, status, total_cents, starts_on, ends_on, signed_at, created_at, quote_id,
        customers(id, legal_name, phone, whatsapp_ddi, whatsapp_number),
        quotes(id, number)
      `,
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    data = (result.data ?? []) as ContractBoardRow[];
  } catch {
    data = [];
  }

  return <ContractsBoard data={data} canWrite={canWrite} canDelete={canDelete} initialQuery={q ?? ''} />;
}
