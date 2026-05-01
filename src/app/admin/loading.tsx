import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-72 border-r border-line/30 bg-surface/90 p-4">
        <Skeleton className="h-20 w-full rounded-2xl mb-4" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
