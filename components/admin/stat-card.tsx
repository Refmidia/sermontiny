import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  icon: Icon,
  tooltip,
  change,
  featured = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tooltip: string;
  change?: { value: string; positive: boolean } | null;
  featured?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <article
          className={cn(
            'rounded-[14px] border border-border p-5 shadow-panel',
            featured ? 'bg-navy text-white' : 'bg-white',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p className={cn('text-[13px] font-medium', featured ? 'text-white/70' : 'text-muted')}>{label}</p>
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                featured ? 'bg-white/10 text-gold' : 'bg-paper-strong text-navy',
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className={cn('mt-3 text-[28px] leading-none font-bold tracking-tight', featured ? 'text-white' : 'text-navy')}>
            {value}
          </p>
          {change && (
            <p
              className={cn(
                'mt-3 inline-flex rounded-full px-2 py-0.5 text-[12px] font-semibold',
                change.positive
                  ? featured
                    ? 'bg-white/10 text-[#8be0a6]'
                    : 'bg-success-soft text-success'
                  : featured
                    ? 'bg-white/10 text-[#ffb4ab]'
                    : 'bg-danger-soft text-danger',
              )}
            >
              {change.value} vs. mês anterior
            </p>
          )}
        </article>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
