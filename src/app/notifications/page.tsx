'use client';

import React from 'react';
import Link from 'next/link';
import { useNotifications } from '../../context/NotificationContext';
import Avatar from '../../components/Avatar';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { componentCopy } from '../../lib/app-copy';
import { useProfileGate } from '../../hooks/useProfileGate';

const NotificationsPage: React.FC = () => {
    const { notifications, unreadCount, markAsRead } = useNotifications();
    useProfileGate();

    const getNotificationLink = (notification: typeof notifications[number]): string => {
        if (notification.url) return notification.url;
        if (!notification.actorId) return '#';
        switch (notification.type) {
            case 'new_message': return `/messages?conversation=${notification.actorId}`;
            case 'new_favorite':
            case 'profile_visit': return `/user/${notification.actorId}`;
            case 'new_match': return `/messages?conversation=${notification.actorId}`;
            default: return '#';
        }
    };

    const getNotificationText = (notification: typeof notifications[number]): React.ReactNode => {
        const actorName = notification.actorId || componentCopy.notificationCenter.genericActorName;

        switch (notification.type) {
            case 'new_message':
                return <><strong>{actorName}</strong> {componentCopy.notificationCenter.sentMessage}</>;
            case 'new_favorite':
                return <><strong>{actorName}</strong> {componentCopy.notificationCenter.savedYourProfile}</>;
            case 'profile_visit':
                return <><strong>{actorName}</strong> {componentCopy.notificationCenter.viewedYourProfile}</>;
            case 'new_match':
                return componentCopy.notificationCenter.youMatchedWith(actorName);
            case 'admin_notice':
                return notification.body || componentCopy.notificationCenter.defaultNotification;
            default:
                return componentCopy.notificationCenter.defaultNotification;
        }
    };

    const handleNotificationOpen = (notification: typeof notifications[number]) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
    };

    return (
        <main className="editorial-shell flex-grow py-8 sm:py-12 lg:py-16">
            <div className="glass-panel mb-8 rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="flex items-center gap-3 text-4xl font-bold">
                        <Bell className="text-brand" />
                        {componentCopy.notificationCenter.title}
                    </h1>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAsRead(null)}
                            className="glass-surface flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-secondary/80"
                        >
                            <CheckCheck size={16} />
                            {componentCopy.notificationCenter.markAllAsRead}
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-panel overflow-hidden rounded-[1.75rem]">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="glass-surface mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                            <Bell className="w-8 h-8 text-faint" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{componentCopy.notificationCenter.emptyStatePageTitle}</h3>
                        <p className="text-faint">
                            {componentCopy.notificationCenter.emptyStateSubtitle}
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-line/30">
                        {notifications.map(n => (
                            <li key={n.id}>
                                <Link
                                    href={getNotificationLink(n)}
                                    onClick={() => handleNotificationOpen(n)}
                                    className={`flex items-start gap-4 p-4 transition-all duration-300 ${n.read ? 'hover:bg-surface-secondary/35' : 'bg-brand/12 hover:bg-brand/18'
                                        }`}
                                >
                                    {n.actorId ? (
                                        <Avatar seed={n.actorId} className="w-12 h-12 rounded-full flex-shrink-0 mt-1" />
                                    ) : (
                                        <div className="glass-surface mt-1 h-12 w-12 flex-shrink-0 rounded-full" />
                                    )}
                                    <div className="flex-1">
                                        <p className="text-muted">{getNotificationText(n)}</p>
                                        <p className="text-sm text-faint mt-1">
                                            {formatDistanceToNow(new Date(n.createdAt))} {componentCopy.notificationCenter.ago}
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <div className="w-3 h-3 bg-brand rounded-full mt-2 flex-shrink-0" title={componentCopy.notificationCenter.unreadTitle}></div>
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
