import React from 'react';
import type { DailySeriesPoint, HealthItem, LeaderboardEntry } from '@/lib/admin-dashboard';
import { getSemanticToneClasses, type SemanticTone } from '../semanticTones';

export const formatEventName = (value: string) =>
  value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

export const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'No events yet';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const getStatusTone = (status: string): SemanticTone => {
  if (status === 'good') {
    return 'success';
  }

  if (status === 'watch' || status === 'pending') {
    return 'warning';
  }

  if (status === 'approved' || status === 'reviewed' || status === 'resolved') {
    return 'approval';
  }

  return 'danger';
};

export const PanelShell = ({
  id,
  title,
  description,
  icon,
  action,
  children,
  className = '',
}: {
  id?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section id={id} className={`rounded-3xl border border-line/30 bg-surface/80 p-6 shadow-xl shadow-black/10 ${className}`.trim()}>
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex items-center gap-3">
        <div className="text-foreground">{icon}</div>
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-sm text-faint">{description}</p>
        </div>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
    {children}
  </section>
);

export const StatusPill = ({ status }: { status: 'good' | 'watch' | 'critical' | string }) => {
  const toneClassName = getSemanticToneClasses(getStatusTone(status));

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${toneClassName.pill}`}>
      {status}
    </span>
  );
};

export const StatCard = ({
  title,
  value,
  hint,
}: {
  title: string;
  value: number | string;
  hint: string;
}) => (
  <div className="rounded-2xl border border-line/30 bg-surface/80 p-5 shadow-lg shadow-black/10">
    <div className="text-sm uppercase tracking-[0.2em] text-faint">{title}</div>
    <div className="mt-3 text-3xl font-semibold text-foreground">{value}</div>
    <div className="mt-2 text-sm text-muted">{hint}</div>
  </div>
);

export const Leaderboard = ({
  title,
  items,
  empty,
}: {
  title: string;
  items: LeaderboardEntry[];
  empty: string;
}) => (
  <div className="rounded-2xl border border-line/30 bg-surface/60 p-5">
    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">{title}</h3>
    {items.length === 0 ? (
      <p className="mt-4 text-sm text-faint">{empty}</p>
    ) : (
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl bg-surface-secondary/70 px-3 py-2">
            <span className="truncate text-sm text-foreground">{item.label}</span>
            <span className="rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand-soft">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const Funnel = ({ title, items }: { title: string; items: LeaderboardEntry[] }) => {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className="rounded-2xl border border-line/30 bg-surface/60 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">{title}</h3>
      <div className="mt-4 space-y-4">
        {items.map((item) => {
          const width = maxValue > 0 ? `${Math.max((item.value / maxValue) * 100, 8)}%` : '0%';

          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm text-muted">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-secondary/80">
                <div className="h-2 rounded-full bg-gradient-to-r from-brand-start to-brand-end" style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TrendChart = ({ items }: { items: DailySeriesPoint[] }) => {
  const maxValue = Math.max(...items.map((item) => item.totalEvents), 1);

  return (
    <div className="rounded-2xl border border-line/30 bg-surface/60 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Daily Activity Trend</h3>
      <div className="mt-6 flex h-56 items-end gap-2 rounded-2xl bg-surface-secondary/70 p-4">
        {items.map((item) => {
          const height = `${Math.max((item.totalEvents / maxValue) * 100, item.totalEvents > 0 ? 8 : 2)}%`;

          return (
            <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <div className="text-[10px] text-faint">{item.totalEvents}</div>
              <div
                className="w-full rounded-t-full bg-gradient-to-t from-brand-start to-brand-end"
                style={{ height }}
                title={`${item.label}: ${item.totalEvents} events, ${item.searches} searches, ${item.messages} messages, ${item.favorites} favorite events, ${item.profileViews} profile views`}
              />
              <div className="text-[10px] text-faint">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const HealthPanel = ({ score, items }: { score: number; items: HealthItem[] }) => (
  <div className="rounded-2xl border border-line/30 bg-surface/60 p-5">
    <div className="flex items-end justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Operational Health</h3>
        <p className="mt-2 text-sm text-faint">Quick read on data quality, funnel health, and admin workload.</p>
      </div>
      <div className="text-right">
        <div className="text-xs uppercase tracking-[0.2em] text-faint">Score</div>
        <div className="text-4xl font-semibold text-foreground">{score}</div>
      </div>
    </div>
    <div className="mt-5 space-y-3">
      {items.map((item) => {
        const toneClassName = getSemanticToneClasses(getStatusTone(item.status));

        return (
          <div key={item.title} className="rounded-xl border border-line/30 bg-surface-secondary/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${toneClassName.dot}`} />
                <div className="font-medium text-foreground">{item.title}</div>
              </div>
              <StatusPill status={item.status} />
            </div>
            <p className="mt-2 text-sm text-muted">{item.detail}</p>
          </div>
        );
      })}
    </div>
  </div>
);
