// src/components/ProfileCard.tsx
import React from 'react';
import { ShieldCheck, User, MapPin, BookOpen, Heart, Calendar, Languages, Clock, LogIn } from 'lucide-react';
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

    return joinedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatLastLoginDate = (lastLogin: string | null | undefined) => {
    if (!lastLogin) {
        return profileCopy.lastLoginNever;
    }

    const date = new Date(lastLogin);
    if (Number.isNaN(date.getTime())) {
        return profileCopy.lastLoginNever;
    }

    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const getDisplayAge = (age: number | null | undefined) => {
    if (typeof age !== 'number' || age <= 0) {
        return null;
    }

    return age;
};

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null; children?: React.ReactNode }> = ({ icon, label, value, children }) => {
    if (!value && !children) return null;
    return (
        <div className="glass-surface flex h-full items-start gap-4 rounded-2xl p-4">
            <div className="mt-1 text-brand">{icon}</div>
            <div>
                <h3 className="text-sm font-medium text-faint">{label}</h3>
                {value && <p className="text-foreground font-medium">{value}</p>}
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
    const lastLoginDate = formatLastLoginDate(profile.last_login);
    const displayAge = getDisplayAge(profile.age);

    return (
        <div className="glass-panel card-hover-lift relative overflow-hidden rounded-[2rem] p-4 transition-all duration-300 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-connection/10" aria-hidden="true" />
            <div className="relative">
            <div className="flex flex-col items-center gap-4 sm:mb-8 sm:flex-row sm:gap-6 mb-6">
                <Avatar seed={profile.id} className="h-24 w-24 rounded-full border-4 border-brand object-cover shadow-glass-lg sm:h-28 sm:w-28" />
                <div className="flex-grow text-center sm:text-left w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate max-w-[200px] sm:max-w-none">{displayName}</h1>
                            {profile.verified && (
                                <span className="flex items-center gap-1 text-approval-soft text-sm font-medium bg-approval/10 px-2 py-1 rounded-full border border-approval/30" title={profileCopy.verifiedUserTitle}>
                                    <ShieldCheck size={14} />
                                    <span className="hidden sm:inline">{profileCopy.verifiedBadge}</span>
                                </span>
                            )}
                        </div>
                        {actionSlot}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-faint sm:justify-start">
                        {displayAge !== null && (
                            <span className="glass-surface flex items-center gap-1 rounded-full px-3 py-1.5">
                                <Calendar size={14} />
                                {profileCopy.yearsOld(displayAge)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="glass-surface mb-6 rounded-[1.5rem] p-5 sm:mb-8 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <BookOpen size={20} className="h-5 w-5 sm:h-6 sm:w-6 text-brand" />
                    <h2 className="text-lg sm:text-xl font-semibold">{aboutHeading}</h2>
                </div>
                <p className="pl-0 text-sm leading-relaxed text-muted whitespace-pre-wrap sm:pl-9 sm:text-base">{aboutText}</p>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 border-y border-line/20 py-6 sm:mb-8 sm:grid-cols-2 sm:gap-5 sm:py-8">
                <DetailItem icon={<User size={20} />} label={commonLabels.gender} value={genderText} />
                {(profile.show_age !== false) && <DetailItem icon={<Calendar size={20} />} label={commonLabels.age} value={displayAge} />}
                {(profile.show_location !== false) && <DetailItem icon={<MapPin size={20} />} label={commonLabels.location} value={formatLocation(profile.locations)} />}
                {joinedDate && <DetailItem icon={<Clock size={20} />} label={commonLabels.registrationDate} value={joinedDate} />}
                <DetailItem icon={<LogIn size={20} />} label={commonLabels.lastLogin} value={lastLoginDate} />
                {languages.length > 0 && (
                    <DetailItem icon={<Languages size={20} />} label={commonLabels.languages}>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {languages.map((lang) => (
                                <span key={lang} className="rounded-full border border-line/30 bg-surface-secondary/70 px-2 py-1 text-xs text-muted sm:px-3 sm:py-1 sm:text-sm">
                                    {lang}
                                </span>
                            ))}
                        </div>
                    </DetailItem>
                )}
            </div>

            {passions.length > 0 && (
                <div className="glass-surface rounded-[1.5rem] p-5 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <Heart size={20} className="h-5 w-5 sm:h-6 sm:w-6 text-brand" />
                        <h2 className="text-lg sm:text-xl font-semibold">{commonLabels.passions}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 pl-0 sm:pl-9">
                        {passions.map((passion) => (
                            <span key={passion} className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs text-brand shadow-glass-sm sm:px-4 sm:py-2 sm:text-sm">
                                {passion}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default ProfileCard;