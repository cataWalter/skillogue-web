// src/pages/Search.tsx
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import MultiSelect from '../components/MultiSelect';
import {
    Save,
    Trash2,
    Zap,
    ArrowLeft,
    ArrowRight,
    User,
    MapPin,
    Heart,
    Calendar,
    Languages,
    MessageSquare
} from 'lucide-react';
import Avatar from '../components/Avatar';
import SEO from '../components/SEO';

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

// ✅ UPDATED INTERFACE: Changed 'languages' to 'profile_languages'
interface SearchResult {
    id: string;
    first_name: string | null;
    last_name: string | null;
    about_me: string | null;
    location: string | null;
    age: number | null;
    gender: string | null;
    profile_languages: string[] | null; // Corrected field name
    created_at: string;
    profilepassions: string[];
}

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
    return (
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-indigo-600/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar seed={user.id} className="w-24 h-24 rounded-full object-cover border-4 border-gray-700 flex-shrink-0" />
                <div className="flex-grow text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-2xl font-bold">{user.first_name} {user.last_name}</h3>
                        <Link
                            to={`/messages?with=${user.id}`}
                            className="mt-2 sm:mt-0 flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm"
                        >
                            <MessageSquare size={16} /> Message
                        </Link>
                    </div>
                    {user.about_me && <p className="text-gray-400 mt-2 text-sm">{user.about_me}</p>}
                </div>
            </div>

            <div className="border-t border-gray-800 my-4"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={<MapPin size={18} />} label="Location" value={user.location} />
                <DetailItem icon={<Calendar size={18} />} label="Age" value={user.age} />
                <DetailItem icon={<User size={18} />} label="Gender" value={user.gender} />

                {/* ✅ UPDATED JSX: Changed user.languages to user.profile_languages */}
                {user.profile_languages && user.profile_languages.length > 0 && (
                    <DetailItem icon={<Languages size={18} />} label="Languages">
                        <div className="flex flex-wrap gap-1 mt-1">
                            {user.profile_languages.map((lang, i) => (
                                <span key={i} className="px-2 py-0.5 bg-gray-700/50 text-indigo-200 rounded-full text-xs">
                                    {lang}
                                </span>
                            ))}
                        </div>
                    </DetailItem>
                )}
            </div>

            {user.profilepassions && user.profilepassions.length > 0 && (
                <div className="mt-4">
                    <DetailItem icon={<Heart size={18} />} label="Passions">
                        <div className="flex flex-wrap gap-2 mt-1">
                            {user.profilepassions.map((passion, i) => (
                                <span key={i} className="px-3 py-1 bg-indigo-900/70 text-indigo-200 rounded-full text-sm border border-indigo-700/80 shadow-sm">
                                    {passion}
                                </span>
                            ))}
                        </div>
                    </DetailItem>
                </div>
            )}
        </div>
    );
};

