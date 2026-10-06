import variants from '@/lib/content/image-variants.json';
import { cn } from '@/lib/utils';

const VARIANTS = variants as unknown as Record<string, [string, number][]>;

function srcSetFor(src: string) {
  return VARIANTS[src]?.map(([file, width]) => `${file} ${width}w`).join(', ');
}

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
  sizes?: string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
}) {
  const srcSet = srcSetFor(src);

  return (
    // Native img keeps PNG/WebP working on Vercel without the image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      alt={alt}
      width={fill ? undefined : (width ?? 1200)}
      height={fill ? undefined : (height ?? 800)}
      sizes={srcSet ? (sizes ?? '100vw') : sizes}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn(fill ? 'absolute inset-0 h-full w-full object-cover' : 'h-auto w-full object-cover', className)}
    />
  );
}
