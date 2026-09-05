'use client';

import { softDeleteCustomer } from '@/app/actions/customers';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

export function CustomerDeleteButton({ id }: { id: string }) {
  return (
    <ConfirmDialog
      triggerLabel="Excluir"
      title="Excluir cliente"
      description="O cliente será removido do painel. Esta ação é reversível apenas no banco."
      confirmLabel="Excluir cliente"
      destructive
      onConfirm={async () => {
        await softDeleteCustomer(id);
      }}
    />
  );
}
