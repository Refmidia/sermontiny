import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { EquipmentBoard } from '@/components/admin/equipment-board';
import type { Equipment } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function EquipmentAdminPage() {
  const user = await requirePermission('equipment.read');
  const canWrite = user.permissions.includes('equipment.write');
  const supabase = await createClient();
  const { data } = await supabase.from('equipment').select('*').is('deleted_at', null).order('sort_order');

  return <EquipmentBoard data={(data ?? []) as Equipment[]} canWrite={canWrite} />;
}
