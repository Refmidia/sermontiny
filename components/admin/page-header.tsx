import { cn } from '@/lib/utils';
import { Breadcrumbs, type Crumb } from '@/components/admin/breadcrumbs';

export function PageHeader({
  title,
  description,
  crumbs,
  actions,
}: {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <div className="mb-2">
            <Breadcrumbs items={crumbs} />
          </div>
        )}
        <h1 className="text-[30px] leading-tight font-bold text-navy md:text-[32px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className={cn('flex flex-wrap gap-2')}>{actions}</div>}
    </div>
  );
}
