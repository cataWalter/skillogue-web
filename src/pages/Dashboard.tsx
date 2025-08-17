// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { MessageSquare, User, Search } from 'lucide-react';
import Avatar from '../components/Avatar';
import ProfileCompletion from '../components/ProfileCompletion';
import PassionSpotlight from '../components/PassionSpotlight';
// ✅ Import shared types - FIX APPLIED ON THIS LINE
import { ProfileData, Conversation, SuggestedProfile, UserPassion } from '../types';
import SEO from '../components/SEO';

const Dashboard: React.FC = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    // ✅ FIX APPLIED ON THIS LINE
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([]);
    const [userPassions, setUserPassions] = useState<UserPassion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const [
                    profileRes,
                    convosRes,
                    suggestionsRes,
                    passionsRes,
                ] = await Promise.all([
                    supabase.from('profiles').select(`
                        id,
                        first_name,
                        about_me,
                        passions_count: profile_passions(count),
                        languages_count: profile_languages(count)
                    `).eq('id', user.id).single(),
                    supabase.rpc('get_recent_conversations', { current_user_id: user.id }),
                    supabase.rpc('get_suggested_profiles', { current_user_id: user.id, p_limit: 5 }),
                    supabase.from('profile_passions').select('passion_id, passions(name)').eq('profile_id', user.id)
                ]);

                if (profileRes.error || !profileRes.data?.first_name) {
                    console.error("Profile incomplete or error fetching:", profileRes.error);
                    navigate('/onboarding');
                    return;
                }

                const profileData = profileRes.data as any;
                setProfile({
                    ...profileData,
                    passions_count: profileData.passions_count[0]?.count || 0,
                    languages_count: profileData.languages_count[0]?.count || 0,
                });

                if (convosRes.error) console.error("Error fetching conversations:", convosRes.error);
                else setConversations(convosRes.data || []);

                if (suggestionsRes.error) console.error("Error fetching suggestions:", suggestionsRes.error);
                else setSuggestions(suggestionsRes.data || []);

                if (passionsRes.error) console.error("Error fetching passions:", passionsRes.error);
                else setUserPassions(passionsRes.data || []);

            } else {
                navigate('/login');
            }
            setLoading(false);
        };

        fetchDashboardData();
    }, [navigate]);

    if (loading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading your dashboard...</div>;
    }

    return (
        <Layout>
            <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
                    Welcome back, <span className="text-indigo-400">{profile?.first_name}</span>!
                </h1>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link to="/messages" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-purple-600 transition-all duration-300 transform hover:scale-105">
                        <MessageSquare className="h-8 w-8 text-purple-400 mb-2" />
                        <h2 className="text-xl font-bold text-white">Messages</h2>
                        <p className="mt-1 text-gray-400">View your conversations</p>
                    </Link>
                    <Link to="/profile" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-indigo-600 transition-all duration-300 transform hover:scale-105">
                        <User className="h-8 w-8 text-indigo-400 mb-2" />
                        <h2 className="text-xl font-bold text-white">Your Profile</h2>
                        <p className="mt-1 text-gray-400">View and edit your profile</p>
                    </Link>
                    <Link to="/search" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-pink-600 transition-all duration-300 transform hover:scale-105">
                        <Search className="h-8 w-8 text-pink-400 mb-2" />
                        <h2 className="text-xl font-bold text-white">Find People</h2>
                        <p className="mt-1 text-gray-400">Search for new connections</p>
                    </Link>
                </div>

                <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {profile && <ProfileCompletion profile={profile} />}
                        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4">Recent Messages</h2>
                            <div className="space-y-4">
                                {conversations.length > 0 ? conversations.map(convo => (
                                    <Link key={convo.user_id} to={`/messages?with=${convo.user_id}`} className="flex items-center gap-4 p-3 hover:bg-gray-800 rounded-lg transition-colors">
                                        <Avatar seed={convo.user_id} className="w-12 h-12 rounded-full flex-shrink-0" />
                                        <div className="flex-grow min-w-0">
                                            <p className="font-semibold truncate">{convo.full_name}</p>
                                            <p className="text-gray-400 text-sm truncate">{convo.last_message}</p>
                                        </div>
                                        {convo.unread_count > 0 && <span className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" title={`${convo.unread_count} unread message(s)`}></span>}
                                    </Link>
                                )) : <p className="text-gray-500">No recent messages yet. Start a new conversation!</p>}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                        {userPassions.length > 0 && <PassionSpotlight userPassions={userPassions} userId={profile?.id || ''} />}

                        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4">Suggested For You</h2>
                            <div className="space-y-4">
                                {suggestions.length > 0 ? suggestions.map(sugg => (
                                    <Link key={sugg.id} to={`/profile/${sugg.id}`} className="flex items-center gap-4 p-3 hover:bg-gray-800 rounded-lg transition-colors">
                                        <Avatar seed={sugg.id} className="w-10 h-10 rounded-full flex-shrink-0" />
                                        <p className="font-semibold truncate">{sugg.first_name} {sugg.last_name}</p>
                                    </Link>
                                )) : <p className="text-gray-500">No suggestions right now. Add more passions to get matched!</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;