'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, User, Search } from 'lucide-react';
import { appClient } from '../../lib/appClient';
import Avatar from '../../components/Avatar';
import ProfileCompletion from '../../components/ProfileCompletion';
import PassionSpotlight from '../../components/PassionSpotlight';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import { ProfileData, Conversation, SuggestedProfile, UserPassion } from '../../types';
import { getDisplayMessagePreview, getDisplayName } from '@/lib/profile-display';
import { commonLabels, dashboardCopy } from '@/lib/app-copy';

const Dashboard: React.FC = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([]);
    const [userPassions, setUserPassions] = useState<UserPassion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [panelsLoading, setPanelsLoading] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {
        let isActive = true;

        const fetchDashboardData = async () => {
            try {
                const { data: { user } } = await appClient.auth.getUser();

                if (!user) {
                    router.push('/login');
                    return;
                }

                // Fetch only the critical profile gate first so the page shell can render sooner.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const profileRes = await appClient.from('profiles').select(`
                    id,
                    first_name,
                    about_me,
                    passions_count: profile_passions(count),
                    languages_count: profile_languages(count)
                `).eq('id', user.id).maybeSingle() as any;

                if (profileRes.error) {
                    console.error("Profile incomplete or error fetching:", profileRes.error);
                    router.push('/onboarding');
                    return;
                }

                if (!profileRes.data?.first_name) {
                    router.push('/onboarding');
                    return;
                }

                if (!isActive) {
                    return;
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const profileData = profileRes.data as any;
                setProfile({
                    ...profileData,
                    passions_count: profileData.passions_count[0]?.count || 0,
                    languages_count: profileData.languages_count[0]?.count || 0,
                });
                setLoading(false);

                const [convosRes, suggestionsRes, passionsRes] = await Promise.all([
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (appClient as any).rpc('get_recent_conversations', { current_user_id: user.id }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (appClient as any).rpc('get_suggested_profiles', { current_user_id: user.id, p_limit: 5 }),
                    appClient.from('profile_passions').select('passion_id, passions(name)').eq('profile_id', user.id),
                ]);

                if (!isActive) {
                    return;
                }

                if (convosRes.error) console.error("Error fetching conversations:", convosRes.error);
                else setConversations(convosRes.data || []);

                if (suggestionsRes.error) console.error("Error fetching suggestions:", suggestionsRes.error);
                else setSuggestions(suggestionsRes.data || []);

                if (passionsRes.error) console.error("Error fetching passions:", passionsRes.error);
                else setUserPassions(passionsRes.data || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                if (isActive) {
                    setLoading(false);
                }
            } finally {
                if (isActive) {
                    setPanelsLoading(false);
                }
            }
        };

        fetchDashboardData();

        return () => {
            isActive = false;
        };
    }, [router]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    const welcomeName = getDisplayName(profile?.first_name);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 sm:mb-8">
                {dashboardCopy.welcomeBackPrefix} <span className="text-indigo-400">{welcomeName}</span>!
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <Link href="/messages" className="bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-800 hover:border-purple-600 transition-all duration-300 transform hover:scale-105 flex sm:block items-center gap-4 sm:gap-0 card-hover-lift">
                    <div className="p-3 bg-purple-600/20 rounded-xl mb-0 sm:mb-3">
                        <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white">{commonLabels.messages}</h2>
                        <p className="text-sm sm:text-base text-gray-400">{dashboardCopy.messagesSubtitle}</p>
                    </div>
                </Link>
                <Link href="/profile" className="bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-800 hover:border-indigo-600 transition-all duration-300 transform hover:scale-105 flex sm:block items-center gap-4 sm:gap-0 card-hover-lift">
                    <div className="p-3 bg-indigo-600/20 rounded-xl mb-0 sm:mb-3">
                        <User className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white">{dashboardCopy.yourProfileTitle}</h2>
                        <p className="text-sm sm:text-base text-gray-400">{dashboardCopy.profileSubtitle}</p>
                    </div>
                </Link>
                <Link href="/search" className="bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-800 hover:border-pink-600 transition-all duration-300 transform hover:scale-105 flex sm:block items-center gap-4 sm:gap-0 card-hover-lift">
                    <div className="p-3 bg-pink-600/20 rounded-xl mb-0 sm:mb-3">
                        <Search className="h-6 w-6 sm:h-8 sm:w-8 text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white">{dashboardCopy.discoverTitle}</h2>
                        <p className="text-sm sm:text-base text-gray-400">{dashboardCopy.discoverSubtitle}</p>
                    </div>
                </Link>
            </div>

            <div className="mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Completion Widget */}
                    {profile && <ProfileCompletion profile={profile} />}

                    {/* Recent Conversations */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">{dashboardCopy.recentConversationsTitle}</h3>
                        {panelsLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }, (_, index) => (
                                    <div key={index} className="bg-gray-800 p-4 rounded-xl animate-pulse">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-700" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-700 rounded w-1/3" />
                                                <div className="h-3 bg-gray-700 rounded w-2/3" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : conversations.length > 0 ? (
                            <div className="space-y-4">
                                {conversations.map((convo) => (
                                    <Link key={convo.conversation_id} href={`/messages?conversation=${convo.conversation_id}`} className="block bg-gray-800 p-4 rounded-xl hover:bg-gray-700 transition">
                                        <div className="flex items-center gap-4">
                                            <Avatar seed={convo.user_id} className="w-12 h-12" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-semibold truncate">{getDisplayName(convo.first_name, convo.last_name)}</p>
                                                <p className="text-gray-400 text-sm truncate">{getDisplayMessagePreview(convo.last_message)}</p>
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {convo.last_message_time ? new Date(convo.last_message_time).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="bg-gray-800 p-4 rounded-full inline-flex mb-4">
                                    <MessageSquare className="w-8 h-8 text-gray-500" />
                                </div>
                                <p className="text-gray-400 mb-4">{dashboardCopy.noConversationsTitle}</p>
                                <Link 
                                    href="/search" 
                                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition"
                                >
                                    {dashboardCopy.startExploring}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Passion Spotlight */}
                    <PassionSpotlight userPassions={userPassions} userId={profile?.id || ''} loading={panelsLoading} />

                    {/* Suggested Profiles */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">{dashboardCopy.suggestedForYouTitle}</h3>
                        {panelsLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }, (_, index) => (
                                    <div key={index} className="bg-gray-800 p-4 rounded-xl animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-700" />
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-700 rounded w-20" />
                                                <div className="h-3 bg-gray-700 rounded w-24" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : suggestions.length > 0 ? (
                            <div className="space-y-4">
                                {suggestions.map((suggestion) => (
                                    <Link key={suggestion.id} href={`/user/${suggestion.id}`} className="block bg-gray-800 p-4 rounded-xl hover:bg-gray-700 transition">
                                        <div className="flex items-center gap-3">
                                            <Avatar seed={suggestion.id} className="w-10 h-10" />
                                            <div>
                                                <p className="text-white font-medium text-sm">{getDisplayName(suggestion.first_name, suggestion.last_name)}</p>
                                                <p className="text-indigo-400 text-xs">{dashboardCopy.sharedPassions(suggestion.shared_passions_count)}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">{dashboardCopy.suggestionsEmpty}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
