import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Input from '../../src/components/Input';

describe('Input Component', () => {
    it('renders with label and id', () => {
        render(<Input label="Email Address" id="email" />);
        const label = screen.getByText('Email Address');
        const input = screen.getByLabelText('Email Address');
        
        expect(label).toBeInTheDocument();
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', 'email');
    });

    it('handles value changes', () => {
        const handleChange = jest.fn();
        render(<Input label="Username" id="username" onChange={handleChange} />);
        
        const input = screen.getByLabelText('Username');
        fireEvent.change(input, { target: { value: 'testuser' } });
        
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
        render(<Input label="Test" id="test" className="custom-class" />);
        const input = screen.getByLabelText('Test');
        expect(input).toHaveClass('custom-class');
    });

    it('forwards ref', () => {
        const ref = React.createRef<HTMLInputElement>();
        render(<Input label="Ref Input" id="ref-input" ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('accepts other input attributes', () => {
        render(<Input label="Password" id="password" type="password" placeholder="Enter password" />);
        const input = screen.getByLabelText('Password');
        expect(input).toHaveAttribute('type', 'password');
        expect(input).toHaveAttribute('placeholder', 'Enter password');
    });
});
