'use client';

import React, { useEffect, useState } from 'react';
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
    Loader2,
    Trash2
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import toast from 'react-hot-toast';

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

interface FavoriteRpcError {
    code?: string;
    message?: string;
}

type NamedRelation = { name: string } | Array<{ name: string }> | null | undefined;

const shouldFallbackFromSavedProfilesRpc = (error: FavoriteRpcError | null): boolean => {
    if (!error) {
        return false;
    }

    return error.code === '42883' || error.message?.includes('uuid = name') === true;
};

const getRelationName = (relation: NamedRelation): string | undefined => {
    if (Array.isArray(relation)) {
        return relation[0]?.name;
    }

    return relation?.name;
};

const loadFavoritesFromTables = async (): Promise<SearchResult[]> => {
    if (!appClient.auth?.getUser) {
        return [];
    }

    const { data: authData, error: authError } = await appClient.auth.getUser();

    if (authError || !authData.user) {
        return [];
    }

    const { data: favoriteRows, error: favoritesError } = await appClient
        .from('favorites')
        .select('favorite_id')
        .eq('user_id', authData.user.id);

    if (favoritesError || !favoriteRows?.length) {
        if (favoritesError) {
            throw favoritesError;
        }

        return [];
    }

    const favoriteIds = favoriteRows.map((row) => row.favorite_id);
    const [profilesResponse, passionsResponse, languagesResponse] = await Promise.all([
        appClient
            .from('profiles')
            .select('id, first_name, last_name, about_me, age, gender, location_id, created_at, is_private, show_age, show_location')
            .in('id', favoriteIds),
        appClient
            .from('profile_passions')
            .select('profile_id, passions(name)')
            .in('profile_id', favoriteIds),
        appClient
            .from('profile_languages')
            .select('profile_id, languages(name)')
            .in('profile_id', favoriteIds),
    ]);

    if (profilesResponse.error) {
        throw profilesResponse.error;
    }

    if (passionsResponse.error) {
        throw passionsResponse.error;
    }

    if (languagesResponse.error) {
        throw languagesResponse.error;
    }

    const locationIds = Array.from(new Set(
        (profilesResponse.data || [])
            .map((profile) => profile.location_id)
            .filter((locationId): locationId is number => typeof locationId === 'number')
    ));

    const locationsResponse = locationIds.length > 0
        ? await appClient.from('locations').select('id, city').in('id', locationIds)
        : { data: [], error: null };

    if (locationsResponse.error) {
        throw locationsResponse.error;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cityByLocationId = new Map<number, any>(
        (locationsResponse.data || []).map((location: any) => [location.id, location.city])
    );
    const passionsByProfileId = new Map<string, string[]>();
    const languagesByProfileId = new Map<string, string[]>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (passionsResponse.data as any[] || [])) {
        const names = passionsByProfileId.get(row.profile_id) || [];
        const passionName = getRelationName(row.passions as NamedRelation);

        if (passionName) {
            names.push(passionName);
            passionsByProfileId.set(row.profile_id, names);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (languagesResponse.data as any[] || [])) {
        const names = languagesByProfileId.get(row.profile_id) || [];
        const languageName = getRelationName(row.languages as NamedRelation);

        if (languageName) {
            names.push(languageName);
            languagesByProfileId.set(row.profile_id, names);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profilesById = new Map<string, any>(
        (profilesResponse.data || []).map((profile: any) => [profile.id, profile])
    );
    const favorites: SearchResult[] = [];

    for (const favoriteId of favoriteIds) {
        const profile = profilesById.get(favoriteId);

        if (!profile) {
            continue;
        }

        favorites.push({
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            about_me: profile.about_me,
            location: profile.location_id ? cityByLocationId.get(profile.location_id) || null : null,
            age: profile.age,
            gender: profile.gender,
            profile_languages: languagesByProfileId.get(profile.id) || [],
            created_at: profile.created_at,
            profilepassions: passionsByProfileId.get(profile.id) || [],
            is_private: profile.is_private,
            show_age: profile.show_age,
            show_location: profile.show_location,
        });
    }

    return favorites;
};

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null; children?: React.ReactNode }> = ({ icon, label, value, children }) => {
    if (!value && !children) return null;
    return (
        <div className="flex items-start gap-3 text-sm">
            <div className="mt-1 text-indigo-400">{icon}</div>
            <div>
                <h4 className="font-medium text-gray-400">{label}</h4>
                {value && <p className="text-white">{value}</p>}
                {children}
            </div>
        </div>
    );
};

const FavoriteCard: React.FC<{ user: SearchResult; onRemove: (id: string) => void }> = ({ user, onRemove }) => {
    if (user.is_private) {
        return (
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-indigo-600/50 transition-all duration-300 transform hover:-translate-y-1 card-hover-lift relative group">
                <button 
                    onClick={() => onRemove(user.id)}
                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded-full transition opacity-0 group-hover:opacity-100 z-10"
                    title="Remove from Favorites"
                >
                    <Trash2 size={18} />
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                        <Avatar seed={user.id} className="w-24 h-24 rounded-full object-cover border-4 border-gray-700 flex-shrink-0" />
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <Lock size={24} className="text-gray-400" />
                        </div>
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-2xl font-bold">
                                <Link href={`/user/${user.id}`} className="hover:text-indigo-400 transition">
                                    {user.first_name} {user.last_name}
                                </Link>
                            </h3>
                            <Link
                                href={`/messages?conversation=${user.id}`}
                                className="mt-2 sm:mt-0 flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm text-white shadow-lg hover:shadow-xl"
                            >
                                <MessageSquare size={16} /> Message
                            </Link>
                        </div>
                        <p className="text-gray-500 mt-2 text-sm italic flex items-center justify-center sm:justify-start gap-2">
                            <Lock size={14} /> Private Profile
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-indigo-600/50 transition-all duration-300 transform hover:-translate-y-1 card-hover-lift relative group">
            <button 
                onClick={() => onRemove(user.id)}
                className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded-full transition opacity-0 group-hover:opacity-100 z-10"
                title="Remove from Favorites"
            >
                <Trash2 size={18} />
            </button>
            <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
                    <Avatar seed={user.id} className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500/30 mb-3 shadow-lg" />
                    <Link
                        href={`/messages?conversation=${user.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm text-white shadow-lg shadow-indigo-900/20"
                    >
                        <MessageSquare size={16} /> Message
                    </Link>
                </div>

                <div className="flex-grow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 text-center sm:text-left">
                        <h3 className="text-2xl font-bold">
                            <Link href={`/user/${user.id}`} className="hover:text-indigo-400 transition">
                                {user.first_name} {user.last_name}
                            </Link>
                        </h3>
                        <span className="text-xs text-gray-500 mt-1 sm:mt-0">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    {user.about_me && (
                        <p className="text-gray-400 mb-4 line-clamp-2 text-sm text-center sm:text-left">
                            {user.about_me}
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-4">
                        {(user.show_age !== false) && <DetailItem icon={<Calendar size={16} />} label="Age" value={user.age} />}
                        <DetailItem icon={<User size={16} />} label="Gender" value={user.gender} />
                        {(user.show_location !== false) && <DetailItem icon={<MapPin size={16} />} label="Location" value={user.location} />}
                        {user.profile_languages && user.profile_languages.length > 0 && (
                            <DetailItem icon={<Languages size={16} />} label="Languages">
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {user.profile_languages.slice(0, 3).map((lang) => (
                                        <span key={lang} className="px-2 py-0.5 bg-gray-800 text-indigo-300 rounded text-xs">
                                            {lang}
                                        </span>
                                    ))}
                                    {user.profile_languages.length > 3 && (
                                        <span className="text-xs text-gray-500">+{user.profile_languages.length - 3}</span>
                                    )}
                                </div>
                            </DetailItem>
                        )}
                    </div>

                    {user.profilepassions && user.profilepassions.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            {user.profilepassions.slice(0, 5).map((passion) => (
                                <span key={passion} className="px-3 py-1 bg-indigo-900/40 text-indigo-300 rounded-full text-xs border border-indigo-800/50">
                                    {passion}
                                </span>
                            ))}
                            {user.profilepassions.length > 5 && (
                                <span className="text-xs text-gray-500 self-center">+{user.profilepassions.length - 5} more</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const FavoritesPage = () => {
    const [favorites, setFavorites] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFavorites = async () => {
            const { data, error } = await appClient.rpc('get_saved_profiles');
            if (error) {
                if (shouldFallbackFromSavedProfilesRpc(error)) {
                    try {
                        const fallbackFavorites = await loadFavoritesFromTables();
                        setFavorites(fallbackFavorites);
                    } catch (fallbackError) {
                        console.error(fallbackError);
                        toast.error('Failed to load favorites');
                    }
                } else {
                    console.error(error);
                    toast.error('Failed to load favorites');
                }
            } else {
                setFavorites(data || []);
            }
            setLoading(false);
        };
        loadFavorites();
    }, []);

    const handleRemove = async (id: string) => {
        if (!confirm('Remove from favorites?')) return;
        const { error } = await appClient.rpc('unsave_profile', { target_id: id });
        if (!error) {
            setFavorites(prev => prev.filter(f => f.id !== id));
            toast.success('Removed from favorites');
        } else {
            toast.error('Failed to remove');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Heart className="text-pink-500" fill="currentColor" />
                Favorite Profiles
            </h1>
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>
            ) : favorites.length === 0 ? (
                <div className="text-center py-10">
                    <Heart className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-xl text-gray-400">You haven&apos;t saved any profiles yet.</p>
                    <Link href="/search" className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition">
                        Find People
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
};

export default FavoritesPage;
