'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
type Session = { user: { id: string } } | null;
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { appClient } from '../../lib/appClient';
import MultiSelect from '../../components/MultiSelect';
import {
    Save,
    Trash2,
    Zap,
    User,
    MapPin,
    Heart,
    Calendar,
    Languages,
    MessageSquare,
    Lock
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import SearchSkeleton from '../../components/SearchSkeleton';

// --- Type Definitions ---
interface Passion {
    id: number;
    name: string;
}

interface SavedSearch {
    id: number;
    name: string;
    query: string | null;
    location: string | null;
    min_age: number | null;
    max_age: number | null;
    language: string | null;
    gender: string | null;
    passion_ids: number[] | null;
}

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

const mergeUniqueResults = (existing: SearchResult[], incoming: SearchResult[]) => {
    const resultMap = new Map<string, SearchResult>();

    for (const result of existing) {
        resultMap.set(result.id, result);
    }

    for (const result of incoming) {
        resultMap.set(result.id, result);
    }

    return Array.from(resultMap.values());
};

const PAGE_SIZE = 10;

// --- Helper Components ---
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

const SearchResultCard: React.FC<{ user: SearchResult }> = ({ user }) => {
    if (user.is_private) {
        return (
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-indigo-600/50 transition-all duration-300 transform hover:-translate-y-1 card-hover-lift">
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
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-indigo-600/50 transition-all duration-300 transform hover:-translate-y-1 card-hover-lift">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                    <Avatar seed={user.id} className="w-24 h-24 rounded-full object-cover border-4 border-gray-700 flex-shrink-0" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" title="Online" />
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
                    {user.about_me && <p className="text-gray-400 mt-2 text-sm line-clamp-2">{user.about_me}</p>}
                </div>
            </div>

            <div className="border-t border-gray-800 my-4"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(user.show_location !== false) && <DetailItem icon={<MapPin size={18} />} label="Location" value={user.location} />}
                {(user.show_age !== false) && <DetailItem icon={<Calendar size={18} />} label="Age" value={user.age} />}
                <DetailItem icon={<User size={18} />} label="Gender" value={user.gender} />

                {user.profile_languages && user.profile_languages.length > 0 && (
                    <DetailItem icon={<Languages size={18} />} label="Languages">
                        <div className="flex flex-wrap gap-2 mt-1">
                            {user.profile_languages.map((lang) => (
                                <span key={lang} className="px-2 py-1 bg-gray-800 text-indigo-200 rounded-full text-xs">
                                    {lang}
                                </span>
                            ))}
                        </div>
                    </DetailItem>
                )}
            </div>

            {user.profilepassions && user.profilepassions.length > 0 && (
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Heart size={18} className="text-pink-400" />
                        <h4 className="font-medium text-gray-400 text-sm">Passions</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {user.profilepassions.map((passion) => (
                            <span key={passion} className="px-3 py-1 bg-indigo-900/50 text-indigo-200 rounded-full text-xs border border-indigo-800">
                                {passion}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const Search: React.FC = () => {
    const searchParams = useSearchParams();
    const initialPassion = searchParams?.get('passion');

    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');
    const [language, setLanguage] = useState('');
    const [gender, setGender] = useState('');
    const [selectedPassions, setSelectedPassions] = useState<string[]>(initialPassion ? [initialPassion] : []);

    const [availablePassions, setAvailablePassions] = useState<Passion[]>([]);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [saveSearchName, setSaveSearchName] = useState('');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'recent' | 'passions'>('recent');
    const [totalResults, setTotalResults] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [session, setSession] = useState<Session | null>(null);
    const resultsRef = useRef<SearchResult[]>([]);

    useEffect(() => {
        resultsRef.current = results;
    }, [results]);

    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { session } } = await appClient.auth.getSession();
            setSession(session as Session);

            const { data: passions } = await appClient.from('passions').select('id, name');
            setAvailablePassions(passions || []);

            if (session) {
                const { data: saved } = await appClient.from('saved_searches').select('*').eq('user_id', session.user.id);
                setSavedSearches(saved || []);
            }
        };
        loadInitialData();
    }, []);

    const performSearch = useCallback(async (pageNumber = 1) => {
        setLoading(true);
        try {
            const { data: { session } } = await appClient.auth.getSession();
            const currentUserId = session?.user?.id;

            // Convert selected passion names to IDs
            const passionIds = selectedPassions.map(name =>
                availablePassions.find(p => p.name === name)?.id
            ).filter(Boolean) as number[];

            const { data, error } = await appClient.rpc('search_profiles', {
                p_query: query || null,
                p_location: location || null,
                p_min_age: minAge ? parseInt(minAge) : null,
                p_max_age: maxAge ? parseInt(maxAge) : null,
                p_language: language || null,
                p_gender: gender || null,
                p_passion_ids: passionIds.length > 0 ? passionIds : null,
                p_limit: PAGE_SIZE,
                p_offset: (pageNumber - 1) * PAGE_SIZE,
                p_current_user_id: currentUserId || null
            });

            if (error) {
                console.error('Search error:', error);
                setError('Failed to search profiles. Please try again.');
                return;
            }

            const newResults = (data as SearchResult[]) || [];
            setError(null);
            
            if (pageNumber === 1) {
                setResults(newResults);
                setTotalResults(newResults.length);
            } else {
                const mergedResults = mergeUniqueResults(resultsRef.current, newResults);
                setResults(mergedResults);
                setTotalResults(mergedResults.length);
            }
            setHasMore(newResults.length === PAGE_SIZE);
        } catch (err) {
            console.error('Search error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [query, location, minAge, maxAge, language, gender, selectedPassions, availablePassions]);

    // Initial search
    useEffect(() => {
        if (availablePassions.length > 0) {
            performSearch(1);
        }
    }, [performSearch, availablePassions.length]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        performSearch(1);
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        performSearch(nextPage);
    };

    const saveSearch = async () => {
        if (!saveSearchName.trim() || !session) return;

        const passionIds = selectedPassions.map(name =>
            availablePassions.find(p => p.name === name)?.id
        ).filter(Boolean) as number[];

        const { data, error } = await appClient.from('saved_searches').insert({
            user_id: session.user.id,
            name: saveSearchName,
            query: query || null,
            location: location || null,
            min_age: minAge ? parseInt(minAge) : null,
            max_age: maxAge ? parseInt(maxAge) : null,
            language: language || null,
            gender: gender || null,
            passion_ids: passionIds.length > 0 ? passionIds : null
        }).select().single();

        if (error) {
            console.error('Error saving search:', error);
            alert('Failed to save search');
        } else {
            setSavedSearches([...savedSearches, data]);
            setIsSaveModalOpen(false);
            setSaveSearchName('');
        }
    };

    const loadSavedSearch = (search: SavedSearch) => {
        setQuery(search.query || '');
        setLocation(search.location || '');
        setMinAge(search.min_age?.toString() || '');
        setMaxAge(search.max_age?.toString() || '');
        setLanguage(search.language || '');
        setGender(search.gender || '');

        if (search.passion_ids) {
            const names = search.passion_ids.map(id =>
                availablePassions.find(p => p.id === id)?.name
            ).filter(Boolean) as string[];
            setSelectedPassions(names);
        } else {
            setSelectedPassions([]);
        }
        setPage(1);
        // Trigger search effect will handle the rest
    };

    const deleteSavedSearch = async (id: number) => {
        const { error } = await appClient.from('saved_searches').delete().eq('id', id);
        if (!error) {
            setSavedSearches(savedSearches.filter(s => s.id !== id));
        }
    };

    const hasActiveFilters = query || location || minAge || maxAge || language || gender || selectedPassions.length > 0;

    const clearFilter = (filterType: string) => {
        switch (filterType) {
            case 'query': setQuery(''); break;
            case 'location': setLocation(''); break;
            case 'minAge': setMinAge(''); break;
            case 'maxAge': setMaxAge(''); break;
            case 'language': setLanguage(''); break;
            case 'gender': setGender(''); break;
            case 'passions': setSelectedPassions([]); break;
        }
        setPage(1);
    };

    const clearAllFilters = () => {
        setQuery('');
        setLocation('');
        setMinAge('');
        setMaxAge('');
        setLanguage('');
        setGender('');
        setSelectedPassions([]);
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Zap className="text-indigo-400" /> Filters
                        </h2>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div>
                                <label htmlFor="search-query" className="block text-sm font-medium text-gray-400 mb-1">Keywords</label>
                                <input
                                    id="search-query"
                                    name="query"
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Name, bio, etc."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label htmlFor="search-location" className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                                <input
                                    id="search-location"
                                    name="location"
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="City, Country"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    autoComplete="off"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label htmlFor="search-min-age" className="block text-sm font-medium text-gray-400 mb-1">Min Age</label>
                                    <input
                                        id="search-min-age"
                                        name="minAge"
                                        type="number"
                                        value={minAge}
                                        onChange={(e) => setMinAge(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        inputMode="numeric"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="search-max-age" className="block text-sm font-medium text-gray-400 mb-1">Max Age</label>
                                    <input
                                        id="search-max-age"
                                        name="maxAge"
                                        type="number"
                                        value={maxAge}
                                        onChange={(e) => setMaxAge(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        inputMode="numeric"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="search-gender" className="block text-sm font-medium text-gray-400 mb-1">Gender</label>
                                <select
                                    id="search-gender"
                                    name="gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="">Any</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Non-binary">Non-binary</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="search-language" className="block text-sm font-medium text-gray-400 mb-1">Language</label>
                                <input
                                    id="search-language"
                                    name="language"
                                    type="text"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    placeholder="English, Spanish..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <MultiSelect
                                    label="Passions"
                                    options={availablePassions}
                                    selected={selectedPassions}
                                    onChange={setSelectedPassions}
                                    placeholder="Select passions..."
                                    id="search-passions"
                                    name="passions"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading && page === 1}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-lg font-bold transition flex items-center justify-center gap-2"
                            >
                                {loading && page === 1 ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Searching...
                                    </>
                                ) : (
                                    'Search'
                                )}
                            </button>

                            {session && (
                                <button
                                    type="button"
                                    onClick={() => setIsSaveModalOpen(true)}
                                    className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition flex items-center justify-center gap-2"
                                >
                                    <Save size={16} /> Save Search
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Saved Searches */}
                    {savedSearches.length > 0 && (
                        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                            <h3 className="font-bold mb-4 text-gray-300">Saved Searches</h3>
                            <div className="space-y-2">
                                {savedSearches.map(search => (
                                    <div key={search.id} className="flex items-center justify-between bg-gray-800 p-2 rounded-lg">
                                        <button
                                            onClick={() => loadSavedSearch(search)}
                                            className="text-sm text-indigo-300 hover:text-white truncate flex-grow text-left"
                                        >
                                            {search.name}
                                        </button>
                                        <button
                                            onClick={() => deleteSavedSearch(search.id)}
                                            className="text-gray-500 hover:text-red-400 ml-2"
                                            title="Delete Search"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Area */}
                <div className="lg:col-span-3">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Discover People</h1>
                            <p className="text-gray-400">Find others who share your passions.</p>
                        </div>
                        {results.length > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-400">
                                    {totalResults} {totalResults === 1 ? 'result' : 'results'}
                                </span>
                                <label htmlFor="search-sort" className="sr-only">Sort results</label>
                                <select
                                    id="search-sort"
                                    name="sortBy"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'passions')}
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="recent">Most Recent</option>
                                    <option value="passions">Most Shared Passions</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && !loading && (
                        <div className="mb-6 text-center py-12 bg-red-900/20 rounded-2xl border border-red-800 flex flex-col items-center">
                            <div className="bg-red-900/30 p-4 rounded-full mb-4">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-red-400 text-lg mb-2">{error}</p>
                            <button
                                onClick={() => { setError(null); performSearch(1); }}
                                className="mt-2 px-4 py-2 text-indigo-400 hover:text-indigo-300 border border-indigo-400 hover:border-indigo-300 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Active Filters Display */}
                    {hasActiveFilters && !error && (
                        <div className="mb-6 bg-gray-900/50 rounded-xl p-4 border border-gray-800 animate-fade-in-up">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-300">Active Filters</span>
                                <button
                                    onClick={clearAllFilters}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {query && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-sm border border-indigo-500/30">
                                        Search: {query}
                                        <button onClick={() => clearFilter('query')} className="hover:text-white ml-1">
                                            ×
                                        </button>
                                    </span>
                                )}
                                {location && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm border border-blue-500/30">
                                        {location}
                                        <button onClick={() => clearFilter('location')} className="hover:text-white ml-1">
                                            ×
                                        </button>
                                    </span>
                                )}
                                {(minAge || maxAge) && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 text-green-300 rounded-full text-sm border border-green-500/30">
                                        Age: {minAge && maxAge ? `${minAge}-${maxAge}` : minAge || maxAge}
                                        <button onClick={() => { clearFilter('minAge'); clearFilter('maxAge'); }} className="hover:text-white ml-1">
                                            ×
                                        </button>
                                    </span>
                                )}
                                {gender && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm border border-purple-500/30">
                                        {gender}
                                        <button onClick={() => clearFilter('gender')} className="hover:text-white ml-1">
                                            ×
                                        </button>
                                    </span>
                                )}
                                {language && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-600/20 text-yellow-300 rounded-full text-sm border border-yellow-500/30">
                                        {language}
                                        <button onClick={() => clearFilter('language')} className="hover:text-white ml-1">
                                            ×
                                        </button>
                                    </span>
                                )}
                                {selectedPassions.map((passion) => (
                                    <span key={passion} className="inline-flex items-center gap-1 px-3 py-1 bg-pink-600/20 text-pink-300 rounded-full text-sm border border-pink-500/30">
                                        {passion}
                                        <button onClick={() => { setSelectedPassions(prev => prev.filter(p => p !== passion)); setPage(1); }} className="hover:text-white ml-1">
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading && page === 1 ? (
                        <div className="space-y-6">
                            {[...Array(3)].map((_, i) => (
                                <SearchSkeleton key={i} />
                            ))}
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-6">
                            {results.map(user => (
                                <SearchResultCard key={user.id} user={user} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col items-center">
                            <div className="bg-gray-800 p-4 rounded-full mb-4">
                                <User className="w-8 h-8 text-gray-500" />
                            </div>
                            <p className="text-gray-400 text-lg mb-2">No profiles found matching your criteria.</p>
                            <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or search for something else.</p>
                            <button
                                onClick={clearAllFilters}
                                className="mt-2 px-4 py-2 text-indigo-400 hover:text-indigo-300 border border-indigo-400 hover:border-indigo-300 rounded-lg transition-colors"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}

                    {/* Load More */}
                    {results.length > 0 && hasMore && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={loadMore}
                                disabled={loading}
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white transition disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Search Modal */}
            {isSaveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
                    <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700">
                        <h3 className="text-xl font-bold mb-4">Save Search</h3>
                        <label htmlFor="save-search-name" className="block text-sm font-medium text-gray-400 mb-2">Search name</label>
                        <input
                            id="save-search-name"
                            name="saveSearchName"
                            type="text"
                            value={saveSearchName}
                            onChange={(e) => setSaveSearchName(e.target.value)}
                            placeholder="Give this search a name..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            autoComplete="off"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsSaveModalOpen(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSearch}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
