import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { QuoteForm } from '@/components/admin/quote-form';
import type { Equipment } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function NewQuotePage() {
  await requirePermission('quotes.write');
  const supabase = await createClient();
  const [{ data: customers }, { data: units }, { data: contacts }, { data: equipment }] = await Promise.all([
    supabase.from('customers').select('id, legal_name').is('deleted_at', null).order('legal_name'),
    supabase.from('customer_units').select('id, customer_id, name').is('deleted_at', null),
    supabase.from('customer_contacts').select('id, customer_id, name').is('deleted_at', null),
    supabase.from('equipment').select('*').is('deleted_at', null).eq('available_for_quote', true),
  ]);

  return (
    <div>
      <PageHeader
        title="Novo orçamento"
        description="Monte a proposta, calcule valores e revise antes de gerar o PDF."
        crumbs={[
          { href: '/admin', label: 'Painel' },
          { href: '/admin/orcamentos', label: 'Orçamentos' },
          { label: 'Novo' },
        ]}
      />
      <QuoteForm
        customers={customers ?? []}
        units={units ?? []}
        contacts={contacts ?? []}
        equipment={(equipment ?? []) as Equipment[]}
      />
    </div>
  );
}
