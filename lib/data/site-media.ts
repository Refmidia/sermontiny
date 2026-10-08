import { unstable_cache } from 'next/cache';
import { PUBLIC_MEDIA } from '@/lib/content/public-media';
import { isDatabaseConfigured } from '@/lib/db/pool';
import { createPublicReader, withPublicReadBreaker } from '@/lib/db/public-reader';
import { createClient } from '@/lib/db/server';
import { publicStorageUrl } from '@/lib/storage-url';

export const SITE_MEDIA_TAG = 'site-media';

export const SITE_MEDIA_SLOTS = [
  {
    slot: 'about',
    label: 'Foto do "Quem somos"',
    where: 'Página inicial (seção Quem somos) e página Empresa.',
    fallback: PUBLIC_MEDIA.about,
  },
  {
    slot: 'hero',
    label: 'Foto da capa',
    where: 'Fundo do topo da página inicial.',
    fallback: PUBLIC_MEDIA.hero,
  },
  {
    slot: 'cta',
    label: 'Foto da faixa final',
    where: 'Fundo da faixa azul no fim da página inicial.',
    fallback: PUBLIC_MEDIA.cta,
  },
] as const;

export type SiteMediaSlot = (typeof SITE_MEDIA_SLOTS)[number]['slot'];
export type SiteMediaImage = { src: string; alt: string; custom: boolean };

type MediaRow = { slot: string; image_path: string };

export function isSiteMediaSlot(value: string): value is SiteMediaSlot {
  return SITE_MEDIA_SLOTS.some((item) => item.slot === value);
}

function buildMedia(rows: MediaRow[]) {
  const bySlot = new Map(rows.map((row) => [row.slot, row.image_path]));
  return Object.fromEntries(
    SITE_MEDIA_SLOTS.map(({ slot, fallback }) => {
      const path = bySlot.get(slot);
      const src = path ? publicStorageUrl('site', path) : null;
      return [slot, { src: src ?? fallback.src, alt: fallback.alt, custom: Boolean(src) }];
    }),
  ) as Record<SiteMediaSlot, SiteMediaImage>;
}

// Falhas lançam erro para não ficarem guardadas no cache.
const loadPublicRows = unstable_cache(
  async () => {
    const client = createPublicReader();
    if (!client) return [] as MediaRow[];
    const { data, error } = await client.from('site_media').select('slot, image_path');
    if (error) throw new Error(error.message);
    return (data ?? []) as MediaRow[];
  },
  ['site-media'],
  { revalidate: 300, tags: [SITE_MEDIA_TAG] },
);

export async function getPublicSiteMedia() {
  if (!isDatabaseConfigured()) return buildMedia([]);
  return buildMedia(await withPublicReadBreaker(loadPublicRows, [] as MediaRow[]));
}

export async function getAdminSiteMedia() {
  const db = await createClient();
  const { data, error } = await db.from('site_media').select('slot, image_path');
  if (error) throw new Error(error.message);
  return buildMedia((data ?? []) as MediaRow[]);
}
