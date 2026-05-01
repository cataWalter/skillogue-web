import Skeleton from '@/components/Skeleton';

export default function Loading() {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="glass-surface rounded-[1.75rem] p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-8 w-20 rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
