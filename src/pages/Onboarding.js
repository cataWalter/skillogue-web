// src/pages/Onboarding.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import MultiSelect from '../components/MultiSelect';
import SEO from '../components/SEO';

const Onboarding = () => {
    const [step, setStep] = useState(1);
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
    const [availablePassions, setAvailablePassions] = useState([]);
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [countries, setCountries] = useState([]);
    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const { data: allLanguages } = await supabase.from('languages').select('id, name');
            setAvailableLanguages(allLanguages || []);

            const { data: allPassions } = await supabase.from('passions').select('id, name');
            setAvailablePassions(allPassions || []);

            const { data: countryData } = await supabase.rpc('get_distinct_countries');
            setCountries(countryData?.map(c => c.country) || []);

            setLoading(false);
        };

        loadInitialData();
    }, [navigate]);

    useEffect(() => {
        if (location.country) {
            const fetchRegions = async () => {
                const { data, error } = await supabase.rpc('get_distinct_regions', { selected_country: location.country });
                if (error) console.error("Error fetching regions:", error);
                else setRegions(data.map(r => r.region).filter(Boolean));
            };
            fetchRegions();
        } else {
            setRegions([]);
        }
    }, [location.country]);

    useEffect(() => {
        if (location.country) {
            const fetchCities = async () => {
                const { data, error } = await supabase.rpc('get_cities', {
                    selected_country: location.country,
                    selected_region: location.region || null
                });
                if (error) console.error("Error fetching cities:", error);
                else setCities(data.map(c => c.city));
            };
            fetchCities();
        } else {
            setCities([]);
        }
    }, [location.country, location.region]);

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

    const nextStep = () => {
        setError(''); // Clear previous errors
        switch (step) {
            case 1:
                if (!profile.first_name || !profile.last_name) {
                    setError('Please enter both your first and last name.');
                    return;
                }
                break;
            case 2:
                if (!profile.age) {
                    setError('Please enter your age.');
                    return;
                }
                break;
            case 3:
                if (!location.city) {
                    setError('Please select your location.');
                    return;
                }
                break;
            // No specific validation needed for steps 4 & 5 to proceed
            default:
                break;
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

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
            let locationId = null;
            if (location.country && location.city) {
                const { data: existingLocation } = await supabase
                    .from('locations')
                    .select('id')
                    .match({ city: location.city, region: location.region || null, country: location.country })
                    .maybeSingle();

                if (existingLocation) {
                    locationId = existingLocation.id;
                } else {
                    const { data: newLocation, error: locError } = await supabase
                        .from('locations')
                        .insert({ city: location.city || null, region: location.region || null, country: location.country })
                        .select()
                        .single();
                    if (locError) throw locError;
                    locationId = newLocation.id;
                }
            }

            const { error: profileError } = await supabase.from('profiles').upsert({
                id: user.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                about_me: profile.about_me,
                age: profile.age ? Number(profile.age) : null,
                gender: profile.gender,
                location_id: locationId,
            });
            if (profileError) throw profileError;

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

            navigate('/dashboard');
        } catch (err) {
            setError('Failed to save profile. ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalSteps = 6;
    const progress = (step / totalSteps) * 100;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Welcome to Skillogue!
                    </h1>
                    <p className="text-center text-gray-400">Let's set up your profile.</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-8">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="bg-gray-900/70 p-8 rounded-2xl border border-gray-800 shadow-2xl">
                    <form className="space-y-6">
                        {error && <p className="text-red-500 text-center">{error}</p>}

                        {step === 1 && (
                            <div className="space-y-4 animate-fade-in">
                                <h2 className="text-xl font-semibold text-center">What's your name?</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                                    <input type="text" name="first_name" value={profile.first_name} onChange={handleProfileChange} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                                    <input type="text" name="last_name" value={profile.last_name} onChange={handleProfileChange} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500" required />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-fade-in">
                                <h2 className="text-xl font-semibold text-center">A little about you...</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                                    <input type="number" name="age" value={profile.age} onChange={handleProfileChange} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500" min="16" max="120" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                                    <select name="gender" value={profile.gender} onChange={handleProfileChange} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500">
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Non-binary">Non-binary</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4 animate-fade-in">
                                <h2 className="text-xl font-semibold text-center">Where are you from?</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                                    <select name="country" value={location.country} onChange={handleLocationChange} required className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg">
                                        <option value="">Select Country</option>
                                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                                    <select name="region" value={location.region} onChange={handleLocationChange} disabled={!location.country || regions.length === 0} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50">
                                        <option value="">Select Region</option>
                                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                                    <select name="city" value={location.city} onChange={handleLocationChange} disabled={!location.country || cities.length === 0} required className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50">
                                        <option value="">Select City</option>
                                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-semibold text-center mb-4">What languages do you speak?</h2>
                                <MultiSelect options={availableLanguages} selected={selectedLanguages} onChange={setSelectedLanguages} label="" placeholder="Select languages..." />
                            </div>
                        )}

                        {step === 5 && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-semibold text-center mb-4">What are your passions?</h2>
                                <MultiSelect options={availablePassions} selected={selectedPassions} onChange={setSelectedPassions} label="" placeholder="Select your passions..." />
                            </div>
                        )}

                        {step === 6 && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-semibold text-center mb-4">Tell us about yourself</h2>
                                <textarea name="about_me" value={profile.about_me} onChange={handleProfileChange} rows="5" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500" placeholder="Share a bit about your hobbies, what you're looking for, etc." />
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-4">
                            {step > 1 ? (
                                <button type="button" onClick={prevStep} className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition">
                                    <ArrowLeft size={16} /> Back
                                </button>
                            ) : <div></div>}

                            {step < totalSteps ? (
                                <button type="button" onClick={nextStep} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
                                    Next <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-70"
                                >
                                    {loading ? 'Finishing...' : 'Finish & Go to Dashboard'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;