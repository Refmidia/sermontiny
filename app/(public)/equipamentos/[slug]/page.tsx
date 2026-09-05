import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SiteContainer } from '@/components/public/site-container';
import { SiteImage } from '@/components/public/site-image';
import { getCompanySettings } from '@/lib/data/company';
import { EQUIPMENT_STATUS_LABELS, getPublicEquipmentBySlug } from '@/lib/data/equipment';
import { publicStorageUrl } from '@/lib/storage-url';
import { equipmentFallbackImage } from '@/lib/content/public-media';
import { formatBRL } from '@/lib/money';
import { SITE, absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicEquipmentBySlug(slug);
  if (!item) return { title: 'Equipamento' };
  return {
    title: item.name,
    description: item.description ?? item.name,
    openGraph: {
      title: `${item.name} | ${SITE.shortName}`,
      description: item.description ?? item.name,
      url: absoluteUrl(`/equipamentos/${item.slug}`),
    },
  };
}

export default async function EquipmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [item, settings] = await Promise.all([getPublicEquipmentBySlug(slug), getCompanySettings()]);
  if (!item) notFound();
  const photo = publicStorageUrl('equipment', item.photo_path) ?? equipmentFallbackImage(item.slug);

  return (
    <div className="bg-white py-16">
      <SiteContainer className="grid gap-10 lg:grid-cols-2">
        <SiteImage
          src={photo}
          alt={`Fotografia de ${item.name}`}
          width={1000}
          height={750}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="min-h-80 w-full rounded-[14px]"
        />
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">Equipamento</p>
          <h1 className="mt-3 text-4xl font-bold text-navy">{item.name}</h1>
          {item.name_needs_confirmation && (
            <p className="mt-3 text-sm text-amber-800">
              Nome comercial provisório. Confirmar marca e modelo antes da emissão definitiva.
            </p>
          )}
          <dl className="mt-6 grid gap-3 text-sm">
            <div>
              <dt className="text-muted">Marca e modelo</dt>
              <dd className="font-medium text-navy">{[item.brand, item.model].filter(Boolean).join(' · ') || 'A definir'}</dd>
            </div>
            <div>
              <dt className="text-muted">Capacidade</dt>
              <dd className="font-medium text-navy">{item.capacity_tons ? `${item.capacity_tons} toneladas` : 'Não aplicável'}</dd>
            </div>
            {item.show_availability_public && (
              <div>
                <dt className="text-muted">Disponibilidade</dt>
                <dd className="font-medium text-navy">{EQUIPMENT_STATUS_LABELS[item.status]}</dd>
              </div>
            )}
          </dl>
          {item.description && <p className="mt-6 leading-7 text-muted">{item.description}</p>}
          {item.technical_features && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-navy">Características técnicas</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{item.technical_features}</p>
            </div>
          )}
          {settings.show_public_prices && (
            <div className="mt-6 rounded-xl border bg-paper p-4 text-sm">
              {item.daily_cents > 0 && <p>Diária: {formatBRL(item.daily_cents)}</p>}
              {item.monthly_cents > 0 && <p>Mensal: {formatBRL(item.monthly_cents)}</p>}
              {item.hourly_cents > 0 && <p>Hora: {formatBRL(item.hourly_cents)}</p>}
              {item.km_cents > 0 && <p>Quilômetro: {formatBRL(item.km_cents)}</p>}
            </div>
          )}
          <Button asChild variant="gold" className="mt-8">
            <Link href={`/contato?equipamento=${item.id}`}>Solicitar orçamento</Link>
          </Button>
        </div>
      </SiteContainer>
    </div>
  );
}
