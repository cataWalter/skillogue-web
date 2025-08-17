// src/pages/EditProfile.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import MultiSelect from '../components/MultiSelect';

interface ProfileState {
    first_name: string;
    last_name: string;
    about_me: string;
    age: string;
    gender: string;
}
interface LocationState {
    city: string;
    region: string;
    country: string;
}
interface Passion {
    id: number;
    name: string;
}
interface Language {
    id: number;
    name: string;
}

type SupabaseRelation = {
    languages: { name: string } | null;
} | {
    passions: { name: string } | null;
};


const EditProfile: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [profile, setProfile] = useState<ProfileState>({
        first_name: '',
        last_name: '',
        about_me: '',
        age: '',
        gender: '',
    });
    const [location, setLocation] = useState<LocationState>({
        city: '',
        region: '',
        country: '',
    });
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [selectedPassions, setSelectedPassions] = useState<string[]>([]);
    const [availablePassions, setAvailablePassions] = useState<Passion[]>([]);
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [regions, setRegions] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const navigate = useNavigate();
    useEffect(() => {
        const loadInitialData = async () => {
            console.log('[DEBUG] Starting to load initial data...');
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }
            console.log('[DEBUG] Fetching data from Supabase...');
            const [
                profileRes,
                languageRes,
                passionRes,
                allLanguagesRes,
                allPassionsRes,
                countriesRes
            ] = await Promise.all([
                supabase.from('profiles').select(`*, locations(*)`).eq('id', user.id).single(),
                supabase.from('profile_languages').select('languages(name)').eq('profile_id', user.id),
                supabase.from('profile_passions').select('passions(name)').eq('profile_id', user.id),
                supabase.from('languages').select('id, name'),
                supabase.from('passions').select('id, name'),
                supabase.rpc('get_distinct_countries')
            ]);
            console.log('[DEBUG] Raw Supabase language response:', JSON.stringify(languageRes.data, null, 2));
            console.log('[DEBUG] Raw Supabase passion response:', JSON.stringify(passionRes.data, null, 2));
            const { data: profileData, error: profileError } = profileRes;
            if (profileError && profileError.code !== 'PGRST116') {
                setError('Failed to load profile.');
                console.error(profileError);
                setLoading(false);
                return;
            }

            // ✅ FIX: Use a type assertion to tell TypeScript the correct data shape.
            const currentLanguages = (languageRes.data as { languages: { name: string } | null }[] | null)
                ?.map(item => item.languages?.name)
                .filter((name): name is string => !!name) || [];

            // ✅ FIX: Apply the same fix for passions.
            const currentPassions = (passionRes.data as { passions: { name: string } | null }[] | null)
                ?.map(item => item.passions?.name)
                .filter((name): name is string => !!name) || [];

            console.log('[DEBUG] Processed current languages:', currentLanguages);
            console.log('[DEBUG] Processed current passions:', currentPassions);
            if (profileData) {
                setProfile({
                    first_name: profileData.first_name || '',
                    last_name: profileData.last_name || '',
                    about_me: profileData.about_me || '',
                    age: profileData.age?.toString() || '',
                    gender: profileData.gender || '',
                });
                if (profileData.locations) {
                    const loc = profileData.locations as LocationState;
                    setLocation({
                        city: loc.city || '',
                        region: loc.region || '',
                        country: loc.country || '',
                    });
                }
            }
            console.log('[DEBUG] Setting selected languages state to:', currentLanguages);
            setSelectedLanguages(currentLanguages);
            console.log('[DEBUG] Setting selected passions state to:', currentPassions);
            setSelectedPassions(currentPassions);
            if (
                profileData && profileData.first_name && profileData.last_name &&
                profileData.about_me && profileData.age && profileData.gender &&
                profileData.locations?.city && currentPassions.length > 0 && currentLanguages.length > 0
            ) {
                setIsProfileComplete(true);
            } else {
                setIsProfileComplete(false);
            }
            setAvailableLanguages(allLanguagesRes.data || []);
            setAvailablePassions(allPassionsRes.data || []);
            setCountries(countriesRes.data?.map((c: { country: string }) => c.country) || []);
            console.log('[DEBUG] Finished loading initial data.');
            setLoading(false);
        };
        loadInitialData();
    }, [navigate]);
    useEffect(() => {
        if (location.country) {
            const fetchRegions = async () => {
                const { data } = await supabase.rpc('get_distinct_regions', { selected_country: location.country });
                setRegions(data?.map((r: { region: string }) => r.region).filter(Boolean) || []);
            };
            fetchRegions();
        } else {
            setRegions([]);
        }
    }, [location.country]);
    useEffect(() => {
        if (location.country) {
            const fetchCities = async () => {
                const { data } = await supabase.rpc('get_cities', {
                    selected_country: location.country,
                    selected_region: location.region || null
                });
                setCities(data?.map((c: { city: string }) => c.city) || []);
            };
            fetchCities();
        } else {
            setCities([]);
        }
    }, [location.country, location.region]);
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };
    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocation(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'country') {
                newState.region = '';
                newState.city = '';
            }
            if (name === 'region') newState.city = '';
            return newState;
        });
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
            let locationId: number | null = null;
            if (location.country) {
                const { data: existingLocation } = await supabase
                    .from('locations')
                    .select('id')
                    .match({ city: location.city || null, region: location.region || null, country: location.country })
                    .maybeSingle();
                if (existingLocation) {
                    locationId = existingLocation.id;
                } else {
                    const { data: newLocation, error: locError } = await supabase
                        .from('locations')
                        .insert({ city: location.city || null, region: location.region || null, country: location.country })
                        .select().single();
                    if (locError) throw locError;
                    locationId = newLocation.id;
                }
            }
            await supabase.from('profiles').upsert({
                id: user.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                about_me: profile.about_me,
                age: profile.age ? Number(profile.age) : null,
                gender: profile.gender,
                location_id: locationId
            });
            await supabase.from('profile_languages').delete().eq('profile_id', user.id);
            const languageInserts = selectedLanguages.map(langName => ({
                profile_id: user.id,
                language_id: availableLanguages.find(l => l.name === langName)?.id
            })).filter((item): item is { profile_id: string; language_id: number } => !!item.language_id);
            if (languageInserts.length > 0) {
                await supabase.from('profile_languages').insert(languageInserts);
            }
            await supabase.from('profile_passions').delete().eq('profile_id', user.id);
            const passionInserts = selectedPassions.map(passionName => ({
                profile_id: user.id,
                passion_id: availablePassions.find(p => p.name === passionName)?.id
            })).filter((item): item is { profile_id: string; passion_id: number } => !!item.passion_id);
            if (passionInserts.length > 0) {
                await supabase.from('profile_passions').insert(passionInserts);
            }
            alert('Profile updated successfully!');
            navigate('/profile');
        } catch (err: any) {
            setError('Failed to update profile. ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };
    const isFormValid =
        profile.first_name.trim() &&
        profile.last_name.trim() &&
        profile.about_me.trim() &&
        profile.age &&
        profile.gender &&
        location.city &&
        selectedLanguages.length > 0 &&
        selectedPassions.length > 0;
    if (loading && !profile.first_name) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Loading your profile...</p>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-black text-white">
            <header className="p-6 border-b border-gray-800 flex items-center">
                {isProfileComplete && (
                    <button
                        onClick={() => navigate('/profile')}
                        className="text-gray-400 hover:text-white transition flex items-center gap-2"
                    >
                        <ArrowLeft size={20} />
                        Back to Profile
                    </button>
                )}
            </header>
            <main className="p-6 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {isProfileComplete ? 'Edit Your Profile' : 'Complete Your Profile'}
                </h1>
                {!isProfileComplete && (
                    <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg mb-8 flex items-start gap-3" role="alert">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Your profile is incomplete!</p>
                            <p className="text-sm">Please fill out all required fields to access the app.</p>
                        </div>
                    </div>
                )}
                {error && <p className="text-red-500 mb-6">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-8">
                    { }
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                            <input type="text" name="first_name" value={profile.first_name} onChange={handleProfileChange} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                            <input type="text" name="last_name" value={profile.last_name} onChange={handleProfileChange} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">About Me</label>
                        <textarea name="about_me" value={profile.about_me} onChange={handleProfileChange} rows={4} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white" placeholder="Tell others about yourself..." required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                            <input type="number" name="age" value={profile.age} onChange={handleProfileChange} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white" min="16" max="120" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                            <select name="gender" value={profile.gender} onChange={handleProfileChange} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white" required>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                            <select name="country" value={location.country} onChange={handleLocationChange} required className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg">
                                <option value="">Select Country</option>
                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                            <select name="region" value={location.region} onChange={handleLocationChange} disabled={!location.country || regions.length === 0} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg disabled:opacity-50">
                                <option value="">Select Region</option>
                                {regions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                            <select name="city" value={location.city} onChange={handleLocationChange} disabled={!location.country || cities.length === 0} required className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg disabled:opacity-50">
                                <option value="">Select City</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <MultiSelect options={availableLanguages} selected={selectedLanguages} onChange={setSelectedLanguages} label="Languages I Speak" placeholder="Select languages..." />
                    <MultiSelect options={availablePassions} selected={selectedPassions} onChange={setSelectedPassions} label="My Passions" placeholder="Select your passions..." />
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading || !isFormValid}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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