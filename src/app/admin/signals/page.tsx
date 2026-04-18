'use client';

import { useEffect, useState } from 'react';
import { Bell, MessageSquare, RefreshCw, Search, Sparkles, Users } from 'lucide-react';
import type { AdminDashboardSnapshot } from '@/lib/admin-dashboard';
import {
    Leaderboard,
    PanelShell,
    StatCard,
    TrendChart,
    formatEventName,
    formatPercent,
} from '@/components/admin/AdminDashboardPrimitives';
import { adminCopy } from '@/lib/app-copy';
import {
    adminCardClassName,
    adminFieldClassName,
    adminSelectClassName,
    buildAnalyticsUrl,
    createLastUpdatedLabel,
    fetchJson,
} from '../_shared';

type RangeOption = { label: string; value: number | null };

const RANGE_OPTIONS: RangeOption[] = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
    { label: 'All', value: null },
];

export default function AdminSignalsPage() {
    const [selectedRange, setSelectedRange] = useState<number | null>(30);
    const [selectedEventType, setSelectedEventType] = useState('');
    const [selectedPath, setSelectedPath] = useState('');
    const [dashboard, setDashboard] = useState<AdminDashboardSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [eventFilter, setEventFilter] = useState('');

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setError(null);
                const payload = await fetchJson<AdminDashboardSnapshot>(
                    buildAnalyticsUrl(selectedRange, selectedEventType, selectedPath)
                );
                setDashboard(payload);
            } catch (loadError) {
                console.error('Error loading signals:', loadError);
                setError(
                    loadError instanceof Error ? loadError.message : 'Failed to fetch analytics signals.'
                );
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
        return <div className="text-foreground">Loading analytics signals...</div>;
    }

    if (error || !dashboard) {
        return <div className="text-danger-soft">{error ?? 'Failed to load signals.'}</div>;
    }

    const filteredRecentEvents = dashboard.analytics.recentEvents.filter((event) => {
        const normalizedFilter = eventFilter.trim().toLowerCase();

        if (!normalizedFilter) {
            return true;
        }

        return [event.eventName, event.path ?? '', JSON.stringify(event.properties)].some((value) =>
            value.toLowerCase().includes(normalizedFilter)
        );
    });

    return (
        <div className="space-y-8 text-foreground">
            {/* Header with range + filter controls */}
            <div className="rounded-3xl border border-line/30 bg-surface/80 p-8 shadow-2xl shadow-black/10">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-brand">{adminCopy.dashboard.eyebrow}</p>
                        <h1 className="mt-3 text-4xl font-semibold">{adminCopy.layout.signals}</h1>
                        <p className="mt-2 text-sm text-faint">
                            {createLastUpdatedLabel(dashboard.lastUpdatedAt)}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 xl:items-end">
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
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 text-sm text-muted">
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
                                            {formatEventName(eventName)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-muted">
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
                </div>
            </div>

            {/* Search quality */}
            <div className="grid gap-6 xl:grid-cols-3">
                <PanelShell
                    className="xl:col-span-2"
                    icon={<Search className="text-info" />}
                    title="Search Quality"
                    description="What users are searching for, what returns results, and where intent is concentrating."
                >
                    <div className="grid gap-4 md:grid-cols-3">
                        <StatCard
                            title="Searches"
                            value={dashboard.analytics.search.submitted}
                            hint={`${dashboard.analytics.search.resultsLoaded} result loads tracked`}
                        />
                        <StatCard
                            title="Zero Results"
                            value={dashboard.analytics.search.zeroResults}
                            hint={`${dashboard.analytics.search.resultClicks} result clicks recorded`}
                        />
                        <StatCard
                            title="Avg Results"
                            value={dashboard.analytics.search.averageResultsPerSearch}
                            hint={`${dashboard.analytics.search.savedSearches} saved searches total`}
                        />
                    </div>
                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <Leaderboard title="Top Queries" items={dashboard.analytics.search.topQueries} empty="No search queries tracked yet." />
                        <Leaderboard title="Top Search Passions" items={dashboard.analytics.search.topPassions} empty="No passion filters tracked yet." />
                        <Leaderboard title="Top Search Locations" items={dashboard.analytics.search.topLocations} empty="No locations tracked yet." />
                        <Leaderboard title="Top Search Languages" items={dashboard.analytics.search.topLanguages} empty="No language filters tracked yet." />
                    </div>
                </PanelShell>

                <PanelShell
                    icon={<Bell className="text-warning" />}
                    title="Notifications"
                    description="Push adoption and notification interaction health."
                >
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <StatCard
                            title="Push Subscriptions"
                            value={dashboard.analytics.notifications.activePushSubscriptions}
                            hint={`${dashboard.analytics.notifications.total} notifications stored`}
                        />
                        <StatCard
                            title="Push Enabled"
                            value={dashboard.analytics.notifications.pushEnabled}
                            hint={`${dashboard.analytics.notifications.pushDisabled} disable events tracked`}
                        />
                        <StatCard
                            title="Notification Opens"
                            value={dashboard.analytics.notifications.notificationOpened}
                            hint={`${dashboard.analytics.notifications.unread} unread notifications remain`}
                        />
                    </div>
                </PanelShell>
            </div>

            {/* Rates */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Search CTR"
                    value={formatPercent(dashboard.analytics.rates.searchClickThroughRate)}
                    hint={`${formatPercent(dashboard.analytics.rates.zeroResultRate)} zero-result rate`}
                />
                <StatCard
                    title="Message Completion"
                    value={formatPercent(dashboard.analytics.rates.messageCompletionRate)}
                    hint={`${formatPercent(dashboard.analytics.rates.favoritesToMessageRate)} favorite-to-message rate`}
                />
                <StatCard
                    title="Peak Day"
                    value={dashboard.analytics.activity.peakDay?.label ?? 'N/A'}
                    hint={
                        dashboard.analytics.activity.peakDay
                            ? `${dashboard.analytics.activity.peakDay.totalEvents} total events`
                            : 'No trend data yet'
                    }
                />
            </div>

            {/* Trend */}
            <PanelShell
                icon={<Users className="text-info" />}
                title="Recent Trend"
                description={`Event volume over the last ${dashboard.analytics.activity.trendWindowDays} days for the current filter.`}
            >
                <TrendChart items={dashboard.analytics.activity.dailySeries} />
            </PanelShell>

            {/* Content + event leaderboard + recent events */}
            <div className="grid gap-6 xl:grid-cols-3">
                <PanelShell
                    icon={<Sparkles className="text-discovery" />}
                    title="Content Signals"
                    description="What content and routes are getting the most attention."
                >
                    <div className="space-y-4">
                        <Leaderboard title="Top Paths" items={dashboard.analytics.content.topPaths.slice(0, 5)} empty="No path analytics yet." />
                        <Leaderboard title="Top Viewed Profiles" items={dashboard.analytics.content.topViewedProfiles} empty="No profile views tracked yet." />
                        <Leaderboard title="Top Languages" items={dashboard.analytics.content.topLanguages} empty="No language signals yet." />
                    </div>
                </PanelShell>

                <PanelShell
                    icon={<Users className="text-info" />}
                    title="Event Leaderboard"
                    description="Which named analytics events are firing most often."
                >
                    <Leaderboard
                        title="Top Event Names"
                        items={dashboard.analytics.eventLeaderboard}
                        empty="No analytics events have been stored yet."
                    />
                </PanelShell>

                <PanelShell
                    icon={<MessageSquare className="text-connection" />}
                    title="Recent Events"
                    description="Latest tracked events with paths and the first few captured properties."
                >
                    <input
                        value={eventFilter}
                        onChange={(event) => setEventFilter(event.target.value)}
                        placeholder={adminCopy.dashboard.recentEventsFilterPlaceholder}
                        className={`mb-4 ${adminFieldClassName}`}
                    />
                    {filteredRecentEvents.length === 0 ? (
                        <p className="text-sm text-faint">{adminCopy.dashboard.recentEventsEmpty}</p>
                    ) : (
                        <div className="space-y-3">
                            {filteredRecentEvents.map((event) => (
                                <div
                                    key={`${event.id}-${event.createdAt}`}
                                    className={adminCardClassName}
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="font-medium text-foreground">
                                                {formatEventName(event.eventName)}
                                            </div>
                                            <div className="mt-1 text-sm text-muted">
                                                {event.path ?? 'No path recorded'}
                                            </div>
                                        </div>
                                        <div className="text-xs uppercase tracking-[0.2em] text-faint">
                                            {event.createdAt
                                                ? new Date(event.createdAt).toLocaleString()
                                                : 'No date'}
                                        </div>
                                    </div>
                                    {Object.keys(event.properties).length > 0 ? (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {Object.entries(event.properties)
                                                .slice(0, 4)
                                                .map(([key, value]) => (
                                                    <span
                                                        key={key}
                                                        className="rounded-full bg-surface/70 px-3 py-1 text-xs text-muted"
                                                    >
                                                        {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
                                                    </span>
                                                ))}
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </PanelShell>
            </div>
        </div>
    );
}
