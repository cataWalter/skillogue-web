import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PushNotificationToggle from '../../src/components/PushNotificationToggle';

// Mock the hook
const mockUsePushNotifications = {
  isSupported: true,
  subscription: null,
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  loading: false,
};

jest.mock('../../src/hooks/usePushNotifications', () => ({
  usePushNotifications: () => mockUsePushNotifications,
}));

describe('PushNotificationToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePushNotifications.isSupported = true;
    mockUsePushNotifications.subscription = null;
    mockUsePushNotifications.loading = false;
  });

  it('should render unsupported message when push is not supported', () => {
    mockUsePushNotifications.isSupported = false;

    render(<PushNotificationToggle />);

    expect(screen.getByText('Push notifications are not supported in this browser.')).toBeInTheDocument();
  });

  it('should render loading spinner when loading', () => {
    mockUsePushNotifications.loading = true;

    render(<PushNotificationToggle />);

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('should render enable button when not subscribed', () => {
    render(<PushNotificationToggle />);

    expect(screen.getByText('Push Notifications')).toBeInTheDocument();
    expect(screen.getByText('Enable notifications for new messages.')).toBeInTheDocument();
    expect(screen.getByText('Off')).toBeInTheDocument();
    expect(screen.getByText('Enable')).toBeInTheDocument();
  });

  it('should render disable button when subscribed', () => {
    mockUsePushNotifications.subscription = {
      endpoint: 'https://example.com/push',
      getKey: jest.fn(),
      unsubscribe: jest.fn(),
    };

    render(<PushNotificationToggle />);

    expect(screen.getByText('Push Notifications')).toBeInTheDocument();
    expect(screen.getByText('You are receiving notifications.')).toBeInTheDocument();
    expect(screen.getByText('On')).toBeInTheDocument();
    expect(screen.getByText('Disable')).toBeInTheDocument();
  });

  it('should call subscribe when Enable button is clicked', async () => {
    render(<PushNotificationToggle />);

    const enableButton = screen.getByText('Enable');
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(mockUsePushNotifications.subscribe).toHaveBeenCalled();
    });
  });

  it('should call unsubscribe when Disable button is clicked', async () => {
    mockUsePushNotifications.subscription = {
      endpoint: 'https://example.com/push',
      getKey: jest.fn(),
      unsubscribe: jest.fn(),
    };

    render(<PushNotificationToggle />);

    const disableButton = screen.getByText('Disable');
    fireEvent.click(disableButton);

    await waitFor(() => {
      expect(mockUsePushNotifications.unsubscribe).toHaveBeenCalled();
    });
  });

  it('should show Bell icon when subscribed', () => {
    mockUsePushNotifications.subscription = {
      endpoint: 'https://example.com/push',
      getKey: jest.fn(),
      unsubscribe: jest.fn(),
    };

    render(<PushNotificationToggle />);

    const bellIcon = document.querySelector('.text-approval');
    expect(bellIcon).toBeInTheDocument();
  });

  it('should show BellOff icon when not subscribed', () => {
    render(<PushNotificationToggle />);

    const bellOffIcon = document.querySelector('.text-faint');
    expect(bellOffIcon).toBeInTheDocument();
  });

  it('should apply correct styling to enable button', () => {
    render(<PushNotificationToggle />);

    const enableButton = screen.getByText('Enable');
    expect(enableButton).toHaveClass('from-brand-start');
    expect(enableButton).toHaveClass('text-white');
  });

  it('should apply correct styling to disable button', () => {
    mockUsePushNotifications.subscription = {
      endpoint: 'https://example.com/push',
      getKey: jest.fn(),
      unsubscribe: jest.fn(),
    };

    render(<PushNotificationToggle />);

    const disableButton = screen.getByText('Disable');
    expect(disableButton).toHaveClass('bg-danger/10');
    expect(disableButton).toHaveClass('text-danger-soft');
  });

  it('should have proper container styling', () => {
    render(<PushNotificationToggle />);

    const container = document.querySelector('div[class*="bg-surface-secondary/"]');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('p-5');
    expect(container).toHaveClass('rounded-[24px]');
  });

  it('should handle loading state correctly', () => {
    mockUsePushNotifications.loading = true;

    render(<PushNotificationToggle />);

    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
    expect(screen.queryByText('Enable')).not.toBeInTheDocument();
    expect(screen.queryByText('Disable')).not.toBeInTheDocument();
  });
});