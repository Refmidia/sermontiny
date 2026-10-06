'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LEAD_STATUS_LABELS, LEAD_STATUS_OPTIONS, leadStatusSelectClass } from '@/lib/leads/ui';
import type { LeadStatus } from '@/types/database';

export function LeadStatusSelect({
  value,
  disabled,
  pending,
  onChange,
  className,
}: {
  value: LeadStatus;
  disabled?: boolean;
  pending?: boolean;
  onChange: (status: LeadStatus) => void;
  className?: string;
}) {
  return (
    <div className={cn('relative inline-flex min-w-[128px]', className)}>
      <select
        value={value}
        disabled={disabled || pending}
        aria-label="Status do contato"
        onChange={(event) => onChange(event.target.value as LeadStatus)}
        className={cn(
          'h-8 w-full appearance-none rounded-lg border px-2.5 pr-7 text-[12px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-gold/50 disabled:cursor-not-allowed disabled:opacity-70',
          leadStatusSelectClass(value),
        )}
      >
        {LEAD_STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {LEAD_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      {pending ? (
        <Loader2 className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 animate-spin opacity-70" />
      ) : (
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] opacity-60">▾</span>
      )}
    </div>
  );
}
