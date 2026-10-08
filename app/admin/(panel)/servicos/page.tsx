import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { requirePermission } from '@/lib/auth/session';
import { serviceImage } from '@/lib/content/public-media';
import { getAdminServices } from '@/lib/data/services';
import { PageHeader } from '@/components/admin/page-header';
import {
  HiddenServiceRow,
  NewServiceCard,
  ServiceEditorCard,
  ServicesSectionForm,
} from '@/components/admin/site-services-editor';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function SiteServicesPage() {
  const user = await requirePermission('settings.read');
  const canWrite = user.permissions.includes('settings.write');
  const { all, services, section } = await getAdminServices();
  const hidden = all.filter((service) => service.hidden);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços do site"
        description="Textos e fotos dos serviços mostrados no site. Ao salvar, o site é atualizado na hora."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Serviços do site' }]}
        actions={
          <Button asChild variant="outline">
            <Link href="/servicos" target="_blank">
              Ver no site
              <ExternalLink />
            </Link>
          </Button>
        }
      />
      <ServicesSectionForm eyebrow={section.eyebrow} title={section.title} canWrite={canWrite} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-navy">
            Serviços no site <span className="text-muted">({services.length})</span>
          </h2>
          {canWrite && <NewServiceCard defaultImageSrc={serviceImage('').src} />}
        </div>
        {services.map((service, index) => (
          <ServiceEditorCard
            key={service.slug}
            index={index}
            canWrite={canWrite}
            service={{
              slug: service.slug,
              title: service.title,
              shortTitle: service.shortTitle,
              summary: service.summary,
              description: service.description,
              highlights: service.highlights,
              applications: service.applications,
              imageSrc: service.image.src,
              defaultImageSrc: service.defaultImageSrc,
              customImage: service.customImage,
              iconKey: service.iconKey,
              custom: service.custom,
              showOnHome: service.showOnHome,
            }}
          />
        ))}
      </div>

      {hidden.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-navy">Excluídos do site</h2>
            <p className="text-[13px] text-muted">Serviços originais que você tirou do site. Podem voltar quando quiser.</p>
          </div>
          {hidden.map((service) => (
            <HiddenServiceRow
              key={service.slug}
              slug={service.slug}
              shortTitle={service.shortTitle}
              imageSrc={service.image.src}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
