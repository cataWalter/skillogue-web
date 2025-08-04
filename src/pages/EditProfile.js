// src/pages/EditProfile.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MultiSelect from '../components/MultiSelect';

const EditProfile = () => {
    // --- States for profile data ---
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        about_me: '',
        age: '',
        gender: '',
    });
    const [location, setLocation] = useState({
        city: '',
        region: '',
        country: '',
    });
    const [selectedLanguages, setSelectedLanguages] = useState([]);
    const [selectedPassions, setSelectedPassions] = useState([]);

    // --- States for dropdown options ---
    const [availablePassions, setAvailablePassions] = useState([]);
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [countries, setCountries] = useState([]);
    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);

    const [error, setError] = useState('');
    const navigate = useNavigate();

    // --- EFFECT 1: Load all initial data for the form ---
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            // Fetch profile data including the linked location
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(`*, locations(*)`)
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                setError('Failed to load profile.');
                console.error(profileError);
                setLoading(false);
                return;
            }

            // Pre-fill form with existing data
            if (profileData) {
                setProfile({
                    first_name: profileData.first_name || '',
                    last_name: profileData.last_name || '',
                    about_me: profileData.about_me || '',
                    age: profileData.age || '',
                    gender: profileData.gender || '',
                });
                if (profileData.locations) {
                    setLocation({
                        city: profileData.locations.city || '',
                        region: profileData.locations.region || '',
                        country: profileData.locations.country || '',
                    });
                }
            }

            // Fetch selected languages and passions
            const { data: languageData } = await supabase.from('profile_languages').select('languages (name)').eq('profile_id', user.id);
            setSelectedLanguages(languageData?.map(l => l.languages.name) || []);

            const { data: passionData } = await supabase.from('profile_passions').select('passions (name)').eq('profile_id', user.id);
            setSelectedPassions(passionData?.map(p => p.passions.name) || []);

            // Fetch all available options for MultiSelect components
            const { data: allLanguages } = await supabase.from('languages').select('id, name');
            setAvailableLanguages(allLanguages || []);

            const { data: allPassions } = await supabase.from('passions').select('id, name');
            setAvailablePassions(allPassions || []);

            // Fetch distinct countries for the first location dropdown
            const { data: countryData } = await supabase.rpc('get_distinct_countries');
            setCountries(countryData?.map(c => c.country) || []);

            setLoading(false);
        };

        loadInitialData();
    }, [navigate]);

    // --- EFFECT 2: Fetch regions when a country is selected ---
    useEffect(() => {
        if (location.country) {
            const fetchRegions = async () => {
                const { data, error } = await supabase.rpc('get_distinct_regions', { selected_country: location.country });
                if (error) {
                    console.error("Error fetching regions:", error);
                    setRegions([]);
                } else {
                    setRegions(data.map(r => r.region).filter(Boolean));
                }
            };
            fetchRegions();
        } else {
            setRegions([]); // Clear regions if no country is selected
        }
    }, [location.country]);

    // --- EFFECT 3: Fetch cities when a country or region changes ---
    useEffect(() => {
        if (location.country) {
            const fetchCities = async () => {
                const { data, error } = await supabase.rpc('get_cities', {
                    selected_country: location.country,
                    selected_region: location.region || null
                });
                if (error) {
                    console.error("Error fetching cities:", error);
                    setCities([]);
                } else {
                    setCities(data.map(c => c.city));
                }
            };
            fetchCities();
        } else {
            setCities([]); // Clear cities if no country is selected
        }
    }, [location.country, location.region]);

    // --- Event Handlers ---
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleLocationChange = (e) => {
        const { name, value } = e.target;
        setLocation(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'country') {
                newState.region = '';
                newState.city = '';
                setRegions([]);
                setCities([]);
            }
            if (name === 'region') {
                newState.city = '';
                setCities([]);
            }
            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('User not authenticated.');
            setLoading(false);
            return;
        }

        try {
            // This logic remains the same, as it correctly finds or creates a location
            // based on the `location` state object, which is now populated by dropdowns.
            let locationId = null;
            if (location.country) {
                const { data: existingLocation } = await supabase
                    .from('locations')
                    .select('id')
                    .match({
                        city: location.city || null,
                        region: location.region || null,
                        country: location.country
                    })
                    .maybeSingle();

                if (existingLocation) {
                    locationId = existingLocation.id;
                } else {
                    const { data: newLocation, error: locError } = await supabase
                        .from('locations')
                        .insert({
                            city: location.city || null,
                            region: location.region || null,
                            country: location.country
                        })
                        .select()
                        .single();
                    if (locError) throw locError;
                    locationId = newLocation.id;
                }
            }

            // Upsert profile data
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    about_me: profile.about_me,
                    age: profile.age ? Number(profile.age) : null,
                    gender: profile.gender,
                    location_id: locationId
                });
            if (profileError) throw profileError;

            // Update languages and passions (logic remains the same)
            await supabase.from('profile_languages').delete().eq('profile_id', user.id);
            const languageInserts = selectedLanguages.map(langName => ({
                profile_id: user.id,
                language_id: availableLanguages.find(l => l.name === langName)?.id
            })).filter(item => item.language_id);
            if (languageInserts.length > 0) {
                await supabase.from('profile_languages').insert(languageInserts);
            }

            await supabase.from('profile_passions').delete().eq('profile_id', user.id);
            const passionInserts = selectedPassions.map(passionName => ({
                profile_id: user.id,
                passion_id: availablePassions.find(p => p.name === passionName)?.id
            })).filter(item => item.passion_id);
            if (passionInserts.length > 0) {
                await supabase.from('profile_passions').insert(passionInserts);
            }

            alert('Profile updated successfully!');
            navigate('/profile');

        } catch (err) {
            setError('Failed to update profile. ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <header className="p-6 border-b border-gray-800 flex items-center">
                <button
                    onClick={() => navigate('/profile')}
                    className="text-gray-400 hover:text-white transition flex items-center gap-2"
                >
                    <ArrowLeft size={20} />
                    Back to Profile
                </button>
            </header>

            <main className="p-6 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Edit Your Profile
                </h1>

                {error && <p className="text-red-500 mb-6">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                value={profile.first_name}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                value={profile.last_name}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* About Me */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">About Me</label>
                        <textarea
                            name="about_me"
                            value={profile.about_me}
                            onChange={handleProfileChange}
                            rows="4"
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                            placeholder="Tell others about yourself..."
                        />
                    </div>

                    {/* Age & Gender */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                            <input
                                type="number"
                                name="age"
                                value={profile.age}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                                min="16"
                                max="120"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                            <select
                                name="gender"
                                value={profile.gender}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                            >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>

                    {/* NEW Location Dropdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                            <select name="country" value={location.country} onChange={handleLocationChange} required className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white">
                                <option value="">Select Country</option>
                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                            <select name="region" value={location.region} onChange={handleLocationChange} disabled={!location.country || regions.length === 0} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white disabled:opacity-50">
                                <option value="">Select Region</option>
                                {regions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                            <select name="city" value={location.city} onChange={handleLocationChange} disabled={!location.country || cities.length === 0} required className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white disabled:opacity-50">
                                <option value="">Select City</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Languages - Using MultiSelect */}
                    <MultiSelect
                        options={availableLanguages}
                        selected={selectedLanguages}
                        onChange={setSelectedLanguages}
                        label="Languages I Speak"
                        placeholder="Select languages..."
                    />

                    {/* Passions - Using MultiSelect */}
                    <MultiSelect
                        options={availablePassions}
                        selected={selectedPassions}
                        onChange={setSelectedPassions}
                        label="My Passions"
                        placeholder="Select your passions..."
                    />

                    {/* Save Button */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-70"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default EditProfile;