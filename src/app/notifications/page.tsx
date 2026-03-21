'use client';

import React from 'react';
import Link from 'next/link';
import { useNotifications } from '../../context/NotificationContext';
import Avatar from '../../components/Avatar';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Re-defining the type here for clarity within the component
interface Notification {
    id: number;
    read: boolean;
    type: string;
    created_at: string;
    actor: {
        id: string;
        first_name: string | null;
    } | null;
}

const NotificationsPage: React.FC = () => {
    const { notifications, unreadCount, markAsRead } = useNotifications();

    const getNotificationLink = (notification: Notification): string => {
        if (notification.type === 'new_message' && notification.actor) {
            return `/messages?with=${notification.actor.id}`;
        }
        // Fallback for other notification types or if actor is null
        return '#';
    };

    const getNotificationText = (notification: Notification): React.ReactNode => {
        const actorName = notification.actor?.first_name || 'An unknown user';

        switch (notification.type) {
            case 'new_message':
                return <><strong>{actorName}</strong> sent you a new message.</>;
            // Future cases can be added here
            // case 'new_match':
            //     return <>You have a new match with <strong>{actorName}</strong>!</>;
            default:
                return 'You have a new notification.';
        }
    };

    return (
        <main className="flex-grow p-6 max-w-3xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold flex items-center gap-3">
                    <Bell className="text-indigo-400" />
                    Notifications
                </h1>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAsRead(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition"
                    >
                        <CheckCheck size={16} />
                        Mark All as Read
                    </button>
                )}
            </div>

            <div className="bg-gray-900/70 border border-gray-800 rounded-xl shadow-lg">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No notifications yet</h3>
                        <p className="text-gray-400">
                            We&apos;ll let you know when something important happens.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-800">
                        {notifications.map(n => (
                            <li key={n.id}>
                                <Link
                                    href={getNotificationLink(n)}
                                    onClick={() => !n.read && markAsRead(n.id)}
                                    className={`flex items-start gap-4 p-4 transition-colors duration-200 ${n.read ? 'hover:bg-gray-800/50' : 'bg-indigo-900/20 hover:bg-indigo-900/40'
                                        }`}
                                >
                                    {n.actor ? (
                                        <Avatar seed={n.actor.id} className="w-12 h-12 rounded-full flex-shrink-0 mt-1" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-700 flex-shrink-0 mt-1" />
                                    )}
                                    <div className="flex-1">
                                        <p className="text-gray-200">{getNotificationText(n)}</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {formatDistanceToNow(new Date(n.created_at))} ago
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0" title="Unread"></div>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
};

export default NotificationsPage;
