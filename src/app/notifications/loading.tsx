import Skeleton from '@/components/Skeleton';

export default function Loading() {
    return (
        <main className="editorial-shell flex-grow py-8 sm:py-12 lg:py-16">
            <div className="max-w-2xl mx-auto space-y-4">
                <Skeleton className="h-8 w-48" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="glass-surface rounded-[1.75rem] p-4 flex items-start gap-3">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
