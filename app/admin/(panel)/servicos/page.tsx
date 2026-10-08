import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { requirePermission } from '@/lib/auth/session';
import { serviceImage } from '@/lib/content/public-media';
import { getAdminServices } from '@/lib/data/services';
import { PageHeader } from '@/components/admin/page-header';
import { ServiceEditorCard, ServicesSectionForm } from '@/components/admin/site-services-editor';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function SiteServicesPage() {
  const user = await requirePermission('settings.read');
  const canWrite = user.permissions.includes('settings.write');
  const { services, section } = await getAdminServices();

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
              defaultImageSrc: serviceImage(service.slug).src,
              customImage: service.customImage,
            }}
          />
        ))}
      </div>
    </div>
  );
}
