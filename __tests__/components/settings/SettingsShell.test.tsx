import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SettingsActionRow,
  SettingsBackLink,
  SettingsDangerPanel,
  SettingsEmptyState,
  SettingsHero,
  SettingsPage,
  SettingsSectionCard,
  SettingsStatusBanner,
  SettingsToggleRow,
} from '../../../src/components/settings/SettingsShell';

describe('SettingsShell', () => {
  it('renders the shared settings scaffolding and action primitives', () => {
    const handleAction = jest.fn();
    const handleToggle = jest.fn();

    render(
      <SettingsPage>
        <SettingsBackLink href="/settings" label="Back" />
        <SettingsHero
          eyebrow="Overview"
          title="Settings Hub"
          description="A focused landing page for account controls."
          icon={<span>Hero Icon</span>}
          highlights={['Fast', 'Safe']}
          actions={<button type="button">Hero Action</button>}
          tone="violet"
        />
        <SettingsSectionCard
          title="Privacy"
          description="Control discoverability."
          icon={<span>Section Icon</span>}
          badge="Ready"
          tone="sky"
        >
          <SettingsStatusBanner
            title="Verification"
            description="Status details"
            helperText="Helpful context"
            badge="Pending"
            icon={<span>Banner Icon</span>}
            action={<button type="button">Banner Action</button>}
            tone="amber"
          />
          <SettingsActionRow
            href="/settings/privacy"
            title="Open privacy"
            description="Jump to privacy settings."
            icon={<span>Link Icon</span>}
            actionLabel="Open"
            status="Ready"
            tone="brand"
          />
          <SettingsActionRow
            onClick={handleAction}
            title="Danger action"
            description="This uses the button branch."
            icon={<span>Button Icon</span>}
            actionLabel="Run"
            tone="rose"
          />
          <SettingsEmptyState
            title="Nothing here yet"
            description="No entries yet."
            icon={<span>Empty Icon</span>}
            action={<button type="button">Empty Action</button>}
            tone="emerald"
          />
          <SettingsDangerPanel title="Danger zone" description="Permanent actions live here." icon={<span>Danger Icon</span>}>
            <p>Danger child</p>
          </SettingsDangerPanel>
          <SettingsToggleRow
            checked={false}
            onChange={handleToggle}
            title="Private Profile"
            description="Hide profile info from discovery."
            helperText="Only name and avatar stay visible."
            icon={<span>Toggle Icon</span>}
            checkedLabel="On"
            uncheckedLabel="Off"
            tone="brand"
          />
        </SettingsSectionCard>
      </SettingsPage>
    );

    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/settings');
    expect(screen.getByRole('heading', { name: 'Settings Hub' })).toBeInTheDocument();
    expect(screen.getByText('Overview')).toHaveClass('border-discovery/20');
    expect(screen.getByText('Pending')).toHaveClass('border-warning/20');
    expect(screen.getByRole('button', { name: 'Hero Action' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open privacy/i })).toHaveAttribute('href', '/settings/privacy');
    fireEvent.click(screen.getByRole('button', { name: /Run/i }));
    expect(handleAction).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Danger child')).toBeInTheDocument();
    const toggle = screen.getByRole('checkbox', { name: 'Private Profile' });
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it('renders a disabled toggle row in the checked state', () => {
    const handleToggle = jest.fn();

    render(
      <SettingsToggleRow
        checked
        disabled
        onChange={handleToggle}
        title="Show Location"
        description="Display city and country."
        checkedLabel="Visible"
        uncheckedLabel="Hidden"
      />
    );

    const toggle = screen.getByRole('checkbox', { name: 'Show Location' });

    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();
    expect(screen.getByText('Visible')).toBeInTheDocument();
    expect(screen.getByText('Display city and country.')).toBeInTheDocument();
  });

  it('renders the minimal variants without optional chrome', () => {
    const handleAction = jest.fn();
    const handleToggle = jest.fn();

    render(
      <SettingsPage>
        <SettingsHero title="Basic hero" description="Hero copy" icon={<span>Hero Icon</span>} />
        <SettingsSectionCard title="Minimal card" icon={undefined} description={undefined}>
          <SettingsStatusBanner title="Minimal banner" description="Banner copy" />
          <SettingsActionRow
            onClick={handleAction}
            title="Plain action"
            description="Button branch without extras."
            icon={<span>Button Icon</span>}
          />
          <SettingsEmptyState title="Empty" description="Nothing to show." />
          <SettingsDangerPanel title="Danger zone" description="Permanent actions live here." />
          <SettingsToggleRow
            checked
            onChange={handleToggle}
            title="Public Profile"
            description="Display profile info."
          />
        </SettingsSectionCard>
      </SettingsPage>
    );

    expect(screen.getByRole('heading', { name: 'Basic hero' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Minimal card' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Minimal banner' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /plain action/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Empty' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Danger zone' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Public Profile' })).toBeChecked();
    expect(screen.queryByText('Hero Action')).not.toBeInTheDocument();
  });
});