'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
type Session = { user: { id: string } } | null;
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { appClient } from '../../lib/appClient';
import MultiSelect from '../../components/MultiSelect';
import {
    Bookmark,
    Save,
    SlidersHorizontal,
    Trash2,
    Zap,
    User,
    MapPin,
    Heart,
    Calendar,
    Languages,
    MessageSquare,
    Lock,
    Clock,
    LogIn
} from 'lucide-react';
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader';
import { DiscoveryEmptyState } from '@/components/discovery/DiscoveryEmptyState';
import Avatar from '../../components/Avatar';
import SearchSkeleton from '../../components/SearchSkeleton';
import {
    getDisplayBio,
    getDisplayGender,
    getDisplayLocation,
    getDisplayName,
} from '@/lib/profile-display';
import { GENDER_OPTIONS, normalizeGender } from '@/lib/gender';
import { commonLabels, searchCopy } from '@/lib/app-copy';
import toast from 'react-hot-toast';
import { useProfileGate } from '@/hooks/useProfileGate';

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
    last_login: string | null;
    profilepassions: string[];
    is_private?: boolean;
    show_age?: boolean;
    show_location?: boolean;
}

const formatShortDate = (iso: string | null | undefined) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

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

/**
 * Smart ranking score (0–1) for a search result.
 *
 * Signals & weights when passions are selected:
 *   50% — passion overlap  (fraction of selected passions the user shares)
 *   30% — activity recency (exponential half-life of 30 days on last_login)
 *   20% — profile depth    (completeness + breadth bonus)
 *
 * When no passion filter is active, weights redistribute:
 *   60% — activity recency
 *   40% — profile depth
 */
const computeSmartScore = (
    user: SearchResult,
    selectedPassions: string[],
    now: number,
): number => {
    // --- activity: exponential decay on last_login (half-life 30 days) ---
    const activityScore = (() => {
        if (!user.last_login) return 0;
        const daysAgo = (now - new Date(user.last_login).getTime()) / 86_400_000;
        return Math.exp(-daysAgo * (Math.LN2 / 30));
    })();

    // --- profile depth: base completeness + breadth bonus ---
    const completenessScore = (() => {
        const checks = [
            !!(user.about_me?.trim()),
            !!(user.location?.trim()),
            user.age != null,
            !!(user.profile_languages?.length),
            !!(user.profilepassions?.length),
        ];
        const base = checks.filter(Boolean).length / checks.length;
        // small bonus for having multiple passions / languages (depth)
        const depth =
            (Math.min(user.profilepassions?.length ?? 0, 5) / 5 +
                Math.min(user.profile_languages?.length ?? 0, 3) / 3) *
            0.1;
        return Math.min(base + depth, 1);
    })();

    // --- passion overlap ---
    if (selectedPassions.length > 0) {
        const userSet = new Set(user.profilepassions ?? []);
        const matches = selectedPassions.filter((p) => userSet.has(p)).length;
        const passionScore = matches / selectedPassions.length;
        return 0.5 * passionScore + 0.3 * activityScore + 0.2 * completenessScore;
    }

    // no passion filter: redistribute weights
    return 0.6 * activityScore + 0.4 * completenessScore;
};

// --- Helper Components ---
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

