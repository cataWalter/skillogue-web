import React from 'react';
import Avatar from './Avatar';
import { getDisplayFullName, getDisplayMessagePreview } from '@/lib/profile-display';

interface ConversationItemProps {
    userId: string;
    fullName: string;
    lastMessage: string;
    unread: number;
    isSelected: boolean;
    isOnline?: boolean;
    onClick: (id: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = React.memo(({ userId, fullName, lastMessage, unread, isSelected, isOnline, onClick }) => {
    const displayName = getDisplayFullName(fullName);
    const messagePreview = getDisplayMessagePreview(lastMessage);

    return (
        <div
            onClick={() => onClick(userId)}
            className={`cursor-pointer border-b border-line/20 p-4 transition-all duration-300 hover:bg-surface-secondary/35 ${isSelected ? 'bg-brand/10 border-l-2 border-l-brand shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)]' : ''
                }`}
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Avatar seed={userId} className="w-12 h-12" />
                    {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-approval border-2 border-surface rounded-full animate-pulse"></span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h3 className={`truncate font-semibold ${unread > 0 || isSelected ? 'text-foreground' : 'text-muted'}`}>
                            {displayName}
                        </h3>
                        {unread > 0 && (
                            <span className="rounded-full bg-gradient-to-r from-brand-start to-brand-end px-2.5 py-0.5 text-xs font-medium text-white shadow-glass-sm">
                                {unread > 99 ? '99+' : unread}
                            </span>
                        )}
                    </div>
                    <p className={`text-sm truncate ${unread > 0 ? 'text-muted font-medium' : 'text-faint'}`}>
                        {messagePreview}
                    </p>
                </div>
            </div>
        </div>
    );
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
