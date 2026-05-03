'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, User, MapPin, Sparkles, ChevronDown } from 'lucide-react';
import { appClient } from '../../lib/appClient';
import staticMasterData from '@/lib/static-master-data';
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

const STEP_CONFIG = [
    {
        icon: <User size={22} />,
        title: 'The Basics',
        subtitle: 'Tell us a little about yourself.',
    },
    {
        icon: <MapPin size={22} />,
        title: 'Your Location',
        subtitle: 'Where are you based?',
    },
    {
        icon: <Sparkles size={22} />,
        title: 'Your Interests',
        subtitle: 'What are you passionate about?',
    },
];

const fieldClass = 'w-full rounded-xl border border-line/30 bg-surface-secondary/70 px-4 py-3 text-foreground shadow-glass-sm transition-all duration-200 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/50';
const selectClass = `${fieldClass} appearance-none cursor-pointer pr-10`;
const labelClass = 'mb-2 block text-sm font-medium text-muted';

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
    const [availablePassions, setAvailablePassions] = useState<{ id: string; name: string }[]>([]);
    const [availableLanguages, setAvailableLanguages] = useState<{ id: string; name: string }[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [regions, setRegions] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [birthMonth, setBirthMonth] = useState('');
    const [birthDay, setBirthDay] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const birthDateRange = getBirthDateRange();
    const minBirthYear = parseInt(birthDateRange.min.split('-')[0]);
    const maxBirthYear = parseInt(birthDateRange.max.split('-')[0]);
    const totalSteps = 3;

    const getDaysInMonth = (month: string, year: string) => {
        if (!month) return 31;
        return new Date(parseInt(year) || 2000, parseInt(month), 0).getDate();
    };

    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { user } } = await appClient.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Passions and languages come from static data — set synchronously before any await
            setAvailableLanguages(staticMasterData.languages);
            setAvailablePassions(staticMasterData.passions);

            try {
                setCountries(await getCountries());
            } catch {
                // location data unavailable; countries stays empty
            }

            setLoading(false);
        };

        loadInitialData();
    }, [router]);

    useEffect(() => {
        if (birthYear && birthMonth && birthDay) {
            const m = birthMonth.padStart(2, '0');
            const d = birthDay.padStart(2, '0');
            setProfile((prev) => ({ ...prev, birth_date: `${birthYear}-${m}-${d}` }));
        } else {
            setProfile((prev) => ({ ...prev, birth_date: '' }));
        }
    }, [birthYear, birthMonth, birthDay]);

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
            <div className="glass-panel relative w-full max-w-2xl overflow-hidden rounded-[2rem]">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/12 via-transparent to-connection/10 pointer-events-none" aria-hidden="true" />

                {/* Step-specific header */}
                <div className="relative text-center px-8 pt-8 sm:px-10 sm:pt-10 pb-6">
                    <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
                        {STEP_CONFIG[step - 1].icon}
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-start to-brand-end bg-clip-text text-transparent">
                        {STEP_CONFIG[step - 1].title}
                    </h1>
                    <p className="text-faint mt-2">{STEP_CONFIG[step - 1].subtitle}</p>
                </div>

                {/* Step indicator */}
                <div className="relative px-8 sm:px-10 pb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-faint">{onboardingCopy.stepCounter(step, totalSteps)}</span>
                        <span className="text-xs text-brand font-medium">{onboardingCopy.progressComplete(step, totalSteps)}</span>
                    </div>
                    <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-brand-start to-brand-end h-1.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>
                    <div className="flex items-start mt-4">
                        {([1, 2, 3] as const).map((s, idx) => (
                            <React.Fragment key={s}>
                                <div className="flex flex-col items-center gap-1.5 shrink-0">
                                    <span
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                                            step >= s
                                                ? 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-glass-sm'
                                                : 'bg-surface-secondary border border-line/30 text-faint'
                                        }`}
                                    >
                                        {s}
                                    </span>
                                    <span className={`text-xs ${step >= s ? 'text-brand font-medium' : 'text-faint'}`}>
                                        {[onboardingCopy.basicInfoStep, onboardingCopy.locationStep, onboardingCopy.passionsStep][idx]}
                                    </span>
                                </div>
                                {idx < 2 && (
                                    <div className="flex-1 h-0.5 mx-2 mt-4 bg-line/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-brand-start to-brand-end rounded-full transition-all duration-500 ease-out"
                                            style={{ width: step > s ? '100%' : '0%' }}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form content */}
                <div className="relative px-8 pb-8 sm:px-10 sm:pb-10">
                    {error && (
                        <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-center text-sm text-danger-soft">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-5 animate-fade-in-up">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
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
                                <div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>{onboardingCopy.birthDate}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Month */}
                                        <div className="relative">
                                            <select
                                                id="birth_month"
                                                value={birthMonth}
                                                onChange={(e) => { setBirthMonth(e.target.value); setBirthDay(''); }}
                                                className={selectClass}
                                                autoComplete="bday-month"
                                                aria-label="Birth month"
                                            >
                                                <option value="">Month</option>
                                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((name, i) => (
                                                    <option key={i + 1} value={String(i + 1)}>{name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                        </div>
                                        {/* Day */}
                                        <div className="relative">
                                            <select
                                                id="birth_day"
                                                value={birthDay}
                                                onChange={(e) => setBirthDay(e.target.value)}
                                                className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                disabled={!birthMonth}
                                                autoComplete="bday-day"
                                                aria-label="Birth day"
                                            >
                                                <option value="">Day</option>
                                                {Array.from({ length: getDaysInMonth(birthMonth, birthYear) }, (_, i) => i + 1).map((d) => (
                                                    <option key={d} value={String(d)}>{d}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                        </div>
                                        {/* Year */}
                                        <div className="relative">
                                            <select
                                                id="birth_year"
                                                value={birthYear}
                                                onChange={(e) => setBirthYear(e.target.value)}
                                                className={selectClass}
                                                autoComplete="bday-year"
                                                aria-label="Birth year"
                                            >
                                                <option value="">Year</option>
                                                {Array.from({ length: maxBirthYear - minBirthYear + 1 }, (_, i) => maxBirthYear - i).map((y) => (
                                                    <option key={y} value={String(y)}>{y}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="gender" className={labelClass}>{onboardingCopy.gender}</label>
                                    <div className="relative">
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={profile.gender}
                                            onChange={handleProfileChange}
                                            className={selectClass}
                                        >
                                            <option value="">{onboardingCopy.selectGender}</option>
                                            {onboardingCopy.genderOptions.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                    </div>
                                </div>
                            </div>
                            <div>
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
                        <div className="space-y-5 animate-fade-in-up">
                            <div>
                                <label htmlFor="country" className={labelClass}>{onboardingCopy.country}</label>
                                <div className="relative">
                                    <select
                                        id="country"
                                        name="country"
                                        value={location.country}
                                        onChange={handleLocationChange}
                                        className={selectClass}
                                        autoComplete="country-name"
                                    >
                                        <option value="">{onboardingCopy.selectCountry}</option>
                                        {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="region" className={labelClass}>{onboardingCopy.regionState}</label>
                                <div className="relative">
                                    <select
                                        id="region"
                                        name="region"
                                        value={location.region}
                                        onChange={handleLocationChange}
                                        className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        disabled={!location.country}
                                        autoComplete="address-level1"
                                    >
                                        <option value="">{onboardingCopy.selectRegion}</option>
                                        {regions.map((region) => <option key={region} value={region}>{region}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="city" className={labelClass}>{onboardingCopy.city}</label>
                                <div className="relative">
                                    <select
                                        id="city"
                                        name="city"
                                        value={location.city}
                                        onChange={handleLocationChange}
                                        className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        disabled={!location.region && !location.country}
                                        autoComplete="address-level2"
                                    >
                                        <option value="">{onboardingCopy.selectCity}</option>
                                        {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in-up">
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
                            <div />
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
        </div>
    );
};

export default Onboarding;
