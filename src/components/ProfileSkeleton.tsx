import React from 'react';
import Skeleton from './Skeleton';

const ProfileSkeleton: React.FC = () => {
    return (
        <div className="bg-gray-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <Skeleton className="w-28 h-28 rounded-full" />
                <div className="flex-grow w-full flex flex-col items-center sm:items-start">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="mb-8">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8 border-t border-b border-gray-800 py-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSkeleton;
