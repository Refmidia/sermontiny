import { unstable_cache } from 'next/cache';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createPublicReader, withPublicReadBreaker } from '@/lib/supabase/public-reader';

export type PublicCertificate = { id: string; file_name: string; storage_path: string };

// Falhas lançam erro para não ficarem guardadas no cache.
const loadPublicCertificates = unstable_cache(
  async () => {
    const client = createPublicReader();
    if (!client) return [];
    const { data, error } = await client
      .from('documents')
      .select('id, file_name, storage_path')
      .eq('kind', 'certificate')
      .is('deleted_at', null)
      .limit(12);
    if (error) throw new Error(error.message);
    return (data ?? []) as PublicCertificate[];
  },
  ['public-certificates'],
  { revalidate: 300 },
);

export async function getPublicCertificates(): Promise<PublicCertificate[]> {
  if (!isSupabaseConfigured()) return [];
  return withPublicReadBreaker(loadPublicCertificates, []);
}
