import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, getSupabasePublicEnv, getSupabaseServiceEnv } from '@/lib/supabase/env';
import type { Equipment } from '@/types/database';

function createPublicReader() {
  const service = getSupabaseServiceEnv();
  const pub = getSupabasePublicEnv();
  const env = service ?? pub;
  if (!env) return null;
  const key = service?.serviceRoleKey ?? pub?.anonKey;
  if (!key) return null;
  return createClient(env.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}

async function loadPublicEquipment() {
  const client = createPublicReader();
  if (!client) return [];
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
    return await loadPublicEquipment();
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
