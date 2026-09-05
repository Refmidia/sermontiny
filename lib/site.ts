export const SITE = {
  name: 'Sermontiny Montagens Industriais e Locações',
  legalName: 'Sermontiny Montagens Industriais LTDA',
  shortName: 'Sermontiny',
  description:
    'Empresa especializada em montagem industrial, fabricação e manutenção de usinas, estruturas metálicas, reservatórios, tubulações, locação de guindastes, muncks e equipamentos industriais.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sermontinymontagens.com.br',
  email: 'comercial@sermontinymontagens.com.br',
  website: 'https://www.sermontinymontagens.com.br',
  instagram: 'https://www.instagram.com/sermontiny_montagens/',
  instagramHandle: '@sermontiny_montagens',
  cnpj: '10.750.978/0001-24',
  stateRegistration: '731.067.344.116',
  address: {
    street: 'Rua Cambará',
    number: '319',
    district: 'Distrito Industrial',
    city: 'Tarumã',
    state: 'SP',
    zip: '19820-000',
    full: 'Rua Cambará, 319, Distrito Industrial, Tarumã/SP, CEP 19.820-000',
  },
  locale: 'pt_BR',
} as const;

export function absoluteUrl(path = '/') {
  const base = SITE.url.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
