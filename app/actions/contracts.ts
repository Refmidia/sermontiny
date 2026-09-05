'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';
import { contractSchema } from '@/lib/validations/common';
import { emptyToNull } from '@/lib/forms';
import { sanitizeMultiline, sanitizePlainText } from '@/lib/sanitize';
import type { ContractStatus } from '@/types/database';

const REQUIRED_PARTIES = [
  'food_party',
  'lodging_party',
  'fuel_party',
  'transport_party',
  'helper_party',
  'rigging_party',
] as const;

export async function convertQuoteToContract(quoteId: string) {
  const user = await assertPermission('contracts.write');
  const supabase = await createClient();
  const { data: quote } = await supabase
    .from('quotes')
    .select('*, quote_versions:current_version_id(*)')
    .eq('id', quoteId)
    .single();
  const version = Array.isArray(quote?.quote_versions) ? quote?.quote_versions[0] : quote?.quote_versions;
  if (!quote || !version) return { error: 'Orçamento não encontrado.' };
  if (version.status !== 'approved' && quote.status !== 'approved') {
    return { error: 'Somente orçamentos aprovados podem virar contrato.' };
  }

  const { data: numberData, error: numberError } = await supabase.rpc('next_document_number', {
    doc_kind: 'contract',
  });
  if (numberError || !numberData) return { error: 'Não foi possível gerar o número do contrato.' };

  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      number: numberData,
      quote_id: quote.id,
      quote_version_id: version.id,
      customer_id: quote.customer_id,
      unit_id: quote.unit_id,
      object: version.title,
      scope: version.scope,
      starts_on: version.start_date,
      ends_on: version.end_date,
      billing_method: version.payment_terms,
      payment_deadline: version.payment_deadline,
      total_cents: version.total_cents,
      status: 'draft',
      created_by: user.id,
    })
    .select('id')
    .single();
  if (error || !contract) return { error: 'Não foi possível criar o contrato.' };

  const { data: contractVersion } = await supabase
    .from('contract_versions')
    .insert({
      contract_id: contract.id,
      version_number: 1,
      object: version.title,
      scope: version.scope,
      payment_terms: version.payment_terms,
      total_cents: version.total_cents,
      created_by: user.id,
    })
    .select('id')
    .single();

  const { data: library } = await supabase.from('clause_library').select('*').eq('is_active', true).order('sort_order');
  if (contractVersion && library?.length) {
    await supabase.from('contract_clauses').insert(
      library.map((clause, index) => ({
        contract_version_id: contractVersion.id,
        library_id: clause.id,
        title: clause.title,
        body: clause.body,
        is_enabled: !clause.requires_responsibility,
        sort_order: index,
      })),
    );
  }
  await supabase.from('contracts').update({ current_version_id: contractVersion?.id }).eq('id', contract.id);
  await supabase.from('quotes').update({ status: 'converted' }).eq('id', quote.id);
  await supabase.from('quote_versions').update({ status: 'converted', locked: true }).eq('id', version.id);
  await writeAuditLog({
    actorId: user.id,
    action: 'convert_contract',
    entity: 'contracts',
    entityId: contract.id,
    metadata: { quoteId },
  });
  redirect(`/admin/contratos/${contract.id}`);
}

