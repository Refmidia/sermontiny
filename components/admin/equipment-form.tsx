'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveEquipment } from '@/app/actions/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormActions } from '@/components/admin/form-actions';
import { FormField, FormSection } from '@/components/admin/form-section';
import { EquipmentPhotoField } from '@/components/admin/equipment-photo-field';
import { ADMIN_SELECT_CLASS } from '@/lib/admin-ui';
import { formatBRLNumber } from '@/lib/money';
import type { Equipment } from '@/types/database';

export function EquipmentForm({
  equipment,
  photoUrl,
  canWrite = true,
}: {
  equipment?: Equipment;
  photoUrl?: string | null;
  canWrite?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await saveEquipment(formData);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setPending(false);
      return;
    }
    toast.success('Salvo com sucesso.');
    if (result && 'id' in result && result.id && !equipment) {
      router.push(`/admin/equipamentos/${result.id}`);
    } else {
      router.refresh();
    }
    setPending(false);
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {equipment && <input type="hidden" name="id" value={equipment.id} />}
      <FormSection title="Dados principais">
        <FormField label="Nome" required>
          <Input name="name" defaultValue={equipment?.name} required />
        </FormField>
        <FormField label="Marca">
          <Input name="brand" defaultValue={equipment?.brand ?? ''} />
        </FormField>
        <FormField label="Modelo">
          <Input name="model" defaultValue={equipment?.model ?? ''} />
        </FormField>
        <FormField label="Capacidade (t)">
          <Input name="capacity_tons" defaultValue={equipment?.capacity_tons ?? ''} />
        </FormField>
        <FormField label="Placa">
          <Input name="plate" defaultValue={equipment?.plate ?? ''} />
        </FormField>
        <FormField label="Ano">
          <Input name="year" defaultValue={equipment?.year ?? ''} />
        </FormField>
        <FormField label="Patrimônio">
          <Input name="asset_number" defaultValue={equipment?.asset_number ?? ''} />
        </FormField>
        <FormField label="Status">
          <select name="status" defaultValue={equipment?.status ?? 'available'} className={ADMIN_SELECT_CLASS}>
            <option value="available">Disponível</option>
            <option value="rented">Locado</option>
            <option value="maintenance">Manutenção</option>
            <option value="inactive">Inativo</option>
          </select>
        </FormField>
        <FormField
          label="Foto do equipamento"
          hint={equipment ? 'A foto aparece no painel e no site público.' : 'A foto será salva junto com o cadastro.'}
          className="md:col-span-2"
        >
          <EquipmentPhotoField
            equipmentId={equipment?.id}
            photoUrl={photoUrl}
            canWrite={canWrite}
            variant="field"
          />
        </FormField>
      </FormSection>
      <FormSection title="Valores">
        <FormField label="Diária (R$)">
          <Input name="daily_reais" defaultValue={equipment ? formatBRLNumber(equipment.daily_cents) : ''} />
        </FormField>
        <FormField label="Mensal (R$)">
          <Input name="monthly_reais" defaultValue={equipment ? formatBRLNumber(equipment.monthly_cents) : ''} />
        </FormField>
        <FormField label="Hora (R$)">
          <Input name="hourly_reais" defaultValue={equipment ? formatBRLNumber(equipment.hourly_cents) : ''} />
        </FormField>
        <FormField label="Quilômetro (R$)">
          <Input name="km_reais" defaultValue={equipment ? formatBRLNumber(equipment.km_cents) : ''} />
        </FormField>
        <FormField label="Mínimo de horas por diária">
          <Input name="min_hours_per_day" defaultValue={equipment?.min_hours_per_day ?? 10} />
        </FormField>
      </FormSection>
      <FormSection title="Informações técnicas">
        <FormField label="Descrição" className="md:col-span-2">
          <Textarea name="description" defaultValue={equipment?.description ?? ''} />
        </FormField>
        <FormField label="Características técnicas" className="md:col-span-2">
          <Textarea name="technical_features" defaultValue={equipment?.technical_features ?? ''} />
        </FormField>
        <FormField label="Observações" className="md:col-span-2">
          <Textarea name="notes" defaultValue={equipment?.notes ?? ''} />
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="available_for_quote" defaultChecked={equipment?.available_for_quote ?? true} />
          Disponível para orçamento
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="show_on_website" defaultChecked={equipment?.show_on_website ?? true} />
          Exibir no site público
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="show_availability_public" defaultChecked={equipment?.show_availability_public ?? false} />
          Exibir disponibilidade no site
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="name_needs_confirmation" defaultChecked={equipment?.name_needs_confirmation ?? false} />
          Nome provisório, confirmar antes de documentos finais
        </label>
      </FormSection>
      {error && <p className="text-sm text-danger">{error}</p>}
      <FormActions>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando...' : 'Salvar'}
        </Button>
      </FormActions>
    </form>
  );
}
