import {
  Building2,
  Cable,
  Cog,
  Construction,
  Container,
  Factory,
  Flame,
  Forklift,
  Hammer,
  HardHat,
  Pipette,
  ShieldCheck,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const SERVICE_ICON_OPTIONS = [
  { key: 'factory', label: 'Fábrica', icon: Factory },
  { key: 'hammer', label: 'Martelo', icon: Hammer },
  { key: 'wrench', label: 'Chave', icon: Wrench },
  { key: 'cog', label: 'Engrenagem', icon: Cog },
  { key: 'container', label: 'Reservatório', icon: Container },
  { key: 'pipette', label: 'Tubulação', icon: Pipette },
  { key: 'cable', label: 'Cabo elétrico', icon: Cable },
  { key: 'zap', label: 'Energia', icon: Zap },
  { key: 'flame', label: 'Fogo', icon: Flame },
  { key: 'forklift', label: 'Empilhadeira / içamento', icon: Forklift },
  { key: 'truck', label: 'Caminhão', icon: Truck },
  { key: 'hardhat', label: 'Capacete', icon: HardHat },
  { key: 'construction', label: 'Obra', icon: Construction },
  { key: 'building', label: 'Prédio', icon: Building2 },
  { key: 'shield', label: 'Segurança', icon: ShieldCheck },
] as const satisfies readonly { key: string; label: string; icon: LucideIcon }[];

export function serviceIcon(key: string | null | undefined): LucideIcon | null {
  return SERVICE_ICON_OPTIONS.find((option) => option.key === key)?.icon ?? null;
}

export function serviceIconKey(icon: LucideIcon) {
  return SERVICE_ICON_OPTIONS.find((option) => option.icon === icon)?.key ?? 'factory';
}
