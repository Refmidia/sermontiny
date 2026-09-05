import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  text,
  action,
  className,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-[14px] border border-dashed border-border bg-white px-6 py-12 text-center', className)}>
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{text}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
