'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { appClient } from '../../lib/appClient';
import { getProfilePassions, getProfileLanguages } from '@/lib/client/profile-client';
import ProfileCard from '../../components/ProfileCard';
import ProfileSkeleton from '../../components/ProfileSkeleton';
import { FullProfile } from '../../types';
import { Edit } from 'lucide-react';
import { profilePageCopy } from '../../lib/app-copy';

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<FullProfile | null>(null);
    const [passions, setPassions] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            const { data: { user } } = await appClient.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profileData, error: profileError } = await appClient
                .from('profiles')
                .select('id, created_at, last_login, first_name, last_name, about_me, age, gender, verified, is_private, show_age, show_location, locations(*)')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error loading profile:', profileError);
                if (profileError.code === 'PGRST116') {
                    router.push('/edit-profile');
                }
                setLoading(false);
                return;
            }
            setProfile(profileData as FullProfile);

            const [profilePassions, profileLanguages] = await Promise.all([
                getProfilePassions(user.id),
                getProfileLanguages(user.id),
            ]);

            setPassions(profilePassions);
            setLanguages(profileLanguages);

            setLoading(false);
        };

        loadProfile();
    }, [router]);

    if (loading) {
        return (
            <main className="editorial-shell flex-grow py-8 sm:py-12 lg:py-16">
                <div className="max-w-4xl mx-auto">
                    <ProfileSkeleton />
                </div>
            </main>
        );
    }

    if (!profile) {
        return <div className="editorial-shell py-10 text-center text-foreground">{profilePageCopy.owner.couldNotLoadProfile}</div>;
    }

    const actionButton = (
        <Link
            href="/edit-profile"
            className="self-center sm:self-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-start to-brand-end px-4 py-2 text-white shadow-glass-sm transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-md"
        >
            <Edit size={16} /> {profilePageCopy.owner.editProfile}
        </Link>
    );

    return (
        <main className="editorial-shell flex-grow py-8 sm:py-12 lg:py-16">
            <div className="max-w-4xl mx-auto">
                <ProfileCard
                    profile={profile}
                    passions={passions}
                    languages={languages}
                    actionSlot={actionButton}
                />
            </div>
        </main>
    );
};

export default Profile;
