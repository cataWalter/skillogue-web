'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    FileSearch,
    RefreshCw,
    SlidersHorizontal,
    Users,
} from 'lucide-react';
import type { AdminDashboardSnapshot } from '@/lib/admin-dashboard';
import {
    PanelShell,
    StatCard,
} from '@/components/admin/AdminDashboardPrimitives';
import { adminCopy } from '../../lib/app-copy';
import {
    createLastUpdatedLabel,
    fetchJson,
} from './_shared';

export default function AdminDashboard() {
    const [dashboard, setDashboard] = useState<AdminDashboardSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setError(null);
                const payload = await fetchJson<AdminDashboardSnapshot>('/api/admin/dashboard');
                setDashboard(payload);
            } catch (loadError) {
                console.error('Error loading admin dashboard:', loadError);
                setError(loadError instanceof Error ? loadError.message : 'Failed to fetch admin dashboard.');
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

    if (loading) {
        return <div className="text-foreground">Loading admin dashboard...</div>;
    }

    if (error || !dashboard) {
        return <div className="text-danger-soft">{error as string}</div>;
    }

    return (
        <div className="space-y-8 text-foreground">
            {/* Header */}
            <div className="rounded-3xl border border-line/30 bg-surface/80 p-8 shadow-2xl shadow-black/10">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-brand">{adminCopy.dashboard.eyebrow}</p>
                        <h1 className="mt-3 text-4xl font-semibold">{adminCopy.dashboard.title}</h1>
                        <p className="mt-3 max-w-3xl text-muted">{adminCopy.dashboard.subtitle}</p>
                        <div className="mt-4 text-sm text-faint">{createLastUpdatedLabel(dashboard.lastUpdatedAt)}</div>
                    </div>
                    <button
                        type="button"
                        onClick={refreshDashboard}
                        className="inline-flex items-center gap-2 rounded-full bg-surface-secondary/55 px-4 py-2 text-sm text-muted hover:bg-surface-secondary/80 hover:text-foreground"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {adminCopy.dashboard.refresh}
                    </button>
                </div>

                {/* Quick stat cards */}
                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                    <StatCard
                        title={adminCopy.dashboard.flaggedUsersLabel}
                        value={dashboard.quickActions.flaggedUsers}
                        hint="Operators asked to revisit these accounts"
                    />
                    <StatCard
                        title={adminCopy.dashboard.unreadNotificationsLabel}
                        value={dashboard.quickActions.unreadNotifications}
                        hint="Unread notifications across the platform"
                    />
                </div>
            </div>

            {/* Overview stats */}
            <PanelShell
                icon={<Users className="text-brand" />}
                title="Platform Overview"
                description="Live counts from the database."
            >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Profiles" value={dashboard.overview.totalProfiles} hint={`${dashboard.overview.verifiedProfiles} verified, ${dashboard.overview.completedProfiles} complete`} />
                    <StatCard title="Messages" value={dashboard.overview.totalMessages} hint={`${dashboard.overview.totalFavorites} total favorites`} />
                    <StatCard title="Notifications" value={dashboard.overview.totalNotifications} hint={`${dashboard.overview.unreadNotifications} unread`} />
                    <StatCard title="Push Subscriptions" value={dashboard.overview.activePushSubscriptions} hint="Active browser push subscriptions" />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <StatCard title="Total Reports" value={dashboard.overview.totalReports} hint={`${dashboard.overview.pendingReports} pending`} />
                    <StatCard title="Verification Requests" value={dashboard.overview.totalVerificationRequests} hint={`${dashboard.overview.pendingVerificationRequests} pending`} />
                </div>
            </PanelShell>

            {/* Quick-nav to sub-sections */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Link href="/admin/queues" className="group rounded-2xl border border-line/30 bg-surface-secondary/35 p-5 transition hover:border-danger/40 hover:bg-danger/5">
                    <AlertTriangle className="mb-3 h-6 w-6 text-danger group-hover:text-danger" />
                    <div className="font-semibold text-foreground">{adminCopy.layout.queues}</div>
                    <div className="mt-1 text-sm text-faint">Reports &amp; verification queues</div>
                </Link>
                <Link href="/admin/users" className="group rounded-2xl border border-line/30 bg-surface-secondary/35 p-5 transition hover:border-info/40 hover:bg-info/5">
                    <FileSearch className="mb-3 h-6 w-6 text-info" />
                    <div className="font-semibold text-foreground">{adminCopy.layout.investigation}</div>
                    <div className="mt-1 text-sm text-faint">Profile inspection &amp; operator actions</div>
                </Link>
                <Link href="/admin/controls" className="group rounded-2xl border border-line/30 bg-surface-secondary/35 p-5 transition hover:border-warning/40 hover:bg-warning/5">
                    <SlidersHorizontal className="mb-3 h-6 w-6 text-warning" />
                    <div className="font-semibold text-foreground">{adminCopy.layout.controls}</div>
                    <div className="mt-1 text-sm text-faint">Banners &amp; moderation hold</div>
                </Link>
            </div>
        </div>
    );
}
