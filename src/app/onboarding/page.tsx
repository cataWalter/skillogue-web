'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import MultiSelect from '../../components/MultiSelect';

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

const Onboarding: React.FC = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
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
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: allLanguages } = await supabase.from('languages').select('id, name');
            setAvailableLanguages(allLanguages || []);

            const { data: allPassions } = await supabase.from('passions').select('id, name');
            setAvailablePassions(allPassions || []);

            const { data: countryData } = await supabase.rpc('get_distinct_countries');
            setCountries(countryData?.map((c: { country: string }) => c.country) || []);

            setLoading(false);
        };

        loadInitialData();
    }, [router]);

    useEffect(() => {
        if (location.country) {
            const fetchRegions = async () => {
                const { data, error } = await supabase.rpc('get_distinct_regions', { p_country: location.country });
                if (error) console.error("Error fetching regions:", error);
                else setRegions(data.map((r: { region: string }) => r.region).filter(Boolean));
            };
            fetchRegions();
        } else {
            setRegions([]);
        }
    }, [location.country]);

    useEffect(() => {
        if (location.country) {
            const fetchCities = async () => {
                const { data, error } = await supabase.rpc('get_distinct_cities', {
                    p_country: location.country,
                    p_region: location.region || null
                });
                if (error) console.error("Error fetching cities:", error);
                else setCities(data.map((c: { city: string }) => c.city));
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
            return newState;
        });
    };

    const nextStep = () => {
        if (step === 1) {
            if (!profile.first_name || !profile.last_name || !profile.age || !profile.gender) {
                setError('Please fill in all required fields.');
                return;
            }
        } else if (step === 2) {
            if (!location.country || !location.city) {
                setError('Please select your location.');
                return;
            }
        }
        setError('');
        setStep(prev => prev + 1);
    };

    const prevStep = () => {
        setError('');
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (selectedPassions.length < 3) {
            setError('Please select at least 3 passions.');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            // 1. Upsert Location
            let locationId: number | null = null;
            if (location.city && location.country) {
                const { data: locData, error: locError } = await supabase
                    .from('locations')
                    .select('id')
                    .eq('city', location.city)
                    .eq('region', location.region || '')
                    .eq('country', location.country)
                    .maybeSingle();

                if (locError) throw locError;

                if (locData) {
                    locationId = locData.id;
                } else {
                    const { data: newLoc, error: newLocError } = await supabase
                        .from('locations')
                        .insert({
                            city: location.city,
                            region: location.region || '',
                            country: location.country
                        })
                        .select()
                        .single();
                    if (newLocError) throw newLocError;
                    locationId = newLoc.id;
                }
            }

            // 2. Upsert Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...profile,
                    age: parseInt(profile.age),
                    location_id: locationId,
                    updated_at: new Date().toISOString(),
                });

            if (updateError) throw updateError;

            // 3. Update Languages
            if (selectedLanguages.length > 0) {
                const languageInserts = selectedLanguages.map(name => {
                    const lang = availableLanguages.find(l => l.name === name);
                    return lang ? { profile_id: user.id, language_id: lang.id } : null;
                }).filter(Boolean);
                await supabase.from('profile_languages').insert(languageInserts);
            }

            // 4. Update Passions
            if (selectedPassions.length > 0) {
                const passionInserts = selectedPassions.map(name => {
                    const passion = availablePassions.find(p => p.name === name);
                    return passion ? { profile_id: user.id, passion_id: passion.id } : null;
                }).filter(Boolean);
                await supabase.from('profile_passions').insert(passionInserts);
            }

            router.push('/dashboard');
        } catch (err: unknown) {
            console.error('Error completing onboarding:', err);
            const message = err instanceof Error ? err.message : 'Failed to save profile';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Welcome to Skillogue!
                    </h1>
                    <p className="text-gray-400 mt-2">Let&apos;s set up your profile to find your tribe.</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-800 h-2 rounded-full mb-8">
                    <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(step / 3) * 100}%` }}
                    ></div>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6 text-center">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-semibold text-white">Step 1: The Basics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={profile.first_name}
                                    onChange={handleProfileChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Jane"
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
                                    placeholder="Doe"
                                />
                            </div>
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
                                    placeholder="25"
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
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">About Me</label>
                            <textarea
                                name="about_me"
                                value={profile.about_me}
                                onChange={handleProfileChange}
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="I love hiking and coding..."
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-semibold text-white">Step 2: Location</h2>
                        <div className="space-y-4">
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
                                    disabled={!location.region && !location.country}
                                >
                                    <option value="">Select City</option>
                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-semibold text-white">Step 3: Interests & Languages</h2>
                        <div className="space-y-6">
                            <MultiSelect
                                label="Passions (Select at least 3)"
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
                )}

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            className="flex items-center gap-2 px-6 py-2 text-gray-400 hover:text-white transition"
                        >
                            <ArrowLeft size={20} /> Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold transition"
                        >
                            Next <ArrowRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-8 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg rounded-lg text-white font-bold transition transform hover:scale-105"
                        >
                            Complete Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
