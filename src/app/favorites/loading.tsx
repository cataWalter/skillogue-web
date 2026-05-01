import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-surface rounded-[1.75rem] p-4 space-y-3">
              <Skeleton className="w-16 h-16 rounded-full mx-auto" />
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
