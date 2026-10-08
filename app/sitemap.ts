import type { MetadataRoute } from 'next';
import { getPublicEquipment } from '@/lib/data/equipment';
import { getPublicServices } from '@/lib/data/services';
import { absoluteUrl } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [equipment, { services }] = await Promise.all([getPublicEquipment(), getPublicServices()]);
  const staticRoutes = ['/', '/servicos', '/equipamentos', '/empresa', '/projetos', '/contato', '/privacidade', '/termos', '/cookies'];

  return [
    ...staticRoutes.map((path) => ({
      url: absoluteUrl(path),
      lastModified: new Date(),
    })),
    ...services.map((service) => ({
      url: absoluteUrl(`/servicos/${service.slug}`),
      lastModified: new Date(),
    })),
    ...equipment.map((item) => ({
      url: absoluteUrl(`/equipamentos/${item.slug}`),
      lastModified: new Date(),
    })),
  ];
}