// --- Main Search Component ---
const Search: React.FC = () => {
    // --- State Declarations ---
    const [query, setQuery] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [minAge, setMinAge] = useState<string>('');
    const [maxAge, setMaxAge] = useState<string>('');
    const [language, setLanguage] = useState<string>('');
    const [gender, setGender] = useState<string>('');
    const [selectedPassionNames, setSelectedPassionNames] = useState<string[]>([]);
    const [hideContacted, setHideContacted] = useState<boolean>(false);

    const [allPassions, setAllPassions] = useState<Passion[]>([]);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [newSearchName, setNewSearchName] = useState<string>('');

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [hasMoreResults, setHasMoreResults] = useState<boolean>(false);

    const initialLoad = useRef(true);

    // --- Data Fetching Callbacks ---
    const fetchPassions = useCallback(async () => {
        console.log('[Search.tsx] Fetching all available passions...');
        const { data, error } = await supabase.from('passions').select('id, name');
        if (error) {
            console.error('[Search.tsx] Error loading passions:', error);
        } else {
            console.log(`[Search.tsx] Loaded ${data?.length || 0} passions.`);
            setAllPassions(data || []);
        }
    }, []);

    const fetchSavedSearches = useCallback(async () => {
        console.log('[Search.tsx] Fetching saved searches...');
        const { data, error } = await supabase.rpc('get_saved_searches');
        if (error) {
            console.error('[Search.tsx] Error fetching saved searches:', error);
        } else {
            console.log(`[Search.tsx] Loaded ${data?.length || 0} saved searches.`);
            setSavedSearches(data || []);
        }
    }, []);

    // --- Main Search Logic ---
    const handleSearch = useCallback(async (page: number) => {
        console.log(`[Search.tsx] handleSearch triggered for page ${page}.`);
        setLoading(true);
        setCurrentPage(page);

        const passionIds = selectedPassionNames
            .map(name => allPassions.find(p => p.name === name)?.id)
            .filter((id): id is number => id !== undefined);

        const searchParams = {
            p_query: query || null,
            p_location: location || null,
            p_min_age: minAge ? parseInt(minAge, 10) : null,
            p_max_age: maxAge ? parseInt(maxAge, 10) : null,
            p_language: language || null,
            p_gender: gender || null,
            p_passion_ids: passionIds.length > 0 ? passionIds : null,
            p_limit: PAGE_SIZE,
            p_offset: (page - 1) * PAGE_SIZE,
            p_hide_contacted: hideContacted,
        };

        console.log('[Search.tsx] Calling Supabase RPC "search_profiles" with params:', searchParams);

        const { data, error } = await supabase.rpc('search_profiles', searchParams);

        if (error) {
            console.error('[Search.tsx] Search RPC error:', error);
            setResults([]);
        } else {
            console.log('[Search.tsx] Received data from Supabase:', data);
            setResults(data as SearchResult[]);
            setHasMoreResults(data.length === PAGE_SIZE);
        }
        setLoading(false);
    }, [allPassions, query, location, minAge, maxAge, language, gender, selectedPassionNames, hideContacted]);

    // --- Effects ---
    useEffect(() => {
        console.log('[Search.tsx] Component mounted. Fetching initial data.');
        fetchPassions();
        fetchSavedSearches();
    }, [fetchPassions, fetchSavedSearches]);

    useEffect(() => {
        if (initialLoad.current) {
            console.log('[Search.tsx] Initial search execution.');
            initialLoad.current = false;
            handleSearch(1);
            return;
        }

        console.log('[Search.tsx] Filters changed, debouncing search...');
        const timer = setTimeout(() => {
            console.log('[Search.tsx] Debounce timer fired, executing search.');
            handleSearch(1);
        }, 500);

        return () => {
            console.log('[Search.tsx] Cleanup: Clearing debounce timer.');
            clearTimeout(timer);
        };
    }, [query, location, minAge, maxAge, language, gender, selectedPassionNames, hideContacted, handleSearch]);

    // --- Event Handlers ---
    const handleClearFilters = () => {
        console.log('[Search.tsx] Clearing all filters.');
        setQuery(''); setLocation(''); setMinAge(''); setMaxAge('');
        setLanguage(''); setGender(''); setSelectedPassionNames([]);
        setHideContacted(false);
    };

    const handleSaveSearch = async () => {
        if (!newSearchName.trim()) {
            alert('Please provide a name for your search.');
            return;
        }
        console.log(`[Search.tsx] Saving search with name: "${newSearchName}"`);
        const passionIds = selectedPassionNames
            .map(name => allPassions.find(p => p.name === name)?.id)
            .filter((id): id is number => id !== undefined);

        await supabase.rpc('save_search', {
            p_name: newSearchName,
            p_query: query || null,
            p_location: location || null,
            p_min_age: minAge ? parseInt(minAge, 10) : null,
            p_max_age: maxAge ? parseInt(maxAge, 10) : null,
            p_language: language || null,
            p_gender: gender || null,
            p_passion_ids: passionIds
        });
        setNewSearchName('');
        setIsSaving(false);
        await fetchSavedSearches();
    };

    const handleLoadSearch = (search: SavedSearch) => {
        console.log(`[Search.tsx] Loading saved search: "${search.name}"`);
        setQuery(search.query || '');
        setLocation(search.location || '');
        setMinAge(search.min_age?.toString() || '');
        setMaxAge(search.max_age?.toString() || '');
        setLanguage(search.language || '');
        setGender(search.gender || '');
        const passionNames = (search.passion_ids || [])
            .map(id => allPassions.find(p => p.id === id)?.name)
            .filter((name): name is string => !!name);
        setSelectedPassionNames(passionNames);
    };

    const handleDeleteSearch = async (searchId: number) => {
        if (window.confirm('Are you sure you want to delete this saved search?')) {
            console.log(`[Search.tsx] Deleting saved search with ID: ${searchId}`);
            await supabase.rpc('delete_saved_search', { p_search_id: searchId });
            await fetchSavedSearches();
        }
    };

    // --- Render ---
    return (
            <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            />
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 p-6">
                <aside className="md:col-span-1 lg:col-span-1 space-y-8 md:sticky md:top-6 self-start">
                    {/* Search Filters */}
                    <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Search Filters</h2>
                            <button onClick={handleClearFilters} className="text-sm text-indigo-400 hover:underline">Clear All</button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <input type="text" placeholder="Search by name or bio..." value={query} onChange={(e) => setQuery(e.target.value)} className="bg-gray-800 px-4 py-2 rounded" />
                            <input type="text" placeholder="Location..." value={location} onChange={(e) => setLocation(e.target.value)} className="bg-gray-800 px-4 py-2 rounded" />
                            <div className="flex gap-2">
                                <input type="number" placeholder="Min Age" value={minAge} onChange={(e) => setMinAge(e.target.value)} className="bg-gray-800 px-4 py-2 rounded w-1/2" />
                                <input type="number" placeholder="Max Age" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} className="bg-gray-800 px-4 py-2 rounded w-1/2" />
                            </div>
                            <input type="text" placeholder="Language..." value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-gray-800 px-4 py-2 rounded" />
                            <select value={gender} onChange={(e) => setGender(e.target.value)} className="bg-gray-800 px-4 py-2 rounded">
                                <option value="">Any Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Non-binary">Non-binary</option><option value="Other">Other</option>
                            </select>
                        </div>
                        <MultiSelect options={allPassions} selected={selectedPassionNames} onChange={setSelectedPassionNames} label="Select Passions" placeholder="Filter by passions..." />

                        <div className="pt-2">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hideContacted}
                                    onChange={(e) => setHideContacted(e.target.checked)}
                                    className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-300">Hide contacted users</span>
                            </label>
                        </div>

                        <div className="pt-2">
                            {isSaving ? (
                                <div className="flex items-center gap-2 animate-fade-in">
                                    <input
                                        type="text"
                                        placeholder="Name this search..."
                                        value={newSearchName}
                                        onChange={(e) => setNewSearchName(e.target.value)}
                                        className="flex-grow bg-gray-800 px-4 py-2 rounded border border-gray-700"
                                    />
                                    <button onClick={handleSaveSearch} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold">Save</button>
                                    <button onClick={() => setIsSaving(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">Cancel</button>
                                </div>
                            ) : (
                                <button onClick={() => setIsSaving(true)} className="flex items-center gap-2 text-indigo-400 hover:underline text-sm">
                                    <Save size={16} /> Save this search
                                </button>
                            )}
                        </div>
                    </div>

                    {savedSearches.length > 0 && (
                        <div className="bg-gray-900 p-4 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4">Saved Searches</h2>
                            <div className="space-y-3">
                                {savedSearches.map(search => (
                                    <div key={search.id} className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center">
                                        <span className="font-medium text-gray-300">{search.name}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleLoadSearch(search)} className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm transition-colors">
                                                <Zap size={14} /> Load
                                            </button>
                                            <button onClick={() => handleDeleteSearch(search.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/50 rounded-full transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                <div className="md:col-span-2 lg:col-span-3 min-w-0">
                    <h2 className="text-2xl font-semibold mb-4">
                        Results: {results.length > 0 ? `Showing page ${currentPage}` : 'No one found'}
                    </h2>
                    <div className="space-y-6">
                        {loading ? (<p className="text-gray-400">Searching...</p>) : results.length === 0 ? (
                            <p className="text-gray-400">No users found. Try adjusting your filters.</p>
                        ) : (
                            results.map((user) => (
                                <SearchResultCard key={user.id} user={user} />
                            ))
                        )}
                    </div>

                    {!loading && (results.length > 0 || currentPage > 1) && (
                        <div className="flex justify-between items-center mt-8">
                            <button
                                onClick={() => handleSearch(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowLeft size={16} />
                                Previous
                            </button>
                            <span className="text-gray-400">Page {currentPage}</span>
                            <button
                                onClick={() => handleSearch(currentPage + 1)}
                                disabled={!hasMoreResults}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Search;
