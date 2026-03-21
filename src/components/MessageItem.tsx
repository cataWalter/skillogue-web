import React from 'react';
import Avatar from './Avatar';

interface MessageItemProps {
    content: string;
    createdAt: string;
    isMe: boolean;
    showAvatar: boolean;
    senderId: string;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({ content, createdAt, isMe, showAvatar, senderId }) => {
    const formattedTime = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = new Date(createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in-up`}>
            {!isMe && (
                <div className="w-8 mr-2 flex-shrink-0">
                    {showAvatar && <Avatar seed={senderId} className="w-8 h-8" />}
                </div>
            )}
            <div
                className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-md ${
                    isMe
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                        : 'bg-gray-800 text-gray-200 rounded-bl-md border border-gray-700'
                }`}
            >
                <p className="text-sm sm:text-base">{content}</p>
                <p className={`text-[10px] mt-1.5 ${isMe ? 'text-indigo-200' : 'text-gray-500'} text-right flex items-center justify-end gap-1`}>
                    <span>{formattedTime}</span>
                    <span>·</span>
                    <span>{formattedDate}</span>
                </p>
            </div>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
