import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  icon: Icon,
  tooltip,
  hint,
  change,
  featured = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tooltip: string;
  hint?: string;
  change?: { value: string; positive: boolean } | null;
  featured?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <article
          className={cn(
            'rounded-[14px] border p-5 shadow-panel transition-shadow hover:shadow-md',
            featured ? 'border-navy/20 bg-navy text-white' : 'border-border bg-white',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={cn('text-[13px] font-medium', featured ? 'text-white/70' : 'text-muted')}>{label}</p>
              {hint ? (
                <p className={cn('mt-0.5 text-[11px]', featured ? 'text-white/45' : 'text-muted/80')}>{hint}</p>
              ) : null}
            </div>
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                featured ? 'bg-white/10 text-white' : 'bg-info-soft text-info',
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p
            className={cn(
              'mt-4 text-[26px] leading-none font-bold tracking-tight tabular-nums sm:text-[28px]',
              featured ? 'text-white' : 'text-navy',
            )}
          >
            {value}
          </p>
          {change ? (
            <p
              className={cn(
                'mt-3 inline-flex rounded-lg px-2 py-1 text-[12px] font-semibold',
                change.positive
                  ? featured
                    ? 'bg-white/10 text-[#9BE4B0]'
                    : 'bg-success-soft text-success'
                  : featured
                    ? 'bg-white/10 text-[#FFB4AB]'
                    : 'bg-danger-soft text-danger',
              )}
            >
              {change.value} vs. mês anterior
            </p>
          ) : (
            <p className={cn('mt-3 text-[12px]', featured ? 'text-white/40' : 'text-muted')}>Sem base no mês anterior</p>
          )}
        </article>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
