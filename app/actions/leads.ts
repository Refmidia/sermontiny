'use server';

import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';
import type { LeadStatus } from '@/types/database';

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const user = await assertPermission('leads.write');
  const supabase = await createClient();
  const { error } = await supabase.from('leads').update({ status }).eq('id', id);
  if (error) return { error: 'Não foi possível atualizar o contato.' };
  await writeAuditLog({ actorId: user.id, action: 'update', entity: 'leads', entityId: id, metadata: { status } });
  revalidatePath('/admin/leads');
  return { ok: true as const };
}
