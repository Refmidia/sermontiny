import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { QuoteForm } from '@/components/admin/quote-form';
import { ContentCard } from '@/components/admin/content-card';
import { QuoteStatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { changeQuoteStatus, createQuoteVersion, duplicateQuote } from '@/app/actions/quotes';
import { convertQuoteToContract } from '@/app/actions/contracts';
import { sendQuoteWhatsApp } from '@/app/actions/documents';
import { QuoteDocumentActions } from '@/components/admin/quote-document-actions';
import { formatBRL, formatBRLNumber } from '@/lib/money';
import { QUOTE_STATUS_LABELS, type Equipment, type QuoteStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('quotes.read');
  const { id } = await params;
  const supabase = await createClient();
  const { data: quote } = await supabase.from('quotes').select('*').eq('id', id).maybeSingle();
  if (!quote) notFound();
  const [{ data: version }, { data: versions }, { data: customers }, { data: units }, { data: contacts }, { data: equipment }, { data: documents }] =
    await Promise.all([
      supabase.from('quote_versions').select('*').eq('id', quote.current_version_id).maybeSingle(),
      supabase.from('quote_versions').select('id, version_number, status, total_cents, created_at').eq('quote_id', id).order('version_number'),
      supabase.from('customers').select('id, legal_name, email').is('deleted_at', null),
      supabase.from('customer_units').select('id, customer_id, name').is('deleted_at', null),
      supabase.from('customer_contacts').select('id, customer_id, name').is('deleted_at', null),
      supabase.from('equipment').select('*').is('deleted_at', null),
      supabase.from('documents').select('id, file_name, access_token, created_at').eq('quote_id', id).order('created_at', { ascending: false }),
    ]);
  const { data: items } = version
    ? await supabase.from('quote_items').select('*').eq('quote_version_id', version.id).order('sort_order')
    : { data: [] };
  const previousVersion = (versions ?? []).filter((row) => row.id !== quote.current_version_id).at(-1);
  const { data: previousItems } = previousVersion
    ? await supabase
        .from('quote_items')
        .select('description, quantity, subtotal_cents')
        .eq('quote_version_id', previousVersion.id)
        .order('sort_order')
    : { data: [] };

  async function setStatus(status: QuoteStatus): Promise<void> {
    'use server';
    await changeQuoteStatus(id, status);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${quote.number} · ${quote.title}`}
        description={`Status atual: ${QUOTE_STATUS_LABELS[quote.status as QuoteStatus]}`}
        crumbs={[
          { href: '/admin', label: 'Painel' },
          { href: '/admin/orcamentos', label: 'Orçamentos' },
          { label: quote.number },
        ]}
        actions={<QuoteStatusBadge status={quote.status as QuoteStatus} />}
      />
      <ContentCard title="Ações do orçamento">
        <div className="flex flex-wrap gap-2">
          <form action={setStatus.bind(null, 'in_review')}>
            <Button variant="outline">Em revisão</Button>
          </form>
          <form action={setStatus.bind(null, 'sent')}>
            <Button variant="outline">Marcar enviado</Button>
          </form>
          <form action={setStatus.bind(null, 'approved')}>
            <Button variant="gold">Aprovar</Button>
          </form>
          <form action={setStatus.bind(null, 'rejected')}>
            <Button variant="destructive">Reprovar</Button>
          </form>
          <form
            action={async () => {
              'use server';
              await createQuoteVersion(id);
            }}
          >
            <Button variant="outline">Nova versão</Button>
          </form>
          <form
            action={async () => {
              'use server';
              await duplicateQuote(id);
            }}
          >
            <Button variant="outline">Duplicar</Button>
          </form>
          <form
            action={async () => {
              'use server';
              await convertQuoteToContract(id);
            }}
          >
            <Button>Converter em contrato</Button>
          </form>
        </div>
      </ContentCard>
      <div className="grid gap-4 xl:grid-cols-2">
        <ContentCard title="Imprimir e enviar ao cliente">
          <QuoteDocumentActions
            quoteId={id}
            quoteNumber={quote.number}
            customerEmail={(customers ?? []).find((row) => row.id === quote.customer_id)?.email}
            sendWhatsApp={async (to) => {
              'use server';
              return sendQuoteWhatsApp(id, to);
            }}
          />
          <p className="mt-3 text-[13px] text-muted">
            Imprimir abre a proposta para papel ou “salvar como PDF”. O botão de PDF gera o arquivo oficial. O
            WhatsApp envia a mensagem com o link do documento.
          </p>
        </ContentCard>
        <ContentCard title="PDFs gerados">
          <div className="space-y-2 text-sm">
            {(documents ?? []).length === 0 && <p className="text-muted">Nenhum PDF gerado ainda.</p>}
            {(documents ?? []).map((doc) => (
              <p key={doc.id}>
                {doc.access_token ? (
                  <a className="underline" href={`/d/${doc.access_token}`} target="_blank" rel="noreferrer">
                    {doc.file_name}
                  </a>
                ) : (
                  doc.file_name
                )}
              </p>
            ))}
          </div>
        </ContentCard>
      </div>
      <ContentCard title="Versões">
        <div className="space-y-2 text-sm">
          {(versions ?? []).map((row) => (
            <p key={row.id}>
              V{row.version_number} · {QUOTE_STATUS_LABELS[row.status as QuoteStatus]} · {formatBRL(row.total_cents)}
              {row.id === quote.current_version_id ? ' · atual' : ''}
            </p>
          ))}
          {previousVersion && (
            <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
              <div>
                <p className="font-medium text-navy">Anterior V{previousVersion.version_number}</p>
                {(previousItems ?? []).map((item, index) => (
                  <p key={`${item.description}-${index}`}>
                    {item.description} · {item.quantity} · {formatBRL(item.subtotal_cents)}
                  </p>
                ))}
                <p className="mt-2 font-semibold">{formatBRL(previousVersion.total_cents)}</p>
              </div>
              <div>
                <p className="font-medium text-navy">Atual V{version?.version_number}</p>
                {(items ?? []).map((item) => (
                  <p key={item.id}>
                    {item.description} · {item.quantity} · {formatBRL(item.subtotal_cents)}
                  </p>
                ))}
                <p className="mt-2 font-semibold">{formatBRL(version?.total_cents ?? 0)}</p>
              </div>
            </div>
          )}
        </div>
      </ContentCard>
      <QuoteForm
        customers={customers ?? []}
        units={units ?? []}
        contacts={contacts ?? []}
        equipment={(equipment ?? []) as Equipment[]}
        defaults={{
          id,
          customer_id: quote.customer_id,
          unit_id: quote.unit_id ?? '',
          contact_id: quote.contact_id ?? '',
          title: version?.title ?? quote.title,
          description: version?.description ?? '',
          scope: version?.scope ?? '',
          activity_code: version?.activity_code ?? '',
          issued_at: version?.issued_at,
          valid_until: version?.valid_until ?? '',
          start_date: version?.start_date ?? '',
          end_date: version?.end_date ?? '',
          payment_terms: version?.payment_terms ?? '',
          payment_deadline: version?.payment_deadline ?? '',
          internal_notes: version?.internal_notes ?? '',
          customer_notes: version?.customer_notes ?? '',
          discount_reais: version ? formatBRLNumber(version.discount_cents) : '0,00',
          surcharge_reais: version ? formatBRLNumber(version.surcharge_cents) : '0,00',
          tax_reais: version ? formatBRLNumber(version.tax_cents) : '0,00',
          locked: version?.locked,
          items: (items ?? []).map((item) => ({
            equipment_id: item.equipment_id ?? '',
            kind: item.kind,
            additional_code: item.additional_code ?? '',
            description: item.description,
            unit: item.unit,
            quantity: String(item.quantity).replace('.', ','),
            unit_price_reais: formatBRLNumber(item.unit_price_cents),
            discount_reais: formatBRLNumber(item.discount_cents),
            surcharge_reais: formatBRLNumber(item.surcharge_cents),
            monthly_reais: '0,00',
          })),
        }}
      />
    </div>
  );
}
