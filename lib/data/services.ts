import { unstable_cache } from 'next/cache';
import { Factory } from 'lucide-react';
import { SERVICES, type ServicePage } from '@/lib/content/services';
import { serviceImage } from '@/lib/content/public-media';
import { serviceIcon, serviceIconKey } from '@/lib/content/service-icons';
import { createClient } from '@/lib/db/server';
import { isDatabaseConfigured } from '@/lib/db/pool';
import { createPublicReader, withPublicReadBreaker } from '@/lib/db/public-reader';
import { publicStorageUrl } from '@/lib/storage-url';

export const SITE_SERVICES_TAG = 'site-services';
export const SERVICES_SECTION_DEFAULT = {
  eyebrow: 'Nossos serviços',
  title: 'Soluções para operações exigentes.',
};

/** Serviços que aparecem na página inicial enquanto ninguém mudar pelo painel. */
export const DEFAULT_HOME_SLUGS = [
  'montagens-industriais',
  'fabricacao-estruturas-metalicas',
  'manutencao-industrial',
  'reservatorios-e-tubulacoes',
  'instalacoes-eletricas',
  'transporte-e-movimentacao-de-cargas',
];

export type ServiceOverride = {
  slug: string;
  title: string | null;
  short_title: string | null;
  summary: string | null;
  description: string | null;
  highlights: string[] | null;
  applications: string[] | null;
  image_path: string | null;
  is_custom: boolean;
  is_hidden: boolean;
  show_on_home: boolean | null;
  icon: string | null;
  sort_order: number | null;
};

export type ServicesSection = { eyebrow: string; title: string };
export type ServiceView = ServicePage & {
  image: { src: string; alt: string };
  defaultImageSrc: string;
  customImage: boolean;
  iconKey: string;
  custom: boolean;
  hidden: boolean;
  showOnHome: boolean;
  sortOrder: number;
};

type SiteServicesContent = { overrides: ServiceOverride[]; section: Partial<ServicesSection> };

const EMPTY_CONTENT: SiteServicesContent = { overrides: [], section: {} };

function list(value: string[] | null | undefined, fallback: string[]) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function toView(base: ServicePage, row: ServiceOverride | undefined, sortOrder: number, custom: boolean): ServiceView {
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
    icon: serviceIcon(row?.icon) ?? base.icon,
    iconKey: row?.icon || serviceIconKey(base.icon),
    image: row?.image_path
      ? { src: publicStorageUrl('site', row.image_path) ?? fallbackImage.src, alt: title }
      : { src: fallbackImage.src, alt: fallbackImage.alt },
    defaultImageSrc: fallbackImage.src,
    customImage: Boolean(row?.image_path),
    custom,
    hidden: Boolean(row?.is_hidden),
    showOnHome: row?.show_on_home ?? DEFAULT_HOME_SLUGS.includes(base.slug),
    sortOrder: row?.sort_order ?? sortOrder,
  };
}

function mergeServices({ overrides, section }: SiteServicesContent) {
  const bySlug = new Map(overrides.map((row) => [row.slug, row]));
  const builtIn = SERVICES.map((base, index) => toView(base, bySlug.get(base.slug), (index + 1) * 10, false));
  const custom = overrides
    .filter((row) => row.is_custom && !SERVICES.some((base) => base.slug === row.slug))
    .map((row, index) =>
      toView(
        {
          slug: row.slug,
          title: row.title || row.short_title || 'Serviço',
          shortTitle: row.short_title || row.title || 'Serviço',
          summary: row.summary || '',
          description: row.description || row.summary || '',
          highlights: [],
          applications: [],
          icon: Factory,
        },
        row,
        1000 + index,
        true,
      ),
    );
  const all = [...builtIn, ...custom].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    all,
    services: all.filter((service) => !service.hidden),
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

/** Versão em cache para o site público (somente serviços visíveis). */
export async function getPublicServices() {
  if (!isDatabaseConfigured()) return mergeServices(EMPTY_CONTENT);
  return mergeServices(await withPublicReadBreaker(loadPublicContent, EMPTY_CONTENT));
}

export async function getPublicService(slug: string) {
  const { services } = await getPublicServices();
  return services.find((service) => service.slug === slug) ?? null;
}

/** Sempre atual, para o painel (inclui os excluídos do site). */
export async function getAdminServices() {
  return mergeServices(await readContent(await createClient()));
}
