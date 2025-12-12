import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../../src/components/Button';
import { Mail } from 'lucide-react';

describe('Button Component', () => {
    it('renders correctly with default props', () => {
        render(<Button>Click me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('bg-primary'); // Default variant
    });

    it('renders different variants', () => {
        const { rerender } = render(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-secondary');

        rerender(<Button variant="danger">Danger</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-red-600');

        rerender(<Button variant="outline">Outline</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-transparent');
    });

    it('shows loading state', () => {
        render(<Button isLoading>Submit</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        // Should not show children text when loading if implementation hides it, 
        // but current implementation appends loading text. 
        // Let's check if the loader icon is present.
        // The Loader2 component from lucide-react renders an svg.
        // We can check for the "Loading..." text which is explicit in the component.
    });

    it('renders with an icon', () => {
        render(<Button icon={<Mail data-testid="icon" />}>Email</Button>);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('handles click events', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('forwards ref', () => {
        const ref = React.createRef<HTMLButtonElement>();
        render(<Button ref={ref}>Ref Button</Button>);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
});
