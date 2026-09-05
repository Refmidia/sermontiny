import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { CustomerForm } from '@/components/admin/customer-form';
import { CustomerDeleteButton } from '@/components/admin/customer-delete-button';
import { DetailTabs } from '@/components/admin/detail-tabs';
import { ContentCard } from '@/components/admin/content-card';
import { EmptyState } from '@/components/admin/empty-state';
import { QuoteStatusBadge, ContractStatusBadge } from '@/components/admin/status-badge';
import { saveCustomerContact, saveCustomerUnit } from '@/app/actions/customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBRL } from '@/lib/money';
import type { ContractStatus, Customer, QuoteStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('customers.read');
  const { id } = await params;
  const supabase = await createClient();
  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).is('deleted_at', null).maybeSingle();
  if (!customer) notFound();
  const [{ data: units }, { data: contacts }, { data: quotes }, { data: contracts }, { data: documents }] =
    await Promise.all([
      supabase.from('customer_units').select('*').eq('customer_id', id).is('deleted_at', null),
      supabase.from('customer_contacts').select('*').eq('customer_id', id).is('deleted_at', null),
      supabase.from('quotes').select('id, number, title, status, quote_versions:current_version_id(total_cents)').eq('customer_id', id).is('deleted_at', null),
      supabase.from('contracts').select('id, number, object, status, total_cents').eq('customer_id', id).is('deleted_at', null),
      supabase.from('documents').select('id, file_name, kind, created_at').eq('customer_id', id).is('deleted_at', null),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.legal_name}
        description="Visão geral, unidades, contatos e documentos do cliente."
        crumbs={[
          { href: '/admin', label: 'Painel' },
          { href: '/admin/clientes', label: 'Clientes' },
          { label: customer.legal_name },
        ]}
        actions={<CustomerDeleteButton id={id} />}
      />
      <DetailTabs
        items={[
          {
            value: 'visao',
            label: 'Visão geral',
            content: <CustomerForm customer={customer as Customer} />,
          },
          {
            value: 'unidades',
            label: 'Unidades',
            content: (
              <ContentCard title="Unidades industriais">
                <div className="space-y-3">
                  {(units ?? []).length === 0 && <EmptyState title="Nenhuma unidade" text="Cadastre as plantas ou filiais deste cliente." />}
                  {(units ?? []).map((unit) => (
                    <div key={unit.id} className="rounded-xl border border-border px-4 py-3 text-sm">
                      <p className="font-medium text-navy">{unit.name}</p>
                      <p className="text-muted">
                        {unit.city}/{unit.state} · {unit.manager_name}
                      </p>
                    </div>
                  ))}
                </div>
                <form
                  action={async (formData) => {
                    'use server';
                    await saveCustomerUnit(formData);
                  }}
                  className="mt-5 grid gap-2 md:grid-cols-2"
                >
                  <input type="hidden" name="customer_id" value={id} />
                  <Input name="name" placeholder="Nome da unidade" required />
                  <Input name="internal_code" placeholder="Código interno" />
                  <Input name="city" placeholder="Cidade" />
                  <Input name="state" placeholder="UF" maxLength={2} />
                  <Input name="manager_name" placeholder="Responsável" />
                  <Input name="phone" placeholder="Telefone" />
                  <Input name="whatsapp" placeholder="WhatsApp" />
                  <Input name="email" placeholder="E-mail" />
                  <Button type="submit" variant="outline" className="md:col-span-2">
                    Adicionar unidade
                  </Button>
                </form>
              </ContentCard>
            ),
          },
          {
            value: 'contatos',
            label: 'Contatos',
            content: (
              <ContentCard title="Contatos">
                <div className="space-y-3">
                  {(contacts ?? []).length === 0 && <EmptyState title="Nenhum contato" text="Cadastre os responsáveis comerciais." />}
                  {(contacts ?? []).map((contact) => (
                    <div key={contact.id} className="rounded-xl border border-border px-4 py-3 text-sm">
                      <p className="font-medium text-navy">{contact.name}</p>
                      <p className="text-muted">{contact.email} · {contact.whatsapp}</p>
                    </div>
                  ))}
                </div>
                <form
                  action={async (formData) => {
                    'use server';
                    await saveCustomerContact(formData);
                  }}
                  className="mt-5 grid gap-2 md:grid-cols-2"
                >
                  <input type="hidden" name="customer_id" value={id} />
                  <Input name="name" placeholder="Nome" required />
                  <Input name="role" placeholder="Cargo" />
                  <Input name="email" placeholder="E-mail" />
                  <Input name="phone" placeholder="Telefone" />
                  <Input name="whatsapp" placeholder="WhatsApp" className="md:col-span-2" />
                  <Button type="submit" variant="outline" className="md:col-span-2">
                    Adicionar contato
                  </Button>
                </form>
              </ContentCard>
            ),
          },
          {
            value: 'orcamentos',
            label: 'Orçamentos',
            content: (
              <ContentCard title="Orçamentos relacionados">
                {(quotes ?? []).length === 0 ? (
                  <EmptyState title="Nenhum orçamento" text="Este cliente ainda não possui propostas." />
                ) : (
                  <div className="space-y-3">
                    {(quotes ?? []).map((quote) => {
                      const version = Array.isArray(quote.quote_versions) ? quote.quote_versions[0] : quote.quote_versions;
                      return (
                        <Link key={quote.id} href={`/admin/orcamentos/${quote.id}`} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                          <span>
                            <span className="font-medium text-navy">{quote.number}</span>
                            <span className="block text-muted">{quote.title}</span>
                          </span>
                          <span className="flex items-center gap-3">
                            <QuoteStatusBadge status={quote.status as QuoteStatus} />
                            {formatBRL(version?.total_cents ?? 0)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </ContentCard>
            ),
          },
          {
            value: 'contratos',
            label: 'Contratos',
            content: (
              <ContentCard title="Contratos relacionados">
                {(contracts ?? []).length === 0 ? (
                  <EmptyState title="Nenhum contrato" text="Os contratos convertidos deste cliente aparecerão aqui." />
                ) : (
                  <div className="space-y-3">
                    {(contracts ?? []).map((contract) => (
                      <Link key={contract.id} href={`/admin/contratos/${contract.id}`} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                        <span>
                          <span className="font-medium text-navy">{contract.number}</span>
                          <span className="block text-muted">{contract.object}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <ContractStatusBadge status={contract.status as ContractStatus} />
                          {formatBRL(contract.total_cents)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </ContentCard>
            ),
          },
          {
            value: 'documentos',
            label: 'Documentos',
            content: (
              <ContentCard title="Documentos">
                {(documents ?? []).length === 0 ? (
                  <EmptyState title="Nenhum documento" text="PDFs e anexos vinculados ao cliente aparecem nesta aba." />
                ) : (
                  <div className="space-y-2">
                    {(documents ?? []).map((doc) => (
                      <p key={doc.id} className="rounded-xl border border-border px-4 py-3 text-sm">
                        {doc.file_name}
                      </p>
                    ))}
                  </div>
                )}
              </ContentCard>
            ),
          },
        ]}
      />
    </div>
  );
}
