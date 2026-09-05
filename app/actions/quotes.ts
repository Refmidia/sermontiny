'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';
import { quoteSchema } from '@/lib/validations/common';
import { emptyToNull, parseMoneyField } from '@/lib/forms';
import { sanitizeMultiline, sanitizePlainText } from '@/lib/sanitize';
import {
  calculateItemSubtotal,
  calculateQuoteTotals,
  shouldRecommendMonthlyRate,
  type QuoteItemInput,
} from '@/lib/money';
import { centsToExtenso } from '@/lib/extenso';
import type { QuoteItemUnit, QuoteStatus } from '@/types/database';

type ParsedItem = {
  equipment_id: string | null;
  kind: 'equipment' | 'service' | 'additional';
  additional_code: string | null;
  description: string;
  unit: QuoteItemUnit;
  quantity: number;
  unit_price_cents: number;
  discount_cents: number;
  surcharge_cents: number;
  subtotal_cents: number;
  monthly_recommendation: boolean;
  sort_order: number;
};

function parseItems(formData: FormData): ParsedItem[] {
  const raw = formData.get('items_json');
  if (typeof raw !== 'string') return [];
  const items = JSON.parse(raw) as Array<Record<string, string>>;
  return items.map((item, index) => {
    const quantity = Number(String(item.quantity).replace(',', '.')) || 0;
    const unitPrice = parseMoneyField(item.unit_price_reais);
    const discount = parseMoneyField(item.discount_reais);
    const surcharge = parseMoneyField(item.surcharge_reais);
    const calc: QuoteItemInput = {
      quantity,
      unitPriceCents: unitPrice,
      discountCents: discount,
      surchargeCents: surcharge,
    };
    const monthlyCents = parseMoneyField(item.monthly_reais);
    return {
      equipment_id: item.equipment_id || null,
      kind: (item.kind as ParsedItem['kind']) || 'equipment',
      additional_code: emptyToNull(item.additional_code),
      description: sanitizePlainText(item.description || ''),
      unit: (item.unit as QuoteItemUnit) || 'daily',
      quantity,
      unit_price_cents: unitPrice,
      discount_cents: discount,
      surcharge_cents: surcharge,
      subtotal_cents: calculateItemSubtotal(calc),
      monthly_recommendation:
        item.unit === 'daily' && monthlyCents > 0
          ? shouldRecommendMonthlyRate(unitPrice, monthlyCents, quantity)
          : false,
      sort_order: index,
    };
  });
}

