'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, User, Search } from 'lucide-react';
import Avatar from '../../components/Avatar';
import ProfileCompletion from '../../components/ProfileCompletion';
import PassionSpotlight from '../../components/PassionSpotlight';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import { ProfileData, Conversation, SuggestedProfile, UserPassion } from '../../types';

const Dashboard: React.FC = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([]);
    const [userPassions, setUserPassions] = useState<UserPassion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

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
                    router.push('/onboarding');
                    return;
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                router.push('/login');
            }
            setLoading(false);
        };

        fetchDashboardData();
    }, [router]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
                Welcome back, <span className="text-indigo-400">{profile?.first_name}</span>!
            </h1>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/messages" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-purple-600 transition-all duration-300 transform hover:scale-105">
                    <MessageSquare className="h-8 w-8 text-purple-400 mb-2" />
                    <h2 className="text-xl font-bold text-white">Messages</h2>
                    <p className="mt-1 text-gray-400">View your conversations</p>
                </Link>
                <Link href="/profile" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-indigo-600 transition-all duration-300 transform hover:scale-105">
                    <User className="h-8 w-8 text-indigo-400 mb-2" />
                    <h2 className="text-xl font-bold text-white">Your Profile</h2>
                    <p className="mt-1 text-gray-400">Update your details</p>
                </Link>
                <Link href="/search" className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-pink-600 transition-all duration-300 transform hover:scale-105">
                    <Search className="h-8 w-8 text-pink-400 mb-2" />
                    <h2 className="text-xl font-bold text-white">Discover</h2>
                    <p className="mt-1 text-gray-400">Find new connections</p>
                </Link>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Completion Widget */}
                    {profile && <ProfileCompletion profile={profile} />}

                    {/* Recent Conversations */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Recent Conversations</h3>
                        {conversations.length > 0 ? (
                            <div className="space-y-4">
                                {conversations.map((convo) => (
                                    <Link key={convo.conversation_id} href={`/messages?conversation=${convo.conversation_id}`} className="block bg-gray-800 p-4 rounded-xl hover:bg-gray-700 transition">
                                        <div className="flex items-center gap-4">
                                            <Avatar seed={convo.user_id} className="w-12 h-12" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-semibold truncate">{convo.first_name} {convo.last_name}</p>
                                                <p className="text-gray-400 text-sm truncate">{convo.last_message}</p>
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {convo.last_message_time ? new Date(convo.last_message_time).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">No conversations yet. Start exploring!</p>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Passion Spotlight */}
                    <PassionSpotlight userPassions={userPassions} userId={profile?.id || ''} />

                    {/* Suggested Profiles */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Suggested for You</h3>
                        {suggestions.length > 0 ? (
                            <div className="space-y-4">
                                {suggestions.map((suggestion) => (
                                    <Link key={suggestion.id} href={`/user/${suggestion.id}`} className="block bg-gray-800 p-4 rounded-xl hover:bg-gray-700 transition">
                                        <div className="flex items-center gap-3">
                                            <Avatar seed={suggestion.id} className="w-10 h-10" />
                                            <div>
                                                <p className="text-white font-medium text-sm">{suggestion.first_name}</p>
                                                <p className="text-indigo-400 text-xs">{suggestion.shared_passions_count} shared passions</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">Complete your profile to get suggestions!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
