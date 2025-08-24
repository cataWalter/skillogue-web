// src/components/ProfileCardSkeleton.tsx
import React from 'react';
import Skeleton from './Skeleton';
import { User, MapPin, BookOpen, Heart, Calendar, Languages } from 'lucide-react';

const DetailItemSkeleton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <div className="flex items-start gap-4">
        <div className="mt-1 text-gray-600">{icon}</div>
        <div>
            <h3 className="text-sm font-medium text-gray-400">{label}</h3>
            <Skeleton className="h-5 w-32 mt-1" />
        </div>
    </div>
);

const ProfileCardSkeleton: React.FC = () => {
    return (
        <div className="bg-gray-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-2xl shadow-indigo-900/20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <Skeleton className="w-28 h-28 rounded-full flex-shrink-0" />
                <div className="flex-grow w-full space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-32 mt-2 sm:mt-0" />
                    </div>
                    <Skeleton className="h-4 w-40" />
                </div>
            </div>

            {/* About Me */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <BookOpen size={20} className="h-6 w-6 text-gray-600" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <div className="space-y-2 pl-9">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8 border-t border-b border-gray-800 py-8">
                <DetailItemSkeleton icon={<User size={20} />} label="Gender" />
                <DetailItemSkeleton icon={<Calendar size={20} />} label="Age" />
                <DetailItemSkeleton icon={<MapPin size={20} />} label="Location" />
                <DetailItemSkeleton icon={<Languages size={20} />} label="Languages" />
            </div>

            {/* Passions */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <Heart size={20} className="h-6 w-6 text-gray-600" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex flex-wrap gap-3 pl-9">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-28 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default ProfileCardSkeleton;