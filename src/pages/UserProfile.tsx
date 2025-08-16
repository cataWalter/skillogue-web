// src/pages/UserProfile.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ProfileCard from '../components/ProfileCard';
import { FullProfile } from '../types';
import { MessageSquare } from 'lucide-react';

const UserProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Get the user ID from the URL
    const [profile, setProfile] = useState<FullProfile | null>(null);
    const [passions, setPassions] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) {
            setError('No user ID provided.');
            setLoading(false);
            return;
        }

        const loadProfile = async () => {
            setLoading(true);
            setError('');

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(`*, locations(*)`)
                .eq('id', id)
                .single();
            
            if (profileError || !profileData) {
                console.error('Error loading user profile:', profileError);
                setError('Could not find this user.');
                setLoading(false);
                return;
            }
            setProfile(profileData as FullProfile);

            const [passionRes, languageRes] = await Promise.all([
                supabase.from('profile_passions').select('passions(name)').eq('profile_id', id),
                supabase.from('profile_languages').select('languages(name)').eq('profile_id', id)
            ]);
            
            setPassions(passionRes.data?.map((p: any) => p.passions.name) || []);
            setLanguages(languageRes.data?.map((l: any) => l.languages.name) || []);
            
            setLoading(false);
        };

        loadProfile();
    }, [id]);

    if (loading) {
        return <Layout><div className="text-center p-10">Loading profile...</div></Layout>;
    }
    
    if (error) {
         return <Layout><div className="text-center p-10 text-red-400">{error}</div></Layout>;
    }

    if (!profile) {
        return <Layout><div className="text-center p-10">User not found.</div></Layout>;
    }

    const actionButton = (
        <Link
            to={`/messages?with=${profile.id}`}
            className="self-center sm:self-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all transform hover:scale-105"
        >
            <MessageSquare size={16} /> Message
        </Link>
    );

    return (
        <Layout>
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

export default UserProfile;