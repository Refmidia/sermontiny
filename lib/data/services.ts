import { unstable_cache } from 'next/cache';
import { SERVICES, type ServicePage } from '@/lib/content/services';
import { serviceImage } from '@/lib/content/public-media';
import { createClient } from '@/lib/db/server';
import { isDatabaseConfigured } from '@/lib/db/pool';
import { createPublicReader, withPublicReadBreaker } from '@/lib/db/public-reader';
import { publicStorageUrl } from '@/lib/storage-url';

export const SITE_SERVICES_TAG = 'site-services';
export const SERVICES_SECTION_DEFAULT = {
  eyebrow: 'Nossos serviços',
  title: 'Soluções para operações exigentes.',
};

export type ServiceOverride = {
  slug: string;
  title: string | null;
  short_title: string | null;
  summary: string | null;
  description: string | null;
  highlights: string[] | null;
  applications: string[] | null;
  image_path: string | null;
};

export type ServicesSection = { eyebrow: string; title: string };
export type ServiceView = ServicePage & { image: { src: string; alt: string }; customImage: boolean };

type SiteServicesContent = { overrides: ServiceOverride[]; section: Partial<ServicesSection> };

const EMPTY_CONTENT: SiteServicesContent = { overrides: [], section: {} };

function list(value: string[] | null | undefined, fallback: string[]) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function mergeServices({ overrides, section }: SiteServicesContent) {
  const bySlug = new Map(overrides.map((row) => [row.slug, row]));
  const services: ServiceView[] = SERVICES.map((base) => {
    const row = bySlug.get(base.slug);
    const fallbackImage = serviceImage(base.slug);
    const title = row?.title || base.title;
    return {
      ...base,
      title,
      shortTitle: row?.short_title || base.shortTitle,
      summary: row?.summary || base.summary,
      description: row?.description || base.description,
      highlights: list(row?.highlights, base.highlights),
      applications: list(row?.applications, base.applications),
      image: row?.image_path
        ? { src: publicStorageUrl('site', row.image_path) ?? fallbackImage.src, alt: title }
        : { src: fallbackImage.src, alt: fallbackImage.alt },
      customImage: Boolean(row?.image_path),
    };
  });
  return {
    services,
    section: {
      eyebrow: section.eyebrow || SERVICES_SECTION_DEFAULT.eyebrow,
      title: section.title || SERVICES_SECTION_DEFAULT.title,
    },
  };
}

async function readContent(db: Awaited<ReturnType<typeof createClient>>): Promise<SiteServicesContent> {
  const [services, settings] = await Promise.all([
    db.from('site_services').select('*'),
    db.from('company_settings').select('services_eyebrow, services_title').limit(1).maybeSingle(),
  ]);
  if (services.error) throw new Error(services.error.message);
  return {
    overrides: (services.data ?? []) as ServiceOverride[],
    section: {
      eyebrow: settings.data?.services_eyebrow ?? undefined,
      title: settings.data?.services_title ?? undefined,
    },
  };
}

// Falhas lançam erro para não ficarem guardadas no cache.
const loadPublicContent = unstable_cache(
  async () => {
    const client = createPublicReader();
    if (!client) return EMPTY_CONTENT;
    return readContent(client);
  },
  ['site-services'],
  { revalidate: 300, tags: [SITE_SERVICES_TAG] },
);

/** Versão em cache para o site público. */
export async function getPublicServices() {
  if (!isDatabaseConfigured()) return mergeServices(EMPTY_CONTENT);
  return mergeServices(await withPublicReadBreaker(loadPublicContent, EMPTY_CONTENT));
}

export async function getPublicService(slug: string) {
  const { services } = await getPublicServices();
  return services.find((service) => service.slug === slug) ?? null;
}

/** Sempre atual, para o painel. */
export async function getAdminServices() {
  return mergeServices(await readContent(await createClient()));
}
