'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar',
  className,
  name,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  name?: string;
}) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input
        name={name}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        className="h-[42px] bg-paper-strong pl-9"
      />
    </div>
  );
}
