import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-11 w-full max-w-sm rounded-lg" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-[14px]" />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return <Skeleton className="h-32 rounded-[14px]" />;
}
