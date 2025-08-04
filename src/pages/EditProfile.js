// src/pages/EditProfile.js
import React, {useEffect, useState} from 'react';
import {supabase} from '../supabaseClient';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';

const EditProfile = () => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        about_me: '',
        age: '',
        location: '',
        gender: '',
        languages: [],
    });
    const [passions, setPassions] = useState([]);
    const [availablePassions, setAvailablePassions] = useState([]);
    const [selectedPassions, setSelectedPassions] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fetch current user and profile
    useEffect(() => {
        const loadProfileAndPassions = async () => {
            const {data: {user}} = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            // Load profile
            const {data: profileData, error: profileError} = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                setError('Failed to load profile.');
                console.error(profileError);
            } else {
                setProfile({
                    first_name: profileData.first_name || '',
                    last_name: profileData.last_name || '',
                    about_me: profileData.about_me || '',
                    age: profileData.age || '',
                    location: profileData.location || '',
                    gender: profileData.gender || '',
                    languages: Array.isArray(profileData.languages) ? profileData.languages : [],
                });
                // Store selected passions for later
                setSelectedPassions(profileData.passions?.map(p => p.name) || []);
            }

            // Load all passions for dropdown
            const {data: passionsData, error: passionsError} = await supabase
                .from('passions')
                .select('id, name');

            if (passionsError) {
                console.error('Error loading passions:', passionsError);
            } else {
                setAvailablePassions(passionsData);
            }

            setLoading(false);
        };

        loadProfileAndPassions();
    }, [navigate]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setProfile((prev) => ({...prev, [name]: value}));
    };

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        setProfile((prev) => {
            const languages = prev.languages.includes(lang)
                ? prev.languages.filter(l => l !== lang)
                : [...prev.languages, lang];
            return {...prev, languages};
        });
    };

    const handlePassionToggle = (passionName) => {
        setSelectedPassions(prev =>
            prev.includes(passionName)
                ? prev.filter(p => p !== passionName)
                : [...prev, passionName]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const {data: {user}} = await supabase.auth.getUser();
        if (!user) {
            setError('User not authenticated.');
            setLoading(false);
            return;
        }

        // Update profile
        const {error: profileError} = await supabase
            .from('profiles')
            .update({
                first_name: profile.first_name,
                last_name: profile.last_name,
                about_me: profile.about_me,
                age: profile.age ? Number(profile.age) : null,
                location: profile.location,
                gender: profile.gender,
                languages: profile.languages,
            })
            .eq('id', user.id);

        if (profileError) {
            setError('Failed to update profile.');
            console.error(profileError);
            setLoading(false);
            return;
        }

        // Clear old profile_passions
        await supabase
            .from('profile_passions')
            .delete()
            .eq('profile_id', user.id);

        // Insert new passions
        const passionInserts = selectedPassions.map(passionName => {
            const passion = availablePassions.find(p => p.name === passionName);
            return {profile_id: user.id, passion_id: passion?.id};
        }).filter(Boolean);

        if (passionInserts.length > 0) {
            const {error: passionError} = await supabase
                .from('profile_passions')
                .insert(passionInserts);

            if (passionError) {
                console.error('Error updating passions:', passionError);
            }
        }

        alert('Profile updated successfully!');
        navigate('/profile');
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
            {/* Header */}
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
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={profile.first_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={profile.last_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* About Me */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            About Me
                        </label>
                        <textarea
                            name="about_me"
                            value={profile.about_me}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                            placeholder="Tell others about yourself..."
                        />
                    </div>

                    {/* Age, Location, Gender */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Age
                            </label>
                            <input
                                type="number"
                                name="age"
                                value={profile.age}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                                min="16"
                                max="120"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={profile.location}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                                placeholder="e.g. Berlin, Germany"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Gender
                            </label>
                            <select
                                name="gender"
                                value={profile.gender}
                                onChange={handleChange}
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

                    {/* Languages */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Languages
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {['English', 'Spanish', 'French', 'German', 'Mandarin', 'Hindi', 'Arabic', 'Portuguese'].map(lang => (
                                <label key={lang} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={profile.languages.includes(lang)}
                                        onChange={handleLanguageChange}
                                        value={lang}
                                        className="rounded text-indigo-600"
                                    />
                                    <span className="text-gray-300">{lang}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Passions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Passions
                        </label>
                        <p className="text-sm text-gray-400 mb-3">
                            Select the interests you'd like to share
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {availablePassions.map(passion => (
                                <label
                                    key={passion.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition text-center ${
                                        selectedPassions.includes(passion.name)
                                            ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                                            : 'border-gray-700 hover:border-gray-500 text-gray-300'
                                    }`}
                                    onClick={() => handlePassionToggle(passion.name)}
                                >
                                    {passion.name}
                                </label>
                            ))}
                        </div>
                    </div>

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