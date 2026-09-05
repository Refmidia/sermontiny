'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveQuote } from '@/app/actions/quotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormActions } from '@/components/admin/form-actions';
import { FormField, FormSection } from '@/components/admin/form-section';
import { ContentCard } from '@/components/admin/content-card';
import { ADMIN_SELECT_CLASS } from '@/lib/admin-ui';
import { calculateQuoteTotals, formatBRL, parseBRLInput, shouldRecommendMonthlyRate } from '@/lib/money';
import { centsToExtenso } from '@/lib/extenso';
import { ADDITIONAL_ITEMS, UNIT_LABELS, type Equipment, type QuoteItemUnit } from '@/types/database';
import { cn } from '@/lib/utils';

type CustomerOption = { id: string; legal_name: string };
type UnitOption = { id: string; customer_id: string; name: string };
type ContactOption = { id: string; customer_id: string; name: string };
type ItemState = {
  equipment_id: string;
  kind: 'equipment' | 'service' | 'additional';
  additional_code: string;
  description: string;
  unit: QuoteItemUnit;
  quantity: string;
  unit_price_reais: string;
  discount_reais: string;
  surcharge_reais: string;
  monthly_reais: string;
};

const emptyItem = (): ItemState => ({
  equipment_id: '',
  kind: 'equipment',
  additional_code: '',
  description: '',
  unit: 'daily',
  quantity: '1',
  unit_price_reais: '0,00',
  discount_reais: '0,00',
  surcharge_reais: '0,00',
  monthly_reais: '0,00',
});

const STEPS = [
  'Cliente e unidade',
  'Escopo',
  'Equipamentos e serviços',
  'Valores adicionais',
  'Condições comerciais',
  'Revisão e PDF',
];

