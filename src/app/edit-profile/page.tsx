'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { appClient } from '../../lib/appClient';
import { getProfilePassions, getProfileLanguages, getAllLanguages, getAllPassions } from '@/lib/client/profile-client';
import { getCountries, getRegions, getCities } from '@/lib/client/location-client';
import MultiSelect from '../../components/MultiSelect';
import Link from 'next/link';
import { updateProfile } from '../actions/profile';
import { GENDER_OPTIONS, normalizeGender } from '@/lib/gender';
import { getBirthDateRange, isBirthDateWithinAgeRange, normalizeBirthDate } from '@/lib/profile-age';
import { commonLabels, profilePageCopy } from '../../lib/app-copy';
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
const sectionClass = 'border-t border-line/20 pt-6';

const EditProfile: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
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
    const [error, setError] = useState<string>('');
    const router = useRouter();
    const birthDateRange = getBirthDateRange();

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            const { data: { user } } = await appClient.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const [
                profileRes,
                currentLanguages,
                currentPassions,
                allLanguages,
                allPassions,
                countries,
            ] = await Promise.all([
                appClient
                    .from('profiles')
                    .select('id, first_name, last_name, about_me, birth_date, gender, locations(*)')
                    .eq('id', user.id)
                    .single(),
                getProfileLanguages(user.id),
                getProfilePassions(user.id),
                getAllLanguages(),
                getAllPassions(),
                getCountries(),
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: profileData, error: profileError } = profileRes as any;
            if (profileError && profileError.code !== 'PGRST116') {
                setError(profilePageCopy.edit.failedToLoad);
                console.error(profileError);
                setLoading(false);
                return;
            }

            if (profileData) {
                setProfile({
                    first_name: profileData.first_name || '',
                    last_name: profileData.last_name || '',
                    about_me: profileData.about_me || '',
                    birth_date: normalizeBirthDate(profileData.birth_date) || '',
                    gender: normalizeGender(profileData.gender) || '',
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
            setAvailableLanguages(allLanguages);
            setAvailablePassions(allPassions);
            setCountries(countries);

            setLoading(false);
        };

        loadInitialData();
    }, [router]);

    const fetchRegions = async (country: string) => {
        setRegions(await getRegions(country));
    };

    const fetchCities = async (country: string, region: string) => {
        setCities(await getCities(country, region));
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
            const normalizedGender = normalizeGender(profile.gender);

            if (!normalizedGender) {
                throw new Error(profilePageCopy.edit.invalidGender);
            }

            if (!isBirthDateWithinAgeRange(profile.birth_date)) {
                throw new Error(profilePageCopy.edit.invalidBirthDate);
            }

            const result = await updateProfile({
                first_name: profile.first_name,
                last_name: profile.last_name,
                about_me: profile.about_me,
                birth_date: profile.birth_date,
                gender: normalizedGender,
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
            setError(err instanceof Error ? err.message : profilePageCopy.edit.failedToUpdate);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">{profilePageCopy.edit.loading}</div>;

    return (
        <div className="editorial-shell flex-grow py-8 sm:py-12 lg:py-16">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/profile" className="glass-surface rounded-full p-2 text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-secondary/80">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <p className="editorial-kicker mb-3 w-fit border-brand/20 bg-brand/10 text-brand-soft">Profile atelier</p>
                        <h1 className="text-2xl font-bold sm:text-3xl">{profilePageCopy.edit.editProfile}</h1>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger-soft">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="glass-panel space-y-8 rounded-[2rem] p-6 sm:p-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                            <label htmlFor="edit-first-name" className={labelClass}>{profilePageCopy.edit.firstName}</label>
                            <input
                                id="edit-first-name"
                                type="text"
                                name="first_name"
                                value={profile.first_name}
                                onChange={handleProfileChange}
                                className={fieldClass}
                                autoComplete="given-name"
                                required
                            />
                        </div>
                        <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                            <label htmlFor="edit-last-name" className={labelClass}>{profilePageCopy.edit.lastName}</label>
                            <input
                                id="edit-last-name"
                                type="text"
                                name="last_name"
                                value={profile.last_name}
                                onChange={handleProfileChange}
                                className={fieldClass}
                                autoComplete="family-name"
                                required
                            />
                        </div>
                    </div>

                    <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                        <label htmlFor="edit-about-me" className={labelClass}>{profilePageCopy.edit.aboutMe}</label>
                        <textarea
                            id="edit-about-me"
                            name="about_me"
                            value={profile.about_me}
                            onChange={handleProfileChange}
                            rows={4}
                            className={`${fieldClass} placeholder-faint`}
                            placeholder={profilePageCopy.edit.aboutPlaceholder}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                            <label htmlFor="edit-birth-date" className={labelClass}>{profilePageCopy.edit.birthDate}</label>
                            <input
                                id="edit-birth-date"
                                type="date"
                                name="birth_date"
                                value={profile.birth_date}
                                onChange={handleProfileChange}
                                className={`date-input-light-icon ${fieldClass}`}
                                required
                                min={birthDateRange.min}
                                max={birthDateRange.max}
                                autoComplete="bday"
                            />
                        </div>
                        <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                            <label htmlFor="edit-gender" className={labelClass}>{profilePageCopy.edit.gender}</label>
                            <select
                                id="edit-gender"
                                name="gender"
                                value={profile.gender}
                                onChange={handleProfileChange}
                                className={fieldClass}
                                required
                            >
                                <option value="">{profilePageCopy.edit.selectGender}</option>
                                {GENDER_OPTIONS.map((genderOption) => (
                                    <option key={genderOption} value={genderOption}>{genderOption}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <div className={sectionClass}>
                        <h3 className="text-xl font-semibold mb-4">{profilePageCopy.edit.location}</h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                                <label htmlFor="edit-country" className={labelClass}>{profilePageCopy.edit.country}</label>
                                <select
                                    id="edit-country"
                                    name="country"
                                    value={location.country}
                                    onChange={handleLocationChange}
                                    className={fieldClass}
                                    autoComplete="country-name"
                                >
                                    <option value="">{profilePageCopy.edit.selectCountry}</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                                <label htmlFor="edit-region" className={labelClass}>{profilePageCopy.edit.regionState}</label>
                                <select
                                    id="edit-region"
                                    name="region"
                                    value={location.region}
                                    onChange={handleLocationChange}
                                    className={fieldClass}
                                    disabled={!location.country}
                                    autoComplete="address-level1"
                                >
                                    <option value="">{profilePageCopy.edit.selectRegion}</option>
                                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="glass-surface rounded-[1.5rem] p-4 sm:p-5">
                                <label htmlFor="edit-city" className={labelClass}>{profilePageCopy.edit.city}</label>
                                <select
                                    id="edit-city"
                                    name="city"
                                    value={location.city}
                                    onChange={handleLocationChange}
                                    className={fieldClass}
                                    disabled={!location.region}
                                    autoComplete="address-level2"
                                >
                                    <option value="">{profilePageCopy.edit.selectCity}</option>
                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Interests */}
                    <div className={sectionClass}>
                        <h3 className="text-xl font-semibold mb-4">{profilePageCopy.edit.interestsAndLanguages}</h3>
                        <div className="space-y-6">
                            <MultiSelect
                                label={commonLabels.passions}
                                options={availablePassions}
                                selected={selectedPassions}
                                onChange={setSelectedPassions}
                                placeholder={profilePageCopy.edit.passionsPlaceholder}
                                id="edit-passions"
                                name="passions"
                                maxSelect={10}
                            />
                            <MultiSelect
                                label={commonLabels.languages}
                                options={availableLanguages}
                                selected={selectedLanguages}
                                onChange={setSelectedLanguages}
                                placeholder={profilePageCopy.edit.languagesPlaceholder}
                                id="edit-languages"
                                name="languages"
                                maxSelect={5}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-line/20 pt-6">
                        <Button type="submit">
                            {profilePageCopy.edit.saveChanges}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
