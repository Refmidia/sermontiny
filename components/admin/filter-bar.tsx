import { cn } from '@/lib/utils';

export function FilterBar({
  children,
  count,
  className,
}: {
  children: React.ReactNode;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      {typeof count === 'number' && (
        <p className="text-[13px] whitespace-nowrap text-muted">{count} registro(s)</p>
      )}
    </div>
  );
}
