import React from 'react';
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
