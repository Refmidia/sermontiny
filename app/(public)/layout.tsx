import { PublicHeader } from '@/components/public/header';
import { PublicFooter } from '@/components/public/footer';
import { CookieBanner } from '@/components/public/cookie-banner';
import { WhatsAppWidget } from '@/components/public/whatsapp-widget';
import { LocalBusinessJsonLd } from '@/components/seo/json-ld';
import { getPublicCompanySettings } from '@/lib/data/company';
import { commercialWhatsAppHref } from '@/lib/whatsapp-public';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicCompanySettings();

  return (
    <div className="flex min-h-full flex-col">
      <LocalBusinessJsonLd settings={settings} />
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter settings={settings} />
      {settings.whatsapp && (
        <WhatsAppWidget href={commercialWhatsAppHref(settings.whatsapp)} phone={settings.whatsapp} />
      )}
      <CookieBanner />
    </div>
  );
}
