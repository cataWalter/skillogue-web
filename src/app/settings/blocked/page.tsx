'use client';

import { appClient } from '../../../lib/appClient';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserX, Loader2, Unlock } from 'lucide-react';
import Avatar from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import toast from 'react-hot-toast';
import { getDisplayName } from '../../../lib/profile-display';
import { settingsCopy } from '../../../lib/app-copy';

interface BlockedUser {
    blocked_id: string;
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
        const { data: { session } } = await appClient.auth.getSession();
        if (!session) return;

        const { data, error } = await appClient
            .from('blocked_users')
            .select(`
                blocked_id,
                profile:profiles!blocked_users_blocked_id_fkey (
                    id,
                    first_name,
                    last_name
                )
            `)
            .eq('blocker_id', session.user.id);

        if (error) {
            console.error('Error fetching blocked users:', error);
            toast.error(settingsCopy.blocked.loadError);
        } else {
            // Transform data to match interface - Appwrite returns nested objects from join
            const transformed = data?.map((item) => ({
                blocked_id: item.blocked_id,
                profile: Array.isArray(item.profile) ? item.profile[0] : item.profile
            })) || [];
            setBlockedUsers(transformed as unknown as BlockedUser[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const handleUnblock = async (userId: string, userName: string) => {
        const { data: { session } } = await appClient.auth.getSession();
        if (!session) return;

        if (!confirm(settingsCopy.blocked.unblockConfirm(userName))) return;

        try {
            const { error } = await appClient
                .from('blocked_users')
                .delete()
                .eq('blocker_id', session.user.id)
                .eq('blocked_id', userId);

            if (error) throw error;

            toast.success(settingsCopy.blocked.unblockSuccess(userName));
            // Refresh the list
            setBlockedUsers(prev => prev.filter(u => u.blocked_id !== userId));
        } catch (error: unknown) {
            console.error('Error unblocking user:', error);
            const message = error instanceof Error ? error.message : settingsCopy.blocked.unblockFallbackError;
            toast.error(message);
        }
    };

    return (
        <main className="flex-grow p-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center mb-8">
                <Link href="/settings" className="text-gray-400 hover:text-white transition flex items-center gap-2">
                    <ArrowLeft size={20} />
                    {settingsCopy.blocked.backToSettings}
                </Link>
            </div>

            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <UserX className="text-red-400" size={32} />
                {settingsCopy.blocked.title}
            </h1>
            <p className="text-gray-400 mb-8">
                {settingsCopy.blocked.subtitle}
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
                    <h3 className="text-xl font-semibold text-white mb-2">{settingsCopy.blocked.emptyTitle}</h3>
                    <p className="text-gray-400">
                        {settingsCopy.blocked.emptyDescription}
                    </p>
                </div>
            ) : (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                    <ul className="divide-y divide-gray-800">
                        {blockedUsers.map((item) => {
                            const displayName = getDisplayName(item.profile.first_name, item.profile.last_name);

                            return (
                            <li key={item.blocked_id} className="p-4 flex items-center justify-between hover:bg-gray-800/30 transition">
                                <div className="flex items-center gap-4">
                                    <Avatar seed={item.profile.id} className="w-12 h-12 rounded-full" />
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            {displayName}
                                        </h3>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => handleUnblock(item.blocked_id, displayName)}
                                    className="!w-auto !px-4 !py-2 text-sm"
                                >
                                    <Unlock size={16} className="mr-2" />
                                    {settingsCopy.blocked.unblock}
                                </Button>
                            </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </main>
    );
};

export default BlockedUsersPage;
