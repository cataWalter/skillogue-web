import React from 'react';
import Avatar from './Avatar';

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
    return (
        <div
            onClick={() => onClick(userId)}
            className={`p-4 border-b border-gray-800 cursor-pointer transition-all duration-200 hover:bg-gray-800/50 ${
                isSelected ? 'bg-indigo-600/10 border-l-2 border-l-indigo-500' : ''
            }`}
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Avatar seed={userId} className="w-12 h-12" />
                    {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h3 className={`font-semibold truncate ${unread > 0 ? 'text-white' : 'text-gray-200'}`}>
                            {fullName}
                        </h3>
                        {unread > 0 && (
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-xs px-2.5 py-0.5 rounded-full text-white font-medium">
                                {unread > 99 ? '99+' : unread}
                            </span>
                        )}
                    </div>
                    <p className={`text-sm truncate ${unread > 0 ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
                        {lastMessage || 'No messages yet'}
                    </p>
                </div>
            </div>
        </div>
    );
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
