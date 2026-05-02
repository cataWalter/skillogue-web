'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { appClient } from '../../lib/appClient';
import { getAllLanguages, getAllPassions } from '@/lib/client/profile-client';
import { getCountries, getRegions, getCities } from '@/lib/client/location-client';
import MultiSelect from '../../components/MultiSelect';
import { updateProfile } from '../actions/profile';
import { getBirthDateRange, isBirthDateWithinAgeRange } from '@/lib/profile-age';
import { onboardingCopy } from '../../lib/app-copy';
import { Button } from '../../components/Button';

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

const fieldClass = 'w-full rounded-xl border border-line/30 bg-surface-secondary/70 p-3 text-foreground shadow-glass-sm focus:outline-none focus:ring-2 focus:ring-brand';
const labelClass = 'mb-2 block text-sm font-medium text-faint';

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
    const [availablePassions, setAvailablePassions] = useState<{ id: number; name: string }[]>([]);
    const [availableLanguages, setAvailableLanguages] = useState<{ id: number; name: string }[]>([]);
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

            const [allLanguages, allPassions, countries] = await Promise.all([
                getAllLanguages(),
                getAllPassions(),
                getCountries(),
            ]);
            setAvailableLanguages(allLanguages);
            setAvailablePassions(allPassions);
            setCountries(countries);

            setLoading(false);
        };

        loadInitialData();
    }, [router]);

    useEffect(() => {
        if (location.country) {
            const fetchRegions = async () => {
                try {
                    setRegions(await getRegions(location.country));
                } catch {
                    console.error('Error fetching regions');
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
                try {
                    setCities(await getCities(location.country, location.region || null));
                } catch {
                    console.error('Error fetching cities');
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

        if (selectedLanguages.length > 5) {
            setError(onboardingCopy.validation.maxLanguages);
            return;
        }

        setLoading(true);
        try {
            const result = await updateProfile({
                first_name: profile.first_name,
                last_name: profile.last_name,
                about_me: profile.about_me,
                birth_date: profile.birth_date,
                gender: profile.gender,
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
        return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">{onboardingCopy.loading}</div>;
    }

    return (
        <div className="editorial-shell min-h-screen flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16">
            <div className="glass-panel w-full max-w-2xl rounded-[2rem] p-8 sm:p-10">
                <div className="mb-8 text-center">
                    <p className="editorial-kicker mx-auto mb-4 w-fit border-brand/20 bg-brand/10 text-brand-soft">
                        Profile launch
                    </p>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-start to-brand-end bg-clip-text text-transparent">
                        {onboardingCopy.title}
                    </h1>
                    <p className="text-faint mt-2">{onboardingCopy.subtitle}</p>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-faint">{onboardingCopy.stepCounter(step, totalSteps)}</span>
                        <span className="text-sm text-brand font-medium">{onboardingCopy.progressComplete(step, totalSteps)}</span>
                    </div>
                    <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-brand-start to-brand-end h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-3 text-xs">
                        <span className={`flex items-center gap-1.5 ${step >= 1 ? 'text-brand font-medium' : 'text-faint'}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-brand-start text-white' : 'bg-surface-secondary text-faint'}`}>1</span>
                            {onboardingCopy.basicInfoStep}
                        </span>
                        <span className={`flex items-center gap-1.5 ${step >= 2 ? 'text-brand font-medium' : 'text-faint'}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-brand-start text-white' : 'bg-surface-secondary text-faint'}`}>2</span>
                            {onboardingCopy.locationStep}
                        </span>
                        <span className={`flex items-center gap-1.5 ${step >= 3 ? 'text-brand font-medium' : 'text-faint'}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-brand-start text-white' : 'bg-surface-secondary text-faint'}`}>3</span>
                            {onboardingCopy.passionsStep}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-center text-danger-soft">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-semibold text-foreground">{onboardingCopy.stepOneTitle}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                                <label htmlFor="first_name" className={labelClass}>{onboardingCopy.firstName}</label>
                                <input
                                    id="first_name"
                                    type="text"
                                    name="first_name"
                                    value={profile.first_name}
                                    onChange={handleProfileChange}
                                    className={`${fieldClass} placeholder-faint`}
                                    placeholder={onboardingCopy.firstNamePlaceholder}
                                    autoComplete="given-name"
                                />
                            </div>
                            <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                                <label htmlFor="last_name" className={labelClass}>{onboardingCopy.lastName}</label>
                                <input
                                    id="last_name"
                                    type="text"
                                    name="last_name"
                                    value={profile.last_name}
                                    onChange={handleProfileChange}
                                    className={`${fieldClass} placeholder-faint`}
                                    placeholder={onboardingCopy.lastNamePlaceholder}
                                    autoComplete="family-name"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                                <label htmlFor="birth_date" className={labelClass}>{onboardingCopy.birthDate}</label>
                                <input
                                    id="birth_date"
                                    type="date"
                                    name="birth_date"
                                    value={profile.birth_date}
                                    onChange={handleProfileChange}
                                    className={`date-input-light-icon ${fieldClass}`}
                                    min={birthDateRange.min}
                                    max={birthDateRange.max}
                                    autoComplete="bday"
                                />
                            </div>
                            <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                                <label htmlFor="gender" className={labelClass}>{onboardingCopy.gender}</label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={profile.gender}
                                    onChange={handleProfileChange}
                                    className={fieldClass}
                                >
                                    <option value="">{onboardingCopy.selectGender}</option>
                                    {onboardingCopy.genderOptions.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                            <label htmlFor="about_me" className={labelClass}>{onboardingCopy.aboutMe}</label>
                            <textarea
                                id="about_me"
                                name="about_me"
                                value={profile.about_me}
                                onChange={handleProfileChange}
                                rows={3}
                                className={`${fieldClass} placeholder-faint`}
                                placeholder={onboardingCopy.aboutPlaceholder}
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-semibold text-foreground">{onboardingCopy.locationStepTitle}</h2>
                        <div className="space-y-4">
                            <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                                <label htmlFor="country" className={labelClass}>{onboardingCopy.country}</label>
                                <select
                                    id="country"
                                    name="country"
                                    value={location.country}
                                    onChange={handleLocationChange}
                                    className={fieldClass}
                                    autoComplete="country-name"
                                >
                                    <option value="">{onboardingCopy.selectCountry}</option>
                                    {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                                </select>
                            </div>
                            <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                                <label htmlFor="region" className={labelClass}>{onboardingCopy.regionState}</label>
                                <select
                                    id="region"
                                    name="region"
                                    value={location.region}
                                    onChange={handleLocationChange}
                                    className={fieldClass}
                                    disabled={!location.country}
                                    autoComplete="address-level1"
                                >
                                    <option value="">{onboardingCopy.selectRegion}</option>
                                    {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                                </select>
                            </div>
                            <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                                <label htmlFor="city" className={labelClass}>{onboardingCopy.city}</label>
                                <select
                                    id="city"
                                    name="city"
                                    value={location.city}
                                    onChange={handleLocationChange}
                                    className={fieldClass}
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
                        <h2 className="text-xl font-semibold text-foreground">{onboardingCopy.interestsLanguagesStepTitle}</h2>
                        <div className="space-y-6">
                            <MultiSelect
                                label={onboardingCopy.passionsWithMinimum}
                                options={availablePassions}
                                selected={selectedPassions}
                                onChange={setSelectedPassions}
                                placeholder={onboardingCopy.passionsPlaceholder}
                                id="onboarding-passions"
                                name="passions"
                                maxSelect={10}
                            />
                            <MultiSelect
                                label={onboardingCopy.languages}
                                options={availableLanguages}
                                selected={selectedLanguages}
                                onChange={setSelectedLanguages}
                                placeholder={onboardingCopy.languagesPlaceholder}
                                id="onboarding-languages"
                                name="languages"
                                maxSelect={5}
                            />
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-between border-t border-line/20 pt-6">
                    {step > 1 ? (
                        <Button
                            onClick={prevStep}
                            type="button"
                            variant="ghost"
                            icon={<ArrowLeft size={20} />}
                        >
                            {onboardingCopy.back}
                        </Button>
                    ) : (
                        <div></div>
                    )}

                    {step < totalSteps ? (
                        <Button
                            onClick={nextStep}
                            type="button"
                            icon={<ArrowRight size={20} />}
                        >
                            {onboardingCopy.next}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            type="button"
                        >
                            {onboardingCopy.completeProfile}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
