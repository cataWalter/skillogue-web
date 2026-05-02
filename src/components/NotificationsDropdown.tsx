'use client';

// src/components/NotificationsDropdown.tsx
import React from 'react';
import Link from 'next/link';
import { useNotifications } from '../context/NotificationContext';
import Avatar from './Avatar';
import { formatDistanceToNow } from 'date-fns';
import { componentCopy } from '../lib/app-copy';

const NotificationsDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { notifications, markAsRead } = useNotifications();

    const getNotificationLink = (notification: typeof notifications[number]): string => {
        if (notification.url) return notification.url;
        if (!notification.actorId) return '/notifications';
        switch (notification.type) {
            case 'new_message': return `/messages?conversation=${notification.actorId}`;
            case 'new_favorite':
            case 'profile_visit': return `/user/${notification.actorId}`;
            case 'new_match': return `/messages?conversation=${notification.actorId}`;
            default: return '/notifications';
        }
    };

    const getNotificationText = (notification: typeof notifications[number]): React.ReactNode => {
        const actorName = notification.actorName || componentCopy.notificationCenter.fallbackActorName;
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
                return componentCopy.notificationCenter.newNotificationFrom(actorName);
        }
    };

    return (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-line/30 rounded-lg shadow-lg shadow-black/15 z-20">
            <div className="p-3 flex justify-between items-center border-b border-line/30">
                <h3 className="font-semibold">{componentCopy.notificationCenter.title}</h3>
                <button onClick={() => markAsRead(null)} className="text-sm text-brand hover:text-brand-soft transition">
                    {componentCopy.notificationCenter.markAllAsRead}
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="text-faint p-4 text-center">{componentCopy.notificationCenter.emptyState}</p>
                ) : (
                    notifications.map(n => {
                        if (!n.actorId) {
                            return (
                                <div key={n.id} className="flex items-start gap-3 p-3 text-faint">
                                    <div className="w-10 h-10 rounded-full bg-surface-secondary flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm">{componentCopy.notificationCenter.missingActor}</p>
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
                                className={`flex items-start gap-3 p-3 hover:bg-surface-secondary/70 transition ${!n.read ? 'bg-brand/10' : ''}`}
                            >
                                <Avatar seed={n.actorId} className="w-10 h-10 rounded-full flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted">{getNotificationText(n)}</p>
                                    <p className="text-xs text-faint">{formatDistanceToNow(new Date(n.createdAt))} {componentCopy.notificationCenter.ago}</p>
                                </div>
                                {!n.read && <div className="w-2.5 h-2.5 bg-brand rounded-full mt-2 flex-shrink-0"></div>}
                            </Link>
                        );
                    })
                )}
            </div>
            <div className="p-2 border-t border-line/30 text-center">
                <Link href="/notifications" onClick={onClose} className="text-sm font-medium text-brand hover:text-brand-soft transition">
                    {componentCopy.notificationCenter.viewAll}
                </Link>
            </div>
        </div>
    );
};

export default NotificationsDropdown;
