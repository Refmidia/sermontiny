'use client';

import { CheckCircle2, Clock3, UserPlus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const CARDS = [
  {
    key: 'total',
    label: 'Total de contatos',
    icon: Users,
    tone: 'bg-info-soft text-info',
  },
  {
    key: 'new',
    label: 'Novos',
    icon: UserPlus,
    tone: 'bg-[#FFF4CC] text-[#8a6a12]',
  },
  {
    key: 'in_progress',
    label: 'Em andamento',
    icon: Clock3,
    tone: 'bg-info-soft text-info',
  },
  {
    key: 'converted',
    label: 'Convertidos',
    icon: CheckCircle2,
    tone: 'bg-success-soft text-success',
  },
] as const;

export function LeadKpiCards({
  total,
  novos,
  emAndamento,
  convertidos,
}: {
  total: number;
  novos: number;
  emAndamento: number;
  convertidos: number;
}) {
  const values = {
    total,
    new: novos,
    in_progress: emAndamento,
    converted: convertidos,
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.key}
            className="rounded-[12px] border border-border bg-white px-4 py-3 shadow-panel"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-medium text-muted">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-navy">{values[card.key]}</p>
              </div>
              <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-lg', card.tone)}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
