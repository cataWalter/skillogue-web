import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MultiSelect from '../../src/components/MultiSelect';

describe('MultiSelect Component', () => {
    const mockOptions = [{ name: 'Option 1' }, { name: 'Option 2' }, { name: 'Option 3' }];
    const mockOnChange = jest.fn();
    const defaultProps = {
        options: mockOptions,
        selected: [],
        onChange: mockOnChange,
        label: 'Test Select',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<MultiSelect {...defaultProps} />);
        expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
    });

    it('opens dropdown on click', () => {
        render(<MultiSelect {...defaultProps} />);
        const input = screen.getByRole('combobox');
        fireEvent.click(input);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('filters options', () => {
        render(<MultiSelect {...defaultProps} />);
        const input = screen.getByRole('combobox');
        fireEvent.click(input); // Open dropdown
        fireEvent.change(input, { target: { value: 'Option 1' } });
        expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Option 2' })).not.toBeInTheDocument();
    });

    it('selects an option', () => {
        render(<MultiSelect {...defaultProps} />);
        const input = screen.getByRole('combobox');
        fireEvent.click(input);
        const option = screen.getByRole('option', { name: 'Option 1' });
        fireEvent.click(option);
        expect(mockOnChange).toHaveBeenCalledWith(['Option 1']);
    });

    it('deselects an option via dropdown', () => {
        render(<MultiSelect {...defaultProps} selected={['Option 1']} />);
        const input = screen.getByRole('combobox');
        fireEvent.click(input);
        const option = screen.getByRole('option', { name: 'Option 1' });
        fireEvent.click(option);
        expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('removes an option via tag', () => {
        render(<MultiSelect {...defaultProps} selected={['Option 1']} />);
        const removeButton = screen.getByLabelText('Remove Option 1');
        fireEvent.click(removeButton);
        expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('closes on outside click', () => {
        render(
            <div>
                <div data-testid="outside">Outside</div>
                <MultiSelect {...defaultProps} />
            </div>
        );
        const input = screen.getByRole('combobox');
        fireEvent.click(input);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        
        fireEvent.mouseDown(screen.getByTestId('outside'));
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
});
