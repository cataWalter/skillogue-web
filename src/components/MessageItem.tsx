import React from 'react';
import Avatar from './Avatar';

interface MessageItemProps {
    content: string;
    createdAt: string;
    isMe: boolean;
    showAvatar: boolean;
    senderId: string;
    attachmentUrl?: string;
    attachmentType?: string;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({ content, createdAt, isMe, showAvatar, senderId, attachmentUrl, attachmentType }) => {
    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
            {!isMe && (
                <div className="w-8 mr-2 flex-shrink-0">
                    {showAvatar && <Avatar seed={senderId} className="w-8 h-8" />}
                </div>
            )}
            <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    isMe
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-gray-800 text-gray-200 rounded-bl-none'
                }`}
            >
                {attachmentUrl && attachmentType === 'image' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={attachmentUrl} alt="Attachment" className="max-w-full rounded-lg mb-2" />
                )}
                <p>{content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-500'} text-right`}>
                    {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
