import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PassionSpotlight from '../../src/components/PassionSpotlight';

// Mock useMasterData hook
const mockUseMasterData = jest.fn();
jest.mock('../../src/hooks/useMasterData', () => ({
  useMasterData: () => mockUseMasterData(),
}));

describe('PassionSpotlight Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton when loading', () => {
    mockUseMasterData.mockReturnValue({ passions: [], loading: true });
    
    render(<PassionSpotlight />);
    
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders loading skeleton when no passions and not loading', async () => {
    mockUseMasterData.mockReturnValue({ passions: [], loading: false });
    
    render(<PassionSpotlight />);
    
    // When no passions, featuredPassion is undefined, so it shows skeleton
    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  it('renders passion spotlight with passion name', async () => {
    const mockPassions = [
      { id: 1, name: 'Coding' },
      { id: 2, name: 'Music' },
    ];
    mockUseMasterData.mockReturnValue({ passions: mockPassions, loading: false });
    
    render(<PassionSpotlight />);
    
    await waitFor(() => {
      expect(screen.getByText('Passion Spotlight')).toBeInTheDocument();
    });
  });

  it('renders the featured passion name', async () => {
    const mockPassions = [{ id: 1, name: 'Coding' }];
    mockUseMasterData.mockReturnValue({ passions: mockPassions, loading: false });
    
    render(<PassionSpotlight />);
    
    await waitFor(() => {
      expect(screen.getByText('Coding')).toBeInTheDocument();
    });
  });

  it('renders the find people button', async () => {
    const mockPassions = [{ id: 1, name: 'Coding' }];
    mockUseMasterData.mockReturnValue({ passions: mockPassions, loading: false });
    
    render(<PassionSpotlight />);
    
    await waitFor(() => {
      expect(screen.getByText('Find people with this passion →')).toBeInTheDocument();
    });
  });
});