const SearchResultCard: React.FC<{
    user: SearchResult;
    onViewProfile: (user: SearchResult) => void;
    onStartMessage: (user: SearchResult) => void;
}> = ({ user, onViewProfile, onStartMessage }) => {
    const displayName = getDisplayName(user.first_name, user.last_name);

    if (user.is_private) {
        return (
            <div className="glass-surface card-hover-lift rounded-[1.75rem] p-6 transition-all duration-300 hover:border-brand/40 hover:-translate-y-1">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                        <Avatar seed={user.id} alt={`${displayName}'s avatar`} className="w-24 h-24 rounded-full object-cover border-4 border-line/40 flex-shrink-0" />
                        <div className="absolute inset-0 bg-surface-overlay/50 rounded-full flex items-center justify-center">
                            <Lock size={24} className="text-faint" />
                        </div>
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-2xl font-bold">
                                <Link href={`/user/${user.id}`} onClick={() => onViewProfile(user)} className="hover:text-brand transition">
                                    {displayName}
                                </Link>
                            </h3>
                            <Link
                                href={`/messages?conversation=${user.id}`}
                                onClick={() => onStartMessage(user)}
                                className="mt-2 sm:mt-0 flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-start to-brand-end hover:from-brand-start-hover hover:to-brand-end-hover rounded-xl transition-all duration-300 hover:-translate-y-0.5 text-sm text-white shadow-glass-sm hover:shadow-glass-md"
                            >
                                <MessageSquare size={16} /> {commonLabels.message}
                            </Link>
                        </div>
                        <p className="text-faint mt-2 text-sm italic flex items-center justify-center sm:justify-start gap-2">
                            <Lock size={14} /> {searchCopy.privateProfile}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-surface card-hover-lift rounded-[1.75rem] p-6 transition-all duration-300 hover:border-brand/40 hover:-translate-y-1">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                    <Avatar seed={user.id} alt={`${displayName}'s avatar`} className="w-24 h-24 rounded-full object-cover border-4 border-line/40 flex-shrink-0" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-approval rounded-full border-2 border-surface" title={searchCopy.onlineTitle} aria-label={searchCopy.onlineTitle} role="status" />
                </div>
                <div className="flex-grow text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-2xl font-bold">
                            <Link href={`/user/${user.id}`} onClick={() => onViewProfile(user)} className="hover:text-brand transition">
                                {displayName}
                            </Link>
                        </h3>
                        <Link
                            href={`/messages?conversation=${user.id}`}
                            onClick={() => onStartMessage(user)}
                            className="mt-2 sm:mt-0 flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-start to-brand-end hover:from-brand-start-hover hover:to-brand-end-hover rounded-xl transition-all duration-300 hover:-translate-y-0.5 text-sm text-white shadow-glass-sm hover:shadow-glass-md"
                        >
                            <MessageSquare size={16} /> {commonLabels.message}
                        </Link>
                    </div>
                    <p className="text-faint mt-2 text-sm line-clamp-2">{getDisplayBio(user.about_me)}</p>
                </div>
            </div>

            <div className="border-t border-line/30 my-4"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(user.show_location !== false) && <DetailItem icon={<MapPin size={18} />} label={commonLabels.location} value={getDisplayLocation(user.location)} />}
                {(user.show_age !== false) && <DetailItem icon={<Calendar size={18} />} label={commonLabels.age} value={user.age} />}
                <DetailItem icon={<User size={18} />} label={commonLabels.gender} value={getDisplayGender(user.gender)} />
                <DetailItem icon={<Clock size={18} />} label={commonLabels.registrationDate} value={formatShortDate(user.created_at)} />
                <DetailItem icon={<LogIn size={18} />} label={commonLabels.lastLogin} value={formatShortDate(user.last_login) ?? 'Never'} />

                {user.profile_languages && user.profile_languages.length > 0 && (
                    <DetailItem icon={<Languages size={18} />} label={commonLabels.languages}>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {user.profile_languages.map((lang) => (
                                <span key={lang} className="px-2 py-1 bg-surface-secondary text-brand-soft rounded-full text-xs">
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
                        <Heart size={18} className="text-connection" />
                        <h4 className="font-medium text-faint text-sm">{commonLabels.passions}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {user.profilepassions.map((passion) => (
                            <span key={passion} className="px-3 py-1 bg-brand/15 text-brand-soft rounded-full text-xs border border-brand/25">
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
    useProfileGate();
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
    const [sortBy, setSortBy] = useState<'smart' | 'recent' | 'passions' | 'last_login' | 'registration'>('smart');
    const [totalResults, setTotalResults] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [session, setSession] = useState<Session | null>(null);
    const resultsRef = useRef<SearchResult[]>([]);

    const sortedResults = useMemo(() => {
        const arr = [...results];
        switch (sortBy) {
            case 'smart': {
                const now = Date.now();
                const scores = new Map(arr.map((u) => [u.id, computeSmartScore(u, selectedPassions, now)]));
                return arr.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
            }
            case 'passions':
                return arr.sort((a, b) => (b.profilepassions?.length ?? 0) - (a.profilepassions?.length ?? 0));
            case 'last_login':
                return arr.sort((a, b) => {
                    if (!a.last_login && !b.last_login) return 0;
                    if (!a.last_login) return 1;
                    if (!b.last_login) return -1;
                    return new Date(b.last_login).getTime() - new Date(a.last_login).getTime();
                });
            case 'registration':
                return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            case 'recent':
            default:
                return arr;
        }
    }, [results, sortBy, selectedPassions]);
    const filterFieldClass = 'w-full rounded-xl border border-line/30 bg-surface-secondary/70 p-2.5 text-foreground placeholder-faint transition focus:outline-none focus:ring-2 focus:ring-brand/50';

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
                setError(searchCopy.failedToSearchProfiles);
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
            setError(searchCopy.unexpectedError);
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
        if (!saveSearchName.trim()) return;

        const passionIds = selectedPassions.map(name =>
            availablePassions.find(p => p.name === name)?.id
        ).filter(Boolean) as number[];

        const { data, error } = await appClient.from('saved_searches').insert({
            user_id: session!.user.id,
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
            toast.error(searchCopy.failedToSaveSearch);
        } else {
            setSavedSearches([...savedSearches, data]);
            setIsSaveModalOpen(false);
            setSaveSearchName('');
        }
    };

    const handleSearchResultClick = useCallback((_user?: unknown, _target?: unknown) => { }, []);

    const loadSavedSearch = (search: SavedSearch) => {
        setQuery(search.query || '');
        setLocation(search.location || '');
        setMinAge(search.min_age?.toString() || '');
        setMaxAge(search.max_age?.toString() || '');
        setLanguage(search.language || '');
        setGender(normalizeGender(search.gender) || '');

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

    const buildSavedSearchSummary = (search: SavedSearch): string[] => {
        const tags: string[] = [];
        if (search.query) tags.push(search.query);
        if (search.location) tags.push(search.location);
        if (search.min_age && search.max_age) tags.push(`${search.min_age}–${search.max_age}y`);
        else if (search.min_age) tags.push(`${search.min_age}+y`);
        else if (search.max_age) tags.push(`≤${search.max_age}y`);
        if (search.gender) tags.push(search.gender);
        if (search.language) tags.push(search.language);
        if (search.passion_ids && search.passion_ids.length > 0)
            tags.push(`${search.passion_ids.length} passion${search.passion_ids.length > 1 ? 's' : ''}`);
        return tags.slice(0, 3);
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
        <div className="editorial-shell py-8 sm:py-12 lg:py-16">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel rounded-[1.75rem] p-6">
                        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-foreground">
                            <SlidersHorizontal className="h-5 w-5 text-brand" /> {searchCopy.filtersTitle}
                        </h2>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div>
                                <label htmlFor="search-query" className="block text-sm font-medium text-faint mb-1">{searchCopy.keywordsLabel}</label>
                                <input
                                    id="search-query"
                                    name="query"
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={searchCopy.keywordsPlaceholder}
                                    className={filterFieldClass}
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label htmlFor="search-location" className="block text-sm font-medium text-faint mb-1">{commonLabels.location}</label>
                                <input
                                    id="search-location"
                                    name="location"
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder={searchCopy.locationPlaceholder}
                                    className={filterFieldClass}
                                    autoComplete="off"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label htmlFor="search-min-age" className="block text-sm font-medium text-faint mb-1">{searchCopy.minAgeLabel}</label>
                                    <input
                                        id="search-min-age"
                                        name="minAge"
                                        type="number"
                                        value={minAge}
                                        onChange={(e) => setMinAge(e.target.value)}
                                        className={filterFieldClass}
                                        inputMode="numeric"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="search-max-age" className="block text-sm font-medium text-faint mb-1">{searchCopy.maxAgeLabel}</label>
                                    <input
                                        id="search-max-age"
                                        name="maxAge"
                                        type="number"
                                        value={maxAge}
                                        onChange={(e) => setMaxAge(e.target.value)}
                                        className={filterFieldClass}
                                        inputMode="numeric"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="search-gender" className="block text-sm font-medium text-faint mb-1">{commonLabels.gender}</label>
                                <select
                                    id="search-gender"
                                    name="gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className={filterFieldClass}
                                >
                                    <option value="">{searchCopy.any}</option>
                                    {GENDER_OPTIONS.map((genderOption) => (
                                        <option key={genderOption} value={genderOption}>{genderOption}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="search-language" className="block text-sm font-medium text-faint mb-1">{searchCopy.languageLabel}</label>
                                <input
                                    id="search-language"
                                    name="language"
                                    type="text"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    placeholder={searchCopy.languagePlaceholder}
                                    className={filterFieldClass}
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <MultiSelect
                                    label={commonLabels.passions}
                                    options={availablePassions}
                                    selected={selectedPassions}
                                    onChange={setSelectedPassions}
                                    placeholder={searchCopy.selectPassionsPlaceholder}
                                    id="search-passions"
                                    name="passions"
                                />
                            </div>

                            <div>
                                <label htmlFor="search-sort" className="mb-1.5 block text-sm font-medium text-faint">{commonLabels.sortBy}</label>
                                <select
                                    id="search-sort"
                                    name="sortBy"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'smart' | 'recent' | 'passions' | 'last_login' | 'registration')}
                                    className={filterFieldClass}
                                >
                                    <option value="smart">{searchCopy.sortOptions.smart}</option>
                                    <option value="recent">{searchCopy.sortOptions.recent}</option>
                                    <option value="passions">{searchCopy.sortOptions.passions}</option>
                                    <option value="last_login">{searchCopy.sortOptions.lastLogin}</option>
                                    <option value="registration">{searchCopy.sortOptions.registration}</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading && page === 1}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-start to-brand-end py-2.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-glow disabled:cursor-not-allowed disabled:from-brand/40 disabled:to-brand/40"
                            >
                                {loading && page === 1 ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {searchCopy.searching}
                                    </>
                                ) : (
                                    commonLabels.search
                                )}
                            </button>

                            {session && (
                                <button
                                    type="button"
                                    onClick={() => setIsSaveModalOpen(true)}
                                    className="glass-surface flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-secondary/80"
                                >
                                    <Save size={16} /> {searchCopy.saveSearchButton}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="glass-surface flex w-full items-center justify-center rounded-xl py-2.5 font-medium text-muted transition-all duration-300 hover:-translate-y-0.5 hover:text-brand"
                            >
                                {searchCopy.clearAllFilters}
                            </button>
                        </form>
                    </div>

                    {/* Saved Searches */}
                    {savedSearches.length > 0 && (
                        <div className="glass-surface rounded-[1.75rem] p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Bookmark size={15} className="text-brand" />
                                    <h3 className="font-semibold text-foreground">{searchCopy.savedSearchesTitle}</h3>
                                </div>
                                <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-brand/15 text-brand-soft border border-brand/20">
                                    {savedSearches.length}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {savedSearches.map(search => (
                                    <div
                                        key={search.id}
                                        className="group flex items-center gap-2 rounded-xl border border-line/20 bg-surface-secondary/50 px-3 py-2.5 transition-all duration-200 hover:border-brand/30 hover:bg-surface-secondary/80 hover:-translate-y-px hover:shadow-glass-sm"
                                    >
                                        <button
                                            onClick={() => loadSavedSearch(search)}
                                            className="flex min-w-0 flex-grow flex-col items-start gap-1 text-left"
                                        >
                                            <span className="text-sm font-medium leading-none text-foreground truncate w-full">
                                                {search.name}
                                            </span>
                                            {buildSavedSearchSummary(search).length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {buildSavedSearchSummary(search).map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-block rounded-full bg-brand/10 px-1.5 py-px text-[10px] leading-tight text-brand-soft"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteSavedSearch(search.id)}
                                            className="ml-auto flex-shrink-0 rounded-lg p-1.5 text-faint opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger"
                                            title={searchCopy.deleteSearchTitle}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Area */}
                <div className="lg:col-span-3">
                    <DiscoveryHeader
                        kicker={<><Zap size={14} className="text-warning" /> Discover</>}
                        title={searchCopy.discoverPeopleTitle}
                        subtitle={searchCopy.discoverPeopleSubtitle}
                        aside={results.length > 0 ? (
                            <span className="text-sm text-faint">{searchCopy.results(totalResults)}</span>
                        ) : undefined}
                    >
                        {hasActiveFilters && !error && (
                            <div className="glass-surface rounded-[1.5rem] p-4 animate-fade-in-up">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-muted">{searchCopy.activeFilters}</span>
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-xs text-brand hover:text-brand-soft transition-colors"
                                    >
                                        {searchCopy.clearAll}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {query && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand/15 text-brand-soft rounded-full text-sm border border-brand/25">
                                            {searchCopy.queryFilterPrefix}: {query}
                                            <button onClick={() => clearFilter('query')} className="hover:text-foreground ml-1">
                                                ×
                                            </button>
                                        </span>
                                    )}
                                    {location && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-info/10 text-info-soft rounded-full text-sm border border-info/25">
                                            {location}
                                            <button onClick={() => clearFilter('location')} className="hover:text-foreground ml-1">
                                                ×
                                            </button>
                                        </span>
                                    )}
                                    {(minAge || maxAge) && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-approval/10 text-approval-soft rounded-full text-sm border border-approval/25">
                                            {searchCopy.ageFilterPrefix}: {minAge && maxAge ? `${minAge}-${maxAge}` : minAge || maxAge}
                                            <button onClick={() => { clearFilter('minAge'); clearFilter('maxAge'); }} className="hover:text-foreground ml-1">
                                                ×
                                            </button>
                                        </span>
                                    )}
                                    {gender && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-discovery/10 text-discovery-soft rounded-full text-sm border border-discovery/25">
                                            {gender}
                                            <button onClick={() => clearFilter('gender')} className="hover:text-foreground ml-1">
                                                ×
                                            </button>
                                        </span>
                                    )}
                                    {language && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand/10 text-brand-soft rounded-full text-sm border border-brand/25">
                                            {language}
                                            <button onClick={() => clearFilter('language')} className="hover:text-foreground ml-1">
                                                ×
                                            </button>
                                        </span>
                                    )}
                                    {selectedPassions.map((passion) => (
                                        <span key={passion} className="inline-flex items-center gap-1 px-3 py-1 bg-connection/10 text-connection-soft rounded-full text-sm border border-connection/25">
                                            {passion}
                                            <button onClick={() => { setSelectedPassions(prev => prev.filter(p => p !== passion)); setPage(1); }} className="hover:text-foreground ml-1">
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </DiscoveryHeader>

                    {/* Error Display */}
                    {error && !loading && (
                        <div className="glass-panel mb-6 flex flex-col items-center rounded-[1.75rem] border-danger/30 bg-danger/10 py-12 text-center">
                            <div className="bg-danger/15 p-4 rounded-full mb-4">
                                <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-danger text-lg mb-2">{error}</p>
                            <button
                                onClick={() => { setError(null); performSearch(1); }}
                                className="mt-2 px-4 py-2 text-brand hover:text-brand-soft border border-brand/50 hover:border-brand rounded-lg transition-colors"
                            >
                                {searchCopy.tryAgain}
                            </button>
                        </div>
                    )}

                    {loading && page === 1 ? (
                        <div className="space-y-6">
                            {[...Array(3)].map((_, i) => (
                                <SearchSkeleton key={i} />
                            ))}
                        </div>
                    ) : sortedResults.length > 0 ? (
                        <div className="space-y-6">
                            {sortedResults.map(user => (
                                <SearchResultCard
                                    key={user.id}
                                    user={user}
                                    onViewProfile={(resultUser) => handleSearchResultClick(resultUser, 'profile')}
                                    onStartMessage={(resultUser) => handleSearchResultClick(resultUser, 'message')}
                                />
                            ))}
                        </div>
                    ) : (
                        <DiscoveryEmptyState
                            icon={<User className="w-8 h-8 text-faint" />}
                            title={searchCopy.noProfilesFoundTitle}
                            description={searchCopy.noProfilesFoundDescription}
                            action={
                                <button
                                    onClick={clearAllFilters}
                                    className="px-4 py-2 text-brand hover:text-brand-soft border border-brand/50 hover:border-brand rounded-lg transition-colors"
                                >
                                    {searchCopy.clearAllFilters}
                                </button>
                            }
                        />
                    )}

                    {/* Load More */}
                    {results.length > 0 && hasMore && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={loadMore}
                                disabled={loading}
                                className="glass-surface rounded-full px-6 py-2 text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-secondary/80 disabled:opacity-50"
                            >
                                {loading ? searchCopy.loading : searchCopy.loadMore}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Search Modal */}
            {isSaveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay/70 backdrop-blur-sm">
                    <div className="glass-panel w-full max-w-md rounded-[1.75rem] p-6">
                        <h3 className="text-xl font-bold mb-4">{searchCopy.saveSearchTitle}</h3>
                        <label htmlFor="save-search-name" className="block text-sm font-medium text-faint mb-2">{searchCopy.saveSearchNameLabel}</label>
                        <input
                            id="save-search-name"
                            name="saveSearchName"
                            type="text"
                            value={saveSearchName}
                            onChange={(e) => setSaveSearchName(e.target.value)}
                            placeholder={searchCopy.giveSearchNamePlaceholder}
                            className={`${filterFieldClass} mb-4 p-3`}
                            autoComplete="off"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsSaveModalOpen(false)}
                                className="px-4 py-2 text-faint hover:text-foreground"
                            >
                                {searchCopy.cancel}
                            </button>
                            <button
                                onClick={saveSearch}
                                className="rounded-xl bg-gradient-to-r from-brand-start to-brand-end px-4 py-2 text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover"
                            >
                                {searchCopy.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
