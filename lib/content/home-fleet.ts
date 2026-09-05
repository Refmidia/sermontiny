import { equipmentFallbackImage } from '@/lib/content/public-media';
import type { Equipment } from '@/types/database';

export type FleetCard = {
  name: string;
  capacity: string;
  description: string;
  href: string;
  image: string;
  alt: string;
};

const FEATURED: Array<{
  name: string;
  capacity: string;
  description: string;
  slugHints: string[];
  nameHints: string[];
  fallbackImage: string;
}> = [
  {
    name: 'Guindaste Madal MD 30 t',
    capacity: '30 toneladas',
    description: 'Indicado para montagens e içamentos de médio porte em usinas e obras industriais.',
    slugHints: ['guindaste-madal-md-30t', 'madal'],
    nameHints: ['madal', '30'],
    fallbackImage: equipmentFallbackImage('guindaste-madal-md-30t'),
  },
  {
    name: 'Guindaste XCMG 60 t',
    capacity: '60 toneladas',
    description: 'Capacidade para estruturas metálicas e equipamentos de processo de maior alcance.',
    slugHints: ['guindaste-xcmg-60t'],
    nameHints: ['xcmg', '60'],
    fallbackImage: equipmentFallbackImage('guindaste-xcmg-60t'),
  },
  {
    name: 'Guindaste XCMG 70 t',
    capacity: '70 toneladas',
    description: 'Uso em reservatórios, usinas e estruturas de grande porte.',
    slugHints: ['guindaste-xcmg-70t'],
    nameHints: ['xcmg', '70'],
    fallbackImage: equipmentFallbackImage('guindaste-xcmg-70t'),
  },
  {
    name: 'Guindaste 90 t',
    capacity: '90 toneladas',
    description: 'Equipamento para operações pesadas de içamento e montagem industrial.',
    slugHints: ['guindaste-90t'],
    nameHints: ['90'],
    fallbackImage: equipmentFallbackImage('guindaste-90t'),
  },
];

export function featuredFleetCards(equipment: Equipment[], photoUrl: (path: string | null) => string | null): FleetCard[] {
  return FEATURED.map((item) => {
    const match = equipment.find(
      (row) =>
        item.slugHints.some((hint) => row.slug.includes(hint)) ||
        item.nameHints.every((hint) => row.name.toLowerCase().includes(hint)),
    );
    const photo = match ? photoUrl(match.photo_path) : null;
    return {
      name: match?.name ?? item.name,
      capacity: match?.capacity_tons ? `${match.capacity_tons} toneladas` : item.capacity,
      description: match?.description ?? item.description,
      href: match ? `/equipamentos/${match.slug}` : '/equipamentos',
      image: photo ?? item.fallbackImage,
      alt: match ? `Fotografia de ${match.name}` : item.name,
    };
  });
}
