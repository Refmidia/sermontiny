import Image from 'next/image';
import { cn } from '@/lib/utils';

export function SiteImage({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  className,
  fill = false,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes: string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
}) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn('object-cover', className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 1200}
      height={height ?? 800}
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
    />
  );
}
