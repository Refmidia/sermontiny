import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/public/page-hero';
import { SiteContainer } from '@/components/public/site-container';
import { SiteImage } from '@/components/public/site-image';
import { featuredFleetCards } from '@/lib/content/home-fleet';
import { getCompanySettings } from '@/lib/data/company';
import { EQUIPMENT_STATUS_LABELS, getPublicEquipment } from '@/lib/data/equipment';
import { publicStorageUrl } from '@/lib/storage-url';
import { equipmentFallbackImage } from '@/lib/content/public-media';
import { formatBRL } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Equipamentos',
  description: 'Catálogo de guindastes, muncks, prancha e serviços de mobilização da Sermontiny.',
};

export const dynamic = 'force-dynamic';

export default async function EquipmentCatalogPage() {
  const [settings, equipment] = await Promise.all([getCompanySettings(), getPublicEquipment()]);
  const fallbackFleet = featuredFleetCards(equipment, (path) => publicStorageUrl('equipment', path));

  return (
    <>
      <PageHero
        eyebrow="Nossa frota"
        title="Equipamentos preparados para cada desafio."
        description="Os dados abaixo vêm do cadastro administrativo. Preços públicos permanecem ocultos até autorização nas configurações."
      />
      <section className="bg-paper py-16">
        <SiteContainer>
          {equipment.length === 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {fallbackFleet.map((item) => (
                <Link key={item.name} href={item.href} className="overflow-hidden rounded-[14px] bg-white shadow-panel transition-transform hover:-translate-y-0.5">
                  <SiteImage
                    src={item.image}
                    alt={item.alt}
                    width={800}
                    height={560}
                    sizes="(max-width: 1280px) 50vw, 33vw"
                    className="aspect-[4/3] w-full"
                  />
                  <div className="p-5">
                    <h2 className="text-xl font-semibold text-navy">{item.name}</h2>
                    <p className="mt-1 text-sm text-muted">{item.capacity}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {equipment.map((item) => {
                const photo = publicStorageUrl('equipment', item.photo_path) ?? equipmentFallbackImage(item.slug);
                return (
                  <Link key={item.id} href={`/equipamentos/${item.slug}`} className="overflow-hidden rounded-[14px] bg-white shadow-panel transition-transform hover:-translate-y-0.5">
                    <SiteImage
                      src={photo}
                      alt={`Fotografia de ${item.name}`}
                      width={800}
                      height={560}
                      sizes="(max-width: 1280px) 50vw, 33vw"
                      className="aspect-[4/3] w-full"
                    />
                    <div className="p-5">
                      <h2 className="text-xl font-semibold text-navy">{item.name}</h2>
                      <p className="mt-1 text-sm text-muted">
                        {[item.brand, item.model, item.capacity_tons ? `${item.capacity_tons} t` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {item.show_availability_public && (
                        <p className="mt-2 text-xs tracking-wide text-steel uppercase">
                          {EQUIPMENT_STATUS_LABELS[item.status]}
                        </p>
                      )}
                      {settings.show_public_prices && item.daily_cents > 0 && (
                        <p className="mt-3 text-sm font-semibold text-navy">Diária {formatBRL(item.daily_cents)}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SiteContainer>
      </section>
    </>
  );
}
