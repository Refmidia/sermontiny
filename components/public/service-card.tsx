import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteImage } from '@/components/public/site-image';
import { serviceImage } from '@/lib/content/public-media';
import type { ServicePage } from '@/lib/content/services';

export function ServiceCard({
  service,
  index,
  title,
}: {
  service: ServicePage;
  index?: number;
  title?: string;
}) {
  const image = serviceImage(service.slug);
  const heading = title ?? service.shortTitle;

  return (
    <Link
      href={`/servicos/${service.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-white shadow-panel transition-shadow hover:shadow-[0_16px_40px_rgba(7,27,53,0.1)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-navy">
        <SiteImage
          src={image.src}
          alt={image.alt}
          width={800}
          height={500}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/55 via-navy/10 to-transparent" />
        {typeof index === 'number' && (
          <span className="absolute top-4 left-4 text-[11px] font-semibold tracking-[0.18em] text-white/80">
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-6 pt-5 pb-6">
        <service.icon className="h-5 w-5 text-gold" strokeWidth={1.75} />
        <h3 className="mt-3 text-xl font-semibold text-navy">{heading}</h3>
        <span className="mt-3 h-0.5 w-8 bg-gold transition-all group-hover:w-14" />
        <p className="mt-3 flex-1 text-sm leading-6 text-muted">{service.summary}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy">
          Ver detalhes
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
