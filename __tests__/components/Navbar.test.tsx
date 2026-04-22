import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../../src/components/Navbar';

const mockReplace = jest.fn();
const mockRefreshRoute = jest.fn();
const mockRefreshAuth = jest.fn();
const mockSignOut = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefreshRoute,
  }),
}));

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    signOut: mockSignOut,
    refresh: mockRefreshAuth,
  }),
}));

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('labels the mobile menu toggle and updates expanded state', () => {
    render(<Navbar />);

    const toggle = screen.getByRole('button', { name: /open navigation menu/i });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: /close navigation menu/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });
});