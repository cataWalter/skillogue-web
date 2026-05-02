'use client';

import { useEffect, useState } from 'react';
import { Bell, RefreshCw, Users } from 'lucide-react';
import type { AdminDashboardSnapshot } from '@/lib/admin-dashboard';
import {
    PanelShell,
    StatCard,
} from '@/components/admin/AdminDashboardPrimitives';
import { adminCopy } from '@/lib/app-copy';
import {
    createLastUpdatedLabel,
    fetchJson,
} from '../_shared';

export default function AdminSignalsPage() {
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
                console.error('Error loading signals:', loadError);
                setError(loadError instanceof Error ? loadError.message : 'Failed to fetch signals.');
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
        return <div className="text-foreground">Loading platform signals...</div>;
    }

    if (error || !dashboard) {
        return <div className="text-danger-soft">{error ?? 'Failed to load signals.'}</div>;
    }

    return (
        <div className="space-y-8 text-foreground">
            {/* Header */}
            <div className="rounded-3xl border border-line/30 bg-surface/80 p-8 shadow-2xl shadow-black/10">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-brand">{adminCopy.dashboard.eyebrow}</p>
                        <h1 className="mt-3 text-4xl font-semibold">{adminCopy.layout.signals}</h1>
                        <p className="mt-2 text-sm text-faint">
                            {createLastUpdatedLabel(dashboard.lastUpdatedAt)}
                        </p>
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
            </div>

            {/* Platform counts */}
            <PanelShell
                icon={<Users className="text-info" />}
                title="Platform Counts"
                description="Live counts of key platform entities."
            >
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="Profiles" value={dashboard.overview.totalProfiles} hint={`${dashboard.overview.verifiedProfiles} verified`} />
                    <StatCard title="Messages" value={dashboard.overview.totalMessages} hint={`${dashboard.overview.totalFavorites} favorites`} />
                    <StatCard title="Saved Searches" value={0} hint="Stored user searches" />
                </div>
            </PanelShell>

            {/* Notifications */}
            <PanelShell
                icon={<Bell className="text-warning" />}
                title="Notifications &amp; Push"
                description="Platform notification health."
            >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard title="Push Subscriptions" value={dashboard.overview.activePushSubscriptions} hint="Active browser push subscriptions" />
                    <StatCard title="Total Notifications" value={dashboard.overview.totalNotifications} hint={`${dashboard.overview.unreadNotifications} unread`} />
                </div>
            </PanelShell>
        </div>
    );
}
