// src/pages/UserProfile.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProfileCard from '../components/ProfileCard';
import { FullProfile } from '../types';
import { MessageSquare, ShieldAlert, UserX, Flag, Ghost } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import Modal from '../components/Modal';
import { Button } from '../components/Button';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

const UserProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [profile, setProfile] = useState<FullProfile | null>(null);
    const [passions, setPassions] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [session, setSession] = useState<Session | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isBlockedByProfileUser, setIsBlockedByProfileUser] = useState(false); // New state for reverse block
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

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
                if (!currentSession?.user) navigate('/login');
                return;
            }

            if (id === currentSession.user.id) {
                navigate('/profile');
                return;
            }

            // --- New Check: See if the profile owner has blocked the current user ---
            const { data: reverseBlock, error: reverseBlockError } = await supabase
                .from('blocks')
                .select('user_id')
                .eq('user_id', id) // The profile owner is the blocker
                .eq('blocked_user_id', currentSession.user.id) // The current user is the one being blocked
                .maybeSingle();

            if (reverseBlockError) {
                console.error('Error checking if blocked by user:', reverseBlockError);
            }

            if (reverseBlock) {
                setIsBlockedByProfileUser(true);
                setLoading(false);
                return; // Stop loading the rest of the profile data
            }
            // --- End of New Check ---

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

            await checkBlockStatus(currentSession.user.id, id);

            setLoading(false);
        };

        loadProfile();
    }, [id, navigate, checkBlockStatus]);

    const handleBlock = async () => {
        if (!session?.user || !profile) return;
        if (!window.confirm(`Are you sure you want to block ${profile.first_name}? You won't see their profile and they won't see yours.`)) return;

        const { error } = await supabase.from('blocks').insert({
            user_id: session.user.id,
            blocked_user_id: profile.id
        });

        if (error) {
            toast.error('Failed to block user.');
            console.error(error);
        } else {
            toast.success(`${profile.first_name} has been blocked.`);
            setIsBlocked(true);
        }
    };

    const handleUnblock = async () => {
        if (!session?.user || !profile) return;

        const { error } = await supabase.from('blocks')
            .delete()
            .match({ user_id: session.user.id, blocked_user_id: profile.id });

        if (error) {
            toast.error('Failed to unblock user.');
            console.error(error);
        } else {
            toast.success(`${profile.first_name} has been unblocked.`);
            setIsBlocked(false);
        }
    };

    const handleSubmitReport = async () => {
        if (!session?.user || !profile || !reportReason.trim()) {
            toast.error('Please provide a reason for the report.');
            return;
        }
        setIsSubmitting(true);
        const { error } = await supabase.from('reports').insert({
            reporter_id: session.user.id,
            reported_user_id: profile.id,
            reason: reportReason
        });

        if (error) {
            toast.error('Failed to submit report.');
            console.error(error);
        } else {
            toast.success('Report submitted successfully. Our team will review it.');
            setReportModalOpen(false);
            setReportReason('');
        }
        setIsSubmitting(false);
    };

    if (loading) {
        return     <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            /><div className="text-center p-10">Loading profile...</div></Layout>;
    }

    // --- New Render Condition for Blocked State ---
    if (isBlockedByProfileUser) {
        return (
                <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            />
                <main className="flex-grow flex items-center justify-center text-center p-6">
                    <div className="bg-gray-900/70 p-10 rounded-2xl border border-gray-800">
                        <Ghost size={64} className="mx-auto text-indigo-400 mb-4 animate-pulse" />
                        <h1 className="text-3xl font-bold text-white">This Profile is Unavailable</h1>
                        <p className="text-gray-400 mt-2 max-w-sm">
                            It seems this user's profile has ventured into the unknown. It might not be available to you.
                        </p>
                        <Link to="/dashboard" className="mt-8 inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition">
                            Back to Dashboard
                        </Link>
                    </div>
                </main>
            </Layout>
        );
    }

    if (error) {
        return     <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            /><div className="text-center p-10 text-red-400">{error}</div></Layout>;
    }

    if (!profile) {
        return     <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            /><div className="text-center p-10">User not found.</div></Layout>;
    }

    const actionSlot = (
        <div className="flex items-center gap-2 self-center sm:self-auto">
            {!isBlocked && (
                <Link
                    to={`/messages?with=${profile.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all transform hover:scale-105 text-sm"
                >
                    <MessageSquare size={16} /> Message
                </Link>
            )}

            <button
                onClick={isBlocked ? handleUnblock : handleBlock}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm ${isBlocked ? 'bg-gray-600 hover:bg-gray-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}
            >
                {isBlocked ? <><ShieldAlert size={16} /> Unblock</> : <><UserX size={16} /> Block</>}
            </button>

            <button onClick={() => setReportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-all text-sm">
                <Flag size={16} /> Report
            </button>
        </div>
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
                        actionSlot={actionSlot}
                    />
                </div>
            </main>

            <Modal
                isOpen={isReportModalOpen}
                onClose={() => setReportModalOpen(false)}
                title={`Report ${profile.first_name}`}
            >
                <div className="space-y-4">
                    <p className="text-gray-300">Please provide a reason for reporting this user. Your report is anonymous and helps us keep the community safe.</p>
                    <textarea
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                        placeholder="Describe the issue..."
                    />
                    <div className="flex justify-end gap-4">
                        <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSubmitReport}
                            isLoading={isSubmitting}
                            disabled={!reportReason.trim() || isSubmitting}
                        >
                            Submit Report
                        </Button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default UserProfile;