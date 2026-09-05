import type { MetadataRoute } from 'next';
import { SERVICES } from '@/lib/content/services';
import { getPublicEquipment } from '@/lib/data/equipment';
import { absoluteUrl } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const equipment = await getPublicEquipment();
  const staticRoutes = ['/', '/servicos', '/equipamentos', '/empresa', '/projetos', '/contato', '/privacidade', '/termos', '/cookies'];

  return [
    ...staticRoutes.map((path) => ({
      url: absoluteUrl(path),
      lastModified: new Date(),
    })),
    ...SERVICES.map((service) => ({
      url: absoluteUrl(`/servicos/${service.slug}`),
      lastModified: new Date(),
    })),
    ...equipment.map((item) => ({
      url: absoluteUrl(`/equipamentos/${item.slug}`),
      lastModified: new Date(),
    })),
  ];
}
