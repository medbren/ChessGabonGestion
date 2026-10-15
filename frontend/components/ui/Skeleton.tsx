import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200/80',
        className
      )}
      aria-hidden="true"
    />
  );
}

/** Podium + table rows for the public rankings page */
export function RankingSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Chargement du classement">
      {/* Podium placeholders */}
      <div className="flex items-end justify-center gap-2 sm:gap-3">
        {[
          { w: 'w-20 sm:w-24', h: 'h-16' },
          { w: 'w-20 sm:w-24', h: 'h-24' },
          { w: 'w-20 sm:w-24', h: 'h-14' },
        ].map((s, i) => (
          <div key={i} className={cn('flex flex-col items-center', s.w)}>
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="mt-1.5 h-3 w-14" />
            <Skeleton className="mt-1 h-2 w-8" />
            <Skeleton className={cn('mt-2 w-full rounded-t-lg', s.h)} />
          </div>
        ))}
      </div>

      {/* Table rows */}
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-40 max-w-full" />
              </div>
              <Skeleton className="hidden h-3.5 w-12 sm:block" />
              <Skeleton className="hidden h-3.5 w-10 md:block" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

/** Header + table for admin members list */
export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Chargement des données">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 min-w-[200px] flex-1 rounded-lg" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="hidden bg-gray-50 px-3 py-2 sm:grid sm:grid-cols-6 sm:gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-6 sm:gap-2"
            >
              <Skeleton className="h-3 w-8" />
              <div className="flex flex-1 items-center gap-2 sm:contents">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
                <Skeleton className="hidden h-3.5 w-28 sm:block" />
                <Skeleton className="hidden h-3.5 w-20 sm:block" />
                <Skeleton className="hidden h-3.5 w-20 sm:block" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-7 w-14 rounded-md" />
                <Skeleton className="hidden h-7 w-16 rounded-md sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

/** Full-page admin bootstrap skeleton */
export function AdminPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface" role="status" aria-label="Chargement de l’administration">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </header>
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl gap-4 px-4 py-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="rounded-xl border border-border bg-white p-5 space-y-4">
          <Skeleton className="h-4 w-40" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <Skeleton className="mb-4 h-4 w-36" />
          <AdminTableSkeleton />
        </div>
      </main>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
