import type { Metadata } from 'next';
import { PageHero } from '@/components/public/page-hero';
import { ServiceCard } from '@/components/public/service-card';
import { SiteContainer } from '@/components/public/site-container';
import { ServiceJsonLd } from '@/components/seo/json-ld';
import { getPublicServices } from '@/lib/data/services';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Serviços',
  description:
    'Montagens industriais, estruturas metálicas, manutenção, reservatórios, instalações e locação de guindastes e muncks.',
};

export default async function ServicesPage() {
  const { services, section } = await getPublicServices();
  return (
    <>
      <ServiceJsonLd />
      <PageHero
        eyebrow={section.eyebrow}
        title={section.title}
        description="Cada serviço possui página própria, com aplicações e critérios de execução."
      />
      <section className="bg-paper py-16">
        <SiteContainer className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard key={service.slug} service={service} index={index} title={service.title} />
          ))}
        </SiteContainer>
      </section>
    </>
  );
}
