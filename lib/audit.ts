import { createClient } from '@/lib/db/server';
import type { AuditAction } from '@/types/database';

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const db = await createClient();
    await db.from('audit_logs').insert({
      actor_id: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Auditoria não deve derrubar a ação principal.
  }
}