async function persistVersion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quoteId: string,
  versionId: string | null,
  formData: FormData,
  userId: string,
  items: ParsedItem[],
) {
  const totals = calculateQuoteTotals(
    items.map((item) => ({
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
      discountCents: item.discount_cents,
      surchargeCents: item.surcharge_cents,
    })),
    parseMoneyField(String(formData.get('discount_reais') || '')),
    parseMoneyField(String(formData.get('surcharge_reais') || '')),
    parseMoneyField(String(formData.get('tax_reais') || '')),
  );

  const versionPayload = {
    quote_id: quoteId,
    title: sanitizePlainText(String(formData.get('title') || '')),
    description: emptyToNull(String(formData.get('description') || ''))
      ? sanitizeMultiline(String(formData.get('description')))
      : null,
    scope: emptyToNull(String(formData.get('scope') || ''))
      ? sanitizeMultiline(String(formData.get('scope')))
      : null,
    activity_code: emptyToNull(String(formData.get('activity_code') || '')),
    issued_at: String(formData.get('issued_at') || new Date().toISOString().slice(0, 10)),
    valid_until: emptyToNull(String(formData.get('valid_until') || '')),
    start_date: emptyToNull(String(formData.get('start_date') || '')),
    end_date: emptyToNull(String(formData.get('end_date') || '')),
    payment_terms: emptyToNull(String(formData.get('payment_terms') || ''))
      ? sanitizeMultiline(String(formData.get('payment_terms')))
      : null,
    payment_deadline: emptyToNull(String(formData.get('payment_deadline') || '')),
    internal_notes: emptyToNull(String(formData.get('internal_notes') || ''))
      ? sanitizeMultiline(String(formData.get('internal_notes')))
      : null,
    customer_notes: emptyToNull(String(formData.get('customer_notes') || ''))
      ? sanitizeMultiline(String(formData.get('customer_notes')))
      : null,
    subtotal_cents: totals.itemsSubtotalCents,
    discount_cents: totals.discountCents,
    surcharge_cents: totals.surchargeCents,
    tax_cents: totals.taxCents,
    total_cents: totals.totalCents,
    total_extenso: centsToExtenso(totals.totalCents),
    created_by: userId,
  };

  let currentVersionId = versionId;
  if (versionId) {
    const { error } = await supabase.from('quote_versions').update(versionPayload).eq('id', versionId);
    if (error) throw new Error('Não foi possível atualizar a versão.');
    await supabase.from('quote_items').delete().eq('quote_version_id', versionId);
  } else {
    const { data: last } = await supabase
      .from('quote_versions')
      .select('version_number')
      .eq('quote_id', quoteId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await supabase
      .from('quote_versions')
      .insert({
        ...versionPayload,
        version_number: (last?.version_number ?? 0) + 1,
        status: 'draft',
      })
      .select('id')
      .single();
    if (error || !data) throw new Error('Não foi possível criar a versão.');
    currentVersionId = data.id;
  }

  if (!currentVersionId) throw new Error('Versão inválida.');
  if (items.length) {
    const { error } = await supabase.from('quote_items').insert(
      items.map((item) => ({
        quote_version_id: currentVersionId,
        ...item,
      })),
    );
    if (error) throw new Error('Não foi possível salvar os itens.');
  }

  await supabase
    .from('quotes')
    .update({
      current_version_id: currentVersionId,
      title: versionPayload.title,
      customer_id: String(formData.get('customer_id')),
      unit_id: emptyToNull(String(formData.get('unit_id') || '')),
      contact_id: emptyToNull(String(formData.get('contact_id') || '')),
      owner_id: emptyToNull(String(formData.get('owner_id') || '')) ?? userId,
    })
    .eq('id', quoteId);

  return currentVersionId;
}

export async function saveQuote(formData: FormData) {
  const user = await assertPermission('quotes.write');
  const parsed = quoteSchema.safeParse({
    customer_id: formData.get('customer_id'),
    unit_id: formData.get('unit_id') || '',
    contact_id: formData.get('contact_id') || '',
    title: formData.get('title'),
    description: formData.get('description') || '',
    scope: formData.get('scope') || '',
    activity_code: formData.get('activity_code') || '',
    issued_at: formData.get('issued_at'),
    valid_until: formData.get('valid_until') || '',
    start_date: formData.get('start_date') || '',
    end_date: formData.get('end_date') || '',
    payment_terms: formData.get('payment_terms') || '',
    payment_deadline: formData.get('payment_deadline') || '',
    internal_notes: formData.get('internal_notes') || '',
    customer_notes: formData.get('customer_notes') || '',
    discount_reais: formData.get('discount_reais') || '',
    surcharge_reais: formData.get('surcharge_reais') || '',
    tax_reais: formData.get('tax_reais') || '',
    items: JSON.parse(String(formData.get('items_json') || '[]')),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const items = parseItems(formData);
  if (!items.length) return { error: 'Inclua ao menos um item.' };

  const supabase = await createClient();
  const id = String(formData.get('id') || '');

  try {
    if (!id) {
      const { data: numberData, error: numberError } = await supabase.rpc('next_document_number', {
        doc_kind: 'quote',
      });
      if (numberError || !numberData) return { error: 'Não foi possível gerar o número do orçamento.' };
      const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
          number: numberData,
          customer_id: parsed.data.customer_id,
          unit_id: parsed.data.unit_id || null,
          contact_id: parsed.data.contact_id || null,
          owner_id: user.id,
          title: sanitizePlainText(parsed.data.title),
          created_by: user.id,
          status: 'draft',
        })
        .select('id')
        .single();
      if (error || !quote) return { error: 'Não foi possível criar o orçamento.' };
      await persistVersion(supabase, quote.id, null, formData, user.id, items);
      await writeAuditLog({ actorId: user.id, action: 'create', entity: 'quotes', entityId: quote.id });
      revalidatePath('/admin/orcamentos');
      redirect(`/admin/orcamentos/${quote.id}`);
    }

    const { data: current } = await supabase
      .from('quotes')
      .select('id, current_version_id, quote_versions:current_version_id(id, locked, status)')
      .eq('id', id)
      .single();
    const version = Array.isArray(current?.quote_versions)
      ? current?.quote_versions[0]
      : current?.quote_versions;
    if (version?.locked || version?.status === 'approved') {
      const newVersionId = await persistVersion(supabase, id, null, formData, user.id, items);
      await writeAuditLog({
        actorId: user.id,
        action: 'update',
        entity: 'quote_versions',
        entityId: newVersionId,
        metadata: { reason: 'new_version_after_lock' },
      });
    } else {
      await persistVersion(supabase, id, current?.current_version_id ?? null, formData, user.id, items);
      await writeAuditLog({ actorId: user.id, action: 'update', entity: 'quotes', entityId: id });
    }
    revalidatePath('/admin/orcamentos');
    redirect(`/admin/orcamentos/${id}`);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Falha ao salvar o orçamento.' };
  }
}

export async function changeQuoteStatus(quoteId: string, status: QuoteStatus) {
  const permission = status === 'approved' ? 'quotes.approve' : 'quotes.write';
  const user = await assertPermission(permission);
  const supabase = await createClient();
  const { data: quote } = await supabase
    .from('quotes')
    .select('id, current_version_id')
    .eq('id', quoteId)
    .single();
  if (!quote?.current_version_id) return { error: 'Orçamento sem versão atual.' };

  const updates: Record<string, unknown> = { status };
  if (status === 'approved') updates.locked = true;
  const { error } = await supabase.from('quote_versions').update(updates).eq('id', quote.current_version_id);
  if (error) return { error: 'Não foi possível alterar o status.' };
  await supabase.from('quotes').update({ status }).eq('id', quoteId);
  await writeAuditLog({
    actorId: user.id,
    action: status === 'approved' ? 'approve' : 'update',
    entity: 'quotes',
    entityId: quoteId,
    metadata: { status },
  });
  revalidatePath(`/admin/orcamentos/${quoteId}`);
  return { ok: true as const };
}

export async function duplicateQuote(quoteId: string) {
  const user = await assertPermission('quotes.write');
  const supabase = await createClient();
  const { data: quote } = await supabase.from('quotes').select('*').eq('id', quoteId).single();
  const { data: version } = await supabase
    .from('quote_versions')
    .select('*')
    .eq('id', quote?.current_version_id)
    .single();
  const { data: items } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_version_id', version?.id);
  if (!quote || !version) return { error: 'Orçamento não encontrado.' };

  const { data: numberData } = await supabase.rpc('next_document_number', { doc_kind: 'quote' });
  const { data: created, error } = await supabase
    .from('quotes')
    .insert({
      number: numberData,
      customer_id: quote.customer_id,
      unit_id: quote.unit_id,
      contact_id: quote.contact_id,
      owner_id: user.id,
      title: `${quote.title} (cópia)`,
      created_by: user.id,
      status: 'draft',
    })
    .select('id')
    .single();
  if (error || !created) return { error: 'Não foi possível duplicar.' };

  const { data: newVersion, error: versionError } = await supabase
    .from('quote_versions')
    .insert({
      quote_id: created.id,
      version_number: 1,
      issued_at: new Date().toISOString().slice(0, 10),
      valid_until: version.valid_until,
      title: `${version.title} (cópia)`,
      description: version.description,
      scope: version.scope,
      activity_code: version.activity_code,
      start_date: version.start_date,
      end_date: version.end_date,
      payment_terms: version.payment_terms,
      payment_deadline: version.payment_deadline,
      customer_notes: version.customer_notes,
      status: 'draft',
      subtotal_cents: version.subtotal_cents,
      discount_cents: version.discount_cents,
      surcharge_cents: version.surcharge_cents,
      tax_cents: version.tax_cents,
      total_cents: version.total_cents,
      total_extenso: version.total_extenso,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (versionError || !newVersion) return { error: 'Falha ao copiar a versão.' };
  if (items?.length) {
    await supabase.from('quote_items').insert(
      items.map((item) => {
        const nextItem = { ...item, quote_version_id: newVersion.id };
        delete (nextItem as { id?: string }).id;
        delete (nextItem as { created_at?: string }).created_at;
        return nextItem;
      }),
    );
  }
  await supabase.from('quotes').update({ current_version_id: newVersion.id }).eq('id', created.id);
  await writeAuditLog({ actorId: user.id, action: 'create', entity: 'quotes', entityId: created.id });
  redirect(`/admin/orcamentos/${created.id}`);
}

export async function createQuoteVersion(quoteId: string) {
  const user = await assertPermission('quotes.write');
  const supabase = await createClient();
  const { data: quote } = await supabase
    .from('quotes')
    .select('current_version_id')
    .eq('id', quoteId)
    .single();
  if (!quote?.current_version_id) return { error: 'Versão atual não encontrada.' };
  const { data: version } = await supabase.from('quote_versions').select('*').eq('id', quote.current_version_id).single();
  const { data: items } = await supabase.from('quote_items').select('*').eq('quote_version_id', version?.id);
  const { data: last } = await supabase
    .from('quote_versions')
    .select('version_number')
    .eq('quote_id', quoteId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: created, error } = await supabase
    .from('quote_versions')
    .insert({
      quote_id: quoteId,
      version_number: (last?.version_number ?? 0) + 1,
      issued_at: new Date().toISOString().slice(0, 10),
      valid_until: version?.valid_until,
      title: version?.title,
      description: version?.description,
      scope: version?.scope,
      activity_code: version?.activity_code,
      start_date: version?.start_date,
      end_date: version?.end_date,
      payment_terms: version?.payment_terms,
      payment_deadline: version?.payment_deadline,
      internal_notes: version?.internal_notes,
      customer_notes: version?.customer_notes,
      status: 'draft',
      subtotal_cents: version?.subtotal_cents ?? 0,
      discount_cents: version?.discount_cents ?? 0,
      surcharge_cents: version?.surcharge_cents ?? 0,
      tax_cents: version?.tax_cents ?? 0,
      total_cents: version?.total_cents ?? 0,
      total_extenso: version?.total_extenso ?? '',
      created_by: user.id,
    })
    .select('id')
    .single();
  if (error || !created) return { error: 'Não foi possível criar a nova versão.' };
  if (items?.length) {
    await supabase.from('quote_items').insert(
      items.map((item) => {
        const nextItem = { ...item, quote_version_id: created.id };
        delete (nextItem as { id?: string }).id;
        delete (nextItem as { created_at?: string }).created_at;
        return nextItem;
      }),
    );
  }
  await supabase.from('quotes').update({ current_version_id: created.id, status: 'draft' }).eq('id', quoteId);
  revalidatePath(`/admin/orcamentos/${quoteId}`);
  return { ok: true as const };
}
