import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { ContractForm } from '@/components/admin/contract-form';
import { Button } from '@/components/ui/button';
import { ContentCard } from '@/components/admin/content-card';
import { DetailTabs } from '@/components/admin/detail-tabs';
import { ContractStatusBadge } from '@/components/admin/status-badge';
import { attachSignedContract, changeContractStatus } from '@/app/actions/contracts';
import { generateContractPdf, sendContractWhatsApp } from '@/app/actions/documents';
import { WhatsAppSendForm } from '@/components/admin/whatsapp-send-form';
import { formatBRL } from '@/lib/money';
import { formatDateTimeBr } from '@/lib/format';
import { CONTRACT_STATUS_LABELS, type ContractStatus, type ResponsibilityParty } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('contracts.read');
  const { id } = await params;
  const supabase = await createClient();
  const { data: contract } = await supabase.from('contracts').select('*').eq('id', id).maybeSingle();
  if (!contract) notFound();
  const [{ data: clauses }, { data: documents }, { data: audit }, { data: messages }] = await Promise.all([
    supabase.from('contract_clauses').select('*').eq('contract_version_id', contract.current_version_id).order('sort_order'),
    supabase.from('documents').select('*').eq('contract_id', id),
    supabase.from('audit_logs').select('id, action, created_at, metadata').eq('entity', 'contracts').eq('entity_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('whatsapp_messages').select('id, to_number, status, created_at').eq('contract_id', id).order('created_at', { ascending: false }).limit(20),
  ]);

  const pdfDocs = (documents ?? []).filter((doc) => doc.kind === 'contract_pdf' || doc.access_token);
  const latestPdf = pdfDocs[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={contract.number}
        description={contract.object}
        crumbs={[
          { href: '/admin', label: 'Painel' },
          { href: '/admin/contratos', label: 'Contratos' },
          { label: contract.number },
        ]}
        actions={<ContractStatusBadge status={contract.status as ContractStatus} />}
      />
      <ContentCard title="Ações do contrato">
        <div className="flex flex-wrap gap-2">
          <form action={async () => { 'use server'; await changeContractStatus(id, 'in_review'); }}>
            <Button variant="outline">Em revisão</Button>
          </form>
          <form action={async () => { 'use server'; await changeContractStatus(id, 'sent'); }}>
            <Button variant="outline">Enviado</Button>
          </form>
          <form action={async () => { 'use server'; await changeContractStatus(id, 'awaiting_signature'); }}>
            <Button variant="outline">Aguardando assinatura</Button>
          </form>
          <form action={async () => { 'use server'; await changeContractStatus(id, 'signed'); }}>
            <Button variant="gold">Assinado</Button>
          </form>
          <form action={async () => { 'use server'; await changeContractStatus(id, 'active'); }}>
            <Button>Ativo</Button>
          </form>
          <form action={async () => { 'use server'; await generateContractPdf(id); }}>
            <Button variant="outline">Gerar PDF</Button>
          </form>
          {latestPdf?.access_token && (
            <>
              <Button asChild variant="outline">
                <a href={`/d/${latestPdf.access_token}`} target="_blank" rel="noreferrer">
                  Visualizar PDF
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`/d/${latestPdf.access_token}`} download>
                  Baixar PDF
                </a>
              </Button>
            </>
          )}
        </div>
      </ContentCard>
      <DetailTabs
        items={[
          {
            value: 'resumo',
            label: 'Resumo',
            content: (
              <ContentCard title="Resumo">
                <dl className="grid gap-3 text-sm md:grid-cols-2">
                  <div><dt className="text-muted">Status</dt><dd>{CONTRACT_STATUS_LABELS[contract.status as ContractStatus]}</dd></div>
                  <div><dt className="text-muted">Valor</dt><dd className="font-semibold text-navy">{formatBRL(contract.total_cents)}</dd></div>
                  <div><dt className="text-muted">Vigência</dt><dd>{[contract.starts_on, contract.ends_on].filter(Boolean).join(' — ') || '—'}</dd></div>
                  <div><dt className="text-muted">Assinatura</dt><dd>{contract.signed_at ?? 'Pendente'}</dd></div>
                </dl>
                <div className="mt-6">
                  <ContractForm
                    contractId={id}
                    customerId={contract.customer_id}
                    unitId={contract.unit_id}
                    quoteId={contract.quote_id}
                    object={contract.object}
                    scope={contract.scope}
                    startsOn={contract.starts_on}
                    endsOn={contract.ends_on}
                    billingMethod={contract.billing_method}
                    paymentDeadline={contract.payment_deadline}
                    notes={contract.notes}
                    parties={{
                      food_party: contract.food_party as ResponsibilityParty | null,
                      lodging_party: contract.lodging_party as ResponsibilityParty | null,
                      fuel_party: contract.fuel_party as ResponsibilityParty | null,
                      transport_party: contract.transport_party as ResponsibilityParty | null,
                      helper_party: contract.helper_party as ResponsibilityParty | null,
                      rigging_party: contract.rigging_party as ResponsibilityParty | null,
                    }}
                    clauses={clauses ?? []}
                  />
                </div>
              </ContentCard>
            ),
          },
          {
            value: 'clausulas',
            label: 'Cláusulas',
            content: (
              <ContentCard title="Cláusulas">
                <div className="space-y-3">
                  {(clauses ?? []).map((clause) => (
                    <article key={clause.id} className="rounded-xl border border-border p-4">
                      <h3 className="font-semibold text-navy">{clause.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{clause.body}</p>
                    </article>
                  ))}
                </div>
              </ContentCard>
            ),
          },
          {
            value: 'documentos',
            label: 'Documentos',
            content: (
              <ContentCard title="Documentos">
                <form
                  action={async (formData) => {
                    'use server';
                    await attachSignedContract(formData);
                  }}
                  className="mb-4 flex flex-wrap gap-2"
                >
                  <input type="hidden" name="contract_id" value={id} />
                  <input type="file" name="file" className="text-sm" required />
                  <Button type="submit" variant="outline">
                    Anexar assinado
                  </Button>
                </form>
                <div className="space-y-2 text-sm">
                  {(documents ?? []).map((doc) => (
                    <p key={doc.id}>
                      {doc.access_token ? (
                        <a href={`/d/${doc.access_token}`} className="underline" target="_blank" rel="noreferrer">
                          {doc.file_name}
                        </a>
                      ) : (
                        doc.file_name
                      )}
                    </p>
                  ))}
                </div>
              </ContentCard>
            ),
          },
          {
            value: 'historico',
            label: 'Histórico',
            content: (
              <ContentCard title="Histórico">
                {(audit ?? []).length === 0 ? (
                  <p className="text-sm text-muted">Ainda não há eventos deste contrato.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {(audit ?? []).map((row) => (
                      <p key={row.id} className="rounded-xl border border-border px-4 py-3">
                        {formatDateTimeBr(row.created_at)} · {row.action}
                      </p>
                    ))}
                  </div>
                )}
              </ContentCard>
            ),
          },
          {
            value: 'envios',
            label: 'Envios',
            content: (
              <ContentCard title="Envios por WhatsApp">
                <WhatsAppSendForm
                  action={async (to) => {
                    'use server';
                    return sendContractWhatsApp(id, to);
                  }}
                />
                <div className="mt-4 space-y-2 text-sm">
                  {(messages ?? []).map((message) => (
                    <p key={message.id} className="rounded-xl border border-border px-4 py-3">
                      {formatDateTimeBr(message.created_at)} · {message.to_number} · {message.status}
                    </p>
                  ))}
                </div>
              </ContentCard>
            ),
          },
        ]}
      />
    </div>
  );
}
