import Link from 'next/link';

export type Crumb = { href?: string; label: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-[13px] text-muted" aria-label="Breadcrumb">
      {items.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
          {crumb.href ? (
            <Link href={crumb.href} className="transition-colors hover:text-navy">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-navy">{crumb.label}</span>
          )}
          {index < items.length - 1 && <span className="text-border">/</span>}
        </span>
      ))}
    </nav>
  );
}
