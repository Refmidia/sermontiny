import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SiteContainer } from '@/components/public/site-container';
import { SiteImage } from '@/components/public/site-image';
import { getService, SERVICES } from '@/lib/content/services';
import { serviceImage } from '@/lib/content/public-media';
import { SITE, absoluteUrl } from '@/lib/site';

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.summary,
    openGraph: {
      title: `${service.title} | ${SITE.shortName}`,
      description: service.summary,
      url: absoluteUrl(`/servicos/${service.slug}`),
    },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  const image = serviceImage(service.slug);

  return (
    <div className="bg-white py-16">
      <SiteContainer className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">Serviço</p>
          <h1 className="mt-3 text-4xl font-bold text-navy">{service.title}</h1>
          <div className="gold-rule mt-5" />
          <p className="mt-6 text-lg leading-8 text-muted">{service.description}</p>
          <h2 className="mt-10 text-2xl font-semibold text-navy">Como executamos</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {service.highlights.map((item) => (
              <li key={item} className="border-l-2 border-gold pl-3">
                {item}
              </li>
            ))}
          </ul>
          <h2 className="mt-10 text-2xl font-semibold text-navy">Aplicações</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {service.applications.map((item) => (
              <span key={item} className="rounded-full border border-border bg-paper px-3 py-1 text-sm text-navy">
                {item}
              </span>
            ))}
          </div>
          <Button asChild variant="gold" className="mt-10">
            <Link href="/contato">Solicitar orçamento</Link>
          </Button>
        </div>
        <SiteImage
          src={image.src}
          alt={image.alt}
          width={900}
          height={720}
          sizes="(max-width: 1024px) 100vw, 42vw"
          className="min-h-80 w-full rounded-[14px]"
        />
      </SiteContainer>
    </div>
  );
}
