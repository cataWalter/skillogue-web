'use client';

import { appClient } from '../../../lib/appClient';

import React, { useEffect, useState } from 'react';
import { UserX, Loader2, Unlock } from 'lucide-react';
import Avatar from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import {
    SettingsBackLink,
    SettingsEmptyState,
    SettingsHero,
    SettingsPage,
    SettingsSectionCard,
    SettingsStatusBanner,
} from '../../../components/settings/SettingsShell';
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
    } | null;
}

const BlockedUsersPage: React.FC = () => {
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBlockedUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await appClient.rpc<BlockedUser[]>('list_blocked_users');

            if (error) throw error;

            setBlockedUsers(Array.isArray(data) ? data : []);
        } catch (error: unknown) {
            console.error('Error fetching blocked users:', error);
            toast.error(settingsCopy.blocked.loadError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const handleUnblock = async (userId: string, userName: string) => {
        if (!confirm(settingsCopy.blocked.unblockConfirm(userName))) return;

        try {
            const { error } = await appClient.rpc('unblock_user', { target_id: userId });

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
        <SettingsPage>
            <SettingsBackLink href="/settings" label={settingsCopy.blocked.backToSettings} />
            <SettingsHero
                eyebrow={settingsCopy.blocked.eyebrow}
                title={settingsCopy.blocked.title}
                description={settingsCopy.blocked.subtitle}
                icon={<UserX className="h-7 w-7" />}
                highlights={loading ? [settingsCopy.blocked.loading] : [settingsCopy.blocked.countLabel(blockedUsers.length)]}
                tone="danger"
            />

            <div className="mt-6">
                {loading ? (
                    <SettingsStatusBanner
                        title={settingsCopy.blocked.loading}
                        description={settingsCopy.blocked.loadingDescription}
                        icon={<Loader2 role="status" aria-label={settingsCopy.blocked.loading} className="h-5 w-5 animate-spin" />}
                        badge={settingsCopy.blocked.title}
                        tone="danger"
                    />
                ) : null}

                {!loading && blockedUsers.length === 0 ? (
                    <SettingsEmptyState
                        title={settingsCopy.blocked.emptyTitle}
                        description={settingsCopy.blocked.emptyDescription}
                        icon={<UserX className="h-6 w-6" />}
                        tone="danger"
                        action={<p className="mx-auto max-w-lg text-sm leading-6 text-muted">{settingsCopy.blocked.emptyHelper}</p>}
                    />
                ) : null}

                {!loading && blockedUsers.length > 0 ? (
                    <SettingsSectionCard
                        title={settingsCopy.blocked.listTitle}
                        icon={<UserX className="h-6 w-6" />}
                        badge={settingsCopy.blocked.countLabel(blockedUsers.length)}
                        tone="danger"
                    >
                        <ul className="space-y-3">
                            {blockedUsers.map((item) => {
                                const displayName = item.profile
                                    ? getDisplayName(item.profile.first_name, item.profile.last_name)
                                    : item.blocked_id;

                                return (
                                    <li
                                        key={item.blocked_id}
                                        className="flex flex-col gap-4 rounded-2xl border border-line/25 bg-surface-secondary/45 p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar seed={item.profile?.id ?? item.blocked_id} className="h-12 w-12 rounded-full" />
                                            <div>
                                                <h3 className="font-semibold text-foreground">{displayName}</h3>
                                                {!item.profile ? (
                                                    <>
                                                        <p className="mt-1 text-sm text-faint">{settingsCopy.blocked.missingProfileDescription}</p>
                                                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{settingsCopy.blocked.missingProfileLabel}</p>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUnblock(item.blocked_id, displayName)}
                                            className="!w-auto !border-danger/25 !text-danger-soft hover:!bg-danger/10"
                                        >
                                            <Unlock size={16} className="mr-2" />
                                            {settingsCopy.blocked.unblock}
                                        </Button>
                                    </li>
                                );
                            })}
                        </ul>
                    </SettingsSectionCard>
                ) : null}
            </div>
        </SettingsPage>
    );
};

export default BlockedUsersPage;
