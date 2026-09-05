import type { Metadata } from 'next';
import { ContactForm } from '@/components/public/contact-form';
import { PageHero } from '@/components/public/page-hero';
import { SiteContainer } from '@/components/public/site-container';
import { companyAddress } from '@/lib/data/company';
import { getCompanySettings } from '@/lib/data/company';
import { getPublicEquipment } from '@/lib/data/equipment';
import { SITE } from '@/lib/site';
import { commercialWhatsAppHref } from '@/lib/whatsapp-public';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com o comercial da Sermontiny para orçamentos de montagem e locação.',
};

export const dynamic = 'force-dynamic';

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ equipamento?: string }>;
}) {
  const [{ equipamento }, settings, equipment] = await Promise.all([
    searchParams,
    getCompanySettings(),
    getPublicEquipment(),
  ]);

  const mapQuery = encodeURIComponent(companyAddress(settings));
  const whatsappHref = commercialWhatsAppHref(settings.whatsapp);

  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Fale com o comercial"
        description="Informe o serviço, o equipamento de interesse e o período. Os contatos ficam registrados no painel."
      />
      <section className="bg-paper py-16">
        <SiteContainer className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-5">
            <div className="space-y-2 text-sm leading-7 text-navy">
              <p>{companyAddress(settings)}</p>
              {settings.email && (
                <p>
                  E-mail:{' '}
                  <a className="underline" href={`mailto:${settings.email}`}>
                    {settings.email}
                  </a>
                </p>
              )}
              {settings.whatsapp && (
                <p>
                  WhatsApp:{' '}
                  <a
                    className="underline"
                    href={whatsappHref}
                    target={whatsappHref.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                  >
                    {settings.whatsapp}
                  </a>
                </p>
              )}
              {settings.phones.map((phone) => (
                <p key={phone}>
                  Telefone:{' '}
                  <a className="underline" href={`tel:${phone.replace(/\D/g, '')}`}>
                    {phone}
                  </a>
                </p>
              ))}
              <p>
                Instagram:{' '}
                <a className="underline" href={SITE.instagram} target="_blank" rel="noreferrer">
                  {SITE.instagramHandle}
                </a>
              </p>
            </div>
            <iframe
              title="Mapa da Sermontiny"
              className="h-64 w-full rounded-[14px] border"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
            />
          </aside>
          <div className="rounded-[14px] border bg-white p-6 shadow-panel">
            <ContactForm equipment={equipment} selectedEquipmentId={equipamento} />
          </div>
        </SiteContainer>
      </section>
    </>
  );
}