export function QuoteForm({
  customers,
  units,
  contacts,
  equipment,
  defaults,
}: {
  customers: CustomerOption[];
  units: UnitOption[];
  contacts: ContactOption[];
  equipment: Equipment[];
  defaults?: {
    id?: string;
    customer_id?: string;
    unit_id?: string;
    contact_id?: string;
    title?: string;
    description?: string;
    scope?: string;
    activity_code?: string;
    issued_at?: string;
    valid_until?: string;
    start_date?: string;
    end_date?: string;
    payment_terms?: string;
    payment_deadline?: string;
    internal_notes?: string;
    customer_notes?: string;
    discount_reais?: string;
    surcharge_reais?: string;
    tax_reais?: string;
    items?: ItemState[];
    locked?: boolean;
  };
}) {
  const [customerId, setCustomerId] = useState(defaults?.customer_id ?? '');
  const [items, setItems] = useState<ItemState[]>(defaults?.items?.length ? defaults.items : [emptyItem()]);
  const [discount, setDiscount] = useState(defaults?.discount_reais ?? '0,00');
  const [surcharge, setSurcharge] = useState(defaults?.surcharge_reais ?? '0,00');
  const [tax, setTax] = useState(defaults?.tax_reais ?? '0,00');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const totals = useMemo(() => {
    return calculateQuoteTotals(
      items.map((item) => ({
        quantity: Number(item.quantity.replace(',', '.')) || 0,
        unitPriceCents: parseBRLInput(item.unit_price_reais),
        discountCents: parseBRLInput(item.discount_reais),
        surchargeCents: parseBRLInput(item.surcharge_reais),
      })),
      parseBRLInput(discount),
      parseBRLInput(surcharge),
      parseBRLInput(tax),
    );
  }, [items, discount, surcharge, tax]);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set('items_json', JSON.stringify(items));
    const result = await saveQuote(formData);
    if (result?.error) setError(result.error);
    setPending(false);
  }

  return (
    <form action={onSubmit} className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
      <div className="min-w-0 space-y-4">
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <span className="text-[13px] font-medium text-navy">{step}</span>
            </li>
          ))}
        </ol>

        <FormSection title="1. Cliente e unidade">
          <FormField label="Cliente" required>
            <select
              name="customer_id"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className={ADMIN_SELECT_CLASS}
              required
            >
              <option value="">Selecione</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.legal_name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Unidade">
            <select name="unit_id" defaultValue={defaults?.unit_id ?? ''} className={ADMIN_SELECT_CLASS}>
              <option value="">Não informada</option>
              {units
                .filter((unit) => unit.customer_id === customerId)
                .map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Contato">
            <select name="contact_id" defaultValue={defaults?.contact_id ?? ''} className={ADMIN_SELECT_CLASS}>
              <option value="">Não informado</option>
              {contacts
                .filter((contact) => contact.customer_id === customerId)
                .map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Título" required>
            <Input name="title" defaultValue={defaults?.title} required />
          </FormField>
        </FormSection>

        <FormSection title="2. Escopo">
          <FormField label="Emissão">
            <Input type="date" name="issued_at" defaultValue={defaults?.issued_at ?? new Date().toISOString().slice(0, 10)} />
          </FormField>
          <FormField label="Validade">
            <Input type="date" name="valid_until" defaultValue={defaults?.valid_until ?? ''} />
          </FormField>
          <FormField label="Início">
            <Input type="date" name="start_date" defaultValue={defaults?.start_date ?? ''} />
          </FormField>
          <FormField label="Término">
            <Input type="date" name="end_date" defaultValue={defaults?.end_date ?? ''} />
          </FormField>
          <FormField label="Código de atividade">
            <Input name="activity_code" defaultValue={defaults?.activity_code ?? ''} />
          </FormField>
          <FormField label="Escopo" className="md:col-span-2">
            <Textarea name="scope" defaultValue={defaults?.scope ?? ''} />
          </FormField>
        </FormSection>

        <FormSection title="3. Equipamentos e serviços">
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => setItems((current) => [...current, emptyItem()])}>
              Item
            </Button>
            <select
              className={cn(ADMIN_SELECT_CLASS, 'w-auto min-w-48')}
              onChange={(event) => {
                const extra = ADDITIONAL_ITEMS.find((item) => item.code === event.target.value);
                if (!extra) return;
                setItems((current) => [
                  ...current,
                  {
                    ...emptyItem(),
                    kind: 'additional',
                    additional_code: extra.code,
                    description: extra.label,
                    unit: extra.unit,
                  },
                ]);
                event.target.value = '';
              }}
            >
              <option value="">Adicional</option>
              {ADDITIONAL_ITEMS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-4 md:col-span-2">
            {items.map((item, index) => {
              const qty = Number(item.quantity.replace(',', '.')) || 0;
              const recommend =
                item.unit === 'daily' &&
                shouldRecommendMonthlyRate(parseBRLInput(item.unit_price_reais), parseBRLInput(item.monthly_reais), qty);
              return (
                <div key={index} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-6">
                  <select
                    className={cn(ADMIN_SELECT_CLASS, 'md:col-span-2')}
                    value={item.equipment_id}
                    onChange={(event) => {
                      const selected = equipment.find((row) => row.id === event.target.value);
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index
                            ? {
                                ...row,
                                equipment_id: event.target.value,
                                description: selected?.name ?? row.description,
                                unit_price_reais: selected
                                  ? (selected.daily_cents / 100).toFixed(2).replace('.', ',')
                                  : row.unit_price_reais,
                                monthly_reais: selected
                                  ? (selected.monthly_cents / 100).toFixed(2).replace('.', ',')
                                  : row.monthly_reais,
                              }
                            : row,
                        ),
                      );
                    }}
                  >
                    <option value="">Equipamento / serviço</option>
                    {equipment.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={item.description}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, description: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Descrição"
                    className="md:col-span-2"
                  />
                  <select
                    className={ADMIN_SELECT_CLASS}
                    value={item.unit}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, unit: event.target.value as QuoteItemUnit } : row,
                        ),
                      )
                    }
                  >
                    {Object.entries(UNIT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={item.quantity}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, quantity: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Qtde"
                  />
                  <Input
                    value={item.unit_price_reais}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, unit_price_reais: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Unitário"
                  />
                  <Input
                    value={item.discount_reais}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, discount_reais: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Desconto"
                  />
                  <Input
                    value={item.surcharge_reais}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, surcharge_reais: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Acréscimo"
                  />
                  <Button type="button" variant="outline" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>
                    Remover
                  </Button>
                  {recommend && (
                    <p className="text-sm text-warning md:col-span-6">
                      A quantidade de diárias supera o ponto em que o valor mensal fica mais econômico. O usuário pode
                      manter a diária ou alterar para mensal.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </FormSection>

        <FormSection title="4. Valores adicionais">
          <FormField label="Desconto geral">
            <Input name="discount_reais" value={discount} onChange={(event) => setDiscount(event.target.value)} />
          </FormField>
          <FormField label="Acréscimo geral">
            <Input name="surcharge_reais" value={surcharge} onChange={(event) => setSurcharge(event.target.value)} />
          </FormField>
          <FormField label="Impostos">
            <Input name="tax_reais" value={tax} onChange={(event) => setTax(event.target.value)} />
          </FormField>
        </FormSection>

        <FormSection title="5. Condições comerciais">
          <FormField label="Prazo de pagamento">
            <Input name="payment_deadline" defaultValue={defaults?.payment_deadline ?? ''} />
          </FormField>
          <FormField label="Condições de pagamento" className="md:col-span-2">
            <Textarea name="payment_terms" defaultValue={defaults?.payment_terms ?? ''} />
          </FormField>
          <FormField label="Observações internas">
            <Textarea name="internal_notes" defaultValue={defaults?.internal_notes ?? ''} />
          </FormField>
          <FormField label="Observações ao cliente">
            <Textarea name="customer_notes" defaultValue={defaults?.customer_notes ?? ''} />
          </FormField>
        </FormSection>

        <FormSection title="6. Revisão e PDF">
          <p className="text-sm text-muted md:col-span-2">
            Revise os valores ao lado. Depois de salvar, use as ações da página para gerar PDF, enviar por WhatsApp ou
            converter em contrato.
          </p>
        </FormSection>

        {error && <p className="text-sm text-danger">{error}</p>}
        <FormActions>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={defaults?.locked || pending}>
            {defaults?.locked ? 'Versão bloqueada' : pending ? 'Salvando...' : 'Salvar'}
          </Button>
        </FormActions>
      </div>

      <aside className="xl:sticky xl:top-24">
        <ContentCard title="Resumo financeiro">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-navy">{formatBRL(totals.itemsSubtotalCents)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Descontos</dt>
              <dd className="font-medium text-navy">{formatBRL(parseBRLInput(discount))}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Acréscimos</dt>
              <dd className="font-medium text-navy">{formatBRL(parseBRLInput(surcharge))}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Impostos</dt>
              <dd className="font-medium text-navy">{formatBRL(parseBRLInput(tax))}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border pt-3">
              <dt className="font-semibold text-navy">Total</dt>
              <dd className="text-lg font-bold text-navy">{formatBRL(totals.totalCents)}</dd>
            </div>
            <p className="text-[12px] text-muted capitalize">{centsToExtenso(totals.totalCents)}</p>
          </dl>
        </ContentCard>
      </aside>
    </form>
  );
}
