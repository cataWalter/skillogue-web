// src/components/ProfileCard.tsx
import React from 'react';
import { ShieldCheck, User, MapPin, BookOpen, Heart, Calendar, Languages, Clock } from 'lucide-react';
import Avatar from './Avatar';
import { FullProfile } from '../types';
import {
    getDisplayBio,
    getDisplayGender,
    getDisplayLocationParts,
    getDisplayName,
    getOptionalText,
} from '@/lib/profile-display';
import { commonLabels, profileCopy } from '@/lib/app-copy';

interface ProfileCardProps {
    profile: FullProfile;
    passions: string[];
    languages: string[];
    actionSlot: React.ReactNode;
}

const formatLocation = (location: FullProfile['locations']) => {
    if (!location) return getDisplayLocationParts([]);
    return getDisplayLocationParts([location.city, location.region, location.country]);
};

const getAboutHeading = (profile: FullProfile) => {
    const firstName = getOptionalText(profile.first_name);
    return firstName ? `About ${firstName}` : profileCopy.aboutThisUser;
};

const formatJoinedDate = (createdAt: string | null | undefined) => {
    if (!createdAt) {
        return null;
    }

    const joinedDate = new Date(createdAt);
    if (Number.isNaN(joinedDate.getTime())) {
        return null;
    }

    return joinedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
};

// 👇 CHANGE #1: Simplify the DetailItem component
const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null; children?: React.ReactNode }> = ({ icon, label, value, children }) => {
    if (!value && !children) return null;
    return (
        <div className="flex items-start gap-4">
            {/* Just render the icon directly, no cloning needed */}
            <div className="mt-1 text-indigo-400">{icon}</div>
            <div>
                <h3 className="text-sm font-medium text-gray-400">{label}</h3>
                {value && <p className="text-white font-medium">{value}</p>}
                {children}
            </div>
        </div>
    );
};

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, passions, languages, actionSlot }) => {
    const displayName = getDisplayName(profile.first_name, profile.last_name);
    const aboutHeading = getAboutHeading(profile);
    const aboutText = getDisplayBio(profile.about_me);
    const genderText = getDisplayGender(profile.gender);
    const joinedDate = formatJoinedDate(profile.created_at);

    return (
        <div className="bg-gray-900/80 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-2xl shadow-indigo-900/20 hover:shadow-indigo-900/40 hover:border-indigo-600/50 transition-all duration-300 card-hover-lift">
            {/* Header: Avatar, Name, Action Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                <Avatar seed={profile.id} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-indigo-500 shadow-lg" />
                <div className="flex-grow text-center sm:text-left w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate max-w-[200px] sm:max-w-none">{displayName}</h1>
                            {profile.verified && (
                                <span className="flex items-center gap-1 text-green-400 text-sm font-medium bg-green-500/10 px-2 py-1 rounded-full border border-green-500/30" title={profileCopy.verifiedUserTitle}>
                                    <ShieldCheck size={14} />
                                    <span className="hidden sm:inline">{profileCopy.verifiedBadge}</span>
                                </span>
                            )}
                        </div>
                        {actionSlot}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                        {joinedDate && (
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {profileCopy.joinedPrefix} {joinedDate}
                            </span>
                        )}
                        {profile.age && (
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {profileCopy.yearsOld(profile.age)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* About Me Section */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    {/* 👇 CHANGE #2: Pass props directly to the icon components */}
                    <BookOpen size={20} className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                    <h2 className="text-lg sm:text-xl font-semibold">{aboutHeading}</h2>
                </div>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap pl-0 sm:pl-9 text-sm sm:text-base">{aboutText}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6 mb-6 sm:mb-8 border-t border-b border-gray-800 py-6 sm:py-8">
                {/* 👇 CHANGE #2 (continued): Pass props directly to all icon components */}
                <DetailItem icon={<User size={20} />} label={commonLabels.gender} value={genderText} />
                {(profile.show_age !== false) && <DetailItem icon={<Calendar size={20} />} label={commonLabels.age} value={profile.age} />}
                {(profile.show_location !== false) && <DetailItem icon={<MapPin size={20} />} label={commonLabels.location} value={formatLocation(profile.locations)} />}
                {languages.length > 0 && (
                    <DetailItem icon={<Languages size={20} />} label={commonLabels.languages}>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {languages.map((lang) => (
                                <span key={lang} className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-700/50 text-indigo-200 rounded-full text-xs sm:text-sm">
                                    {lang}
                                </span>
                            ))}
                        </div>
                    </DetailItem>
                )}
            </div>

            {/* Passions Section */}
            {passions.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <Heart size={20} className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400" />
                        <h2 className="text-lg sm:text-xl font-semibold">{commonLabels.passions}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 pl-0 sm:pl-9">
                        {passions.map((passion) => (
                            <span key={passion} className="px-3 py-1 sm:px-4 sm:py-2 bg-indigo-900/70 text-indigo-200 rounded-full text-xs sm:text-sm border border-indigo-700/80 shadow-sm">
                                {passion}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileCard;