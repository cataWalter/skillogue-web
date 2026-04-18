'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    FileSearch,
    RefreshCw,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import type { AdminDashboardSnapshot } from '@/lib/admin-dashboard';
import {
    Funnel,
    HealthPanel,
    PanelShell,
    StatCard,
    formatDateTime,
    formatPercent,
    TrendChart,
} from '@/components/admin/AdminDashboardPrimitives';
import { adminCopy } from '../../lib/app-copy';
import {
    adminCardClassName,
    adminSelectClassName,
    buildAnalyticsUrl,
    createLastUpdatedLabel,
    fetchJson,
} from './_shared';

type RangeOption = {
    label: string;
    value: number | null;
};

const RANGE_OPTIONS: RangeOption[] = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
    { label: 'All', value: null },
];

export default function AdminDashboard() {
    const [selectedRange, setSelectedRange] = useState<number | null>(30);
    const [selectedEventType, setSelectedEventType] = useState('');
    const [selectedPath, setSelectedPath] = useState('');
    const [dashboard, setDashboard] = useState<AdminDashboardSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setError(null);
                const payload = await fetchJson<AdminDashboardSnapshot>(
                    buildAnalyticsUrl(selectedRange, selectedEventType, selectedPath)
                );
                setDashboard(payload);
            } catch (loadError) {
                console.error('Error loading admin overview:', loadError);
                setError(loadError instanceof Error ? loadError.message : 'Failed to fetch admin dashboard.');
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        };

        void loadDashboard();
    }, [reloadKey, selectedEventType, selectedPath, selectedRange]);

    const refreshDashboard = () => {
        setRefreshing(true);
        setReloadKey((current) => current + 1);
    };

    if (loading) {
        return <div className="text-foreground">Loading admin analytics...</div>;
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
                    <div className="flex flex-col gap-3 xl:items-end">
                        <div className="rounded-2xl border border-line/25 bg-surface-secondary/55 px-4 py-3 text-sm text-muted">
                            Last tracked event:{' '}
                            <span className="font-medium text-foreground">
                                {formatDateTime(dashboard.analytics.overview.lastEventAt)}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {RANGE_OPTIONS.map((option) => {
                                const isSelected = option.value === selectedRange;

                                return (
                                    <button
                                        key={option.label}
                                        type="button"
                                        onClick={() => {
                                            setLoading(true);
                                            setSelectedRange(option.value);
                                        }}
                                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${isSelected ? 'bg-brand text-white' : 'bg-surface-secondary/55 text-muted hover:bg-surface-secondary/80 hover:text-foreground'}`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={refreshDashboard}
                                className="inline-flex items-center gap-2 rounded-full bg-surface-secondary/55 px-3 py-1.5 text-sm text-muted hover:bg-surface-secondary/80 hover:text-foreground"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                {adminCopy.dashboard.refresh}
                            </button>
                            <a
                                href={dashboard.analytics.filters.exportUrl}
                                download="admin-analytics-export.json"
                                className="rounded-full border border-line/30 px-3 py-1.5 text-sm text-muted hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
                            >
                                {adminCopy.dashboard.export}
                            </a>
                        </div>
                    </div>
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

                {/* Analytics filters */}
                <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
                    <div className={adminCardClassName}>
                        <div className="text-xs uppercase tracking-[0.2em] text-faint">{adminCopy.dashboard.filtersTitle}</div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <label className="flex flex-col gap-2 text-sm text-muted">
                                <span>{adminCopy.dashboard.eventTypeLabel}</span>
                                <select
                                    value={selectedEventType}
                                    onChange={(event) => {
                                        setLoading(true);
                                        setSelectedEventType(event.target.value);
                                    }}
                                    className={adminSelectClassName}
                                >
                                    <option value="">{adminCopy.dashboard.allEvents}</option>
                                    {dashboard.analytics.filters.availableEventTypes.map((eventName) => (
                                        <option key={eventName} value={eventName}>
                                            {eventName}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-2 text-sm text-muted">
                                <span>{adminCopy.dashboard.pathLabel}</span>
                                <select
                                    value={selectedPath}
                                    onChange={(event) => {
                                        setLoading(true);
                                        setSelectedPath(event.target.value);
                                    }}
                                    className={adminSelectClassName}
                                >
                                    <option value="">{adminCopy.dashboard.allPaths}</option>
                                    {dashboard.analytics.filters.availablePaths.map((path) => (
                                        <option key={path} value={path}>
                                            {path}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className={`${adminCardClassName} text-sm text-muted`}>
                        Showing analytics for{' '}
                        <span className="font-medium text-foreground">{dashboard.analytics.range.label}</span>.
                        {selectedEventType ? (
                            <span className="mt-2 block">
                                Filtered to{' '}
                                <span className="font-medium text-foreground">{selectedEventType}</span>.
                            </span>
                        ) : null}
                        {selectedPath ? (
                            <span className="mt-2 block">
                                Scoped to <span className="font-medium text-foreground">{selectedPath}</span>.
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Overview stats */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Tracked Events" value={dashboard.analytics.overview.totalEvents} hint={`Captured in ${dashboard.analytics.range.label.toLowerCase()}`} />
                <StatCard title="Page Views" value={dashboard.analytics.overview.pageViews} hint={`${dashboard.analytics.overview.uniquePaths} unique paths in range`} />
                <StatCard title="Profiles" value={dashboard.analytics.overview.totalProfiles} hint={`${dashboard.analytics.overview.verifiedProfiles} verified, ${dashboard.analytics.overview.completedProfiles} complete`} />
                <StatCard title="Messages" value={dashboard.analytics.overview.totalMessages} hint={`${dashboard.analytics.overview.totalFavorites} total favorites currently stored`} />
            </div>

            {/* Funnels + Activity */}
            <div className="grid gap-6 xl:grid-cols-3">
                <PanelShell
                    className="xl:col-span-2"
                    icon={<BarChart3 className="text-brand" />}
                    title="Acquisition and Engagement"
                    description="Funnel-style checkpoints for signup, onboarding, discovery, and messaging."
                >
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Funnel title="Acquisition Funnel" items={dashboard.analytics.acquisition.funnel} />
                        <Funnel title="Search to Message Funnel" items={dashboard.analytics.engagement.funnel} />
                    </div>
                </PanelShell>

                <PanelShell
                    icon={<Activity className="text-approval" />}
                    title="Activity Cadence"
                    description="Rolling activity windows from the tracked event stream."
                >
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <StatCard title="Events Last 7d" value={dashboard.analytics.activity.eventsLast7d} hint={`${dashboard.analytics.activity.activeDaysLast7d} active tracked days`} />
                        <StatCard title="Events Last 30d" value={dashboard.analytics.activity.eventsLast30d} hint={`${dashboard.analytics.activity.activeDaysLast30d} active tracked days`} />
                    </div>
                </PanelShell>
            </div>

            {/* Trend + health */}
            <div className="grid gap-6 xl:grid-cols-3">
                <PanelShell
                    className="xl:col-span-2"
                    icon={<Activity className="text-info" />}
                    title="Recent Trend"
                    description={`Event volume over the last ${dashboard.analytics.activity.trendWindowDays} days.`}
                >
                    <TrendChart items={dashboard.analytics.activity.dailySeries} />
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <StatCard title="Peak Day" value={dashboard.analytics.activity.peakDay?.label ?? 'N/A'} hint={dashboard.analytics.activity.peakDay ? `${dashboard.analytics.activity.peakDay.totalEvents} total events` : 'No trend data yet'} />
                        <StatCard title="Search CTR" value={formatPercent(dashboard.analytics.rates.searchClickThroughRate)} hint={`${formatPercent(dashboard.analytics.rates.zeroResultRate)} zero-result rate`} />
                        <StatCard title="Message Completion" value={formatPercent(dashboard.analytics.rates.messageCompletionRate)} hint={`${formatPercent(dashboard.analytics.rates.favoritesToMessageRate)} favorite-to-message rate`} />
                    </div>
                </PanelShell>

                <HealthPanel score={dashboard.analytics.health.score} items={dashboard.analytics.health.items} />
            </div>

            {/* Quick-nav to sub-sections */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                <Link href="/admin/signals" className="group rounded-2xl border border-line/30 bg-surface-secondary/35 p-5 transition hover:border-discovery/40 hover:bg-discovery/5">
                    <Search className="mb-3 h-6 w-6 text-discovery" />
                    <div className="font-semibold text-foreground">{adminCopy.layout.signals}</div>
                    <div className="mt-1 text-sm text-faint">Search quality, content &amp; event log</div>
                </Link>
                <Link href="/admin/controls" className="group rounded-2xl border border-line/30 bg-surface-secondary/35 p-5 transition hover:border-warning/40 hover:bg-warning/5">
                    <SlidersHorizontal className="mb-3 h-6 w-6 text-warning" />
                    <div className="font-semibold text-foreground">{adminCopy.layout.controls}</div>
                    <div className="mt-1 text-sm text-faint">Banners, refresh cadence &amp; moderation hold</div>
                </Link>
            </div>
        </div>
    );
}
