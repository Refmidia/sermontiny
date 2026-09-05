import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import type { Equipment } from '@/types/database';

export async function getPublicEquipment(): Promise<Equipment[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .is('deleted_at', null)
    .eq('show_on_website', true)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data ?? []) as Equipment[];
}

export async function getPublicEquipmentBySlug(slug: string): Promise<Equipment | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('equipment')
    .select('*')
    .eq('slug', slug)
    .eq('show_on_website', true)
    .is('deleted_at', null)
    .maybeSingle();
  return (data as Equipment | null) ?? null;
}

export const EQUIPMENT_STATUS_LABELS = {
  available: 'Disponível',
  rented: 'Locado',
  maintenance: 'Em manutenção',
  inactive: 'Inativo',
} as const;
