import { cn } from '@/lib/utils';

export function ContentCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-[14px] border border-border bg-white shadow-panel', className)}>
      {(title || description || actions) && (
        <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-semibold text-navy sm:text-xl">{title}</h2>}
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
