'use client';

import { cn } from '@/src/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-secondary',
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-4 w-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-border last:border-0 flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <Skeleton className="h-4 w-1/4 mb-4" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonChart };
