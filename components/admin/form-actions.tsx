import { cn } from '@/lib/utils';

export function FormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-2 border-t border-border pt-5', className)}>
      {children}
    </div>
  );
}
