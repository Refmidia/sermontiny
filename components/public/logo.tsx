import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({
  className,
  compact = false,
  href = '/',
  inverted = false,
}: {
  className?: string;
  compact?: boolean;
  href?: string;
  inverted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-w-0 shrink-0 items-center',
        inverted && 'rounded-md bg-white px-2 py-1',
        className,
      )}
      aria-label="Sermontiny"
    >
      {/* Native img keeps PNG alpha intact; next/image can paint dark fringe as black boxes. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sermontiny/logo-oficial-nav.png"
        alt="Sermontiny Montagens Industriais e Locações"
        width={1006}
        height={298}
        decoding="async"
        fetchPriority={inverted ? 'auto' : 'high'}
        className={cn(
          'h-[52px] w-auto max-w-[min(100%,220px)] object-contain object-left sm:h-[62px] sm:max-w-[260px]',
          compact && 'h-11 max-w-[180px] sm:h-11',
        )}
      />
    </Link>
  );
}
