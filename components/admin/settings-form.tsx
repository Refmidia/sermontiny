'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveCompanySettings } from '@/app/actions/settings';
import { FormActions } from '@/components/admin/form-actions';
import { Button } from '@/components/ui/button';

export function SettingsForm({ children }: { children: React.ReactNode }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveCompanySettings(formData);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Configurações salvas.');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit}>
      {children}
      <FormActions className="mt-4">
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? 'Salvando...' : 'Salvar configurações'}
        </Button>
      </FormActions>
    </form>
  );
}
