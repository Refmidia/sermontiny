import { SITE, absoluteUrl } from '@/lib/site';
import type { CompanySettings } from '@/types/database';
import { SERVICES } from '@/lib/content/services';

export function LocalBusinessJsonLd({ settings }: { settings: CompanySettings }) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: settings.trade_name,
    legalName: settings.legal_name,
    description: SITE.description,
    url: SITE.url,
    sameAs: [SITE.instagram],
    email: settings.email,
    telephone: settings.whatsapp || settings.phones[0],
    taxID: settings.cnpj,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${settings.street}, ${settings.number}`,
      addressLocality: settings.city,
      addressRegion: settings.state,
      postalCode: settings.zip,
      addressCountry: 'BR',
    },
    areaServed: 'Brasil',
    image: absoluteUrl('/opengraph-image'),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}

export function ServiceJsonLd() {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: SERVICES.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.title,
        description: service.summary,
        url: absoluteUrl(`/servicos/${service.slug}`),
        provider: {
          '@type': 'LocalBusiness',
          name: SITE.name,
        },
      },
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}
