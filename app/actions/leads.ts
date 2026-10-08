'use server';

import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { createClient } from '@/lib/db/server';
import { sanitizeMultiline, sanitizePlainText } from '@/lib/sanitize';
import type { LeadStatus } from '@/types/database';

const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'in_progress',
  'proposal_sent',
  'converted',
  'lost',
  'archived',
];

function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.includes(value as LeadStatus);
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const user = await assertPermission('leads.write');
  if (!id || !isLeadStatus(status)) return { error: 'Status inválido.' };

  const db = await createClient();
  const { data: current } = await db.from('leads').select('status').eq('id', id).maybeSingle();
  if (!current) return { error: 'Contato não encontrado.' };
  if (current.status === status) return { ok: true as const };

  const { error } = await db.from('leads').update({ status }).eq('id', id);
  if (error) {
    const message = /invalid input value|enum/i.test(error.message)
      ? 'Este status ainda não está disponível no banco. Aplique a migration 0002_leads_crm.sql.'
      : error.message || 'Não foi possível atualizar o contato.';
    return { error: message };
  }

  await writeAuditLog({
    actorId: user.id,
    action: 'update',
    entity: 'leads',
    entityId: id,
    metadata: { from: current.status, to: status, field: 'status' },
  });
  revalidatePath('/admin/leads');
  return { ok: true as const };
}

export async function updateLeadNotes(id: string, notes: string) {
  const user = await assertPermission('leads.write');
  if (!id) return { error: 'Contato inválido.' };
  const db = await createClient();
  const payload = { notes: sanitizeMultiline(notes) || null };
  const { error } = await db.from('leads').update(payload).eq('id', id);
  if (error) {
    const message = /column .*notes.* does not exist/i.test(error.message)
      ? 'Campo de observações ainda não existe no banco. Aplique a migration 0002_leads_crm.sql.'
      : error.message || 'Não foi possível salvar a observação.';
    return { error: message };
  }
  await writeAuditLog({
    actorId: user.id,
    action: 'update',
    entity: 'leads',
    entityId: id,
    metadata: { field: 'notes' },
  });
  revalidatePath('/admin/leads');
  return { ok: true as const };
}

export async function createLead(input: {
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  company?: string;
  subject?: string;
  message?: string;
}) {
  const user = await assertPermission('leads.write');
  const name = sanitizePlainText(input.name);
  if (!name) return { error: 'Informe o nome do contato.' };

  const db = await createClient();
  const { data, error } = await db
    .from('leads')
    .insert({
      name,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      company: input.company ? sanitizePlainText(input.company) : null,
      subject: input.subject ? sanitizePlainText(input.subject) : 'Contato manual',
      message: sanitizeMultiline(input.message || 'Contato cadastrado pelo painel.'),
      source: 'admin',
      status: 'new',
    })
    .select('id')
    .single();

  if (error || !data) return { error: error?.message || 'Não foi possível cadastrar o contato.' };
  await writeAuditLog({
    actorId: user.id,
    action: 'create',
    entity: 'leads',
    entityId: data.id,
    metadata: { source: 'admin' },
  });
  revalidatePath('/admin/leads');
  return { ok: true as const, id: data.id };
}

export async function archiveLead(id: string) {
  return updateLeadStatus(id, 'archived');
}

export async function softDeleteLead(id: string) {
  const user = await assertPermission('leads.write');
  if (!id) return { error: 'Contato inválido.' };
  const { createAdminClient } = await import('@/lib/db/admin');
  const admin = createAdminClient();
  const { data: lead } = await admin
    .from('leads')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!lead) return { error: 'Contato não encontrado.' };

  const { error } = await admin
    .from('leads')
    .update({ deleted_at: new Date().toISOString(), status: 'archived' })
    .eq('id', id);
  if (error) return { error: error.message || 'Não foi possível excluir o contato.' };

  await writeAuditLog({
    actorId: user.id,
    action: 'soft_delete',
    entity: 'leads',
    entityId: id,
  });
  revalidatePath('/admin/leads');
  return { ok: true as const };
}
