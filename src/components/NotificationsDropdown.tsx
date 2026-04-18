// src/components/NotificationsDropdown.tsx
import React from 'react';
import Link from 'next/link';
import { useNotifications } from '../context/NotificationContext';
import Avatar from './Avatar';
import { formatDistanceToNow } from 'date-fns';

const NotificationsDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { notifications, markAsRead } = useNotifications();

    const getNotificationLink = (notification: typeof notifications[number]): string => {
        if (notification.type === 'new_message' && notification.actorId) {
            return `/messages?conversation=${notification.actorId}`;
        }
        return '/notifications'; // Fallback link
    };

    const getNotificationText = (notification: typeof notifications[number]): React.ReactNode => {
        const actorName = notification.actorId || 'Someone';

        if (notification.type === 'new_message') {
            return <><strong>{actorName}</strong> sent you a message.</>;
        }
        return `You have a new notification from ${actorName}.`;
    };

    return (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
            <div className="p-3 flex justify-between items-center border-b border-gray-700">
                <h3 className="font-semibold">Notifications</h3>
                <button onClick={() => markAsRead(null)} className="text-sm text-indigo-400 hover:underline">
                    Mark all as read
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="text-gray-400 p-4 text-center">No new notifications.</p>
                ) : (
                    notifications.map(n => {
                        if (!n.actorId) {
                            return (
                                <div key={n.id} className="flex items-start gap-3 p-3 text-gray-500">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm">This notification is from a user who no longer exists.</p>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <Link
                                href={getNotificationLink(n)}
                                key={n.id}
                                onClick={() => {
                                    if (!n.read) markAsRead(n.id);
                                    onClose();
                                }}
                                className={`flex items-start gap-3 p-3 hover:bg-gray-700/50 ${!n.read ? 'bg-indigo-900/20' : ''}`}
                            >
                                <Avatar seed={n.actorId} className="w-10 h-10 rounded-full flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-200">{getNotificationText(n)}</p>
                                    <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(n.createdAt))} ago</p>
                                </div>
                                {!n.read && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>}
                            </Link>
                        );
                    })
                )}
            </div>
            <div className="p-2 border-t border-gray-700 text-center">
                <Link href="/notifications" onClick={onClose} className="text-sm font-medium text-indigo-400 hover:underline">
                    View all notifications
                </Link>
            </div>
        </div>
    );
};

export default NotificationsDropdown;