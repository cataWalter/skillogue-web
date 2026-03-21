import React from 'react';
import Skeleton from './Skeleton';

const SearchSkeleton: React.FC = () => {
    return (
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
                <div className="flex-grow w-full text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
                        <Skeleton className="h-10 w-28 mt-2 sm:mt-0 mx-auto sm:mx-0 rounded-lg" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mx-auto sm:mx-0" />
                </div>
            </div>

            <div className="border-t border-gray-800 my-4"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-5 h-5 rounded" />
                    <div>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="w-5 h-5 rounded" />
                    <div>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default SearchSkeleton;
