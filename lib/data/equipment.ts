import { isSupabaseConfigured, getSupabaseServiceEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Equipment } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

async function loadPublicEquipment(client: SupabaseClient) {
  const { data, error } = await client
    .from('equipment')
    .select('*')
    .is('deleted_at', null)
    .eq('show_on_website', true)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data ?? []) as Equipment[];
}

export async function getPublicEquipment(): Promise<Equipment[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const rows = await loadPublicEquipment(supabase);
    if (rows.length) return rows;
  } catch {
    // Fall through to the service-role client used on Vercel when anon read fails.
  }
  if (!getSupabaseServiceEnv()) return [];
  try {
    return await loadPublicEquipment(createAdminClient());
  } catch {
    return [];
  }
}

export async function getPublicEquipmentBySlug(slug: string): Promise<Equipment | null> {
  const rows = await getPublicEquipment();
  return rows.find((item) => item.slug === slug) ?? null;
}

export const EQUIPMENT_STATUS_LABELS = {
  available: 'Disponível',
  rented: 'Locado',
  maintenance: 'Em manutenção',
  inactive: 'Inativo',
} as const;
