'use server';

import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCompanySettings } from '@/lib/data/company';
import { renderPdfBuffer } from '@/lib/pdf/render';
import { ContractPdf } from '@/lib/pdf/documents';
import { QuotePdf } from '@/lib/pdf/quote-pdf';
import { buildQuoteDocument, withQuotePix } from '@/lib/pdf/quote-document';
import { sendWhatsApp, applyTemplate } from '@/lib/whatsapp';
import { formatDateBr, toWhatsAppDigits } from '@/lib/format';
import { RESPONSIBILITY_LABELS, type ResponsibilityParty } from '@/types/database';

function publicDocumentUrl(token: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return `${origin}/d/${token}`;
}

export async function generateQuotePdf(quoteId: string, lockImmutable = false) {
  const user = await assertPermission('documents.write');
  const supabase = await createClient();
  const admin = createAdminClient();
  const settings = await getCompanySettings();
  const { data: quote } = await supabase
    .from('quotes')
    .select('*, customers(*), customer_units(*), quote_versions:current_version_id(*)')
    .eq('id', quoteId)
    .single();
  const version = Array.isArray(quote?.quote_versions) ? quote?.quote_versions[0] : quote?.quote_versions;
  const customer = Array.isArray(quote?.customers) ? quote?.customers[0] : quote?.customers;
  const unit = Array.isArray(quote?.customer_units) ? quote?.customer_units[0] : quote?.customer_units;
  if (!quote || !version || !customer) return { error: 'Orçamento incompleto.' };
  const { data: items } = await supabase.from('quote_items').select('*').eq('quote_version_id', version.id);

  const buffer = await renderPdfBuffer(
    QuotePdf(
      await withQuotePix(
        buildQuoteDocument({
          settings,
          number: quote.number,
          version,
          customer,
          unitName: unit?.name,
          items: items ?? [],
        }),
      ),
    ),
  );

  const token = crypto.randomUUID();
  const path = `quotes/${quote.number}-v${version.version_number}-${token}.pdf`;
  const { error: uploadError } = await admin.storage.from('documents').upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (uploadError) return { error: 'Falha ao gravar o PDF.' };

  const { data: document, error } = await admin
    .from('documents')
    .insert({
      kind: 'quote_pdf',
      customer_id: quote.customer_id,
      quote_id: quote.id,
      quote_version_id: version.id,
      storage_path: path,
      file_name: `${quote.number}-v${version.version_number}.pdf`,
      is_immutable: lockImmutable,
      access_token: token,
      token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: user.id,
    })
    .select('id, access_token')
    .single();
  if (error || !document) return { error: 'PDF gerado, mas não registrado.' };
  await writeAuditLog({ actorId: user.id, action: 'pdf_generate', entity: 'quotes', entityId: quoteId });
  revalidatePath(`/admin/orcamentos/${quoteId}`);
  return { ok: true as const, documentId: document.id, url: publicDocumentUrl(token) };
}

export async function generateContractPdf(contractId: string) {
  const user = await assertPermission('documents.write');
  const supabase = await createClient();
  const admin = createAdminClient();
  const settings = await getCompanySettings();
  const { data: contract } = await supabase
    .from('contracts')
    .select('*, customers(*), contract_versions:current_version_id(*)')
    .eq('id', contractId)
    .single();
  const version = Array.isArray(contract?.contract_versions)
    ? contract?.contract_versions[0]
    : contract?.contract_versions;
  const customer = Array.isArray(contract?.customers) ? contract?.customers[0] : contract?.customers;
  if (!contract || !version || !customer) return { error: 'Contrato incompleto.' };
  const { data: clauses } = await supabase
    .from('contract_clauses')
    .select('*')
    .eq('contract_version_id', version.id)
    .eq('is_enabled', true)
    .order('sort_order');

  const buffer = await renderPdfBuffer(
    ContractPdf({
      settings,
      number: contract.number,
      version: version.version_number,
      customerName: customer.legal_name,
      customerDocument: customer.document,
      object: contract.object,
      scope: contract.scope,
      totalCents: contract.total_cents,
      startsOn: contract.starts_on,
      endsOn: contract.ends_on,
      payment: contract.billing_method,
      responsibilities: [
        ['Alimentação', contract.food_party],
        ['Hospedagem', contract.lodging_party],
        ['Combustível', contract.fuel_party],
        ['Transporte', contract.transport_party],
        ['Ajudante', contract.helper_party],
        ['Plano de rigging', contract.rigging_party],
      ].map(([label, value]) => ({
        label,
        value: value ? RESPONSIBILITY_LABELS[value as ResponsibilityParty] : 'Não definido',
      })),
      clauses: (clauses ?? []).map((clause) => ({ title: clause.title, body: clause.body })),
    }),
  );

  const token = crypto.randomUUID();
  const path = `contracts/${contract.number}-v${version.version_number}-${token}.pdf`;
  const { error: uploadError } = await admin.storage.from('documents').upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (uploadError) return { error: 'Falha ao gravar o PDF.' };
  const { data: document, error } = await admin
    .from('documents')
    .insert({
      kind: 'contract_pdf',
      customer_id: contract.customer_id,
      contract_id: contract.id,
      contract_version_id: version.id,
      storage_path: path,
      file_name: `${contract.number}-v${version.version_number}.pdf`,
      is_immutable: true,
      access_token: token,
      token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: user.id,
    })
    .select('id, access_token')
    .single();
  if (error || !document) return { error: 'PDF gerado, mas não registrado.' };
  await writeAuditLog({ actorId: user.id, action: 'pdf_generate', entity: 'contracts', entityId: contractId });
  revalidatePath(`/admin/contratos/${contractId}`);
  return { ok: true as const, documentId: document.id, url: publicDocumentUrl(token) };
}

