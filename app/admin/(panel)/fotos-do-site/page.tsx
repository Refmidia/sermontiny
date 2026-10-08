import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { requirePermission } from '@/lib/auth/session';
import { SITE_MEDIA_SLOTS, getAdminSiteMedia } from '@/lib/data/site-media';
import { PageHeader } from '@/components/admin/page-header';
import { SiteMediaCard } from '@/components/admin/site-media-editor';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function SiteMediaPage() {
  const user = await requirePermission('settings.read');
  const canWrite = user.permissions.includes('settings.write');
  const media = await getAdminSiteMedia();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fotos do site"
        description="Troque as fotos principais do site. Ao salvar, o site é atualizado na hora. As fotos dos serviços ficam em Serviços do site."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Fotos do site' }]}
        actions={
          <Button asChild variant="outline">
            <Link href="/" target="_blank">
              Ver no site
              <ExternalLink />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {SITE_MEDIA_SLOTS.map(({ slot, label, where }) => (
          <SiteMediaCard
            key={slot}
            slot={slot}
            label={label}
            where={where}
            src={media[slot].src}
            custom={media[slot].custom}
            canWrite={canWrite}
          />
        ))}
      </div>
    </div>
  );
}
