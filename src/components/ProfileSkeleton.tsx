import React from 'react';
import Skeleton from './Skeleton';

const ProfileSkeleton: React.FC = () => {
    return (
        <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <Skeleton className="h-28 w-28 rounded-full" />
                <div className="flex-grow w-full flex flex-col items-center sm:items-start">
                    <Skeleton className="mb-2 h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="glass-surface mb-8 rounded-[1.5rem] p-5 sm:p-6">
                <Skeleton className="mb-4 h-6 w-40" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 border-y border-line/20 py-8 md:grid-cols-2">
                <div className="glass-surface flex items-center gap-4 rounded-2xl p-4">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="mb-1 h-3 w-16" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <div className="glass-surface flex items-center gap-4 rounded-2xl p-4">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="mb-1 h-3 w-16" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSkeleton;
