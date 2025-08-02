// src/pages/Search.js
import React, {useEffect, useState} from 'react';
import {supabase} from '../supabaseClient';
import {Link} from 'react-router-dom';

const Search = () => {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');
    const [language, setLanguage] = useState('');
    const [gender, setGender] = useState('');
    const [passions, setPassions] = useState([]);
    const [allPassions, setAllPassions] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch all passions for dropdown
    useEffect(() => {
        const fetchPassions = async () => {
            const {data, error} = await supabase.from('passions').select('id, name');
            if (error) {
                console.error('Error loading passions:', error);
            } else {
                setAllPassions(data);
            }
        };

        fetchPassions();
    }, []);

    // Full-text & filtered search
    const handleSearch = async () => {
        setLoading(true);
        let queryBuilder = supabase
            .from('profiles')
            .select(`
        id,
        first_name,
        last_name,
        about_me,
        location,
        age,
        gender,
        languages,
        created_at,
        profile_passions(passions (name))
      `)
            .not('id', 'is', null); // exclude null profiles

        // Text search (full-text on multiple fields)
        if (query) {
            queryBuilder = queryBuilder.or(
                `first_name.ilike.%${query}%,last_name.ilike.%${query}%,about_me.ilike.%${query}%`
            );
        }

        // Filters
        if (location) {
            queryBuilder = queryBuilder.ilike('location', `%${location}%`);
        }
        if (minAge) {
            queryBuilder = queryBuilder.gte('age', minAge);
        }
        if (maxAge) {
            queryBuilder = queryBuilder.lte('age', maxAge);
        }
        if (language) {
            queryBuilder = queryBuilder.contains('languages', [language]);
        }
        if (gender) {
            queryBuilder = queryBuilder.eq('gender', gender);
        }

        // Passion filter (via join table)
        if (passions.length > 0) {
            // We need to filter profiles that have ALL selected passions
            for (const passionId of passions) {
                const {data, error} = await supabase
                    .from('profile_passions')
                    .select('profile_id')
                    .eq('passion_id', passionId);
                if (data) {
                    const profileIds = data.map(p => p.profile_id);
                    queryBuilder = queryBuilder.in('id', profileIds);
                }
            }
        }

        const {data, error} = await queryBuilder.order('created_at', {ascending: false});

        if (error) {
            console.error('Search error:', error);
        } else {
            // Map passions from join
            const resultsWithPassions = data.map(profile => {
                const profilePassions = profile.profile_passions?.map(pp => pp.passions.name) || [];
                return {...profile, profilePassions};
            });
            setResults(resultsWithPassions);
        }
        setLoading(false);
    };

    const togglePassion = (passionId) => {
        setPassions(prev =>
            prev.includes(passionId)
                ? prev.filter(id => id !== passionId)
                : [...prev, passionId]
        );
    };

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Find Your Tribe</h1>

                {/* Search Filters */}
                <div className="bg-gray-900 p-6 rounded-lg mb-8 space-y-4">
                    <h2 className="text-xl font-semibold">Search Filters</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Search by name or bio..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="bg-gray-800 px-4 py-2 rounded"
                        />
                        <input
                            type="text"
                            placeholder="Location (e.g., Berlin)"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="bg-gray-800 px-4 py-2 rounded"
                        />
                        <input
                            type="number"
                            placeholder="Min Age"
                            value={minAge}
                            onChange={(e) => setMinAge(e.target.value)}
                            className="bg-gray-800 px-4 py-2 rounded"
                        />
                        <input
                            type="number"
                            placeholder="Max Age"
                            value={maxAge}
                            onChange={(e) => setMaxAge(e.target.value)}
                            className="bg-gray-800 px-4 py-2 rounded"
                        />
                        <input
                            type="text"
                            placeholder="Language (e.g., Spanish)"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-gray-800 px-4 py-2 rounded"
                        />
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="bg-gray-800 px-4 py-2 rounded"
                        >
                            <option value="">Any Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Passion Selection */}
                    <div>
                        <h3 className="text-sm font-medium mb-2">Select Passions</h3>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {allPassions.map((passion) => (
                                <button
                                    key={passion.id}
                                    type="button"
                                    onClick={() => togglePassion(passion.id)}
                                    className={`px-3 py-1 rounded-full text-sm ${
                                        passions.includes(passion.id)
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {passion.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {/* Results */}
                <h2 className="text-2xl font-semibold mb-4">
                    Results: {results.length} {results.length === 1 ? 'person' : 'people'}
                </h2>

                <div className="space-y-6">
                    {results.length === 0 && !loading ? (
                        <p className="text-gray-400">No users found. Try adjusting your filters.</p>
                    ) : (
                        results.map((user) => (
                            <div key={user.id} className="bg-gray-900 p-6 rounded-lg hover:bg-gray-850 transition">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold">
                                            {user.first_name} {user.last_name}
                                        </h3>
                                        <p className="text-gray-300 mt-1">{user.about_me}</p>

                                        <div className="mt-2 text-sm text-gray-400">
                                            {user.location && <span>{user.location} • </span>}
                                            {user.age && <span>{user.age} • </span>}
                                            {user.gender}
                                        </div>

                                        {/* Passions */}
                                        {user.profilePassions.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-3">
                                                {user.profilePassions.map((passion, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-1 bg-indigo-900/50 text-indigo-200 rounded-full text-xs"
                                                    >
                            {passion}
                          </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Link
                                        to={`/messages?chatWith=${user.id}`}
                                        className="ml-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
                                    >
                                        Message
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Search;