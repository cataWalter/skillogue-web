import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileCard from '../../src/components/ProfileCard';
import { FullProfile } from '../../src/types';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
    MapPin: () => <div data-testid="icon-map-pin" />,
    Globe: () => <div data-testid="icon-globe" />,
    Briefcase: () => <div data-testid="icon-briefcase" />,
    GraduationCap: () => <div data-testid="icon-graduation-cap" />,
    Heart: () => <div data-testid="icon-heart" />,
    Languages: () => <div data-testid="icon-languages" />,
    ShieldCheck: () => <div data-testid="icon-shield-check" />,
    User: () => <div data-testid="icon-user" />,
    BookOpen: () => <div data-testid="icon-book-open" />,
    Calendar: () => <div data-testid="icon-calendar" />,
}));

const mockProfile: FullProfile = {
    id: '123',
    first_name: 'John',
    last_name: 'Doe',
    avatar_url: 'https://example.com/avatar.jpg',
    about_me: 'Test bio',
    locations: {
        city: 'New York',
        region: 'NY',
        country: 'USA',
    },
    passions: [
        { id: 1, name: 'Coding' },
        { id: 2, name: 'Music' },
    ],
    languages: [
        { id: 1, name: 'English' },
        { id: 2, name: 'Spanish' },
    ],
    // Add other required fields if necessary, but these seem to be the ones used
} as unknown as FullProfile;

describe('ProfileCard', () => {
    it('renders profile information correctly', () => {
        render(
            <ProfileCard
                profile={mockProfile}
                passions={['Coding', 'Music']}
                languages={['English', 'Spanish']}
                actionSlot={<button>Action</button>}
            />
        );

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Test bio')).toBeInTheDocument();
        expect(screen.getByText('New York, NY, USA')).toBeInTheDocument();
        expect(screen.getByText('Coding')).toBeInTheDocument();
        expect(screen.getByText('Music')).toBeInTheDocument();
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('Spanish')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('handles missing location', () => {
        const profileWithoutLocation = { ...mockProfile, locations: null };
        render(
            <ProfileCard
                profile={profileWithoutLocation}
                passions={[]}
                languages={[]}
                actionSlot={null}
            />
        );

        expect(screen.getByText('Not specified')).toBeInTheDocument();
    });

    it('does not render DetailItem if value is missing', () => {
        // Render with empty passions/languages to trigger the null check in DetailItem
        render(
            <ProfileCard
                profile={mockProfile}
                passions={[]} // Empty array -> join returns "" -> falsy
                languages={[]} // Empty array -> join returns "" -> falsy
                actionSlot={null}
            />
        );

        // Icons should not be present if the detail item is not rendered
        expect(screen.queryByTestId('icon-heart')).not.toBeInTheDocument();
        expect(screen.queryByTestId('icon-languages')).not.toBeInTheDocument();
    });
});
