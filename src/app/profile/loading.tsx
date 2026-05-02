import ProfileSkeleton from '@/components/ProfileSkeleton';

export default function Loading() {
    return (
        <main className="editorial-shell flex-grow py-8 sm:py-12 lg:py-16">
            <div className="max-w-4xl mx-auto">
                <ProfileSkeleton />
            </div>
        </main>
    );
}
