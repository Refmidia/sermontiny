import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { Logo } from '@/components/public/logo';
import { SiteContainer } from '@/components/public/site-container';
import { companyAddress } from '@/lib/data/company';
import { SERVICES } from '@/lib/content/services';
import { SITE } from '@/lib/site';
import { commercialWhatsAppHref } from '@/lib/whatsapp-public';
import type { CompanySettings } from '@/types/database';

export function PublicFooter({ settings }: { settings: CompanySettings }) {
  const whatsappHref = commercialWhatsAppHref(settings.whatsapp);

  return (
    <footer className="bg-navy text-white">
      <SiteContainer className="grid gap-10 py-16 md:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
            {settings.legal_name} atua em montagem industrial, manutenção e locação de equipamentos para usinas e
            indústrias.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/85 transition-colors hover:border-gold hover:text-gold"
              aria-label="Instagram da Sermontiny"
            >
              <Instagram className="h-4 w-4" />
              {SITE.instagramHandle}
            </a>
          </div>
        </div>
        <div>
          <h2 className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">Empresa</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li><Link href="/empresa" className="hover:text-white">História</Link></li>
            <li><Link href="/empresa" className="hover:text-white">Qualidade</Link></li>
            <li><Link href="/projetos" className="hover:text-white">Projetos</Link></li>
            <li><Link href="/contato" className="hover:text-white">Contato</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">Equipamentos</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li><Link href="/equipamentos" className="hover:text-white">Guindastes</Link></li>
            <li><Link href="/servicos/locacao-de-caminhoes-munck" className="hover:text-white">Muncks</Link></li>
            <li><Link href="/servicos/transporte-e-movimentacao-de-cargas" className="hover:text-white">Prancha e mobilização</Link></li>
            <li><Link href="/equipamentos" className="hover:text-white">Catálogo completo</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">Serviços</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {SERVICES.slice(0, 6).map((service) => (
              <li key={service.slug}>
                <Link href={`/servicos/${service.slug}`} className="hover:text-white">
                  {service.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">Contato</h2>
          <address className="mt-4 space-y-2 text-sm not-italic text-white/75">
            <p>{companyAddress(settings)}</p>
            {settings.phones.map((phone) => (
              <p key={phone}>
                <a href={`tel:${phone.replace(/\D/g, '')}`} className="hover:text-white">
                  {phone}
                </a>
              </p>
            ))}
            {settings.whatsapp && (
              <p>
                <a href={whatsappHref} className="hover:text-white" target={whatsappHref.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  WhatsApp {settings.whatsapp}
                </a>
              </p>
            )}
            {settings.email && (
              <p>
                <a href={`mailto:${settings.email}`} className="hover:text-white">
                  {settings.email}
                </a>
              </p>
            )}
          </address>
        </div>
      </SiteContainer>
      <div className="border-t border-white/10">
        <SiteContainer className="flex flex-col gap-3 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.legal_name}. Todos os direitos reservados.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacidade" className="hover:text-white">Política de privacidade</Link>
            <Link href="/termos" className="hover:text-white">Termos de uso</Link>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
          </div>
        </SiteContainer>
      </div>
    </footer>
  );
}

