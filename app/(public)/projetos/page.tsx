import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/public/page-hero';
import { SiteContainer } from '@/components/public/site-container';
import { SiteImage } from '@/components/public/site-image';
import { Button } from '@/components/ui/button';
import { PUBLIC_MEDIA } from '@/lib/content/public-media';

export const metadata: Metadata = {
  title: 'Projetos',
  description: 'Projetos de montagem industrial, reservatórios e estruturas metálicas da Sermontiny.',
};

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        eyebrow="Nossos projetos"
        title="Projetos que demonstram nossa capacidade."
        description="Galeria institucional com operações típicas de montagem industrial. Não exibimos marcas de clientes sem autorização."
      />
      <section className="bg-paper py-16">
        <SiteContainer className="grid gap-6 md:grid-cols-3">
          {PUBLIC_MEDIA.projects.map((project) => (
            <article key={project.title} className="overflow-hidden rounded-[14px] bg-white shadow-panel">
              <SiteImage
                src={project.src}
                alt={project.alt}
                width={800}
                height={520}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="aspect-[5/4] w-full"
              />
              <div className="p-5">
                <h2 className="text-lg font-semibold text-navy">{project.title}</h2>
                <p className="mt-1 text-sm text-muted">{project.segment}</p>
              </div>
            </article>
          ))}
        </SiteContainer>
        <SiteContainer className="mt-10">
          <Button asChild variant="gold">
            <Link href="/contato">Solicitar orçamento</Link>
          </Button>
        </SiteContainer>
      </section>
    </>
  );
}
