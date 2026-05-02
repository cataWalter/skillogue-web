import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  PanelShell,
  StatusPill,
  StatCard,
  formatDateTime,
  formatEventName,
  formatPercent,
} from '../../../src/components/admin/AdminDashboardPrimitives';

describe('AdminDashboardPrimitives', () => {
  it('formats values correctly', () => {
    expect(formatEventName('page_view')).toBe('Page View');
    expect(formatDateTime(null)).toBe('No events yet');
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
    expect(formatPercent(12.345)).toBe('12.3%');
  });

  it('renders PanelShell with StatCard', () => {
    render(
      <PanelShell
        id="overview"
        title="Overview"
        description="Overview description"
        icon={<span>Icon</span>}
        action={<button type="button">Action</button>}
      >
        <StatCard title="Members" value={42} hint="Active this week" />
      </PanelShell>
    );

    expect(screen.getByText('Overview description')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Active this week')).toBeInTheDocument();
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
});
