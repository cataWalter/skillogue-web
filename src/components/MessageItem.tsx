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
                className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-glass-sm ${
                    isMe
                        ? 'bg-gradient-to-r from-brand-start to-brand-end text-white rounded-br-md'
                        : 'glass-surface text-muted rounded-bl-md border border-line/20'
                }`}
            >
                <p className="text-sm sm:text-base">{content}</p>
                <p className={`text-[10px] mt-1.5 ${isMe ? 'text-brand-soft' : 'text-faint'} text-right flex items-center justify-end gap-1`}>
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
