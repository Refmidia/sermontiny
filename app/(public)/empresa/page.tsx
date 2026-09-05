import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/public/page-hero';
import { SiteContainer } from '@/components/public/site-container';
import { SiteImage } from '@/components/public/site-image';
import { Button } from '@/components/ui/button';
import { COMPANY_STORY } from '@/lib/content/company';
import { PUBLIC_MEDIA } from '@/lib/content/public-media';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { publicStorageUrl } from '@/lib/storage-url';

export const metadata: Metadata = {
  title: 'Empresa',
  description: 'História, missão, visão, valores, segurança e qualidade da Sermontiny.',
};

export const dynamic = 'force-dynamic';

export default async function CompanyPage() {
  const certificates = isSupabaseConfigured()
    ? await (async () => {
        const supabase = await createClient();
        const { data } = await supabase
          .from('documents')
          .select('id, file_name, storage_path')
          .eq('kind', 'certificate')
          .is('deleted_at', null)
          .limit(12);
        return data ?? [];
      })()
    : [];

  return (
    <>
      <PageHero
        eyebrow="Quem somos"
        title="Experiência que movimenta a indústria."
        description="Sermontiny Montagens Industriais e Locações, com base em Tarumã/SP."
      />
      <section className="bg-white py-16">
        <SiteContainer className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-lg leading-8 text-muted">{COMPANY_STORY.history}</p>
            <Button asChild variant="gold" className="mt-8">
              <Link href="/contato">Falar com o comercial</Link>
            </Button>
          </div>
          <SiteImage
            src={PUBLIC_MEDIA.about.src}
            alt={PUBLIC_MEDIA.about.alt}
            width={900}
            height={720}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="aspect-[5/4] w-full rounded-[14px]"
          />
        </SiteContainer>
        <SiteContainer className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="rounded-[14px] border border-border bg-paper p-6">
            <h2 className="text-2xl font-semibold text-navy">Missão</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{COMPANY_STORY.mission}</p>
          </section>
          <section className="rounded-[14px] border border-border bg-paper p-6">
            <h2 className="text-2xl font-semibold text-navy">Visão</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{COMPANY_STORY.vision}</p>
          </section>
        </SiteContainer>
        <SiteContainer className="mt-12">
          <h2 className="text-2xl font-semibold text-navy">Valores</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {COMPANY_STORY.values.map((value) => (
              <div key={value.title} className="rounded-[14px] border border-border p-5">
                <h3 className="text-lg font-semibold text-navy">{value.title}</h3>
                <p className="mt-2 text-sm text-muted">{value.text}</p>
              </div>
            ))}
          </div>
        </SiteContainer>
        <SiteContainer className="mt-12 grid gap-6 md:grid-cols-3">
          <section>
            <h2 className="text-2xl font-semibold text-navy">Segurança</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{COMPANY_STORY.safety}</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-navy">Qualidade</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{COMPANY_STORY.quality}</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-navy">Normas e treinamentos</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{COMPANY_STORY.standards}</p>
          </section>
        </SiteContainer>
        <SiteContainer className="mt-12">
          <h2 className="text-2xl font-semibold text-navy">Certificados</h2>
          {certificates.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Os certificados oficiais ficam disponíveis mediante solicitação e, quando enviados pelo painel, nesta
              página.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {certificates.map((doc) => (
                <li key={doc.id} className="rounded-[14px] border border-border bg-paper px-4 py-3 text-sm">
                  <a
                    href={publicStorageUrl('certificates', doc.storage_path) ?? '#'}
                    className="text-navy underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {doc.file_name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </SiteContainer>
      </section>
    </>
  );
}
