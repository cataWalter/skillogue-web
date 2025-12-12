'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import Link from 'next/link';
import { ArrowLeft, UserX, Loader2, Unlock } from 'lucide-react';
import Avatar from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import toast from 'react-hot-toast';

interface BlockedUser {
    blocked_user_id: string;
    profile: {
        id: string;
        first_name: string;
        last_name: string;
        avatar_url: string | null;
    };
}

const BlockedUsersPage: React.FC = () => {
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBlockedUsers = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('blocks')
            .select(`
                blocked_user_id,
                profile:profiles!blocks_blocked_user_id_fkey (
                    id,
                    first_name,
                    last_name
                )
            `)
            .eq('user_id', session.user.id);

        if (error) {
            console.error('Error fetching blocked users:', error);
            toast.error('Failed to load blocked users');
        } else {
            // Transform data to match interface if needed, though Supabase returns nested objects
            setBlockedUsers(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const handleUnblock = async (userId: string, userName: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        if (!confirm(`Are you sure you want to unblock ${userName}?`)) return;

        try {
            const { error } = await supabase
                .from('blocks')
                .delete()
                .eq('user_id', session.user.id)
                .eq('blocked_user_id', userId);

            if (error) throw error;

            toast.success(`${userName} has been unblocked`);
            // Refresh the list
            setBlockedUsers(prev => prev.filter(u => u.blocked_user_id !== userId));
        } catch (error: any) {
            console.error('Error unblocking user:', error);
            toast.error(error.message || 'Failed to unblock user');
        }
    };

    return (
        <main className="flex-grow p-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center mb-8">
                <Link href="/settings" className="text-gray-400 hover:text-white transition flex items-center gap-2">
                    <ArrowLeft size={20} />
                    Back to Settings
                </Link>
            </div>

            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <UserX className="text-red-400" size={32} />
                Blocked Users
            </h1>
            <p className="text-gray-400 mb-8">
                Users you have blocked will not be able to see your profile or send you messages.
            </p>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
            ) : blockedUsers.length === 0 ? (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                        <UserX className="text-gray-500" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Blocked Users</h3>
                    <p className="text-gray-400">
                        You haven't blocked anyone yet.
                    </p>
                </div>
            ) : (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                    <ul className="divide-y divide-gray-800">
                        {blockedUsers.map((item) => (
                            <li key={item.blocked_user_id} className="p-4 flex items-center justify-between hover:bg-gray-800/30 transition">
                                <div className="flex items-center gap-4">
                                    <Avatar seed={item.profile.id} className="w-12 h-12 rounded-full" />
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            {item.profile.first_name} {item.profile.last_name}
                                        </h3>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => handleUnblock(item.blocked_user_id, item.profile.first_name)}
                                    className="!w-auto !px-4 !py-2 text-sm"
                                >
                                    <Unlock size={16} className="mr-2" />
                                    Unblock
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </main>
    );
};

export default BlockedUsersPage;
