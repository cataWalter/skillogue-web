import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import FAQPage from '../src/app/faq/page';

describe('FAQPage', () => {
  it('renders the clearer FAQ overview and support CTA', () => {
    render(<FAQPage />);

    expect(screen.getByRole('heading', { level: 1, name: /Frequently Asked Questions/i })).toBeInTheDocument();
    expect(screen.getByText(/Start with the essentials: how matching works/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /How does Skillogue decide who I see\?/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact support/i })).toHaveAttribute('href', '/contact');
  });

  it('surfaces the quick-start summary cards', () => {
    render(<FAQPage />);

    expect(screen.getByText('Matching stays passion-first')).toBeInTheDocument();
    expect(screen.getByText('You control visibility')).toBeInTheDocument();
    expect(screen.getByText('Safety tools stay close')).toBeInTheDocument();
  });
});