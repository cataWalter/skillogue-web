import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileCompletion from '../../src/components/ProfileCompletion';

describe('ProfileCompletion Component', () => {
    it('renders nothing when profile is complete', () => {
        const profile = {
            about_me: 'I am a developer',
            passions_count: 5,
            languages_count: 2,
        };
        const { container } = render(<ProfileCompletion profile={profile} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders suggestions when profile is incomplete', () => {
        const profile = {
            about_me: null,
            passions_count: 1,
            languages_count: 0,
        };
        render(<ProfileCompletion profile={profile} />);
        
        expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
        expect(screen.getByText('Add a bio to tell people about yourself.')).toBeInTheDocument();
        expect(screen.getByText('Add more passions to find better connections.')).toBeInTheDocument();
        expect(screen.getByText('Add the languages you speak.')).toBeInTheDocument();
    });

    it('renders partial suggestions', () => {
        const profile = {
            about_me: 'Bio',
            passions_count: 1,
            languages_count: 1,
        };
        render(<ProfileCompletion profile={profile} />);
        
        expect(screen.queryByText('Add a bio to tell people about yourself.')).not.toBeInTheDocument();
        expect(screen.getByText('Add more passions to find better connections.')).toBeInTheDocument();
        expect(screen.queryByText('Add the languages you speak.')).not.toBeInTheDocument();
    });
});
