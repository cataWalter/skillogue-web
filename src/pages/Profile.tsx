// src/pages/Profile.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProfileCard from '../components/ProfileCard';
import { FullProfile } from '../types';
import { Edit } from 'lucide-react';
import SEO from '../components/SEO';

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<FullProfile | null>(null);
    const [passions, setPassions] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
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
                    navigate('/edit-profile');
                }
                setLoading(false);
                return;
            }
            setProfile(profileData as FullProfile);

            const [passionRes, languageRes] = await Promise.all([
                supabase.from('profile_passions').select('passions(name)').eq('profile_id', user.id),
                supabase.from('profile_languages').select('languages(name)').eq('profile_id', user.id)
            ]);

            setPassions(passionRes.data?.map((p: any) => p.passions.name) || []);
            setLanguages(languageRes.data?.map((l: any) => l.languages.name) || []);

            setLoading(false);
        };

        loadProfile();
    }, [navigate]);

    if (loading) {
        return     <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            /><div className="text-center p-10">Loading your profile...</div></Layout>;
    }

    if (!profile) {
        return     <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            /><div className="text-center p-10">Could not load profile.</div></Layout>;
    }

    const actionButton = (
        <Link
            to="/edit-profile"
            className="self-center sm:self-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-300 transform hover:scale-105"
        >
            <Edit size={16} /> Edit Profile
        </Link>
    );

    return (
            <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            />
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
        </Layout>
    );
};

export default Profile;