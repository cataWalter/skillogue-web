import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeToggle from '../../src/components/ThemeToggle';

const mockToggleTheme = jest.fn();
let currentTheme: 'light' | 'dark' = 'dark';

jest.mock('../../src/hooks/useTheme', () => ({
  useTheme: () => [currentTheme, mockToggleTheme] as const,
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the dark-mode toggle label when the theme is dark', async () => {
    currentTheme = 'dark';

    render(<ThemeToggle />);

    const button = await screen.findByRole('button', { name: /switch to light mode/i });

    expect(button).toHaveAttribute('title', 'Switch to light mode');
    fireEvent.click(button);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('shows the light-mode toggle label when the theme is light', async () => {
    currentTheme = 'light';

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
    });
  });
});