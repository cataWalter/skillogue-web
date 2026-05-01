import SearchSkeleton from '@/components/SearchSkeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <SearchSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
