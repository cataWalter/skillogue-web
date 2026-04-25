'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { appClient } from '../../lib/appClient';
import MultiSelect from '../../components/MultiSelect';
import Link from 'next/link';
import { updateProfile } from '../actions/profile';
import { GENDER_OPTIONS, normalizeGender } from '@/lib/gender';
import { getBirthDateRange, isBirthDateWithinAgeRange, normalizeBirthDate } from '@/lib/profile-age';
import { commonLabels, profilePageCopy } from '../../lib/app-copy';

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
    const [availablePassions, setAvailablePassions] = useState<Passion[]>([]);
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
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
                languageRes,
                passionRes,
                allLanguagesRes,
                allPassionsRes,
                countriesRes
            ] = await Promise.all([
                appClient
                    .from('profiles')
                    .select('id, first_name, last_name, about_me, birth_date, gender, locations(*)')
                    .eq('id', user.id)
                    .single(),
                appClient.from('profile_languages').select('languages(name)').eq('profile_id', user.id),
                appClient.from('profile_passions').select('passions(name)').eq('profile_id', user.id),
                appClient.from('languages').select('id, name'),
                appClient.from('passions').select('id, name'),
                appClient.rpc('get_distinct_countries')
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: profileData, error: profileError } = profileRes as any;
            if (profileError && profileError.code !== 'PGRST116') {
                setError(profilePageCopy.edit.failedToLoad);
                console.error(profileError);
                setLoading(false);
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentLanguages = ((languageRes as any).data as { languages: { name: string } | null }[] | null)
                ?.map(item => item.languages?.name)
                .filter((name): name is string => !!name) || [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentPassions = ((passionRes as any).data as { passions: { name: string } | null }[] | null)
                ?.map(item => item.passions?.name)
                .filter((name): name is string => !!name) || [];

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setAvailableLanguages((allLanguagesRes as any).data || []);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setAvailablePassions((allPassionsRes as any).data || []);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setCountries((countriesRes as any).data?.map((c: { country: string }) => c.country) || []);

            setLoading(false);
        };

        loadInitialData();
    }, [router]);

    const fetchRegions = async (country: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (appClient as any).rpc('get_distinct_regions', { p_country: country });
        setRegions(data?.map((r: { region: string }) => r.region) || []);
    };

    const fetchCities = async (country: string, region: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (appClient as any).rpc('get_distinct_cities', { p_country: country, p_region: region });
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

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">{profilePageCopy.edit.loading}</div>;

    return (
        <div className="flex-grow p-4 sm:p-6 w-full">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile" className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold">{profilePageCopy.edit.editProfile}</h1>
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
                            <label htmlFor="edit-first-name" className="block text-sm font-medium text-gray-400 mb-2">{profilePageCopy.edit.firstName}</label>
                            <input
                                id="edit-first-name"
                                type="text"
                                name="first_name"
                                value={profile.first_name}
                                onChange={handleProfileChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                autoComplete="given-name"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-last-name" className="block text-sm font-medium text-gray-400 mb-2">{profilePageCopy.edit.lastName}</label>
                            <input
                                id="edit-last-name"
                                type="text"
                                name="last_name"
                                value={profile.last_name}
                                onChange={handleProfileChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                autoComplete="family-name"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="edit-about-me" className="block text-sm font-medium text-gray-400 mb-2">{profilePageCopy.edit.aboutMe}</label>
                        <textarea
                            id="edit-about-me"
                            name="about_me"
                            value={profile.about_me}
                            onChange={handleProfileChange}
                            rows={4}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder={profilePageCopy.edit.aboutPlaceholder}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="edit-birth-date" className="block text-sm font-medium text-gray-400 mb-2">{profilePageCopy.edit.birthDate}</label>
                            <input
                                id="edit-birth-date"
                                type="date"
                                name="birth_date"
                                value={profile.birth_date}
                                onChange={handleProfileChange}
                                className="date-input-light-icon w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                required
                                min={birthDateRange.min}
                                max={birthDateRange.max}
                                autoComplete="bday"
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-gender" className="block text-sm font-medium text-gray-400 mb-2">{profilePageCopy.edit.gender}</label>
                            <select
                                id="edit-gender"
                                name="gender"
                                value={profile.gender}
                                onChange={handleProfileChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    <div className="border-t border-gray-800 pt-6">
                        <h3 className="text-xl font-semibold mb-4">{profilePageCopy.edit.location}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="edit-country" className="block text-sm font-medium text-gray-400 mb-2">{profilePageCopy.edit.country}</label>
                                <select
                                    id="edit-country"
                                    name="country"
                                    value={location.country}
                                    onChange={handleLocationChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    autoComplete="country-name"
                                >
                                    <option value="">{profilePageCopy.edit.selectCountry}</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="edit-region" className="block text-sm font-medium text-gray-400 mb-2">{profilePageCopy.edit.regionState}</label>
                                <select
                                    id="edit-region"
                                    name="region"
                                    value={location.region}
                                    onChange={handleLocationChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    disabled={!location.country}
                                    autoComplete="address-level1"
                                >
                                    <option value="">{profilePageCopy.edit.selectRegion}</option>
                                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="edit-city" className="block text-sm font-medium text-gray-400 mb-2">{profilePageCopy.edit.city}</label>
                                <select
                                    id="edit-city"
                                    name="city"
                                    value={location.city}
                                    onChange={handleLocationChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    <div className="border-t border-gray-800 pt-6">
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
                            />
                            <MultiSelect
                                label={commonLabels.languages}
                                options={availableLanguages}
                                selected={selectedLanguages}
                                onChange={setSelectedLanguages}
                                placeholder={profilePageCopy.edit.languagesPlaceholder}
                                id="edit-languages"
                                name="languages"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-800">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-bold hover:shadow-lg transform hover:scale-105 transition"
                        >
                            {profilePageCopy.edit.saveChanges}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
