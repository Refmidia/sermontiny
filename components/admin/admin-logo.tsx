import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AdminLogo({
  href = '/admin',
  compact = false,
  inverted = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  const src = inverted
    ? '/images/sermontiny/logo-oficial-white.png'
    : '/images/sermontiny/logo-oficial-nav.png';

  return (
    <Link
      href={href}
      className={cn('flex min-w-0 items-center justify-center overflow-hidden', className)}
      aria-label="Sermontiny"
    >
      {compact ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white font-display text-sm font-bold tracking-tight text-navy">
          SM
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Sermontiny Montagens Industriais e Locações"
          width={1006}
          height={298}
          className="h-12 w-auto max-w-[210px] object-contain object-center"
        />
      )}
    </Link>
  );
}
