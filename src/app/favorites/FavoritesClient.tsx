'use client';

import React, { useState } from 'react';
import { appClient } from '../../lib/appClient';
import Link from 'next/link';
import {
    User,
    MapPin,
    Heart,
    Calendar,
    Languages,
    MessageSquare,
    Lock,
    Trash2
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import toast from 'react-hot-toast';
import { getDisplayBio, getDisplayGender, getDisplayLocation, getDisplayName } from '../../lib/profile-display';
import { commonLabels, favoritesCopy, profileCopy } from '../../lib/app-copy';
import { formatShortDate } from '@/lib/format-date';

interface SearchResult {
    id: string;
    first_name: string | null;
    last_name: string | null;
    about_me: string | null;
    location: string | null;
    age: number | null;
    gender: string | null;
    profile_languages: string[] | null;
    created_at: string;
    profilepassions: string[];
    is_private?: boolean;
    show_age?: boolean;
    show_location?: boolean;
}

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null; children?: React.ReactNode }> = ({ icon, label, value, children }) => {
    if (!value && !children) return null;
    return (
        <div className="flex items-start gap-3 text-sm">
            <div className="mt-1 text-brand">{icon}</div>
            <div>
                <h4 className="font-medium text-faint">{label}</h4>
                {value && <p className="text-foreground">{value}</p>}
                {children}
            </div>
        </div>
    );
};

