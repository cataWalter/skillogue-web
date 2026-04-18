'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileSearch } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { AdminUserInvestigation, AdminUserSearchResult } from '@/lib/admin-dashboard';
import {
    PanelShell,
    StatCard,
    StatusPill,
    formatDateTime,
} from '@/components/admin/AdminDashboardPrimitives';
import { adminCopy } from '@/lib/app-copy';
import {
    adminCardClassName,
    adminFieldClassName,
    adminListItemClassName,
    emptyStateClassName,
    fetchJson,
    createLastUpdatedLabel,
} from '../_shared';

export default function AdminUsersPage() {
    const [userQuery, setUserQuery] = useState('');
    const [userResults, setUserResults] = useState<AdminUserSearchResult[]>([]);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [investigation, setInvestigation] = useState<AdminUserInvestigation | null>(null);
    const [investigationLoading, setInvestigationLoading] = useState(false);
    const [investigationError, setInvestigationError] = useState<string | null>(null);
    const [investigationLoadedAt, setInvestigationLoadedAt] = useState<string | null>(null);
    const [investigationReloadKey, setInvestigationReloadKey] = useState(0);
    const [actionPending, setActionPending] = useState<string | null>(null);
    const [messageDraft, setMessageDraft] = useState('');
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationBody, setNotificationBody] = useState('');

    const selectedUserName =
        investigation?.user.displayName ??
        userResults.find((entry) => entry.id === selectedUserId)?.displayName ??
        'this user';

    const loadUsers = useCallback(async (query: string) => {
        setUserSearchLoading(true);

        try {
            const payload = await fetchJson<AdminUserSearchResult[]>(
                `/api/admin/users${query.trim() ? `?query=${encodeURIComponent(query.trim())}` : ''}`
            );
            setUserResults(payload);

            if (payload.length === 0) {
                setSelectedUserId(null);
                setInvestigation(null);
                return;
            }

            setSelectedUserId((current) => {
                if (!current || !payload.some((entry) => entry.id === current)) {
                    return payload[0].id;
                }
                return current;
            });
        } catch (loadError) {
            console.error('Error searching admin users:', loadError);
            toast.error(
                loadError instanceof Error ? loadError.message : 'Failed to search users.'
            );
        } finally {
            setUserSearchLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadUsers('');
    }, [loadUsers]);

    useEffect(() => {
        if (!selectedUserId) {
            setInvestigation(null);
            return;
        }

        const loadInvestigation = async () => {
            setInvestigationLoading(true);
            setInvestigationError(null);

            try {
                const payload = await fetchJson<AdminUserInvestigation>(
                    `/api/admin/users/${selectedUserId}`
                );
                setInvestigation(payload);
                setInvestigationLoadedAt(new Date().toISOString());
            } catch (loadError) {
                console.error('Error loading admin investigation:', loadError);
                setInvestigationError(
                    loadError instanceof Error ? loadError.message : 'Failed to load user investigation.'
                );
            } finally {
                setInvestigationLoading(false);
            }
        };

        void loadInvestigation();
    }, [investigationReloadKey, selectedUserId]);

    const runUserAction = async (
        userId: string,
        payload: { action: string } & Record<string, unknown>,
        confirmationMessage: string,
        successMessage: string
    ) => {
        if (!window.confirm(confirmationMessage)) {
            return;
        }

        setActionPending(payload.action);

        try {
            await fetchJson(`/api/admin/users/${userId}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (payload.action === 'send-message') {
                setMessageDraft('');
            }

            if (payload.action === 'send-notification') {
                setNotificationTitle('');
                setNotificationBody('');
            }

            toast.success(successMessage);
            await loadUsers(userQuery);
            setInvestigationReloadKey((current) => current + 1);
        } catch (actionError) {
            console.error('Error performing admin action:', actionError);
            toast.error(
                actionError instanceof Error ? actionError.message : 'Failed to perform admin action.'
            );
        } finally {
            setActionPending(null);
        }
    };

    return (
        <div className="space-y-8 text-foreground">
            {/* Header */}
            <div className="rounded-3xl border border-line/30 bg-surface/80 p-8 shadow-2xl shadow-black/10">
                <p className="text-xs uppercase tracking-[0.35em] text-brand">{adminCopy.dashboard.eyebrow}</p>
                <h1 className="mt-3 text-4xl font-semibold">{adminCopy.layout.investigation}</h1>
                <p className="mt-2 text-sm text-faint">{adminCopy.dashboard.investigationSubtitle}</p>
            </div>

            <PanelShell
                icon={<FileSearch className="text-info" />}
                title={adminCopy.dashboard.investigationTitle}
                description={adminCopy.dashboard.investigationSubtitle}
                action={
                    <div className="text-sm text-faint">
                        {createLastUpdatedLabel(investigationLoadedAt)}
                    </div>
                }
            >
                {/* Search bar */}
                <form
                    className="mb-4 flex flex-col gap-3 lg:flex-row"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void loadUsers(userQuery);
                    }}
                >
                    <input
                        value={userQuery}
                        onChange={(event) => setUserQuery(event.target.value)}
                        placeholder={adminCopy.dashboard.searchUsersPlaceholder}
                        className={adminFieldClassName}
                    />
                    <button
                        type="submit"
                        className="rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={userSearchLoading}
                    >
                        {adminCopy.dashboard.searchUsersAction}
                    </button>
                </form>

                <div className="grid gap-4 xl:grid-cols-[260px,minmax(0,1fr)]">
                    {/* User list */}
                    <div className="space-y-3">
                        {userSearchLoading ? (
                            <div className={emptyStateClassName}>Loading users...</div>
                        ) : null}
                        {!userSearchLoading && userResults.length === 0 ? (
                            <div className={emptyStateClassName}>{adminCopy.dashboard.searchUsersEmpty}</div>
                        ) : null}
                        {userResults.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => setSelectedUserId(user.id)}
                                className={`w-full rounded-2xl border p-4 text-left transition ${selectedUserId === user.id ? 'border-brand/40 bg-brand/10' : 'border-line/30 bg-surface-secondary/35 hover:border-line/60'}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="font-medium text-foreground">{user.displayName}</div>
                                    {user.flaggedForFollowUp ? <StatusPill status="watch" /> : null}
                                </div>
                                <div className="mt-1 text-sm text-muted">{user.location ?? 'Location unavailable'}</div>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-faint">
                                    <span>{user.openReports} open reports</span>
                                    <span>{user.messageCount} messages</span>
                                    <span>{user.savedSearchCount} saved searches</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Investigation panel */}
                    <div>
                        {investigationLoading ? (
                            <div className={emptyStateClassName}>Loading investigation...</div>
                        ) : null}
                        {!investigationLoading && investigationError ? (
                            <div className={emptyStateClassName}>{investigationError}</div>
                        ) : null}
                        {!investigationLoading && !investigationError && !investigation ? (
                            <div className={emptyStateClassName}>{adminCopy.dashboard.investigationEmpty}</div>
                        ) : null}

                        {investigation ? (
                            <div className="space-y-4">
                                {/* User header */}
                                <div className={adminCardClassName}>
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-2xl font-semibold">{investigation.user.displayName}</h3>
                                                {investigation.user.verified ? <StatusPill status="approved" /> : null}
                                                {investigation.user.flaggedForFollowUp ? <StatusPill status="watch" /> : null}
                                            </div>
                                            <div className="mt-2 text-sm text-muted">
                                                {investigation.user.location ?? 'Location unavailable'}
                                            </div>
                                            <div className="mt-2 text-sm text-muted">
                                                Joined {formatDateTime(investigation.user.joinedAt)}
                                            </div>
                                            <div className="mt-3 text-sm text-muted">
                                                {investigation.user.aboutMe ?? 'No profile bio provided.'}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                disabled={actionPending === 'toggle-verification'}
                                                onClick={() =>
                                                    void runUserAction(
                                                        investigation.user.id,
                                                        {
                                                            action: 'toggle-verification',
                                                            verified: !investigation.user.verified,
                                                        },
                                                        investigation.user.verified
                                                            ? adminCopy.dashboard.confirmations.removeVerified(selectedUserName)
                                                            : adminCopy.dashboard.confirmations.markVerified(selectedUserName),
                                                        adminCopy.dashboard.actionMessages.verificationToggled
                                                    )
                                                }
                                                className="rounded-full border border-info/30 px-3 py-1.5 text-sm text-info-soft hover:bg-info/10 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {investigation.user.verified
                                                    ? adminCopy.dashboard.toggleUnverified
                                                    : adminCopy.dashboard.toggleVerified}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={actionPending === 'toggle-follow-up'}
                                                onClick={() =>
                                                    void runUserAction(
                                                        investigation.user.id,
                                                        {
                                                            action: 'toggle-follow-up',
                                                            followUp: !investigation.user.flaggedForFollowUp,
                                                        },
                                                        investigation.user.flaggedForFollowUp
                                                            ? adminCopy.dashboard.confirmations.clearFollowUp(selectedUserName)
                                                            : adminCopy.dashboard.confirmations.markFollowUp(selectedUserName),
                                                        adminCopy.dashboard.actionMessages.followUpUpdated
                                                    )
                                                }
                                                className="rounded-full border border-warning/30 px-3 py-1.5 text-sm text-warning-soft hover:bg-warning/10 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {investigation.user.flaggedForFollowUp
                                                    ? adminCopy.dashboard.clearFollowUp
                                                    : adminCopy.dashboard.markFollowUp}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <StatCard title="Open Reports" value={investigation.user.openReports} hint="Reports still awaiting resolution" />
                                    <StatCard title="Messages" value={investigation.user.messageCount} hint="Total messages involving this user" />
                                    <StatCard title="Blocked Users" value={investigation.user.blockedCount} hint="Users blocked from this account" />
                                    <StatCard title="Saved Searches" value={investigation.user.savedSearchCount} hint="Saved discovery configurations" />
                                </div>

                                {/* Profile + verification history */}
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className={adminCardClassName}>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-faint">
                                            {adminCopy.dashboard.profileSnapshotTitle}
                                        </h4>
                                        <div className="mt-3 space-y-2 text-sm text-muted">
                                            <div>Gender: {investigation.user.gender ?? 'Not provided'}</div>
                                            <div>Age: {investigation.user.age ?? 'Hidden or unavailable'}</div>
                                            <div>Private profile: {investigation.user.isPrivate ? 'Yes' : 'No'}</div>
                                            <div>Passions: {investigation.user.passions.length ? investigation.user.passions.join(', ') : 'None saved'}</div>
                                            <div>Languages: {investigation.user.languages.length ? investigation.user.languages.join(', ') : 'None saved'}</div>
                                        </div>
                                    </div>
                                    <div className={adminCardClassName}>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-faint">
                                            {adminCopy.dashboard.verificationHistoryTitle}
                                        </h4>
                                        {investigation.verificationHistory.length === 0 ? (
                                            <div className="mt-3 text-sm text-faint">No verification history.</div>
                                        ) : (
                                            <div className="mt-3 space-y-2">
                                                {investigation.verificationHistory.map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        className="flex items-center justify-between rounded-xl bg-surface/70 px-3 py-2 text-sm text-muted"
                                                    >
                                                        <span>{formatDateTime(entry.createdAt)}</span>
                                                        <StatusPill status={entry.status} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Saved searches + blocked users */}
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className={adminCardClassName}>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-faint">
                                            {adminCopy.dashboard.savedSearchesTitle}
                                        </h4>
                                        {investigation.savedSearches.length === 0 ? (
                                            <div className="mt-3 text-sm text-faint">No saved searches.</div>
                                        ) : (
                                            <div className="mt-3 space-y-2">
                                                {investigation.savedSearches.map((search) => (
                                                    <div key={search.id} className={adminListItemClassName}>
                                                        <div className="font-medium text-foreground">{search.name}</div>
                                                        <div className="mt-1 text-muted">
                                                            {search.query ?? 'No keyword query'} |{' '}
                                                            {search.location ?? 'Any location'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className={adminCardClassName}>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-faint">
                                            {adminCopy.dashboard.blockedUsersTitle}
                                        </h4>
                                        {investigation.blockedUsers.length === 0 ? (
                                            <div className="mt-3 text-sm text-faint">No blocked users.</div>
                                        ) : (
                                            <div className="mt-3 space-y-2">
                                                {investigation.blockedUsers.map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        className="flex items-center justify-between rounded-xl bg-surface/70 px-3 py-2 text-sm text-muted"
                                                    >
                                                        <span>
                                                            {entry.profile?.displayName ??
                                                                entry.blockedId ??
                                                                'Unknown user'}
                                                        </span>
                                                        <span className="text-faint">{formatDateTime(entry.createdAt)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Messages + notifications */}
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className={adminCardClassName}>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-faint">
                                            {adminCopy.dashboard.messagesTitle}
                                        </h4>
                                        {investigation.messages.length === 0 ? (
                                            <div className="mt-3 text-sm text-faint">No messages found.</div>
                                        ) : (
                                            <div className="mt-3 space-y-2">
                                                {investigation.messages.slice(0, 6).map((message) => (
                                                    <div key={message.id} className={adminListItemClassName}>
                                                        <div className="flex items-center justify-between gap-3">
                                                            <StatusPill
                                                                status={message.direction === 'sent' ? 'approved' : 'watch'}
                                                            />
                                                            <span className="text-xs uppercase tracking-[0.2em] text-faint">
                                                                {formatDateTime(message.createdAt)}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 text-foreground">{message.content}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className={adminCardClassName}>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-faint">
                                            {adminCopy.dashboard.notificationsTitle}
                                        </h4>
                                        {investigation.notifications.length === 0 ? (
                                            <div className="mt-3 text-sm text-faint">No notifications sent to this user.</div>
                                        ) : (
                                            <div className="mt-3 space-y-2">
                                                {investigation.notifications.slice(0, 6).map((notification) => (
                                                    <div key={notification.id} className={adminListItemClassName}>
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="font-medium text-foreground">
                                                                {notification.title ?? 'Notification'}
                                                            </div>
                                                            <span className="text-xs uppercase tracking-[0.2em] text-faint">
                                                                {formatDateTime(notification.createdAt)}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2">{notification.body ?? 'No body provided.'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reports against / filed */}
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className={adminCardClassName}>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-faint">
                                            {adminCopy.dashboard.reportsAgainstTitle}
                                        </h4>
                                        {investigation.reportsAgainst.length === 0 ? (
                                            <div className="mt-3 text-sm text-faint">No reports against this user.</div>
                                        ) : (
                                            <div className="mt-3 space-y-2">
                                                {investigation.reportsAgainst.slice(0, 4).map((report) => (
                                                    <div key={report.id} className={adminListItemClassName}>
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="font-medium text-foreground">{report.reason}</div>
                                                            <StatusPill status={report.status} />
                                                        </div>
                                                        <div className="mt-2 text-muted">
                                                            Reporter: {report.reporter?.displayName ?? 'Unknown user'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className={adminCardClassName}>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-faint">
                                            {adminCopy.dashboard.reportsFiledTitle}
                                        </h4>
                                        {investigation.reportsFiled.length === 0 ? (
                                            <div className="mt-3 text-sm text-faint">No reports filed by this user.</div>
                                        ) : (
                                            <div className="mt-3 space-y-2">
                                                {investigation.reportsFiled.slice(0, 4).map((report) => (
                                                    <div key={report.id} className={adminListItemClassName}>
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="font-medium text-foreground">{report.reason}</div>
                                                            <StatusPill status={report.status} />
                                                        </div>
                                                        <div className="mt-2 text-muted">
                                                            Reported user: {report.reported?.displayName ?? 'Unknown user'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Send message + notification */}
                                <div className="grid gap-4 xl:grid-cols-2">
                                    <div className={adminCardClassName}>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-faint">
                                            {adminCopy.dashboard.sendMessageTitle}
                                        </h4>
                                        <textarea
                                            value={messageDraft}
                                            onChange={(event) => setMessageDraft(event.target.value)}
                                            placeholder={adminCopy.dashboard.messagePlaceholder}
                                            className={`mt-3 min-h-[140px] ${adminFieldClassName}`}
                                        />
                                        <button
                                            type="button"
                                            disabled={!messageDraft.trim() || actionPending === 'send-message'}
                                            onClick={() =>
                                                void runUserAction(
                                                    investigation.user.id,
                                                    { action: 'send-message', content: messageDraft.trim() },
                                                    adminCopy.dashboard.confirmations.sendMessage(selectedUserName),
                                                    adminCopy.dashboard.actionMessages.messageSent
                                                )
                                            }
                                            className="mt-3 rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {adminCopy.dashboard.sendMessageAction}
                                        </button>
                                    </div>
                                    <div className={adminCardClassName}>
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-faint">
                                            {adminCopy.dashboard.sendNotificationAction}
                                        </h4>
                                        <label className="mt-3 block text-sm text-muted">
                                            <span>{adminCopy.dashboard.notificationTitleLabel}</span>
                                            <input
                                                value={notificationTitle}
                                                onChange={(event) => setNotificationTitle(event.target.value)}
                                                className={`mt-2 ${adminFieldClassName}`}
                                            />
                                        </label>
                                        <label className="mt-3 block text-sm text-muted">
                                            <span>{adminCopy.dashboard.notificationBodyLabel}</span>
                                            <textarea
                                                value={notificationBody}
                                                onChange={(event) => setNotificationBody(event.target.value)}
                                                placeholder={adminCopy.dashboard.notificationBodyPlaceholder}
                                                className={`mt-2 min-h-[100px] ${adminFieldClassName}`}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            disabled={
                                                !notificationTitle.trim() ||
                                                !notificationBody.trim() ||
                                                actionPending === 'send-notification'
                                            }
                                            onClick={() =>
                                                void runUserAction(
                                                    investigation.user.id,
                                                    {
                                                        action: 'send-notification',
                                                        title: notificationTitle.trim(),
                                                        content: notificationBody.trim(),
                                                        url: '/notifications',
                                                    },
                                                    adminCopy.dashboard.confirmations.sendNotification(selectedUserName),
                                                    adminCopy.dashboard.actionMessages.notificationSent
                                                )
                                            }
                                            className="mt-3 rounded-xl border border-info/40 px-4 py-3 text-sm font-medium text-info-soft hover:bg-info/10 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {adminCopy.dashboard.sendNotificationAction}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </PanelShell>
        </div>
    );
}
