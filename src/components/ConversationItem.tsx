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
            className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-900 transition ${isSelected ? 'bg-gray-900' : ''}`}
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Avatar seed={userId} className="w-12 h-12" />
                    {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold truncate">{fullName}</h3>
                        {unread > 0 && (
                            <span className="bg-indigo-600 text-xs px-2 py-0.5 rounded-full">
                                {unread}
                            </span>
                        )}
                    </div>
                    <p className={`text-sm truncate ${unread > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                        {lastMessage}
                    </p>
                </div>
            </div>
        </div>
    );
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
