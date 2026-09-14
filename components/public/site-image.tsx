import { cn } from '@/lib/utils';

export function SiteImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  fill = false,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
}) {
  return (
    // Native img keeps PNG/WebP working on Vercel without the image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : (width ?? 1200)}
      height={fill ? undefined : (height ?? 800)}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn(fill ? 'absolute inset-0 h-full w-full object-cover' : 'h-auto w-full object-cover', className)}
    />
  );
}
