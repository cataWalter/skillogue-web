import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import ConversationItem from '../../src/components/ConversationItem';

jest.mock('../../src/components/Avatar', () => ({
	__esModule: true,
	default: ({ seed }: { seed: string }) => <div data-testid="avatar">{seed}</div>,
}));

describe('ConversationItem', () => {
	it('renders a selected unread conversation, caps the badge, and handles clicks', () => {
		const onClick = jest.fn();
		const { container } = render(
			<ConversationItem
				userId="user-123"
				fullName="Ada Lovelace"
				lastMessage="Hello there"
				unread={120}
				isSelected
				isOnline
				onClick={onClick}
			/>
		);

		const item = container.firstChild as HTMLElement;

		expect(screen.getByTestId('avatar')).toHaveTextContent('user-123');
		expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
		expect(screen.getByText('Hello there')).toBeInTheDocument();
		expect(screen.getByText('99+')).toBeInTheDocument();
		expect(item).toHaveClass('bg-indigo-600/10');
		expect(item).toHaveClass('border-l-indigo-500');
		expect(container.querySelector('.bg-green-500')).toBeInTheDocument();

		fireEvent.click(item);

		expect(onClick).toHaveBeenCalledWith('user-123');
	});

	it('renders fallback copy for conversations without unread messages', () => {
		const { container } = render(
			<ConversationItem
				userId="user-456"
				fullName="Grace Hopper"
				lastMessage=""
				unread={0}
				isSelected={false}
				onClick={jest.fn()}
			/>
		);

		const item = container.firstChild as HTMLElement;

		expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
		expect(screen.getByText('No messages yet')).toBeInTheDocument();
		expect(screen.queryByText('99+')).not.toBeInTheDocument();
		expect(item).not.toHaveClass('bg-indigo-600/10');
		expect(container.querySelector('.bg-green-500')).not.toBeInTheDocument();
	});
});
