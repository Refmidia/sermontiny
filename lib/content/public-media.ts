export const PUBLIC_MEDIA = {
  hero: {
    src: '/images/sermontiny/hero-fachada.png',
    alt: 'Fachada da sede da Sermontiny em Tarumã, com o logo da engrenagem na parede azul',
    width: 680,
    height: 510,
  },
  about: {
    src: '/images/sermontiny/empresa-equipe.png',
    alt: 'Equipe da Sermontiny em reunião de segurança em área industrial',
    width: 680,
    height: 510,
  },
  aboutSide: {
    src: '/images/sermontiny/empresa-planta-industrial.webp',
    alt: 'Planta industrial com estruturas e chaminés',
    width: 900,
    height: 1200,
  },
  cta: {
    src: '/images/sermontiny/cta-operacao-industrial.webp',
    alt: 'Ambiente industrial com tubulações e operação em andamento',
    width: 1800,
    height: 900,
  },
  services: {
    'montagens-industriais': {
      src: '/images/sermontiny/servico-montagem-industrial.webp',
      alt: 'Montagem industrial em ambiente de planta',
    },
    'fabricacao-estruturas-metalicas': {
      src: '/images/sermontiny/servico-estrutura-metalica.webp',
      alt: 'Estrutura metálica em fase de montagem',
    },
    'manutencao-industrial': {
      src: '/images/sermontiny/servico-manutencao.webp',
      alt: 'Manutenção industrial em equipamento e estrutura',
    },
    'reservatorios-e-tubulacoes': {
      src: '/images/sermontiny/servico-reservatorios.webp',
      alt: 'Reservatórios e tubulações industriais',
    },
    'instalacoes-eletricas': {
      src: '/images/sermontiny/servico-instalacoes.webp',
      alt: 'Instalação industrial em área de processo',
    },
    'instalacoes-hidraulicas': {
      src: '/images/sermontiny/servico-instalacoes.webp',
      alt: 'Instalações industriais de utilidades',
    },
    'transporte-e-movimentacao-de-cargas': {
      src: '/images/sermontiny/servico-movimentacao-cargas.webp',
      alt: 'Movimentação de cargas com equipamento pesado',
    },
    'locacao-de-guindastes': {
      src: '/images/sermontiny/equipamento-xcmg-70t.webp',
      alt: 'Guindaste em operação de içamento',
    },
    'locacao-de-caminhoes-munck': {
      src: '/images/sermontiny/equipamento-xcmg-60t.webp',
      alt: 'Equipamento de movimentação em área industrial',
    },
    'prevencao-contra-incendio': {
      src: '/images/sermontiny/servico-reservatorios.webp',
      alt: 'Infraestrutura industrial associada a sistemas de segurança',
    },
  },
  equipment: {
    'guindaste-madal-md-30t': '/images/sermontiny/equipamento-madal-30t.webp',
    'guindaste-xcmg-60t': '/images/sermontiny/equipamento-xcmg-60t.webp',
    'guindaste-xcmg-70t': '/images/sermontiny/equipamento-xcmg-70t.webp',
    'guindaste-90t': '/images/sermontiny/equipamento-guindaste-90t.webp',
  },
  projects: [
    {
      src: '/images/sermontiny/projeto-industrial-01.webp',
      title: 'Montagem de estrutura industrial',
      segment: 'Usina e processo',
      alt: 'Vista de planta industrial com estruturas de grande porte',
    },
    {
      src: '/images/sermontiny/projeto-industrial-02.webp',
      title: 'Instalação de reservatórios',
      segment: 'Reservatórios e tubulações',
      alt: 'Reservatórios industriais em área de processo',
    },
    {
      src: '/images/sermontiny/projeto-industrial-03.webp',
      title: 'Montagem de estruturas metálicas',
      segment: 'Estruturas metálicas',
      alt: 'Estrutura metálica industrial em montagem',
    },
  ],
} as const;

export function serviceImage(slug: string) {
  return PUBLIC_MEDIA.services[slug as keyof typeof PUBLIC_MEDIA.services] ?? PUBLIC_MEDIA.services['montagens-industriais'];
}

export function equipmentFallbackImage(slug: string) {
  return PUBLIC_MEDIA.equipment[slug as keyof typeof PUBLIC_MEDIA.equipment] ?? PUBLIC_MEDIA.equipment['guindaste-xcmg-70t'];
}
