import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrivacySettings from '../src/app/settings/privacy/page';
import { appClient } from '../src/lib/appClient';
import { toast } from 'react-hot-toast';

const mockPush = jest.fn();
const mockUpdateEq = jest.fn();
const mockUpdate = jest.fn();
let mockPrivacyData = {
  is_private: true,
  show_age: false,
  show_location: true,
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../src/lib/appClient', () => ({
  appClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('PrivacySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrivacyData = {
      is_private: true,
      show_age: false,
      show_location: true,
    };
    mockUpdate.mockReturnValue({
      eq: mockUpdateEq,
    });
    mockUpdateEq.mockResolvedValue({ error: null });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-1' } } });
    (appClient.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: mockPrivacyData, error: null }),
        })),
      })),
      update: mockUpdate,
    }));
  });

  it('loads and displays the privacy toggles inside the shared settings shell', async () => {
    render(<PrivacySettings />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Privacy Settings' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Private Profile' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Show Age' })).not.toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Show Location' })).toBeChecked();
    });

    expect(screen.getByText('How this affects discovery')).toBeInTheDocument();
  });

  it('applies default values when loaded privacy fields are falsey or missing', async () => {
    mockPrivacyData = {
      is_private: false,
      show_age: undefined,
      show_location: undefined,
    } as any;

    render(<PrivacySettings />);

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Private Profile' })).not.toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Show Age' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Show Location' })).toBeChecked();
    });
  });

  it('updates a setting optimistically and shows a success toast', async () => {
    render(<PrivacySettings />);

    const ageToggle = await screen.findByRole('checkbox', { name: 'Show Age' });
    fireEvent.click(ageToggle);

    await waitFor(() => {
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'user-1');
      expect(toast.success).toHaveBeenCalledWith('Settings updated');
    });
  });

  it('updates the private profile toggle optimistically and shows a success toast', async () => {
    render(<PrivacySettings />);

    const privateToggle = await screen.findByRole('checkbox', { name: 'Private Profile' });
    expect(privateToggle).toBeChecked();

    fireEvent.click(privateToggle);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ is_private: false });
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'user-1');
      expect(toast.success).toHaveBeenCalledWith('Settings updated');
    });
  });

  it('redirects unauthenticated users to login', async () => {
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });

    render(<PrivacySettings />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('falls back to default settings when the profile query errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    (appClient.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Missing columns' } }),
        })),
      })),
      update: jest.fn(() => ({
        eq: mockUpdateEq,
      })),
    }));

    render(<PrivacySettings />);

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Private Profile' })).not.toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Show Age' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Show Location' })).toBeChecked();
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('rolls back the optimistic update when saving fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockUpdateEq.mockResolvedValue({ error: { message: 'Write failed' } });

    render(<PrivacySettings />);

    const locationToggle = await screen.findByRole('checkbox', { name: 'Show Location' });
    expect(locationToggle).toBeChecked();

    fireEvent.click(locationToggle);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(locationToggle).toBeChecked();
    });

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('keeps the optimistic state when the user disappears before the update request', async () => {
    render(<PrivacySettings />);

    const ageToggle = await screen.findByRole('checkbox', { name: 'Show Age' });
    expect(ageToggle).not.toBeChecked();

    (appClient.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null } });

    fireEvent.click(ageToggle);

    await waitFor(() => {
      expect(ageToggle).toBeChecked();
    });

    expect(mockUpdateEq).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});