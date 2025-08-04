// src/pages/EditProfile.js
import React, {useEffect, useState} from 'react';
import {supabase} from '../supabaseClient';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import MultiSelect from '../components/MultiSelect'; // Import the new component

const EditProfile = () => {
    const [loading, setLoading] = useState(true);
    // Separate states for different parts of the profile
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

    // State for available options from the database
    const [availablePassions, setAvailablePassions] = useState([]);
    const [availableLanguages, setAvailableLanguages] = useState([]);

    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fetch all necessary data on component mount
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            const {data: {user}} = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            // --- 1. Fetch Profile and Location Data ---
            const {data: profileData, error: profileError} = await supabase
                .from('profiles')
                .select(`
                    *,
                    locations (city, region, country)
                `)
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // Handle errors other than no profile
                setError('Failed to load profile.');
                console.error(profileError);
                setLoading(false);
                return;
            }

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


            // --- 2. Fetch User's Selected Languages ---
            const {data: languageData, error: languageError} = await supabase
                .from('profile_languages')
                .select('languages (name)')
                .eq('profile_id', user.id);

            if (languageError) console.error('Error loading languages:', languageError);
            else setSelectedLanguages(languageData.map(l => l.languages.name));

            // --- 3. Fetch User's Selected Passions ---
            const {data: passionData, error: passionError} = await supabase
                .from('profile_passions')
                .select('passions (name)')
                .eq('profile_id', user.id);

            if (passionError) console.error('Error loading passions:', passionError);
            else setSelectedPassions(passionData.map(p => p.passions.name));


            // --- 4. Fetch All Available Languages and Passions for selection ---
            const {data: allLanguages, error: allLangError} = await supabase.from('languages').select('id, name');
            if (allLangError) console.error('Error fetching all languages', allLangError);
            else setAvailableLanguages(allLanguages);

            const {data: allPassions, error: allPassionsError} = await supabase.from('passions').select('id, name');
            if (allPassionsError) console.error('Error fetching all passions', allPassionsError);
            else setAvailablePassions(allPassions);


            setLoading(false);
        };

        loadInitialData();
    }, [navigate]);

    const handleProfileChange = (e) => {
        const {name, value} = e.target;
        setProfile((prev) => ({...prev, [name]: value}));
    };

    const handleLocationChange = (e) => {
        const {name, value} = e.target;
        setLocation((prev) => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const {data: {user}} = await supabase.auth.getUser();
        if (!user) {
            setError('User not authenticated.');
            setLoading(false);
            return;
        }

        try {
            // --- 1. Upsert Location and get location_id ---
            let locationId = null;
            if (location.country) { // Country is required in the schema
                const {data: existingLocation, error: findLocError} = await supabase
                    .from('locations')
                    .select('id')
                    .match({
                        city: location.city || null,
                        region: location.region || null,
                        country: location.country
                    })
                    .maybeSingle();

                if (findLocError) throw findLocError;

                if (existingLocation) {
                    locationId = existingLocation.id;
                } else {
                    const {data: newLocation, error: locError} = await supabase
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


            // --- 2. Upsert the main profile table ---
            const {error: profileError} = await supabase
                .from('profiles')
                .upsert({
                    id: user.id, // Important for upsert
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    about_me: profile.about_me,
                    age: profile.age ? Number(profile.age) : null,
                    gender: profile.gender,
                    location_id: locationId
                })
                .select()
                .single();

            if (profileError) throw profileError;


            // --- 3. Update Profile Languages ---
            await supabase.from('profile_languages').delete().eq('profile_id', user.id);
            const languageInserts = selectedLanguages.map(langName => {
                const language = availableLanguages.find(l => l.name === langName);
                return {profile_id: user.id, language_id: language?.id};
            }).filter(item => item.language_id);

            if (languageInserts.length > 0) {
                const {error: langError} = await supabase.from('profile_languages').insert(languageInserts);
                if (langError) throw langError;
            }


            // --- 4. Update Profile Passions ---
            await supabase.from('profile_passions').delete().eq('profile_id', user.id);
            const passionInserts = selectedPassions.map(passionName => {
                const passion = availablePassions.find(p => p.name === passionName);
                return {profile_id: user.id, passion_id: passion?.id};
            }).filter(item => item.passion_id);

            if (passionInserts.length > 0) {
                const {error: passionError} = await supabase.from('profile_passions').insert(passionInserts);
                if (passionError) throw passionError;
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
                    <ArrowLeft size={20}/>
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

                    {/* Location Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                            <input
                                type="text"
                                name="country"
                                value={location.country}
                                onChange={handleLocationChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                                placeholder="e.g. Germany"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                            <input
                                type="text"
                                name="region"
                                value={location.region}
                                onChange={handleLocationChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                                placeholder="e.g. Bavaria"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                            <input
                                type="text"
                                name="city"
                                value={location.city}
                                onChange={handleLocationChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                                placeholder="e.g. Munich"
                            />
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