const FavoriteCard: React.FC<{ user: SearchResult; onRemove: (id: string) => void }> = ({ user, onRemove }) => {
    const displayName = getDisplayName(user.first_name, user.last_name);

    if (user.is_private) {
        return (
            <div className="glass-surface card-hover-lift relative rounded-[1.75rem] p-6 transition-all duration-300 hover:border-brand/40 hover:-translate-y-1 group">
                <button
                    onClick={() => onRemove(user.id)}
                    className="glass-surface absolute top-4 right-4 z-10 rounded-full p-2 text-faint opacity-0 transition-all duration-300 group-hover:opacity-100 hover:text-danger"
                    title={favoritesCopy.removeTitle}
                >
                    <Trash2 size={18} />
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                        <Avatar seed={user.id} className="w-24 h-24 rounded-full object-cover border-4 border-line/40 flex-shrink-0" />
                        <div className="absolute inset-0 bg-surface-overlay/50 rounded-full flex items-center justify-center">
                            <Lock size={24} className="text-faint" />
                        </div>
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-2xl font-bold">
                                <Link href={`/user/${user.id}`} className="hover:text-brand transition">
                                    {displayName}
                                </Link>
                            </h3>
                            <Link
                                href={`/messages?conversation=${user.id}`}
                                className="mt-2 sm:mt-0 flex-shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-start to-brand-end px-4 py-2 text-sm text-white shadow-glass-sm transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-md"
                            >
                                <MessageSquare size={16} /> {commonLabels.message}
                            </Link>
                        </div>
                        <p className="text-faint mt-2 text-sm italic flex items-center justify-center sm:justify-start gap-2">
                            <Lock size={14} /> {favoritesCopy.privateProfile}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const displayBio = getDisplayBio(user.about_me);
    const displayGender = getDisplayGender(user.gender);
    const displayLocation = getDisplayLocation(user.location);
    const formattedJoinedDate = formatShortDate(user.created_at);

    return (
        <div className="glass-surface card-hover-lift relative rounded-[1.75rem] p-6 transition-all duration-300 hover:border-brand/40 hover:-translate-y-1 group">
            <button
                onClick={() => onRemove(user.id)}
                className="glass-surface absolute top-4 right-4 z-10 rounded-full p-2 text-faint opacity-0 transition-all duration-300 group-hover:opacity-100 hover:text-danger"
                title={favoritesCopy.removeTitle}
            >
                <Trash2 size={18} />
            </button>
            <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
                    <Avatar seed={user.id} className="mb-3 h-24 w-24 rounded-full border-4 border-brand/30 object-cover shadow-glass-md" />
                    <Link
                        href={`/messages?conversation=${user.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-start to-brand-end px-4 py-2 text-sm text-white shadow-glass-sm transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-md"
                    >
                        <MessageSquare size={16} /> {commonLabels.message}
                    </Link>
                </div>

                <div className="flex-grow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 text-center sm:text-left">
                        <h3 className="text-2xl font-bold">
                            <Link href={`/user/${user.id}`} className="hover:text-brand transition">
                                {displayName}
                            </Link>
                        </h3>
                        {formattedJoinedDate && (
                            <span className="text-xs text-faint mt-1 sm:mt-0">
                                {profileCopy.joinedPrefix} {formattedJoinedDate}
                            </span>
                        )}
                    </div>

                    <p className="text-faint mb-4 line-clamp-2 text-sm text-center sm:text-left">
                        {displayBio}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-4">
                        {(user.show_age !== false) && <DetailItem icon={<Calendar size={16} />} label={commonLabels.age} value={user.age} />}
                        <DetailItem icon={<User size={16} />} label={commonLabels.gender} value={displayGender} />
                        {(user.show_location !== false) && <DetailItem icon={<MapPin size={16} />} label={commonLabels.location} value={displayLocation} />}
                        {user.profile_languages && user.profile_languages.length > 0 && (
                            <DetailItem icon={<Languages size={16} />} label={commonLabels.languages}>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {user.profile_languages.slice(0, 3).map((lang) => (
                                        <span key={lang} className="px-2 py-0.5 bg-surface-secondary text-brand-soft rounded text-xs">
                                            {lang}
                                        </span>
                                    ))}
                                    {user.profile_languages.length > 3 && (
                                        <span className="text-xs text-faint">+{user.profile_languages.length - 3}</span>
                                    )}
                                </div>
                            </DetailItem>
                        )}
                    </div>

                    {user.profilepassions && user.profilepassions.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            {user.profilepassions.slice(0, 5).map((passion) => (
                                <span key={passion} className="px-3 py-1 bg-brand/15 text-brand-soft rounded-full text-xs border border-brand/25">
                                    {passion}
                                </span>
                            ))}
                            {user.profilepassions.length > 5 && (
                                <span className="text-xs text-faint self-center">+{user.profilepassions.length - 5} more</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface FavoritesClientProps {
    initialFavorites: SearchResult[];
}

export default function FavoritesClient({ initialFavorites }: FavoritesClientProps) {
    const [favorites, setFavorites] = useState<SearchResult[]>(initialFavorites);

    const handleRemove = async (id: string) => {
        if (!confirm(favoritesCopy.removeConfirm)) return;
        const { error } = await appClient.rpc('unsave_profile', { target_id: id });
        if (!error) {
            setFavorites(prev => prev.filter(f => f.id !== id));
            toast.success(favoritesCopy.removeSuccess);
        } else {
            toast.error(favoritesCopy.removeError);
        }
    };

    return (
        <div className="editorial-shell py-8 sm:py-12 lg:py-16">
            <div className="glass-panel mb-6 rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
                <div className="editorial-kicker mb-4 border-connection/25 bg-connection/10 text-connection-soft">
                    <Heart className="fill-current text-connection" size={16} fill="currentColor" />
                    <span>Saved connections</span>
                </div>
                <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground sm:text-4xl">
                    <Heart className="text-connection fill-current" fill="currentColor" />
                    {favoritesCopy.title}
                </h1>
                <p className="mt-3 max-w-2xl text-faint">Revisit people you want close at hand and jump back into conversation quickly.</p>
            </div>
            {favorites.length === 0 ? (
                <div className="glass-panel py-10 text-center">
                    <Heart className="w-16 h-16 text-line/80 mx-auto mb-4" />
                    <p className="text-xl text-faint">{favoritesCopy.emptyState}</p>
                    <Link href="/search" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-brand-start to-brand-end px-6 py-2 text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover">
                        {favoritesCopy.findPeople}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {favorites.map(user => (
                        <FavoriteCard key={user.id} user={user} onRemove={handleRemove} />
                    ))}
                </div>
            )}
        </div>
    );
}
