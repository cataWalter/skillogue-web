'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { appClient } from '../../lib/appClient';
import MultiSelect from '../../components/MultiSelect';
import { updateProfile } from '../actions/profile';
import { normalizeGender } from '@/lib/gender';
import { getBirthDateRange, isBirthDateWithinAgeRange } from '@/lib/profile-age';
import { onboardingCopy } from '../../lib/app-copy';

interface ProfileState {
    first_name: string;
    last_name: string;
    about_me: string;
    birth_date: string;
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
        birth_date: '',
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
    const birthDateRange = getBirthDateRange();
    const totalSteps = 3;

    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { user } } = await appClient.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: allLanguages } = await appClient.from('languages').select('id, name');
            setAvailableLanguages(allLanguages || []);

            const { data: allPassions } = await appClient.from('passions').select('id, name');
            setAvailablePassions(allPassions || []);

            const { data: countryData } = await appClient.rpc('get_distinct_countries');
            setCountries(countryData?.map((country: { country: string }) => country.country) || []);

            setLoading(false);
        };

        loadInitialData();
    }, [router]);

    useEffect(() => {
        if (location.country) {
            const fetchRegions = async () => {
                const { data, error } = await appClient.rpc('get_distinct_regions', { p_country: location.country });
                if (error) {
                    console.error('Error fetching regions:', error);
                } else {
                    setRegions(data.map((region: { region: string }) => region.region).filter(Boolean));
                }
            };
            fetchRegions();
        } else {
            setRegions([]);
        }
    }, [location.country]);

    useEffect(() => {
        if (location.country) {
            const fetchCities = async () => {
                const { data, error } = await appClient.rpc('get_distinct_cities', {
                    p_country: location.country,
                    p_region: location.region || null,
                });
                if (error) {
                    console.error('Error fetching cities:', error);
                } else {
                    setCities(data.map((city: { city: string }) => city.city));
                }
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
        setLocation((prev) => {
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
            if (!profile.first_name || !profile.last_name || !profile.birth_date || !profile.gender) {
                setError(onboardingCopy.validation.missingBasics);
                return;
            }

            if (!isBirthDateWithinAgeRange(profile.birth_date)) {
                setError(onboardingCopy.validation.invalidBirthDate);
                return;
            }

            if (profile.first_name.length < 2 || profile.last_name.length < 2) {
                setError(onboardingCopy.validation.shortNames);
                return;
            }
        } else if (step === 2) {
            if (!location.country || !location.city) {
                setError(onboardingCopy.validation.missingLocation);
                return;
            }
        }

        setError('');
        setStep((prev) => prev + 1);
    };

    const prevStep = () => {
        setError('');
        setStep((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        if (selectedPassions.length < 3) {
            setError(onboardingCopy.validation.minPassions);
            return;
        }

        if (selectedPassions.length > 10) {
            setError(onboardingCopy.validation.maxPassions);
            return;
        }

        setLoading(true);
        try {
            const normalizedGender = normalizeGender(profile.gender);

            const result = await updateProfile({
                first_name: profile.first_name,
                last_name: profile.last_name,
                about_me: profile.about_me,
                birth_date: profile.birth_date,
                gender: normalizedGender,
                location: {
                    city: location.city || null,
                    region: location.region || null,
                    country: location.country || null,
                },
                languages: selectedLanguages,
                passions: selectedPassions,
            });

            if (!result.success) {
                if (result.details) {
                    const message = Object.values(result.details).flat().join(', ');
                    throw new Error(message);
                }

                throw new Error(result.error);
            }

            router.push('/dashboard');
        } catch (err: unknown) {
            console.error('Error completing onboarding:', err);
            const message = err instanceof Error ? err.message : onboardingCopy.validation.saveFailed;
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">{onboardingCopy.loading}</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {onboardingCopy.title}
                    </h1>
                    <p className="text-gray-400 mt-2">{onboardingCopy.subtitle}</p>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">{onboardingCopy.stepCounter(step, totalSteps)}</span>
                        <span className="text-sm text-indigo-400 font-medium">{onboardingCopy.progressComplete(step, totalSteps)}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-3 text-xs">
                        <span className={`flex items-center gap-1.5 ${step >= 1 ? 'text-indigo-400 font-medium' : 'text-gray-500'}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}>1</span>
                            {onboardingCopy.basicInfoStep}
                        </span>
                        <span className={`flex items-center gap-1.5 ${step >= 2 ? 'text-indigo-400 font-medium' : 'text-gray-500'}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}>2</span>
                            {onboardingCopy.locationStep}
                        </span>
                        <span className={`flex items-center gap-1.5 ${step >= 3 ? 'text-indigo-400 font-medium' : 'text-gray-500'}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}>3</span>
                            {onboardingCopy.passionsStep}
                        </span>
                    </div>
                </div>

                <div className="w-full bg-gray-800 h-2 rounded-full mb-8">
                    <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    ></div>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6 text-center">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-semibold text-white">{onboardingCopy.stepOneTitle}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-400 mb-2">{onboardingCopy.firstName}</label>
                                <input
                                    id="first_name"
                                    type="text"
                                    name="first_name"
                                    value={profile.first_name}
                                    onChange={handleProfileChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder={onboardingCopy.firstNamePlaceholder}
                                    autoComplete="given-name"
                                />
                            </div>
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-gray-400 mb-2">{onboardingCopy.lastName}</label>
                                <input
                                    id="last_name"
                                    type="text"
                                    name="last_name"
                                    value={profile.last_name}
                                    onChange={handleProfileChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder={onboardingCopy.lastNamePlaceholder}
                                    autoComplete="family-name"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-400 mb-2">{onboardingCopy.birthDate}</label>
                                <input
                                    id="birth_date"
                                    type="date"
                                    name="birth_date"
                                    value={profile.birth_date}
                                    onChange={handleProfileChange}
                                    className="date-input-light-icon w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    min={birthDateRange.min}
                                    max={birthDateRange.max}
                                    autoComplete="bday"
                                />
                            </div>
                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-gray-400 mb-2">{onboardingCopy.gender}</label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={profile.gender}
                                    onChange={handleProfileChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="">{onboardingCopy.selectGender}</option>
                                    {onboardingCopy.genderOptions.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="about_me" className="block text-sm font-medium text-gray-400 mb-2">{onboardingCopy.aboutMe}</label>
                            <textarea
                                id="about_me"
                                name="about_me"
                                value={profile.about_me}
                                onChange={handleProfileChange}
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder={onboardingCopy.aboutPlaceholder}
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-semibold text-white">{onboardingCopy.locationStepTitle}</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-400 mb-2">{onboardingCopy.country}</label>
                                <select
                                    id="country"
                                    name="country"
                                    value={location.country}
                                    onChange={handleLocationChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    autoComplete="country-name"
                                >
                                    <option value="">{onboardingCopy.selectCountry}</option>
                                    {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="region" className="block text-sm font-medium text-gray-400 mb-2">{onboardingCopy.regionState}</label>
                                <select
                                    id="region"
                                    name="region"
                                    value={location.region}
                                    onChange={handleLocationChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    disabled={!location.country}
                                    autoComplete="address-level1"
                                >
                                    <option value="">{onboardingCopy.selectRegion}</option>
                                    {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-400 mb-2">{onboardingCopy.city}</label>
                                <select
                                    id="city"
                                    name="city"
                                    value={location.city}
                                    onChange={handleLocationChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    disabled={!location.region && !location.country}
                                    autoComplete="address-level2"
                                >
                                    <option value="">{onboardingCopy.selectCity}</option>
                                    {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-semibold text-white">{onboardingCopy.interestsLanguagesStepTitle}</h2>
                        <div className="space-y-6">
                            <MultiSelect
                                label={onboardingCopy.passionsWithMinimum}
                                options={availablePassions}
                                selected={selectedPassions}
                                onChange={setSelectedPassions}
                                placeholder={onboardingCopy.passionsPlaceholder}
                                id="onboarding-passions"
                                name="passions"
                            />
                            <MultiSelect
                                label={onboardingCopy.languages}
                                options={availableLanguages}
                                selected={selectedLanguages}
                                onChange={setSelectedLanguages}
                                placeholder={onboardingCopy.languagesPlaceholder}
                                id="onboarding-languages"
                                name="languages"
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
                            <ArrowLeft size={20} /> {onboardingCopy.back}
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < totalSteps ? (
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold transition"
                        >
                            {onboardingCopy.next} <ArrowRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-8 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg rounded-lg text-white font-bold transition transform hover:scale-105"
                        >
                            {onboardingCopy.completeProfile}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
