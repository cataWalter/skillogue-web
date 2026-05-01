'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, User, Search, ArrowRight } from 'lucide-react';
import { appClient } from '../../lib/appClient';
import Avatar from '../../components/Avatar';
import ProfileCompletion from '../../components/ProfileCompletion';
import PassionSpotlight from '../../components/PassionSpotlight';
import { ProfileData, Conversation, SuggestedProfile, UserPassion } from '../../types';
import { getDisplayMessagePreview, getDisplayName } from '@/lib/profile-display';
import { commonLabels, dashboardCopy } from '@/lib/app-copy';
import toast from 'react-hot-toast';

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
                    toast.error(dashboardCopy.fetchError);
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

    const welcomeName = loading ? 'there' : getDisplayName(profile?.first_name);
    const introCopy = profile?.about_me || dashboardCopy.discoverSubtitle;
    const profilePassionsCount = profile?.passions_count ?? 0;
    const quickActions = [
        {
            href: '/messages',
            icon: MessageSquare,
            title: commonLabels.messages,
            subtitle: dashboardCopy.messagesSubtitle,
            iconClass: 'bg-connection/15 text-connection',
            borderClass: 'hover:border-connection/40',
        },
        {
            href: '/profile',
            icon: User,
            title: dashboardCopy.yourProfileTitle,
            subtitle: dashboardCopy.profileSubtitle,
            iconClass: 'bg-brand/15 text-brand',
            borderClass: 'hover:border-brand/40',
        },
        {
            href: '/search',
            icon: Search,
            title: dashboardCopy.discoverTitle,
            subtitle: dashboardCopy.discoverSubtitle,
            iconClass: 'bg-discovery/15 text-discovery',
            borderClass: 'hover:border-discovery/40',
        },
    ];

    return (
        <div className="editorial-shell py-8 sm:py-12 lg:py-16" data-testid={loading ? 'dashboard-skeleton' : undefined}>
            <section className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-connection/10" />
                <div className="absolute -right-16 top-6 h-36 w-36 rounded-full bg-discovery/20 blur-3xl" aria-hidden="true" />
                <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.85fr)] xl:items-end">
                    <div>
                        <div className="editorial-kicker mb-5 border-brand/20 bg-brand/10 text-brand-soft">
                            <span>Curated dashboard</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl md:text-5xl">
                            {dashboardCopy.welcomeBackPrefix} <span className="bg-gradient-to-r from-brand-start to-discovery-end bg-clip-text text-transparent">{welcomeName}</span>!
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                            {introCopy}
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/search"
                                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-start to-brand-end px-6 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-glow"
                            >
                                {dashboardCopy.discoverTitle}
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href="/messages"
                                className="inline-flex items-center justify-center rounded-full border border-line/40 bg-surface/70 px-6 py-3 font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-line/60 hover:bg-surface-secondary/70"
                            >
                                {commonLabels.messages}
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                        <div className="glass-surface rounded-[1.5rem] p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-faint">Live conversations</p>
                            <p className="mt-3 text-4xl font-bold text-foreground">{conversations.length}</p>
                        </div>
                        <div className="glass-surface rounded-[1.5rem] p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-faint">Fresh matches</p>
                            <p className="mt-3 text-4xl font-bold text-foreground">{suggestions.length}</p>
                        </div>
                        <div className="glass-surface rounded-[1.5rem] p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-faint">Profile passions</p>
                            <p className="mt-3 text-4xl font-bold text-foreground">{profilePassionsCount}</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 sm:gap-6">
                {quickActions.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`glass-surface card-hover-lift flex items-center gap-4 rounded-[1.5rem] p-5 transition-all duration-300 sm:block sm:p-6 ${item.borderClass}`}
                    >
                        <div className={`mb-0 inline-flex rounded-2xl p-3 sm:mb-4 ${item.iconClass}`}>
                            <item.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground sm:text-xl">{item.title}</h2>
                            <p className="mt-1 text-sm text-faint sm:text-base">{item.subtitle}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:mt-12 lg:grid-cols-3 sm:gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Completion Widget */}
                    {profile && <ProfileCompletion profile={profile} />}

                    {/* Recent Conversations */}
                    <div className="glass-panel rounded-[1.75rem] p-6">
                        <h3 className="text-xl font-bold text-foreground mb-4">{dashboardCopy.recentConversationsTitle}</h3>
                        {panelsLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }, (_, index) => (
                                    <div key={index} className="glass-surface rounded-xl p-4 animate-pulse">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-line/30" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-line/30 rounded w-1/3" />
                                                <div className="h-3 bg-line/30 rounded w-2/3" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : conversations.length > 0 ? (
                            <div className="space-y-4">
                                {conversations.map((convo) => (
                                    <Link key={convo.conversation_id} href={`/messages?conversation=${convo.conversation_id}`} className="glass-surface block rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-secondary/90">
                                        <div className="flex items-center gap-4">
                                            <Avatar seed={convo.user_id} className="w-12 h-12" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-foreground font-semibold truncate">{getDisplayName(convo.first_name, convo.last_name)}</p>
                                                <p className="text-muted text-sm truncate">{getDisplayMessagePreview(convo.last_message)}</p>
                                            </div>
                                            <span className="text-xs text-faint whitespace-nowrap">
                                                {convo.last_message_time ? new Date(convo.last_message_time).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="glass-surface inline-flex rounded-full p-4 mb-4">
                                    <MessageSquare className="w-8 h-8 text-faint" />
                                </div>
                                <p className="text-muted mb-4">{dashboardCopy.noConversationsTitle}</p>
                                <Link
                                    href="/search"
                                    className="inline-flex items-center gap-2 text-brand hover:text-brand-soft font-medium transition"
                                >
                                    {dashboardCopy.startExploring}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Suggested Profiles */}
                    <div className="glass-panel rounded-[1.75rem] p-6">
                        <h3 className="text-xl font-bold text-foreground mb-4">{dashboardCopy.suggestedForYouTitle}</h3>
                        {panelsLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }, (_, index) => (
                                    <div key={index} className="glass-surface rounded-xl p-4 animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-line/30" />
                                            <div className="space-y-2">
                                                <div className="h-4 bg-line/30 rounded w-20" />
                                                <div className="h-3 bg-line/30 rounded w-24" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : suggestions.length > 0 ? (
                            <div className="space-y-4">
                                {suggestions.map((suggestion) => (
                                    <Link key={suggestion.id} href={`/user/${suggestion.id}`} className="glass-surface block rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-secondary/90">
                                        <div className="flex items-center gap-3">
                                            <Avatar seed={suggestion.id} className="w-10 h-10" />
                                            <div>
                                                <p className="text-foreground font-medium text-sm">{getDisplayName(suggestion.first_name, suggestion.last_name)}</p>
                                                <p className="text-connection text-xs">{dashboardCopy.sharedPassions(suggestion.shared_passions_count)}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted text-sm">{dashboardCopy.suggestionsEmpty}</p>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    <div className="glass-panel rounded-[1.75rem] p-4 sm:p-6">
                        <PassionSpotlight userPassions={userPassions} userId={profile?.id || ''} loading={panelsLoading} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
