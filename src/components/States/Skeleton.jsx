/**
 * Skeleton — pulsing placeholders for future async loading states.
 * SkeletonText / SkeletonCard are ready-made compositions.
 */
export function Skeleton({ className = '' }) {
  return (
    <div aria-hidden="true" className={`animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700 ${className}`} />
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={`h-4 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`surface p-4 ${className}`} aria-hidden="true">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="mt-3 h-8 w-16" />
    </div>
  )
}

export default Skeleton
