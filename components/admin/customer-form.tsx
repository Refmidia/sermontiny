'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCustomer } from '@/app/actions/customers';
import { lookupCepAction, lookupCnpjAction } from '@/app/actions/lookups';
import { fetchCep, fetchCnpj, isLookupError } from '@/lib/lookups/br-registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioCards } from '@/components/ui/radio-cards';
import { FormActions } from '@/components/admin/form-actions';
import { FormField, FormSection } from '@/components/admin/form-section';
import { formatCep, formatDocument, onlyDigits } from '@/lib/format';
import type { Customer, PersonType } from '@/types/database';

type Values = {
  person_type: PersonType;
  status: 'active' | 'inactive';
  legal_name: string;
  trade_name: string;
  document: string;
  state_registration: string;
  email: string;
  phone: string;
  whatsapp_ddi: string;
  whatsapp_number: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  notes: string;
};

export function CustomerForm({ customer }: { customer?: Customer }) {
  const [error, setError] = useState<string | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lookingCnpj, setLookingCnpj] = useState(false);
  const [lookingCep, setLookingCep] = useState(false);
  const lastCnpj = useRef('');
  const lastCep = useRef('');
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    person_type: customer?.person_type ?? 'pj',
    status: customer?.status ?? 'active',
    legal_name: customer?.legal_name ?? '',
    trade_name: customer?.trade_name ?? '',
    document: customer?.document ?? '',
    state_registration: customer?.state_registration ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    whatsapp_ddi: customer?.whatsapp_ddi ?? '55',
    whatsapp_number: customer?.whatsapp_number ?? '',
    zip: customer?.zip ?? '',
    street: customer?.street ?? '',
    number: customer?.number ?? '',
    complement: customer?.complement ?? '',
    district: customer?.district ?? '',
    city: customer?.city ?? '',
    state: customer?.state ?? '',
    notes: customer?.notes ?? '',
  });

  function patch(next: Partial<Values>) {
    setValues((current) => ({ ...current, ...next }));
  }

  async function lookupCnpj(digits: string) {
    try {
      const local = await fetchCnpj(digits);
      if (!isLookupError(local)) return local;
    } catch {
      // Cai na action do servidor.
    }
    try {
      return await lookupCnpjAction(digits);
    } catch {
      return { error: 'Não foi possível consultar o CNPJ agora.' };
    }
  }

  async function lookupCep(digits: string) {
    try {
      const local = await fetchCep(digits);
      if (!isLookupError(local)) return local;
    } catch {
      // Cai na action do servidor.
    }
    try {
      return await lookupCepAction(digits);
    } catch {
      return { error: 'Não foi possível consultar o CEP agora.' };
    }
  }

  async function fillFromCnpj(raw: string) {
    const digits = onlyDigits(raw);
    if (digits.length !== 14 || digits === lastCnpj.current || lookingCnpj) return;
    lastCnpj.current = digits;
    setLookingCnpj(true);
    setLookupMessage('Consultando CNPJ...');
    setError(null);
    const result = await lookupCnpj(digits);
    setLookingCnpj(false);
    if (isLookupError(result)) {
      lastCnpj.current = '';
      setLookupMessage(null);
      setError(result.error);
      return;
    }
    setValues((current) => ({
      ...current,
      person_type: 'pj',
      document: result.document,
      legal_name: result.legalName,
      trade_name: result.tradeName,
      email: result.email || current.email,
      phone: result.phone || current.phone,
      zip: result.zip || current.zip,
      street: result.street || current.street,
      number: result.number || current.number,
      complement: result.complement || current.complement,
      district: result.district || current.district,
      city: result.city || current.city,
      state: result.state || current.state,
    }));
    if (onlyDigits(result.zip).length === 8) lastCep.current = onlyDigits(result.zip);
    setLookupMessage('Dados do CNPJ preenchidos. Confira e complete o que faltar.');
  }

  async function fillFromCep(raw: string) {
    const digits = onlyDigits(raw);
    if (digits.length !== 8 || digits === lastCep.current || lookingCep) return;
    lastCep.current = digits;
    setLookingCep(true);
    setLookupMessage('Consultando CEP...');
    setError(null);
    const result = await lookupCep(digits);
    setLookingCep(false);
    if (isLookupError(result)) {
      lastCep.current = '';
      setLookupMessage(null);
      setError(result.error);
      return;
    }
    setValues((current) => ({
      ...current,
      zip: result.zip,
      street: result.street || current.street,
      complement: result.complement || current.complement,
      district: result.district,
      city: result.city,
      state: result.state,
    }));
    setLookupMessage('Endereço preenchido pelo CEP. Informe o número se precisar.');
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await saveCustomer(formData);
    if (result?.error) setError(result.error);
    setPending(false);
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {customer && <input type="hidden" name="id" value={customer.id} />}
      <FormSection title="Dados principais">
        <FormField label="Tipo" required className="md:col-span-2">
          <input type="hidden" name="person_type" value={values.person_type} />
          <RadioCards
            value={values.person_type}
            onChange={(person_type) =>
              patch({
                person_type: person_type as PersonType,
                document: formatDocument(values.document, person_type as PersonType),
              })
            }
            options={[
              { value: 'pj', label: 'Pessoa jurídica', description: 'CNPJ e razão social.' },
              { value: 'pf', label: 'Pessoa física', description: 'CPF e nome completo.' },
            ]}
          />
        </FormField>
        <FormField label="Status" className="md:col-span-2">
          <input type="hidden" name="status" value={values.status} />
          <RadioCards
            value={values.status}
            onChange={(status) => patch({ status: status as 'active' | 'inactive' })}
            options={[
              { value: 'active', label: 'Ativo', description: 'Cliente disponível para orçamentos.' },
              { value: 'inactive', label: 'Inativo', description: 'Mantém o cadastro sem uso operacional.' },
            ]}
          />
        </FormField>
        <FormField label="Razão social / Nome" required>
          <Input
            name="legal_name"
            value={values.legal_name}
            onChange={(event) => patch({ legal_name: event.target.value })}
            required
          />
        </FormField>
        <FormField label="Nome fantasia">
          <Input
            name="trade_name"
            value={values.trade_name}
            onChange={(event) => patch({ trade_name: event.target.value })}
          />
        </FormField>
        <FormField
          label="CNPJ / CPF"
          required
          hint={
            lookingCnpj
              ? 'Consultando CNPJ...'
              : 'Digite o CNPJ completo para preencher automaticamente razão social, endereço e contato.'
          }
        >
          <div className="flex gap-2">
            <Input
              name="document"
              value={values.document}
              inputMode="numeric"
              autoComplete="off"
              required
              onChange={(event) => {
                const next = formatDocument(event.target.value, values.person_type);
                patch({ document: next });
                if (values.person_type === 'pj' && onlyDigits(next).length === 14) {
                  void fillFromCnpj(next);
                }
              }}
              onBlur={(event) => {
                if (values.person_type === 'pj') void fillFromCnpj(event.target.value);
              }}
            />
            {values.person_type === 'pj' && (
              <Button
                type="button"
                variant="outline"
                disabled={lookingCnpj || onlyDigits(values.document).length !== 14}
                onClick={() => {
                  lastCnpj.current = '';
                  void fillFromCnpj(values.document);
                }}
              >
                {lookingCnpj ? 'Buscando...' : 'Buscar'}
              </Button>
            )}
          </div>
        </FormField>
        <FormField label="Inscrição estadual">
          <Input
            name="state_registration"
            value={values.state_registration}
            onChange={(event) => patch({ state_registration: event.target.value })}
          />
        </FormField>
      </FormSection>
      <FormSection title="Contatos">
        <FormField label="E-mail">
          <Input
            type="email"
            name="email"
            value={values.email}
            onChange={(event) => patch({ email: event.target.value })}
          />
        </FormField>
        <FormField label="Telefone">
          <Input name="phone" value={values.phone} onChange={(event) => patch({ phone: event.target.value })} />
        </FormField>
        <FormField label="DDI WhatsApp">
          <Input
            name="whatsapp_ddi"
            value={values.whatsapp_ddi}
            onChange={(event) => patch({ whatsapp_ddi: event.target.value })}
          />
        </FormField>
        <FormField label="WhatsApp">
          <Input
            name="whatsapp_number"
            value={values.whatsapp_number}
            onChange={(event) => patch({ whatsapp_number: event.target.value })}
          />
        </FormField>
      </FormSection>
      <FormSection title="Endereço">
        <FormField
          label="CEP"
          hint={lookingCep ? 'Consultando CEP...' : 'Digite o CEP completo para preencher rua, bairro, cidade e estado.'}
        >
          <div className="flex gap-2">
            <Input
              name="zip"
              value={values.zip}
              inputMode="numeric"
              autoComplete="postal-code"
              onChange={(event) => {
                const next = formatCep(event.target.value);
                patch({ zip: next });
                if (onlyDigits(next).length === 8) void fillFromCep(next);
              }}
              onBlur={(event) => void fillFromCep(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={lookingCep || onlyDigits(values.zip).length !== 8}
              onClick={() => {
                lastCep.current = '';
                void fillFromCep(values.zip);
              }}
            >
              {lookingCep ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </FormField>
        <FormField label="Endereço">
          <Input name="street" value={values.street} onChange={(event) => patch({ street: event.target.value })} />
        </FormField>
        <FormField label="Número">
          <Input name="number" value={values.number} onChange={(event) => patch({ number: event.target.value })} />
        </FormField>
        <FormField label="Complemento">
          <Input
            name="complement"
            value={values.complement}
            onChange={(event) => patch({ complement: event.target.value })}
          />
        </FormField>
        <FormField label="Bairro">
          <Input name="district" value={values.district} onChange={(event) => patch({ district: event.target.value })} />
        </FormField>
        <FormField label="Cidade">
          <Input name="city" value={values.city} onChange={(event) => patch({ city: event.target.value })} />
        </FormField>
        <FormField label="Estado">
          <Input
            name="state"
            maxLength={2}
            value={values.state}
            onChange={(event) => patch({ state: event.target.value.toUpperCase() })}
          />
        </FormField>
      </FormSection>
      <FormSection title="Observações">
        <FormField label="Observações" className="md:col-span-2">
          <Textarea name="notes" value={values.notes} onChange={(event) => patch({ notes: event.target.value })} />
        </FormField>
      </FormSection>
      {lookupMessage && <p className="text-sm text-steel">{lookupMessage}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <FormActions>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || lookingCnpj || lookingCep}>
          {pending ? 'Salvando...' : 'Salvar'}
        </Button>
      </FormActions>
    </form>
  );
}
