import { render, screen, waitFor } from '@testing-library/react';
import PassionSpotlight from '../../src/components/PassionSpotlight';

const hasExactParagraphText = (text: string) => (_content: string, element: Element | null) =>
  element?.tagName.toLowerCase() === 'p' && element.textContent === text;

describe('PassionSpotlight Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton when loading', () => {
    render(<PassionSpotlight loading />);
    
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders fallback content when no passions are available', async () => {
    render(<PassionSpotlight />);
    
    await waitFor(() => {
      expect(screen.getByText('Add a few passions to your profile to get more relevant suggestions on the dashboard.')).toBeInTheDocument();
      expect(screen.getByText('Complete your passions →')).toBeInTheDocument();
    });
  });

  it('renders passion spotlight with passion name', async () => {
    const userPassions = [
      { passion_id: 1, passions: { name: 'Coding' } },
      { passion_id: 2, passions: { name: 'Music' } },
    ];
    
    render(<PassionSpotlight userPassions={userPassions} />);
    
    await waitFor(() => {
      expect(screen.getByText('Passion Spotlight')).toBeInTheDocument();
    });
  });

  it('renders the featured passion name', async () => {
    const userPassions = [{ passion_id: 1, passions: { name: 'Coding' } }];
    
    render(<PassionSpotlight userPassions={userPassions} />);
    
    await waitFor(() => {
      expect(screen.getByText('Coding')).toBeInTheDocument();
    });
  });

  it('renders the find people button', async () => {
    const userPassions = [{ passion_id: 1, passions: { name: 'Coding' } }];

    render(<PassionSpotlight userPassions={userPassions} />);

    await waitFor(() => {
      expect(screen.getByText('Find people with this passion →')).toBeInTheDocument();
    });
  });

  it('renders with user passions and userId', async () => {
    const userPassions = [{ passion_id: 1, passions: { name: 'Coding' } }];

    render(<PassionSpotlight userPassions={userPassions} userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText(hasExactParagraphText('Your passion for Coding'))).toBeInTheDocument();
    });
  });

  it('renders with user passions but no userId', async () => {
    const userPassions = [{ passion_id: 1, passions: { name: 'Coding' } }];

    render(<PassionSpotlight userPassions={userPassions} />);

    await waitFor(() => {
      expect(
        screen.getByText(hasExactParagraphText('Connect with others who share your love for Coding'))
      ).toBeInTheDocument();
    });
  });

  it('picks random passion when user has multiple passions', async () => {
    const userPassions = [
      { passion_id: 1, passions: { name: 'Coding' } },
      { passion_id: 2, passions: { name: 'Music' } },
    ];

    render(<PassionSpotlight userPassions={userPassions} />);

    await waitFor(() => {
      const text = screen.getByText(
        (_content, element) =>
          element?.tagName.toLowerCase() === 'p' &&
          /Connect with others who share your love for (Coding|Music)/.test(element.textContent ?? '')
      );
      expect(text).toBeInTheDocument();
    });
  });

  it('handles passion_id as string', async () => {
    const userPassions = [{ passion_id: '1', passions: { name: 'Coding' } }];

    render(<PassionSpotlight userPassions={userPassions} />);

    await waitFor(() => {
      expect(
        screen.getByText(hasExactParagraphText('Connect with others who share your love for Coding'))
      ).toBeInTheDocument();
    });
  });

  it('falls back to the generic CTA if user passions have no names', async () => {
    const userPassions = [{ passion_id: 999 }];

    render(<PassionSpotlight userPassions={userPassions} />);

    await waitFor(() => {
      expect(screen.getByText('Add a few passions to your profile to get more relevant suggestions on the dashboard.')).toBeInTheDocument();
    });
  });
});