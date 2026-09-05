import { cn } from '@/lib/utils';

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-[14px] border border-border bg-white p-5 shadow-panel md:p-6', className)}>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-navy">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function FormField({
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <label className="text-sm font-medium text-navy">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] text-muted">{hint}</p>}
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </div>
  );
}
