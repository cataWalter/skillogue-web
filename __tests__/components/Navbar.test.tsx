import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../../src/components/Navbar';

const mockReplace = jest.fn();
const mockRefreshRoute = jest.fn();
const mockRefreshAuth = jest.fn();
const mockSignOut = jest.fn();
const mockToggleTheme = jest.fn();
let mockUser: { id: string; name: string; email?: string } | null = null;
let mockPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefreshRoute,
  }),
}));

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: mockSignOut,
    refresh: mockRefreshAuth,
  }),
}));

jest.mock('../../src/hooks/useTheme', () => ({
  useTheme: () => ['dark', mockToggleTheme],
}));

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockPathname = '/';
  });

  it('labels the mobile menu toggle and updates expanded state', () => {
    render(<Navbar />);

    const toggle = screen.getByRole('button', { name: /open navigation menu/i });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    const mobileNavigation = document.getElementById('mobile-navigation');

    expect(screen.getByRole('button', { name: /close navigation menu/i })).toHaveAttribute('aria-expanded', 'true');
    expect(mobileNavigation).not.toBeNull();
    expect(within(mobileNavigation as HTMLElement).getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(within(mobileNavigation as HTMLElement).getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('renders a theme toggle button', async () => {
    render(<Navbar />);

    const toggle = await screen.findByRole('button', { name: /switch to light mode/i });

    fireEvent.click(toggle);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('renders authenticated navigation and closes the mobile menu on sign out', () => {
    mockUser = { id: 'user-1', name: 'Ada', email: 'ada@example.com' };
    mockPathname = '/search/filters';

    render(<Navbar />);

    expect(screen.getByRole('link', { name: /^search$/i })).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: /^search$/i })).toHaveClass('bg-surface-secondary');
    expect(screen.getByRole('link', { name: /skillogue/i })).toHaveAttribute('href', '/dashboard');

    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));

    const signOutButtons = screen.getAllByRole('button', { name: /sign out/i });
    act(() => {
      fireEvent.click(signOutButtons[1]);
    });

    return waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/');
      expect(mockRefreshRoute).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /open navigation menu/i })).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('renders the admin link and signs out from the desktop navigation', () => {
    mockUser = { id: 'admin-1', name: 'Admin', email: 'cata.walter@gmail.com' };

    render(<Navbar />);

    expect(screen.getByRole('link', { name: /^admin$/i })).toHaveAttribute('href', '/admin');

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    return waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/');
      expect(mockRefreshRoute).toHaveBeenCalledTimes(1);
    });
  });

  it('closes the mobile menu when navigation links are clicked', () => {
    mockUser = { id: 'user-1', name: 'Ada', email: 'ada@example.com' };

    const { rerender } = render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));

    let mobileNavigation = document.getElementById('mobile-navigation');
    fireEvent.click(within(mobileNavigation as HTMLElement).getByRole('link', { name: /^search$/i }));
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toHaveAttribute('aria-expanded', 'false');

    mockUser = null;
    rerender(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    mobileNavigation = document.getElementById('mobile-navigation');
    fireEvent.click(within(mobileNavigation as HTMLElement).getByRole('link', { name: /sign in/i }));
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    mobileNavigation = document.getElementById('mobile-navigation');
    fireEvent.click(within(mobileNavigation as HTMLElement).getByRole('link', { name: /sign up/i }));
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toHaveAttribute('aria-expanded', 'false');
  });
});
