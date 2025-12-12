'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import MultiSelect from '../../components/MultiSelect';
import Link from 'next/link';
import { updateProfileAction } from '../actions/profile';

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
    const [error, setError] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            
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

            const { data: profileData, error: profileError } = profileRes;
            if (profileError && profileError.code !== 'PGRST116') {
                setError('Failed to load profile.');
                console.error(profileError);
                setLoading(false);
                return;
            }

            const currentLanguages = (languageRes.data as { languages: { name: string } | null }[] | null)
                ?.map(item => item.languages?.name)
                .filter((name): name is string => !!name) || [];

            const currentPassions = (passionRes.data as { passions: { name: string } | null }[] | null)
                ?.map(item => item.passions?.name)
                .filter((name): name is string => !!name) || [];

            if (profileData) {
                setProfile({
                    first_name: profileData.first_name || '',
                    last_name: profileData.last_name || '',
                    about_me: profileData.about_me || '',
                    age: profileData.age?.toString() || '',
                    gender: profileData.gender || '',
                });
                if (profileData.locations) {
                    setLocation({
                        city: profileData.locations.city || '',
                        region: profileData.locations.region || '',
                        country: profileData.locations.country || '',
                    });
                    // Trigger region/city loads if we have data
                    if (profileData.locations.country) fetchRegions(profileData.locations.country);
                    if (profileData.locations.region) fetchCities(profileData.locations.country, profileData.locations.region);
                }
            }

            setSelectedLanguages(currentLanguages);
            setSelectedPassions(currentPassions);
            setAvailableLanguages(allLanguagesRes.data || []);
            setAvailablePassions(allPassionsRes.data || []);
            setCountries(countriesRes.data?.map((c: { country: string }) => c.country) || []);

            setLoading(false);
        };

        loadInitialData();
    }, [router]);

    const fetchRegions = async (country: string) => {
        const { data } = await supabase.rpc('get_distinct_regions', { p_country: country });
        setRegions(data?.map((r: { region: string }) => r.region) || []);
    };

    const fetchCities = async (country: string, region: string) => {
        const { data } = await supabase.rpc('get_distinct_cities', { p_country: country, p_region: region });
        setCities(data?.map((c: { city: string }) => c.city) || []);
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocation(prev => ({ ...prev, [name]: value }));

        if (name === 'country') {
            setLocation(prev => ({ ...prev, region: '', city: '' }));
            fetchRegions(value);
        } else if (name === 'region') {
            setLocation(prev => ({ ...prev, city: '' }));
            fetchCities(location.country, value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await updateProfileAction({
                first_name: profile.first_name,
                last_name: profile.last_name,
                about_me: profile.about_me,
                age: profile.age ? parseInt(profile.age) : null,
                gender: profile.gender,
                location: {
                    city: location.city || null,
                    region: location.region || null,
                    country: location.country || null
                },
                languages: selectedLanguages,
                passions: selectedPassions
            });

            if (!result.success) {
                if (result.details) {
                    const messages = Object.values(result.details).flat().join(', ');
                    throw new Error(messages);
                }
                throw new Error(result.error);
            }

            router.push('/profile');
        } catch (err: unknown) {
            console.error('Error updating profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="flex-grow p-4 sm:p-6 w-full">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile" className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold">Edit Profile</h1>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-3">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-800">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                value={profile.first_name}
                                onChange={handleProfileChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                value={profile.last_name}
                                onChange={handleProfileChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">About Me</label>
                        <textarea
                            name="about_me"
                            value={profile.about_me}
                            onChange={handleProfileChange}
                            rows={4}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Age</label>
                            <input
                                type="number"
                                name="age"
                                value={profile.age}
                                onChange={handleProfileChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                required
                                min="18"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Gender</label>
                            <select
                                name="gender"
                                value={profile.gender}
                                onChange={handleProfileChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="border-t border-gray-800 pt-6">
                        <h3 className="text-xl font-semibold mb-4">Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
                                <select
                                    name="country"
                                    value={location.country}
                                    onChange={handleLocationChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Region/State</label>
                                <select
                                    name="region"
                                    value={location.region}
                                    onChange={handleLocationChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    disabled={!location.country}
                                >
                                    <option value="">Select Region</option>
                                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">City</label>
                                <select
                                    name="city"
                                    value={location.city}
                                    onChange={handleLocationChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    disabled={!location.region}
                                >
                                    <option value="">Select City</option>
                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Interests */}
                    <div className="border-t border-gray-800 pt-6">
                        <h3 className="text-xl font-semibold mb-4">Interests & Languages</h3>
                        <div className="space-y-6">
                            <MultiSelect
                                label="Passions"
                                options={availablePassions}
                                selected={selectedPassions}
                                onChange={setSelectedPassions}
                                placeholder="Select your passions..."
                            />
                            <MultiSelect
                                label="Languages"
                                options={availableLanguages}
                                selected={selectedLanguages}
                                onChange={setSelectedLanguages}
                                placeholder="Select languages you speak..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-800">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-bold hover:shadow-lg transform hover:scale-105 transition"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
