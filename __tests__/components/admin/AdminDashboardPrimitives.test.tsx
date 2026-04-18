import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Funnel,
  HealthPanel,
  Leaderboard,
  PanelShell,
  StatusPill,
  StatCard,
  TrendChart,
  formatDateTime,
  formatEventName,
  formatPercent,
} from '../../../src/components/admin/AdminDashboardPrimitives';

describe('AdminDashboardPrimitives', () => {
  it('formats values for analytics copy', () => {
    expect(formatEventName('page_view')).toBe('Page View');
    expect(formatDateTime(null)).toBe('No events yet');
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
    expect(formatPercent(12.345)).toBe('12.3%');
  });

  it('renders the admin panels and analytics visuals', () => {
    render(
      <PanelShell
        id="overview"
        title="Overview"
        description="Overview description"
        icon={<span>Icon</span>}
        action={<button type="button">Action</button>}
      >
        <StatCard title="Members" value={42} hint="Active this week" />
        <Leaderboard title="Top Queries" items={[{ label: 'Coffee', value: 12 }]} empty="No data" />
        <Leaderboard title="Empty" items={[]} empty="No data" />
        <Funnel title="Funnel" items={[{ label: 'Signups', value: 10 }, { label: 'Verified', value: 5 }]} />
        <TrendChart
          items={[
            {
              date: '2026-05-10',
              label: 'May 10',
              totalEvents: 4,
              searches: 1,
              messages: 1,
              favorites: 1,
              profileViews: 1,
              notifications: 0,
            },
          ]}
        />
        <HealthPanel
          score={87}
          items={[
            { title: 'Feed', status: 'good', detail: 'All good' },
            { title: 'Queue', status: 'watch', detail: 'Review soon' },
            { title: 'Urgent', status: 'critical', detail: 'Action needed' },
          ]}
        />
      </PanelShell>
    );

    expect(screen.getByText('Overview description')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Daily Activity Trend')).toBeInTheDocument();
    expect(screen.getByText('Operational Health')).toBeInTheDocument();
    expect(screen.getAllByText('No data')).toHaveLength(1);
  });

  it('renders status pills for each status style', () => {
    render(
      <div>
        <StatusPill status="good" />
        <StatusPill status="watch" />
        <StatusPill status="critical" />
        <StatusPill status="approved" />
        <StatusPill status="resolved" />
      </div>
    );

    expect(screen.getByText('good')).toHaveClass('bg-success/15');
    expect(screen.getByText('watch')).toHaveClass('bg-warning/15');
    expect(screen.getByText('critical')).toHaveClass('bg-danger/15');
    expect(screen.getByText('approved')).toHaveClass('bg-approval/15');
    expect(screen.getByText('resolved')).toHaveClass('bg-approval/15');
  });

  it('renders Funnel with all-zero values (maxValue === 0)', () => {
    render(
      <Funnel
        title="Zero Funnel"
        items={[
          { label: 'Step A', value: 0 },
          { label: 'Step B', value: 0 },
        ]}
      />
    );

    expect(screen.getByText('Zero Funnel')).toBeInTheDocument();
    expect(screen.getByText('Step A')).toBeInTheDocument();
  });

  it('renders TrendChart with zero-event days', () => {
    render(
      <TrendChart
        items={[
          {
            date: '2026-05-10',
            label: 'May 10',
            totalEvents: 0,
            searches: 0,
            messages: 0,
            favorites: 0,
            profileViews: 0,
            notifications: 0,
          },
        ]}
      />
    );

    expect(screen.getByText('Daily Activity Trend')).toBeInTheDocument();
  });
});