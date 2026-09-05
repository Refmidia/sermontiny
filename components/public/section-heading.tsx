import { cn } from '@/lib/utils';

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  invert = false,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  invert?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-5 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl">
        <p className={cn('text-[11px] font-semibold tracking-[0.22em] uppercase', invert ? 'text-gold' : 'text-gold-bright')}>
          {eyebrow}
        </p>
        <h2 className={cn('mt-2 text-3xl leading-tight font-bold md:text-4xl', invert ? 'text-white' : 'text-navy')}>
          {title}
        </h2>
        {description && (
          <p className={cn('mt-3 text-base leading-7', invert ? 'text-white/70' : 'text-muted')}>{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
