import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PasswordStrengthMeter from '../../src/components/PasswordStrengthMeter';

describe('PasswordStrengthMeter', () => {
  it('renders all shared password requirement labels', () => {
    render(<PasswordStrengthMeter password="" />);

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('At least one uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('At least one number')).toBeInTheDocument();
    expect(screen.getByText('At least one symbol')).toBeInTheDocument();
  });

  it('keeps all requirement labels visible for a valid password', () => {
    render(<PasswordStrengthMeter password="StrongP@ssw0rd!" />);

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('At least one uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('At least one number')).toBeInTheDocument();
    expect(screen.getByText('At least one symbol')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters').closest('div')).toHaveClass('text-approval');
  });
});