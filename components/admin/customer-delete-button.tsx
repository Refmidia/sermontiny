'use client';

import { useRouter } from 'next/navigation';
import { softDeleteCustomer } from '@/app/actions/customers';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

export function CustomerDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      triggerLabel="Excluir"
      title="Excluir cliente"
      description="O cliente será removido do painel. Esta ação é reversível apenas no banco."
      confirmLabel="Excluir cliente"
      destructive
      onConfirm={async () => {
        const result = await softDeleteCustomer(id);
        if (result && 'error' in result && result.error) {
          throw new Error(result.error);
        }
        router.push('/admin/clientes');
        router.refresh();
      }}
    />
  );
}
