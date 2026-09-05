import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { EquipmentForm } from '@/components/admin/equipment-form';
import { EquipmentPhotoField } from '@/components/admin/equipment-photo-field';
import { DetailTabs } from '@/components/admin/detail-tabs';
import { ContentCard } from '@/components/admin/content-card';
import { EmptyState } from '@/components/admin/empty-state';
import { EquipmentStatusBadge, QuoteStatusBadge } from '@/components/admin/status-badge';
import { formatBRL } from '@/lib/money';
import { formatDateTimeBr } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { publicStorageUrl } from '@/lib/storage-url';
import type { Equipment, QuoteStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('equipment.read');
  const canWrite = hasPermission(user.permissions, 'equipment.write');
  const { id } = await params;
  const supabase = await createClient();
  const { data: equipment } = await supabase.from('equipment').select('*').eq('id', id).is('deleted_at', null).maybeSingle();
  if (!equipment) notFound();
  const [{ data: history }, { data: items }] = await Promise.all([
    supabase.from('equipment_price_history').select('*').eq('equipment_id', id).order('valid_from', { ascending: false }),
    supabase
      .from('quote_items')
      .select('id, description, quote_versions(quotes(id, number, status, title))')
      .eq('equipment_id', id)
      .limit(30),
  ]);
  const photo = publicStorageUrl('equipment', equipment.photo_path);

  return (
    <div className="space-y-6">
      <PageHeader
        title={equipment.name}
        description={[equipment.brand, equipment.model].filter(Boolean).join(' ') || 'Ficha técnica e preços vigentes.'}
        crumbs={[
          { href: '/admin', label: 'Painel' },
          { href: '/admin/equipamentos', label: 'Equipamentos' },
          { label: equipment.name },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <ContentCard>
          <EquipmentPhotoField
            equipmentId={equipment.id}
            photoUrl={photo}
            canWrite={canWrite}
            variant="card"
          />
          <div className="mt-4 space-y-2 text-sm">
            <EquipmentStatusBadge status={equipment.status} />
            <p className="font-medium text-navy">{equipment.available_for_quote ? 'Disponível para orçamento' : 'Indisponível para orçamento'}</p>
            <p className="text-muted">Diária {formatBRL(equipment.daily_cents)}</p>
          </div>
        </ContentCard>
        <DetailTabs
          items={[
            {
              value: 'tecnico',
              label: 'Informações técnicas',
              content: <EquipmentForm equipment={equipment as Equipment} photoUrl={photo} canWrite={canWrite} />,
            },
            {
              value: 'precos',
              label: 'Preços vigentes',
              content: (
                <ContentCard title="Preços vigentes">
                  <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div><dt className="text-muted">Diária</dt><dd className="font-semibold text-navy">{formatBRL(equipment.daily_cents)}</dd></div>
                    <div><dt className="text-muted">Mensal</dt><dd className="font-semibold text-navy">{formatBRL(equipment.monthly_cents)}</dd></div>
                    <div><dt className="text-muted">Hora</dt><dd className="font-semibold text-navy">{formatBRL(equipment.hourly_cents)}</dd></div>
                    <div><dt className="text-muted">Quilômetro</dt><dd className="font-semibold text-navy">{formatBRL(equipment.km_cents)}</dd></div>
                  </dl>
                </ContentCard>
              ),
            },
            {
              value: 'historico',
              label: 'Histórico de preços',
              content: (
                <ContentCard title="Histórico de preços">
                  {(history ?? []).length === 0 ? (
                    <EmptyState title="Sem histórico" text="As alterações de preço serão registradas aqui." />
                  ) : (
                    <div className="space-y-2 text-sm">
                      {(history ?? []).map((row) => (
                        <p key={row.id} className="rounded-xl border border-border px-4 py-3">
                          {formatDateTimeBr(row.valid_from)} · diária {formatBRL(row.daily_cents)} · mensal {formatBRL(row.monthly_cents)} ·
                          km {formatBRL(row.km_cents)}
                          {row.valid_to ? ` · até ${formatDateTimeBr(row.valid_to)}` : ' · vigente'}
                        </p>
                      ))}
                    </div>
                  )}
                </ContentCard>
              ),
            },
            {
              value: 'orcamentos',
              label: 'Orçamentos',
              content: (
                <ContentCard title="Orçamentos relacionados">
                  {(items ?? []).length === 0 ? (
                    <EmptyState title="Nenhum orçamento" text="Este equipamento ainda não foi usado em propostas." />
                  ) : (
                    <div className="space-y-2">
                      {(items ?? []).map((item, index) => {
                        const version = Array.isArray(item.quote_versions) ? item.quote_versions[0] : item.quote_versions;
                        const quote = version ? (Array.isArray(version.quotes) ? version.quotes[0] : version.quotes) : null;
                        if (!quote) return null;
                        return (
                          <Link key={`${quote.id}-${index}`} href={`/admin/orcamentos/${quote.id}`} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                            <span>
                              <span className="font-medium text-navy">{quote.number}</span>
                              <span className="block text-muted">{item.description}</span>
                            </span>
                            <QuoteStatusBadge status={quote.status as QuoteStatus} />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </ContentCard>
              ),
            },
            {
              value: 'documentos',
              label: 'Documentos e imagens',
              content: (
                <ContentCard title="Documentos e imagens" description="Foto principal do equipamento no painel e no site.">
                  <div className="max-w-md">
                    <EquipmentPhotoField
                      equipmentId={equipment.id}
                      photoUrl={photo}
                      canWrite={canWrite}
                      variant="field"
                    />
                  </div>
                </ContentCard>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
