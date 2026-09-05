import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PhotoPlaceholder({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 border border-dashed border-white/20 bg-navy-deep/40 text-center text-white/70',
        className,
      )}
    >
      <Camera className="h-7 w-7 text-gold" aria-hidden />
      <p className="max-w-xs px-4 text-sm">{label}</p>
    </div>
  );
}
