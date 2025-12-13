'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
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
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-indigo-600/50 transition-all duration-300 transform hover:-translate-y-1 relative group">
                <button 
                    onClick={() => onRemove(user.id)}
                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded-full transition opacity-0 group-hover:opacity-100"
                    title="Remove from Favorites"
                >
                    <Trash2 size={18} />
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar seed={user.id} className="w-24 h-24 rounded-full object-cover border-4 border-gray-700 flex-shrink-0" />
                    <div className="flex-grow text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-2xl font-bold">
                                <Link href={`/user/${user.id}`} className="hover:text-indigo-400 transition">
                                    {user.first_name} {user.last_name}
                                </Link>
                            </h3>
                            <Link
                                href={`/messages?conversation=${user.id}`}
                                className="mt-2 sm:mt-0 flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm text-white"
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
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-indigo-600/50 transition-all duration-300 transform hover:-translate-y-1 relative group">
            <button 
                onClick={() => onRemove(user.id)}
                className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded-full transition opacity-0 group-hover:opacity-100"
                title="Remove from Favorites"
            >
                <Trash2 size={18} />
            </button>
            <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
                    <Avatar seed={user.id} className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500/30 mb-3" />
                    <Link
                        href={`/messages?conversation=${user.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm text-white shadow-lg shadow-indigo-900/20"
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
                                    {user.profile_languages.slice(0, 3).map((lang, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-gray-800 text-indigo-300 rounded text-xs">
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
                            {user.profilepassions.slice(0, 5).map((passion, i) => (
                                <span key={i} className="px-3 py-1 bg-indigo-900/40 text-indigo-300 rounded-full text-xs border border-indigo-800/50">
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
            const { data, error } = await supabase.rpc('get_saved_profiles');
            if (error) {
                console.error(error);
                toast.error('Failed to load favorites');
            } else {
                setFavorites(data || []);
            }
            setLoading(false);
        };
        loadFavorites();
    }, []);

    const handleRemove = async (id: string) => {
        if (!confirm('Remove from favorites?')) return;
        const { error } = await supabase.rpc('unsave_profile', { target_id: id });
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
                    <p className="text-xl text-gray-400">You haven't saved any profiles yet.</p>
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
