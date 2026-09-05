'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveContract } from '@/app/actions/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormActions } from '@/components/admin/form-actions';
import { FormField, FormSection } from '@/components/admin/form-section';
import { ADMIN_SELECT_CLASS } from '@/lib/admin-ui';
import { RESPONSIBILITY_LABELS, type ResponsibilityParty } from '@/types/database';

type Clause = { id: string; title: string; body: string; is_enabled: boolean };

export function ContractForm({
  contractId,
  customerId,
  unitId,
  quoteId,
  object,
  scope,
  startsOn,
  endsOn,
  billingMethod,
  paymentDeadline,
  notes,
  parties,
  clauses,
}: {
  contractId: string;
  customerId: string;
  unitId?: string | null;
  quoteId?: string | null;
  object: string;
  scope?: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  billingMethod?: string | null;
  paymentDeadline?: string | null;
  notes?: string | null;
  parties: {
    food_party: ResponsibilityParty | null;
    lodging_party: ResponsibilityParty | null;
    fuel_party: ResponsibilityParty | null;
    transport_party: ResponsibilityParty | null;
    helper_party: ResponsibilityParty | null;
    rigging_party: ResponsibilityParty | null;
  };
  clauses: Clause[];
}) {
  const [enabled, setEnabled] = useState<string[]>(clauses.filter((clause) => clause.is_enabled).map((clause) => clause.id));
  const [bodies, setBodies] = useState<Record<string, string>>(
    Object.fromEntries(clauses.map((clause) => [clause.id, clause.body])),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set('enabled_clauses', JSON.stringify(enabled));
    formData.set('clause_overrides', JSON.stringify(bodies));
    const result = await saveContract(formData);
    if (result && 'error' in result && result.error) setError(result.error);
    setPending(false);
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={contractId} />
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="unit_id" value={unitId ?? ''} />
      <input type="hidden" name="quote_id" value={quoteId ?? ''} />
      <FormSection title="Dados principais">
        <FormField label="Objeto" required>
          <Input name="object" defaultValue={object} required />
        </FormField>
        <FormField label="Início">
          <Input type="date" name="starts_on" defaultValue={startsOn ?? ''} />
        </FormField>
        <FormField label="Término">
          <Input type="date" name="ends_on" defaultValue={endsOn ?? ''} />
        </FormField>
        <FormField label="Prazo de pagamento">
          <Input name="payment_deadline" defaultValue={paymentDeadline ?? ''} />
        </FormField>
        <FormField label="Escopo" className="md:col-span-2">
          <Textarea name="scope" defaultValue={scope ?? ''} />
        </FormField>
        <FormField label="Forma de faturamento" className="md:col-span-2">
          <Textarea name="billing_method" defaultValue={billingMethod ?? ''} />
        </FormField>
      </FormSection>
      <FormSection title="Responsabilidades obrigatórias" description="Não há presunção automática. Defina a parte responsável em cada item.">
        {(
          [
            ['food_party', 'Alimentação', parties.food_party],
            ['lodging_party', 'Hospedagem', parties.lodging_party],
            ['fuel_party', 'Combustível', parties.fuel_party],
            ['transport_party', 'Transporte', parties.transport_party],
            ['helper_party', 'Ajudante', parties.helper_party],
            ['rigging_party', 'Plano de rigging', parties.rigging_party],
          ] as const
        ).map(([name, label, value]) => (
          <FormField key={name} label={label} required>
            <select name={name} defaultValue={value ?? ''} required className={ADMIN_SELECT_CLASS}>
              <option value="">Selecione</option>
              {Object.entries(RESPONSIBILITY_LABELS).map(([key, option]) => (
                <option key={key} value={key}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>
        ))}
      </FormSection>
      <FormSection title="Cláusulas">
        <div className="space-y-3 md:col-span-2">
          {clauses.map((clause) => (
            <div key={clause.id} className="rounded-xl border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-navy">
                <input
                  type="checkbox"
                  checked={enabled.includes(clause.id)}
                  onChange={(event) => {
                    setEnabled((current) =>
                      event.target.checked ? [...current, clause.id] : current.filter((id) => id !== clause.id),
                    );
                  }}
                />
                {clause.title}
              </label>
              <Textarea
                className="mt-2"
                value={bodies[clause.id]}
                onChange={(event) => setBodies((current) => ({ ...current, [clause.id]: event.target.value }))}
              />
            </div>
          ))}
        </div>
      </FormSection>
      <FormSection title="Observações">
        <FormField label="Observações" className="md:col-span-2">
          <Textarea name="notes" defaultValue={notes ?? ''} />
        </FormField>
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
