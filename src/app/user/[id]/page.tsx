'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProfileCard from '../../../components/ProfileCard';
import ProfileSkeleton from '../../../components/ProfileSkeleton';
import Avatar from '../../../components/Avatar';
import { FullProfile } from '../../../types';
import { MessageSquare, ShieldAlert, UserX, Flag, Ghost, Lock, Heart } from 'lucide-react';
import { appClient } from '../../../lib/appClient';
import { getProfilePassions, getProfileLanguages } from '@/lib/client/profile-client';
import { isBlocked as checkIsBlocked, isBlockedBy as checkIsBlockedBy, isSaved as checkIsSaved, blockUser as doBlockUser, unblockUser as doUnblockUser, saveProfile as doSaveProfile, unsaveProfile as doUnsaveProfile } from '@/lib/client/social-client';
import ReportModal from '../../../components/ReportModal';
import toast from 'react-hot-toast';
import { profilePageCopy } from '../../../lib/app-copy';

type Session = {
    user: {
        id: string;
    };
} | null;

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
    const [isSaved, setIsSaved] = useState(false);
    const [isBlockedByProfileUser, setIsBlockedByProfileUser] = useState(false);
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const router = useRouter();

    const checkBlockStatus = useCallback(async (profileId: string) => {
        setIsBlocked(await checkIsBlocked(profileId));
    }, []);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError('');

            const { data: { session: currentSession } } = await appClient.auth.getSession();
            setSession(currentSession);

            if (!id) {
                setError(profilePageCopy.user.noUserId);
                setLoading(false);
                return;
            }

            if (currentSession?.user) {
                if (id === currentSession.user.id) {
                    router.push('/profile');
                    return;
                }

                // Check if I am blocked by this user
                if (await checkIsBlockedBy(id)) {
                    setIsBlockedByProfileUser(true);
                    setLoading(false);
                    return;
                }

                checkBlockStatus(id);
            }

            const { data: profileData, error: profileError } = await appClient
                .from('profiles')
                .select('id, created_at, last_login, first_name, last_name, about_me, age, gender, verified, is_private, show_age, show_location, locations(*)')
                .eq('id', id)
                .single();

            if (profileError || !profileData) {
                console.error('Error loading user profile:', profileError);
                setError(profilePageCopy.user.couldNotFindUser);
                setLoading(false);
                return;
            }
            setProfile(profileData as FullProfile);
            if (currentSession?.user) {
                appClient.functions.invoke('send-push', {
                    body: {
                        receiver_id: profileData.id,
                        actor_id: currentSession.user.id,
                        notification_type: 'profile_visit',
                        title: 'Profile Visit',
                        body: 'Someone viewed your profile.',
                        url: `/user/${currentSession.user.id}`,
                    }
                }).catch(() => undefined);
            }

            const [profilePassions, profileLanguages] = await Promise.all([
                getProfilePassions(id),
                getProfileLanguages(id),
            ]);

            setPassions(profilePassions);
            setLanguages(profileLanguages);

            if (currentSession?.user) {
                setIsSaved(await checkIsSaved(id));
                await checkBlockStatus(id);
            }

            setLoading(false);
        };

        loadProfile();
    }, [id, router, checkBlockStatus]);

    const handleBlock = profile
        ? async () => {
            if (!confirm(profilePageCopy.user.blockConfirm(profile.first_name ?? ''))) return;

            try {
                const { error } = await doBlockUser(profile.id);

                if (error) throw error;
                setIsBlocked(true);
                toast.success(profilePageCopy.user.blockedSuccess);
                router.push('/dashboard');
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : profilePageCopy.user.blockError;
                toast.error(message);
            }
        }
        : undefined;

    const handleUnblock = profile
        ? async () => {
            if (!confirm(profilePageCopy.user.unblockConfirm(profile.first_name ?? ''))) return;

            try {
                const { error } = await doUnblockUser(profile.id);

                if (error) throw error;
                setIsBlocked(false);
                toast.success(profilePageCopy.user.unblockSuccess);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : profilePageCopy.user.unblockError;
                toast.error(message);
            }
        }
        : undefined;

    const handleToggleSave = profile
        ? async () => {
            if (isSaved) {
                const { error } = await doUnsaveProfile(profile.id);
                if (!error) {
                    setIsSaved(false);
                    toast.success(profilePageCopy.user.removedFromFavorites);
                } else {
                    toast.error(profilePageCopy.user.removeFavoriteError);
                }
            } else {
                const { error } = await doSaveProfile(profile.id);
                if (!error) {
                    setIsSaved(true);
                    toast.success(profilePageCopy.user.savedToFavorites);
                    appClient.functions.invoke('send-push', {
                        body: {
                            receiver_id: profile.id,
                            notification_type: 'new_favorite',
                            title: 'New Favorite',
                            body: 'Someone saved your profile.',
                            url: `/user/${session?.user.id}`,
                        }
                    }).catch(() => undefined);
                } else {
                    toast.error(profilePageCopy.user.saveFavoriteError);
                }
            }
        }
        : undefined;

    if (loading) {
        return (
            <main className="editorial-shell flex-grow py-8 sm:py-12 lg:py-16">
                <div className="max-w-4xl mx-auto">
                    <ProfileSkeleton />
                </div>
            </main>
        );
    }

    if (isBlockedByProfileUser) {
        return (
            <div className="editorial-shell flex flex-grow flex-col items-center justify-center py-10 text-center text-foreground">
                <div className="glass-panel max-w-xl rounded-[2rem] p-10">
                    <Ghost size={64} className="text-muted mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">{profilePageCopy.user.profileUnavailable}</h2>
                    <p className="text-faint">{profilePageCopy.user.cannotViewProfile}</p>
                    <Link href="/dashboard" className="mt-6 text-brand hover:text-brand">
                        {profilePageCopy.user.returnToDashboard}
                    </Link>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        const profileErrorMessage = [error, profilePageCopy.user.profileNotFound].find(
            (message) => message.length > 0
        );

        return (
            <div className="editorial-shell py-10 text-center text-foreground">
                <p className="text-xl text-danger mb-4">{profileErrorMessage}</p>
                <Link href="/dashboard" className="text-brand hover:underline">{profilePageCopy.user.returnToDashboard}</Link>
            </div>
        );
    }

    const actionButton = !session?.user ? (
        <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-start to-brand-end px-4 py-2 text-white shadow-glass-sm transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-md"
        >
            <MessageSquare size={18} />
            <span>Sign in to connect</span>
        </Link>
    ) : (
        <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
            {!isBlocked ? (
                <>
                    <Link
                        href={`/messages?conversation=${profile.id}`}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-start to-brand-end px-4 py-2 text-white shadow-glass-sm transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-md"
                    >
                        <MessageSquare size={18} />
                        <span>{profilePageCopy.user.message}</span>
                    </Link>
                    <button
                        onClick={handleToggleSave}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 transition-all duration-300 hover:-translate-y-0.5 ${isSaved ? 'border-connection/40 bg-connection text-white shadow-glass-sm' : 'glass-surface text-foreground hover:bg-surface-secondary/80'}`}
                        title={isSaved ? profilePageCopy.user.removeFromFavorites : profilePageCopy.user.addToFavorites}
                        aria-label={isSaved ? profilePageCopy.user.removeFromFavorites : profilePageCopy.user.addToFavorites}
                    >
                        <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={() => setReportModalOpen(true)}
                        className="glass-surface flex items-center gap-2 rounded-xl px-4 py-2 text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-secondary/80"
                        title={profilePageCopy.user.reportUser}
                        aria-label={profilePageCopy.user.reportUser}
                    >
                        <Flag size={18} />
                    </button>
                    <button
                        onClick={handleBlock}
                        className="flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-2 text-danger-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-danger/15"
                        title={profilePageCopy.user.blockUser}
                        aria-label={profilePageCopy.user.blockUser}
                    >
                        <ShieldAlert size={18} />
                    </button>
                </>
            ) : (
                <button
                    onClick={handleUnblock}
                    className="glass-surface flex items-center gap-2 rounded-xl px-4 py-2 text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-secondary/80"
                    title={profilePageCopy.user.unblockUser}
                >
                    <UserX size={18} />
                    <span>{profilePageCopy.user.unblock}</span>
                </button>
            )}
        </div>
    );

    if (profile.is_private) {
        return (
            <div className="editorial-shell flex flex-grow flex-col items-center justify-center py-10 text-center text-foreground animate-fade-in-up">
                <div className="glass-panel max-w-2xl rounded-[2rem] p-8 sm:p-10">
                    <div className="mb-6">
                        <div className="relative inline-block">
                            <Avatar seed={profile.id} className="w-32 h-32 rounded-full mx-auto mb-4" />
                            <div className="glass-surface absolute bottom-0 right-0 rounded-full border-2 border-line/30 p-2">
                                <Lock size={20} className="text-muted" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold">{profile.first_name} {profile.last_name}</h1>
                    </div>
                    <div className="glass-surface mx-auto max-w-md w-full rounded-[1.5rem] p-6 card-hover-lift">
                        <Lock size={48} className="text-muted mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">{profilePageCopy.user.privateTitle}</h2>
                        <p className="text-faint mb-6">
                            {profilePageCopy.user.privateDescription(profile.first_name ?? '')}
                        </p>
                        {actionButton}
                    </div>
                </div>
                {session?.user && profile && (
                    <ReportModal
                        isOpen={isReportModalOpen}
                        onClose={() => setReportModalOpen(false)}
                        reportedUserId={profile.id}
                    />
                )}
            </div>
        );
    }

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

            {session?.user && profile && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setReportModalOpen(false)}
                    reportedUserId={profile.id}
                />
            )}
        </main>
    );
};

export default UserProfile;
