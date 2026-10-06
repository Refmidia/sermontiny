import { unstable_cache } from 'next/cache';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createPublicReader, withPublicReadBreaker } from '@/lib/supabase/public-reader';
import type { Equipment } from '@/types/database';

export const PUBLIC_EQUIPMENT_TAG = 'public-equipment';

// Falhas lançam erro para não ficarem guardadas no cache.
const loadPublicEquipment = unstable_cache(
  async () => {
    const client = createPublicReader();
    if (!client) return [];
    const { data, error } = await client
      .from('equipment')
      .select('*')
      .is('deleted_at', null)
      .eq('show_on_website', true)
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Equipment[];
  },
  ['public-equipment'],
  { revalidate: 300, tags: [PUBLIC_EQUIPMENT_TAG] },
);

export async function getPublicEquipment(): Promise<Equipment[]> {
  if (!isSupabaseConfigured()) return [];
  return withPublicReadBreaker(loadPublicEquipment, []);
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
