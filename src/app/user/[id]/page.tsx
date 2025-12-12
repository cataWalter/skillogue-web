'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../supabaseClient';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProfileCard from '../../../components/ProfileCard';
import ProfileSkeleton from '../../../components/ProfileSkeleton';
import Avatar from '../../../components/Avatar';
import { FullProfile } from '../../../types';
import { MessageSquare, ShieldAlert, UserX, Flag, Ghost, Lock } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import ReportModal from '../../../components/ReportModal';
import toast from 'react-hot-toast';

const UserProfile: React.FC = () => {
    const params = useParams();
    const id = params?.id as string;
    const [profile, setProfile] = useState<FullProfile | null>(null);
    const [passions, setPassions] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [session, setSession] = useState<Session | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isBlockedByProfileUser, setIsBlockedByProfileUser] = useState(false);
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const router = useRouter();

    const checkBlockStatus = useCallback(async (currentUserId: string, profileId: string) => {
        const { data, error } = await supabase
            .from('blocks')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('blocked_user_id', profileId)
            .maybeSingle();

        if (error) {
            console.error('Error checking block status:', error);
            return;
        }
        setIsBlocked(!!data);
    }, []);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError('');

            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);

            if (!id || !currentSession?.user) {
                setError(!id ? 'No user ID provided.' : 'You must be logged in to view profiles.');
                setLoading(false);
                if (!currentSession?.user) router.push('/login');
                return;
            }

            if (id === currentSession.user.id) {
                router.push('/profile');
                return;
            }

            const { data: reverseBlock, error: reverseBlockError } = await supabase
                .from('blocks')
                .select('user_id')
                .eq('user_id', id)
                .eq('blocked_user_id', currentSession.user.id)
                .maybeSingle();

            if (reverseBlockError) {
                console.error('Error checking if blocked by user:', reverseBlockError);
            }

            if (reverseBlock) {
                setIsBlockedByProfileUser(true);
                setLoading(false);
                return;
            }

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

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPassions(passionRes.data?.map((p: any) => p.passions.name) || []);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setLanguages(languageRes.data?.map((l: any) => l.languages.name) || []);

            await checkBlockStatus(currentSession.user.id, id);

            setLoading(false);
        };

        loadProfile();
    }, [id, router, checkBlockStatus]);

    const handleBlock = async () => {
        if (!session?.user || !profile) return;
        if (!confirm(`Are you sure you want to block ${profile.first_name}? You won't see them in search or messages.`)) return;

        try {
            const { error } = await supabase.from('blocks').insert({
                user_id: session.user.id,
                blocked_user_id: profile.id
            });

            if (error) throw error;
            setIsBlocked(true);
            toast.success('User blocked successfully');
            router.push('/dashboard');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error blocking user';
            toast.error(message);
        }
    };

    const handleUnblock = async () => {
        if (!session?.user || !profile) return;
        if (!confirm(`Unblock ${profile.first_name}?`)) return;

        try {
            const { error } = await supabase
                .from('blocks')
                .delete()
                .eq('user_id', session.user.id)
                .eq('blocked_user_id', profile.id);

            if (error) throw error;
            setIsBlocked(false);
            toast.success('User unblocked');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error unblocking user';
            toast.error(message);
        }
    };

    if (loading) {
        return (
            <main className="flex-grow p-4 sm:p-6 w-full">
                <div className="max-w-4xl mx-auto">
                    <ProfileSkeleton />
                </div>
            </main>
        );
    }

    if (isBlockedByProfileUser) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-10 text-center">
                <Ghost size={64} className="text-gray-600 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Profile Unavailable</h2>
                <p className="text-gray-400">You cannot view this profile.</p>
                <Link href="/dashboard" className="mt-6 text-indigo-400 hover:text-indigo-300">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="text-center p-10 text-white">
                <p className="text-xl text-red-400 mb-4">{error || 'Profile not found'}</p>
                <Link href="/dashboard" className="text-indigo-400 hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    const actionButton = (
        <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
            {!isBlocked ? (
                <>
                    <Link
                        href={`/messages?conversation=${profile.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-300 transform hover:scale-105 text-white"
                    >
                        <MessageSquare size={18} />
                        <span>Message</span>
                    </Link>
                    <button
                        onClick={() => setReportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-white"
                        title="Report User"
                    >
                        <Flag size={18} />
                    </button>
                    <button
                        onClick={handleBlock}
                        className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-900/80 text-red-200 rounded-lg transition"
                        title="Block User"
                    >
                        <ShieldAlert size={18} />
                    </button>
                </>
            ) : (
                <button
                    onClick={handleUnblock}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
                >
                    <UserX size={18} />
                    <span>Unblock</span>
                </button>
            )}
        </div>
    );

    if (profile.is_private) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-10 text-center">
                <div className="mb-6">
                    <Avatar seed={profile.id} className="w-32 h-32 rounded-full mx-auto mb-4" />
                    <h1 className="text-3xl font-bold">{profile.first_name} {profile.last_name}</h1>
                </div>
                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 max-w-md w-full">
                    <Lock size={48} className="text-gray-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">This profile is private</h2>
                    <p className="text-gray-400 mb-6">
                        {profile.first_name} has limited who can see their profile details.
                    </p>
                    {actionButton}
                </div>
                {session?.user && profile && (
                    <ReportModal
                        isOpen={isReportModalOpen}
                        onClose={() => setReportModalOpen(false)}
                        reporterId={session.user.id}
                        reportedUserId={profile.id}
                        reportedUserName={profile.first_name || 'User'}
                    />
                )}
            </div>
        );
    }

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

            {session?.user && profile && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setReportModalOpen(false)}
                    reporterId={session.user.id}
                    reportedUserId={profile.id}
                    reportedUserName={profile.first_name || 'User'}
                />
            )}
        </main>
    );
};

export default UserProfile;
