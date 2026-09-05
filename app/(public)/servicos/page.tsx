import type { Metadata } from 'next';
import { PageHero } from '@/components/public/page-hero';
import { ServiceCard } from '@/components/public/service-card';
import { SiteContainer } from '@/components/public/site-container';
import { ServiceJsonLd } from '@/components/seo/json-ld';
import { SERVICES } from '@/lib/content/services';

export const metadata: Metadata = {
  title: 'Serviços',
  description:
    'Montagens industriais, estruturas metálicas, manutenção, reservatórios, instalações e locação de guindastes e muncks.',
};

export default function ServicesPage() {
  return (
    <>
      <ServiceJsonLd />
      <PageHero
        eyebrow="Nossos serviços"
        title="Soluções para operações exigentes."
        description="Cada serviço possui página própria, com aplicações e critérios de execução."
      />
      <section className="bg-paper py-16">
        <SiteContainer className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {SERVICES.map((service, index) => (
            <ServiceCard key={service.slug} service={service} index={index} title={service.title} />
          ))}
        </SiteContainer>
      </section>
    </>
  );
}
