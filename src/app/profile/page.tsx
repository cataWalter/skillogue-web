'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProfileCard from '../../components/ProfileCard';
import ProfileSkeleton from '../../components/ProfileSkeleton';
import { FullProfile } from '../../types';
import { Edit } from 'lucide-react';

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<FullProfile | null>(null);
    const [passions, setPassions] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(`*, locations(*)`)
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

            const [passionRes, languageRes] = await Promise.all([
                supabase.from('profile_passions').select('passions(name)').eq('profile_id', user.id),
                supabase.from('profile_languages').select('languages(name)').eq('profile_id', user.id)
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPassions(passionRes.data?.map((p: any) => p.passions.name) || []);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setLanguages(languageRes.data?.map((l: any) => l.languages.name) || []);

            setLoading(false);
        };

        loadProfile();
    }, [router]);

    if (loading) {
        return (
            <main className="flex-grow p-4 sm:p-6 w-full">
                <div className="max-w-4xl mx-auto">
                    <ProfileSkeleton />
                </div>
            </main>
        );
    }

    if (!profile) {
        return <div className="text-center p-10 text-white">Could not load profile.</div>;
    }

    const actionButton = (
        <Link
            href="/edit-profile"
            className="self-center sm:self-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-300 transform hover:scale-105 text-white"
        >
            <Edit size={16} /> Edit Profile
        </Link>
    );

    return (
        <main className="flex-grow p-4 sm:p-6 w-full">
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
