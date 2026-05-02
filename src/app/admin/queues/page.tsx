'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { AdminDashboardSnapshot, AdminSystemControls } from '@/lib/admin-dashboard';
import { DEFAULT_ADMIN_SYSTEM_CONTROLS } from '@/lib/admin-dashboard';
import {
    PanelShell,
    StatCard,
    StatusPill,
    formatDateTime,
} from '@/components/admin/AdminDashboardPrimitives';
import { adminCopy } from '@/lib/app-copy';
import {
    adminCardClassName,
    emptyStateClassName,
    fetchJson,
    createLastUpdatedLabel,
} from '../_shared';

export default function AdminQueuesPage() {
    const [dashboard, setDashboard] = useState<AdminDashboardSnapshot | null>(null);
    const [settings, setSettings] = useState<AdminSystemControls>(DEFAULT_ADMIN_SYSTEM_CONTROLS);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [queuePendingKey, setQueuePendingKey] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setError(null);
                const payload = await fetchJson<AdminDashboardSnapshot>('/api/admin/dashboard');
                setDashboard(payload);
                setSettings(payload.systemControls);
            } catch (loadError) {
                console.error('Error loading queues:', loadError);
                setError(loadError instanceof Error ? loadError.message : 'Failed to fetch queues.');
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        };

        void loadDashboard();
    }, [reloadKey]);

    const refreshDashboard = () => {
        setRefreshing(true);
        setReloadKey((current) => current + 1);
    };

    const handleReportUpdate = async (reportId: string, status: 'reviewed' | 'resolved') => {
        const confirmationMessage =
            status === 'resolved'
                ? adminCopy.dashboard.confirmations.resolveReport
                : adminCopy.dashboard.confirmations.reviewReport;

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        setQueuePendingKey(`report-${reportId}`);

        try {
            await fetchJson(`/api/admin/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            const current = dashboard as AdminDashboardSnapshot;
            setDashboard({
                ...current,
                queues: {
                    ...current.queues,
                    reports: current.queues.reports.filter((r) => r.id !== reportId),
                },
                quickActions: {
                    ...current.quickActions,
                    pendingReports: Math.max(current.quickActions.pendingReports - 1, 0),
                    totalQueueItems: Math.max(current.quickActions.totalQueueItems - 1, 0),
                },
            });
            toast.success(adminCopy.dashboard.actionMessages.reportUpdated);
            refreshDashboard();
        } catch (updateError) {
            console.error('Error updating report:', updateError);
            toast.error(updateError instanceof Error ? updateError.message : 'Failed to update report.');
        } finally {
            setQueuePendingKey(null);
        }
    };

    const handleVerificationUpdate = async (
        requestId: string,
        userId: string,
        status: 'approved' | 'rejected'
    ) => {
        const confirmationMessage =
            status === 'approved'
                ? adminCopy.dashboard.confirmations.approveVerification
                : adminCopy.dashboard.confirmations.rejectVerification;

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        setQueuePendingKey(`verification-${requestId}`);

        try {
            await fetchJson(`/api/admin/verification/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, userId }),
            });

            const current = dashboard as AdminDashboardSnapshot;
            setDashboard({
                ...current,
                queues: {
                    ...current.queues,
                    verificationRequests: current.queues.verificationRequests.filter(
                        (r) => r.id !== requestId
                    ),
                },
                quickActions: {
                    ...current.quickActions,
                    pendingVerificationRequests: Math.max(
                        current.quickActions.pendingVerificationRequests - 1,
                        0
                    ),
                    totalQueueItems: Math.max(current.quickActions.totalQueueItems - 1, 0),
                },
            });
            toast.success(adminCopy.dashboard.actionMessages.verificationUpdated);
            refreshDashboard();
        } catch (updateError) {
            console.error('Error updating verification request:', updateError);
            toast.error(
                updateError instanceof Error ? updateError.message : 'Failed to update verification request.'
            );
        } finally {
            setQueuePendingKey(null);
        }
    };

    if (loading) {
        return <div className="text-foreground">Loading queues...</div>;
    }

    if (error || !dashboard) {
        return <div className="text-danger-soft">{error ?? 'Failed to load queues.'}</div>;
    }

    return (
        <div className="space-y-8 text-foreground">
            {/* Header */}
            <div className="rounded-3xl border border-line/30 bg-surface/80 p-8 shadow-2xl shadow-black/10">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-brand">{adminCopy.dashboard.eyebrow}</p>
                        <h1 className="mt-3 text-4xl font-semibold">{adminCopy.layout.queues}</h1>
                        <p className="mt-2 text-sm text-faint">{createLastUpdatedLabel(dashboard.lastUpdatedAt)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={refreshDashboard}
                        className="inline-flex items-center gap-2 self-start rounded-full bg-surface-secondary/55 px-4 py-2 text-sm text-muted hover:bg-surface-secondary/80 hover:text-foreground xl:self-auto"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {adminCopy.dashboard.refresh}
                    </button>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <StatCard
                        title={adminCopy.dashboard.pendingReportsLabel}
                        value={dashboard.quickActions.pendingReports}
                        hint="Pending moderation decisions"
                    />
                    <StatCard
                        title={adminCopy.dashboard.pendingVerificationLabel}
                        value={dashboard.quickActions.pendingVerificationRequests}
                        hint="Profiles waiting for review"
                    />
                </div>
            </div>

            <PanelShell
                icon={<AlertTriangle className="text-danger" />}
                title={adminCopy.dashboard.queuesTitle}
                description={adminCopy.dashboard.queuesSubtitle}
                action={<div className="text-sm text-faint">{createLastUpdatedLabel(dashboard.lastUpdatedAt)}</div>}
            >
                {settings.moderationHold ? (
                    <div className="mb-4 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning-soft">
                        <div className="font-medium text-warning">{adminCopy.dashboard.moderationHoldLabel}</div>
                        <div className="mt-1">{adminCopy.dashboard.moderationHoldDescription}</div>
                    </div>
                ) : null}

                <div className="space-y-8">
                    {/* Reports */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{adminCopy.dashboard.reportsTitle}</h3>
                            <Link href="/admin/reports" className="text-sm text-brand hover:text-brand-soft">
                                {adminCopy.dashboard.viewAllReports}
                            </Link>
                        </div>
                        {dashboard.queues.reports.length === 0 ? (
                            <div className={emptyStateClassName}>{adminCopy.dashboard.emptyReports}</div>
                        ) : (
                            <div className="space-y-3">
                                {dashboard.queues.reports.map((report) => (
                                    <div key={report.id} className={adminCardClassName}>
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium text-foreground">
                                                        {report.reported?.displayName ?? 'Unknown user'}
                                                    </div>
                                                    <StatusPill status={report.status} />
                                                </div>
                                                <div className="mt-1 text-sm text-muted">
                                                    Reported by {report.reporter?.displayName ?? 'Unknown user'}
                                                </div>
                                                <div className="mt-2 text-sm text-muted">{report.reason}</div>
                                                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-faint">
                                                    {formatDateTime(report.createdAt)}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        settings.moderationHold ||
                                                        queuePendingKey === `report-${report.id}`
                                                    }
                                                    onClick={() => void handleReportUpdate(report.id, 'reviewed')}
                                                    className="rounded-full border border-info/30 px-3 py-1.5 text-sm text-info-soft hover:bg-info/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {adminCopy.dashboard.review}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={
                                                        settings.moderationHold ||
                                                        queuePendingKey === `report-${report.id}`
                                                    }
                                                    onClick={() => void handleReportUpdate(report.id, 'resolved')}
                                                    className="rounded-full border border-approval/30 px-3 py-1.5 text-sm text-approval-soft hover:bg-approval/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {adminCopy.dashboard.resolve}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Verification */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{adminCopy.dashboard.verificationQueueTitle}</h3>
                            <Link href="/admin/verification" className="text-sm text-brand hover:text-brand-soft">
                                {adminCopy.dashboard.viewAllVerification}
                            </Link>
                        </div>
                        {dashboard.queues.verificationRequests.length === 0 ? (
                            <div className={emptyStateClassName}>{adminCopy.dashboard.emptyVerification}</div>
                        ) : (
                            <div className="space-y-3">
                                {dashboard.queues.verificationRequests.map((request) => (
                                    <div key={request.id} className={adminCardClassName}>
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium text-foreground">
                                                        {request.profile?.displayName ?? request.userId}
                                                    </div>
                                                    <StatusPill status={request.status} />
                                                </div>
                                                <div className="mt-1 text-sm text-muted">
                                                    {request.profile?.location ?? 'Location unavailable'}
                                                </div>
                                                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-faint">
                                                    {formatDateTime(request.createdAt)}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        settings.moderationHold ||
                                                        queuePendingKey === `verification-${request.id}`
                                                    }
                                                    onClick={() =>
                                                        void handleVerificationUpdate(
                                                            request.id,
                                                            request.userId,
                                                            'approved'
                                                        )
                                                    }
                                                    className="rounded-full border border-approval/30 px-3 py-1.5 text-sm text-approval-soft hover:bg-approval/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {adminCopy.dashboard.approve}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={
                                                        settings.moderationHold ||
                                                        queuePendingKey === `verification-${request.id}`
                                                    }
                                                    onClick={() =>
                                                        void handleVerificationUpdate(
                                                            request.id,
                                                            request.userId,
                                                            'rejected'
                                                        )
                                                    }
                                                    className="rounded-full border border-danger/30 px-3 py-1.5 text-sm text-danger-soft hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {adminCopy.dashboard.reject}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PanelShell>
        </div>
    );
}
