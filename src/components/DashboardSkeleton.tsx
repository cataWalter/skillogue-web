import React from 'react';
import Skeleton from './Skeleton';

const DashboardSkeleton: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="dashboard-skeleton">
            {/* Welcome Header */}
            <Skeleton className="h-12 w-3/4 sm:w-1/2 mb-8" />

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-900 p-6 rounded-2xl border border-gray-800 h-32">
                        <Skeleton className="w-8 h-8 mb-2" />
                        <Skeleton className="h-6 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Completion */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 h-48">
                        <Skeleton className="h-6 w-1/3 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>

                    {/* Recent Conversations */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                        <Skeleton className="h-6 w-1/3 mb-4" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-gray-800 p-4 rounded-xl flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-1/3 mb-2" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Passion Spotlight */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 h-64">
                        <Skeleton className="h-6 w-1/2 mb-4" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>

                    {/* Suggested Profiles */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                        <Skeleton className="h-6 w-1/2 mb-4" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-gray-800 p-4 rounded-xl flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <div className="flex-1">
                                        <Skeleton className="h-3 w-1/2 mb-1" />
                                        <Skeleton className="h-2 w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
