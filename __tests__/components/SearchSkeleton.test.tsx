import { render } from '@testing-library/react';
import SearchSkeleton from '../../src/components/SearchSkeleton';

describe('SearchSkeleton Component', () => {
    it('renders correctly', () => {
        const { container } = render(<SearchSkeleton />);
        expect(container.firstChild).toHaveClass('bg-surface');
        expect(container.firstChild).toHaveClass('border-line/30');
    });
});