export async function sendQuoteWhatsApp(quoteId: string, to: string) {
  const user = await assertPermission('whatsapp.send');
  const generated = await generateQuotePdf(quoteId, true);
  if (!generated.ok || !generated.url) return generated;
  const supabase = await createClient();
  const settings = await getCompanySettings();
  const { data: quote } = await supabase
    .from('quotes')
    .select('number, title, quote_versions:current_version_id(valid_until, title), customers(legal_name, whatsapp_ddi, whatsapp_number)')
    .eq('id', quoteId)
    .single();
  const version = Array.isArray(quote?.quote_versions) ? quote?.quote_versions[0] : quote?.quote_versions;
  const customer = Array.isArray(quote?.customers) ? quote?.customers[0] : quote?.customers;
  const body = `${applyTemplate(settings.quote_whatsapp_template, {
    nome: customer?.legal_name ?? '',
    numero: quote?.number ?? '',
    titulo: version?.title ?? quote?.title ?? '',
    validade: version?.valid_until ? formatDateBr(version.valid_until) : 'o prazo indicado',
  })}\n\nVisualizar PDF: ${generated.url}`;

  const result = await sendWhatsApp({
    to: toWhatsAppDigits(to || `${customer?.whatsapp_ddi ?? '55'}${customer?.whatsapp_number ?? ''}`),
    body,
    quoteId,
    documentId: generated.documentId,
    actorId: user.id,
    provider: settings.whatsapp_provider,
    fileName: `${quote?.number}.pdf`,
  });
  await writeAuditLog({
    actorId: user.id,
    action: 'whatsapp_send',
    entity: 'quotes',
    entityId: quoteId,
    metadata: { status: result.status },
  });
  if (result.status === 'failed') return { error: result.error ?? 'Falha no envio.' };
  return { ok: true as const, waLink: result.waLink, url: generated.url };
}

export async function sendContractWhatsApp(contractId: string, to: string) {
  const user = await assertPermission('whatsapp.send');
  const generated = await generateContractPdf(contractId);
  if (!generated.ok || !generated.url) return generated;
  const supabase = await createClient();
  const settings = await getCompanySettings();
  const { data: contract } = await supabase
    .from('contracts')
    .select('number, object, customers(legal_name, whatsapp_ddi, whatsapp_number)')
    .eq('id', contractId)
    .single();
  const customer = Array.isArray(contract?.customers) ? contract?.customers[0] : contract?.customers;
  const body = `${applyTemplate(settings.contract_whatsapp_template, {
    nome: customer?.legal_name ?? '',
    numero: contract?.number ?? '',
    objeto: contract?.object ?? '',
  })}\n\nVisualizar PDF: ${generated.url}`;
  const result = await sendWhatsApp({
    to: toWhatsAppDigits(to || `${customer?.whatsapp_ddi ?? '55'}${customer?.whatsapp_number ?? ''}`),
    body,
    contractId,
    documentId: generated.documentId,
    actorId: user.id,
    provider: settings.whatsapp_provider,
    fileName: `${contract?.number}.pdf`,
  });
  await writeAuditLog({
    actorId: user.id,
    action: 'whatsapp_send',
    entity: 'contracts',
    entityId: contractId,
    metadata: { status: result.status },
  });
  if (result.status === 'failed') return { error: result.error ?? 'Falha no envio.' };
  return { ok: true as const, waLink: result.waLink, url: generated.url };
}
