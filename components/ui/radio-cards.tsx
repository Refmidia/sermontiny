'use client';

import { cn } from '@/lib/utils';

export type RadioCardOption = {
  value: string;
  label: string;
  description?: string;
};

export function RadioCards({
  name,
  value,
  options,
  onChange,
  columns = 2,
  className,
}: {
  name?: string;
  value: string;
  options: RadioCardOption[];
  onChange: (value: string) => void;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'grid gap-2',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-3',
        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-xl border px-3 py-3 text-left transition-all',
              active
                ? 'border-gold bg-[#FFF8E8] shadow-[0_0_0_1px_rgba(214,167,44,0.45)]'
                : 'border-border bg-white hover:border-gold/50 hover:bg-paper-strong',
            )}
          >
            {name ? (
              <input type="radio" name={name} value={option.value} checked={active} readOnly className="sr-only" />
            ) : null}
            <span className={cn('block text-sm font-semibold', active ? 'text-navy' : 'text-navy/80')}>
              {option.label}
            </span>
            {option.description ? <span className="mt-1 block text-[12px] text-muted">{option.description}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
