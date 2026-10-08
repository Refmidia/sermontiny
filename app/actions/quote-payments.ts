'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { createAdminClient } from '@/lib/db/admin';
import { createClient } from '@/lib/db/server';
import { toCents } from '@/lib/money';

export type QuotePaymentRow = {
  id: string;
  quote_id: string;
  amount_cents: number;
  kind: string;
  paid_at: string;
  notes: string | null;
  created_at: string;
};

const STORAGE_BUCKET = 'documents';
const storagePath = (quoteId: string) => `quote-payments/${quoteId}.json`;

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /quote_payments/i.test(error.message || '') ||
    /Could not find the table/i.test(error.message || '')
  );
}

async function readStoragePayments(quoteId: string): Promise<QuotePaymentRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(STORAGE_BUCKET).download(storagePath(quoteId));
  if (error || !data) return [];
  try {
    const text = await data.text();
    const parsed = JSON.parse(text) as QuotePaymentRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStoragePayments(quoteId: string, payments: QuotePaymentRow[]) {
  const admin = createAdminClient();
  const body = new Blob([JSON.stringify(payments, null, 2)], { type: 'application/json' });
  const { error } = await admin.storage.from(STORAGE_BUCKET).upload(storagePath(quoteId), body, {
    upsert: true,
    contentType: 'application/json',
  });
  if (error) throw new Error(error.message || 'Falha ao salvar recebimentos.');
}

export async function listQuotePayments(quoteId: string) {
  await assertPermission('quotes.read');
  if (!quoteId) return { error: 'Orçamento inválido.' as const, payments: [] as QuotePaymentRow[] };

  const db = await createClient();
  const { data, error } = await db
    .from('quote_payments')
    .select('id, quote_id, amount_cents, kind, paid_at, notes, created_at')
    .eq('quote_id', quoteId)
    .is('deleted_at', null)
    .order('paid_at', { ascending: false });

  if (!error) {
    return { payments: (data ?? []) as QuotePaymentRow[], source: 'table' as const };
  }

  if (!isMissingTableError(error)) {
    return {
      error: error.message || 'Não foi possível carregar os recebimentos.',
      payments: [] as QuotePaymentRow[],
    };
  }

  try {
    const payments = await readStoragePayments(quoteId);
    payments.sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
    return { payments, source: 'storage' as const };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Não foi possível carregar os recebimentos.',
      payments: [] as QuotePaymentRow[],
    };
  }
}

export async function sumReceivedByQuoteIds(quoteIds: string[]) {
  await assertPermission('quotes.read');
  const unique = [...new Set(quoteIds.filter(Boolean))];
  const totals: Record<string, number> = {};
  for (const id of unique) totals[id] = 0;
  if (unique.length === 0) return { totals };

  const db = await createClient();
  const { data, error } = await db
    .from('quote_payments')
    .select('quote_id, amount_cents')
    .in('quote_id', unique)
    .is('deleted_at', null);

  if (!error) {
    for (const row of data ?? []) {
      totals[row.quote_id] = (totals[row.quote_id] || 0) + (row.amount_cents || 0);
    }
    return { totals, source: 'table' as const };
  }

  if (!isMissingTableError(error)) {
    return { totals, error: error.message };
  }

  await Promise.all(
    unique.map(async (quoteId) => {
      const payments = await readStoragePayments(quoteId);
      totals[quoteId] = payments.reduce((sum, payment) => sum + (payment.amount_cents || 0), 0);
    }),
  );
  return { totals, source: 'storage' as const };
}

export async function createQuotePayment(input: {
  quoteId: string;
  amount: string;
  kind: string;
  paidAt: string;
  notes?: string;
}) {
  const user = await assertPermission('quotes.write');
  const quoteId = input.quoteId?.trim();
  const kind = input.kind?.trim() || 'Sinal';
  const notes = input.notes?.trim() || null;

  if (!quoteId) return { error: 'Orçamento inválido.' };

  let amountCents = 0;
  try {
    amountCents = toCents(input.amount);
  } catch {
    return { error: 'Informe um valor válido.' };
  }
  if (amountCents <= 0) return { error: 'O valor deve ser maior que zero.' };

  const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
  if (Number.isNaN(paidAt.getTime())) return { error: 'Data/hora inválida.' };

  const db = await createClient();
  const { data: quote } = await db
    .from('quotes')
    .select('id, number')
    .eq('id', quoteId)
    .is('deleted_at', null)
    .maybeSingle();
  if (!quote) return { error: 'Orçamento não encontrado.' };

  const { data, error } = await db
    .from('quote_payments')
    .insert({
      quote_id: quoteId,
      amount_cents: amountCents,
      kind,
      paid_at: paidAt.toISOString(),
      notes,
      created_by: user.id,
    })
    .select('id, quote_id, amount_cents, kind, paid_at, notes, created_at')
    .single();

  if (!error && data) {
    await writeAuditLog({
      actorId: user.id,
      action: 'create',
      entity: 'quote_payments',
      entityId: data.id,
      metadata: { quote_id: quoteId, amount_cents: amountCents, kind },
    });
    revalidatePath('/admin/orcamentos');
    revalidatePath(`/admin/orcamentos/${quoteId}`);
    return { ok: true as const, payment: data as QuotePaymentRow, source: 'table' as const };
  }

  if (error && !isMissingTableError(error)) {
    return { error: error.message || 'Não foi possível salvar o pagamento.' };
  }

  try {
    const current = await readStoragePayments(quoteId);
    const payment: QuotePaymentRow = {
      id: randomUUID(),
      quote_id: quoteId,
      amount_cents: amountCents,
      kind,
      paid_at: paidAt.toISOString(),
      notes,
      created_at: new Date().toISOString(),
    };
    await writeStoragePayments(quoteId, [payment, ...current]);
    await writeAuditLog({
      actorId: user.id,
      action: 'create',
      entity: 'quote_payments',
      entityId: payment.id,
      metadata: { quote_id: quoteId, amount_cents: amountCents, kind, source: 'storage' },
    });
    revalidatePath('/admin/orcamentos');
    revalidatePath(`/admin/orcamentos/${quoteId}`);
    return { ok: true as const, payment, source: 'storage' as const };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Não foi possível salvar o pagamento.',
    };
  }
}
