import {
  Cable,
  Container,
  Factory,
  Flame,
  Forklift,
  Hammer,
  HardHat,
  Pipette,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type ServicePage = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  description: string;
  highlights: string[];
  applications: string[];
  icon: LucideIcon;
};

export const SERVICES: ServicePage[] = [
  {
    slug: 'montagens-industriais',
    title: 'Montagens industriais',
    shortTitle: 'Montagens industriais',
    summary: 'Montagem de usinas, linhas de processo e estruturas em ambiente industrial.',
    description:
      'A Sermontiny executa montagens industriais com planejamento de içamento, equipe qualificada e controle de segurança. Atuamos na implantação e na adequação de plantas, com coordenação entre fabricação, transporte e instalação.',
    highlights: [
      'Planejamento de montagem e sequência de içamento',
      'Equipes próprias e equipamentos compatíveis com o porte da obra',
      'Controle de qualidade dimensional e de soldas',
      'Documentação de segurança e diário de obra',
    ],
    applications: ['Usinas', 'Indústrias de processo', 'Expansões de planta', 'Paradas programadas'],
    icon: Factory,
  },
  {
    slug: 'fabricacao-estruturas-metalicas',
    title: 'Fabricação de estruturas metálicas',
    shortTitle: 'Estruturas metálicas',
    summary: 'Fabricação e montagem de estruturas metálicas para usinas e edificações industriais.',
    description:
      'Projetamos a execução e fabricamos estruturas metálicas com rastreabilidade de materiais, soldagem controlada e preparação para montagem em campo. O objetivo é reduzir retrabalho e prazo no canteiro.',
    highlights: [
      'Fabricação sob projeto ou detalhamento executivo',
      'Preparação, solda e acabamento controlados',
      'Identificação de peças e logística de entrega',
      'Montagem com equipamentos próprios',
    ],
    applications: ['Galpões', 'Passarelas', 'Suportes de processo', 'Estruturas de reservatórios'],
    icon: Hammer,
  },
  {
    slug: 'manutencao-industrial',
    title: 'Manutenção industrial',
    shortTitle: 'Manutenção industrial',
    summary: 'Manutenção corretiva e programada em estruturas, equipamentos e utilidades.',
    description:
      'Prestamos manutenção industrial com foco em segurança, janela de parada e retomada da operação. Atendemos correções estruturais, adequações e apoio a equipes de manutenção da contratante.',
    highlights: [
      'Atendimento em paradas e janelas curtas',
      'Equipe familiarizada com ambiente industrial',
      'Apoio com guindaste, munck e movimentação',
      'Registro das intervenções executadas',
    ],
    applications: ['Paradas de usina', 'Recuperação estrutural', 'Substituição de equipamentos', 'Adequações'],
    icon: Wrench,
  },
  {
    slug: 'reservatorios-e-tubulacoes',
    title: 'Reservatórios e tubulações',
    shortTitle: 'Reservatórios e tubulações',
    summary: 'Fabricação, montagem e manutenção de reservatórios e linhas de tubulação.',
    description:
      'Executamos reservatórios e tubulações industriais com atenção a estanqueidade, acessos, tesouras e interferências de planta. O serviço pode incluir fabricação, transporte, içamento e interligações.',
    highlights: [
      'Montagem de tanques e reservatórios',
      'Tubulações de processo e utilidades',
      'Içamento e posicionamento controlado',
      'Acabamento, testes e liberação conforme escopo',
    ],
    applications: ['Água industrial', 'Efluentes', 'Tanques de processo', 'Linhas de interligação'],
    icon: Container,
  },
  {
    slug: 'instalacoes-eletricas',
    title: 'Instalações elétricas',
    shortTitle: 'Instalações elétricas',
    summary: 'Instalações elétricas industriais associadas a montagens e adequações de planta.',
    description:
      'Realizamos instalações elétricas no contexto de obras industriais, com organização de eletrocalhas, quadros, iluminação de área e infraestrutura para equipamentos, sempre alinhadas às normas aplicáveis ao site.',
    highlights: [
      'Infraestrutura elétrica de área industrial',
      'Apoio à montagem de equipamentos',
      'Organização de percursos e identificações',
      'Integração com as demais disciplinas da obra',
    ],
    applications: ['Quadros e distribuição', 'Iluminação industrial', 'Infraestrutura de campo', 'Adequações'],
    icon: Cable,
  },
  {
    slug: 'instalacoes-hidraulicas',
    title: 'Instalações hidráulicas',
    shortTitle: 'Instalações hidráulicas',
    summary: 'Instalações hidráulicas industriais para água, utilidades e apoio operacional.',
    description:
      'Executamos instalações hidráulicas industriais vinculadas a montagens, reservatórios e utilidades de planta, com atenção a vazão, acessos de manutenção e interferências com estruturas e equipamentos.',
    highlights: [
      'Redes de água e utilidades',
      'Interligações com reservatórios',
      'Organização de percursos e suportes',
      'Testes previstos no escopo contratado',
    ],
    applications: ['Utilidades', 'Captação e recalque', 'Redes de área', 'Apoio a montagens'],
    icon: Pipette,
  },
  {
    slug: 'prevencao-contra-incendio',
    title: 'Prevenção contra incêndio',
    shortTitle: 'Prevenção contra incêndio',
    summary: 'Instalações e adequações de prevenção contra incêndio em ambientes industriais.',
    description:
      'Atuamos em instalações de prevenção contra incêndio associadas a obras industriais, observando as exigências do projeto, do corpo de bombeiros e das normas internas da contratante.',
    highlights: [
      'Execução conforme projeto aprovado',
      'Integração com estruturas e tubulações',
      'Organização de acessos e sinalização de obra',
      'Documentação de conclusão do escopo',
    ],
    applications: ['Hidrantes', 'Sprinklers', 'Reservatórios de incêndio', 'Adequações prediais industriais'],
    icon: Flame,
  },
  {
    slug: 'locacao-de-guindastes',
    title: 'Locação de guindastes',
    shortTitle: 'Locação de guindastes',
    summary: 'Locação de guindastes com operador para montagens e içamentos industriais.',
    description:
      'Disponibilizamos guindastes de diferentes capacidades para obras industriais, com operador, condições comerciais claras e apoio para mobilização. Os valores não são exibidos no site público por padrão.',
    highlights: [
      'Equipamentos de 30 a 90 toneladas',
      'Operador qualificado',
      'Condições de diária, hora e mensal',
      'Apoio para mobilização e plano de içamento',
    ],
    applications: ['Montagens', 'Paradas', 'Carga e descarga pesada', 'Posicionamento de equipamentos'],
    icon: Forklift,
  },
  {
    slug: 'locacao-de-caminhoes-munck',
    title: 'Locação de caminhões munck',
    shortTitle: 'Locação de muncks',
    summary: 'Locação de caminhões munck para carga, descarga e movimentações de médio porte.',
    description:
      'Os caminhões munck da Sermontiny atendem obras que exigem agilidade de deslocamento e içamento auxiliar. Indicados para peças, estruturas e apoio logístico em plantas industriais.',
    highlights: [
      'Muncks TKA e Rodomaq',
      'Capacidades de 25 a 45 toneladas',
      'Agilidade de mobilização',
      'Operação com equipe da Sermontiny',
    ],
    applications: ['Carga e descarga', 'Apoio a montagem', 'Peças e estruturas', 'Serviços urbanos e industriais'],
    icon: Truck,
  },
  {
    slug: 'transporte-e-movimentacao-de-cargas',
    title: 'Transporte e movimentação de cargas',
    shortTitle: 'Transporte e movimentação',
    summary: 'Prancha, mobilização e movimentação de cargas com planejamento de acesso.',
    description:
      'Oferecemos transporte em caminhão-prancha e serviços de mobilização e desmobilização, com cobrança por quilômetro e avaliação prévia de acesso, peso e dimensões da carga.',
    highlights: [
      'Caminhão-prancha 2 eixos',
      'Mobilização e desmobilização por quilômetro',
      'Avaliação de acesso e interferências',
      'Integração com içamento no destino',
    ],
    applications: ['Transporte de equipamentos', 'Mudança de peças', 'Apoio a montagens', 'Logística de obra'],
    icon: HardHat,
  },
];

export function getService(slug: string) {
  return SERVICES.find((service) => service.slug === slug);
}
