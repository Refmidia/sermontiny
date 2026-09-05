import { PublicHeader } from '@/components/public/header';
import { PublicFooter } from '@/components/public/footer';
import { CookieBanner } from '@/components/public/cookie-banner';
import { LocalBusinessJsonLd } from '@/components/seo/json-ld';
import { getCompanySettings } from '@/lib/data/company';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getCompanySettings();

  return (
    <div className="flex min-h-full flex-col">
      <LocalBusinessJsonLd settings={settings} />
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter settings={settings} />
      <CookieBanner />
    </div>
  );
}