export async function saveContract(formData: FormData) {
  const user = await assertPermission('contracts.write');
  const parsed = contractSchema.safeParse({
    customer_id: formData.get('customer_id'),
    unit_id: formData.get('unit_id') || '',
    quote_id: formData.get('quote_id') || '',
    object: formData.get('object'),
    scope: formData.get('scope') || '',
    starts_on: formData.get('starts_on') || '',
    ends_on: formData.get('ends_on') || '',
    billing_method: formData.get('billing_method') || '',
    payment_deadline: formData.get('payment_deadline') || '',
    notes: formData.get('notes') || '',
    food_party: formData.get('food_party'),
    lodging_party: formData.get('lodging_party'),
    fuel_party: formData.get('fuel_party'),
    transport_party: formData.get('transport_party'),
    helper_party: formData.get('helper_party'),
    rigging_party: formData.get('rigging_party'),
    enabled_clauses: JSON.parse(String(formData.get('enabled_clauses') || '[]')),
    clause_overrides: JSON.parse(String(formData.get('clause_overrides') || '{}')),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Defina todas as responsabilidades.' };

  for (const field of REQUIRED_PARTIES) {
    if (!parsed.data[field]) {
      return { error: 'Defina claramente a responsabilidade de alimentação, hospedagem, combustível, transporte, ajudante e plano de rigging.' };
    }
  }

  const supabase = await createClient();
  const id = String(formData.get('id') || '');
  const payload = {
    customer_id: parsed.data.customer_id,
    unit_id: parsed.data.unit_id || null,
    quote_id: parsed.data.quote_id || null,
    object: sanitizePlainText(parsed.data.object),
    scope: parsed.data.scope ? sanitizeMultiline(parsed.data.scope) : null,
    starts_on: emptyToNull(parsed.data.starts_on),
    ends_on: emptyToNull(parsed.data.ends_on),
    billing_method: emptyToNull(parsed.data.billing_method),
    payment_deadline: emptyToNull(parsed.data.payment_deadline),
    notes: parsed.data.notes ? sanitizeMultiline(parsed.data.notes) : null,
    food_party: parsed.data.food_party,
    lodging_party: parsed.data.lodging_party,
    fuel_party: parsed.data.fuel_party,
    transport_party: parsed.data.transport_party,
    helper_party: parsed.data.helper_party,
    rigging_party: parsed.data.rigging_party,
  };

  if (!id) return { error: 'Contrato inválido.' };
  const { error } = await supabase.from('contracts').update(payload).eq('id', id);
  if (error) return { error: 'Não foi possível salvar o contrato.' };

  const { data: contract } = await supabase
    .from('contracts')
    .select('current_version_id')
    .eq('id', id)
    .single();
  if (contract?.current_version_id) {
    await supabase
      .from('contract_versions')
      .update({
        object: payload.object,
        scope: payload.scope,
        payment_terms: payload.billing_method,
      })
      .eq('id', contract.current_version_id)
      .eq('locked', false);
    const { data: clauses } = await supabase
      .from('contract_clauses')
      .select('id')
      .eq('contract_version_id', contract.current_version_id);
    for (const clause of clauses ?? []) {
      const enabled = parsed.data.enabled_clauses.includes(clause.id);
      const override = parsed.data.clause_overrides?.[clause.id];
      await supabase
        .from('contract_clauses')
        .update({
          is_enabled: enabled,
          body: override ? sanitizeMultiline(override) : undefined,
        })
        .eq('id', clause.id);
    }
  }

  await writeAuditLog({ actorId: user.id, action: 'update', entity: 'contracts', entityId: id });
  revalidatePath(`/admin/contratos/${id}`);
  return { ok: true as const };
}

export async function changeContractStatus(id: string, status: ContractStatus) {
  const user = await assertPermission(status === 'signed' || status === 'active' ? 'contracts.sign' : 'contracts.write');
  const supabase = await createClient();
  const { data: contract } = await supabase.from('contracts').select('*').eq('id', id).single();
  if (!contract) return { error: 'Contrato não encontrado.' };
  if (['sent', 'awaiting_signature', 'signed', 'active'].includes(status)) {
    const missing = REQUIRED_PARTIES.filter((field) => !contract[field]);
    if (missing.length) {
      return {
        error:
          'Antes de emitir o contrato, defina se alimentação, hospedagem, combustível, transporte, ajudante e plano de rigging pertencem à contratante ou à contratada.',
      };
    }
  }
  const { error } = await supabase
    .from('contracts')
    .update({
      status,
      signed_at: status === 'signed' || status === 'active' ? new Date().toISOString().slice(0, 10) : contract.signed_at,
    })
    .eq('id', id);
  if (error) return { error: 'Não foi possível atualizar o status.' };
  await writeAuditLog({
    actorId: user.id,
    action: status === 'signed' || status === 'active' ? 'approve' : 'update',
    entity: 'contracts',
    entityId: id,
    metadata: { status },
  });
  revalidatePath(`/admin/contratos/${id}`);
  return { ok: true as const };
}

export async function attachSignedContract(formData: FormData) {
  const user = await assertPermission('documents.write');
  const contractId = String(formData.get('contract_id') || '');
  const file = formData.get('file');
  if (!contractId || !(file instanceof File) || file.size === 0) {
    return { error: 'Selecione o arquivo assinado.' };
  }
  const supabase = await createClient();
  const path = `signed/${contractId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
  const { error: uploadError } = await supabase.storage.from('documents').upload(path, file);
  if (uploadError) return { error: 'Falha no envio do arquivo.' };
  const { error } = await supabase.from('documents').insert({
    kind: 'signed_contract',
    contract_id: contractId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type || 'application/pdf',
    created_by: user.id,
  });
  if (error) return { error: 'Arquivo enviado, mas não foi registrado.' };
  await writeAuditLog({ actorId: user.id, action: 'create', entity: 'documents', entityId: contractId });
  revalidatePath(`/admin/contratos/${contractId}`);
  return { ok: true as const };
}
