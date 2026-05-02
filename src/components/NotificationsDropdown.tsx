'use client';

// src/components/NotificationsDropdown.tsx
import React from 'react';
import Link from 'next/link';
import { useNotifications } from '../context/NotificationContext';
import Avatar from './Avatar';
import { formatDistanceToNow } from 'date-fns';
import { componentCopy } from '../lib/app-copy';
import { MessageCircle, Heart, Eye, Sparkles, Megaphone, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type TypeIconConfig = {
    icon: LucideIcon;
    bg: string;
};

const typeIconConfig: Record<string, TypeIconConfig> = {
    new_message:   { icon: MessageCircle, bg: 'bg-blue-500' },
    new_favorite:  { icon: Heart,         bg: 'bg-rose-500' },
    profile_visit: { icon: Eye,           bg: 'bg-violet-500' },
    new_match:     { icon: Sparkles,      bg: 'bg-amber-500' },
    admin_notice:  { icon: Megaphone,     bg: 'bg-orange-500' },
};

const NotificationsDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { notifications, markAsRead } = useNotifications();

    const getNotificationLink = (notification: typeof notifications[number]): string => {
        if (notification.url) return notification.url;
        if (!notification.actorId) {
            return notification.type === 'admin_notice' ? '/notifications' : '/notifications';
        }
        switch (notification.type) {
            case 'new_message': return `/messages?conversation=${notification.actorId}`;
            case 'new_favorite':
            case 'profile_visit': return `/user/${notification.actorId}`;
            case 'new_match': return `/messages?conversation=${notification.actorId}`;
            default: return '/notifications';
        }
    };

    const getNotificationText = (notification: typeof notifications[number]): React.ReactNode => {
        const nc = componentCopy.notificationCenter;
        const actorName = notification.actorName || nc.fallbackActorName;

        switch (notification.type) {
            case 'new_message':
                return <><strong>{actorName}</strong> {nc.sentMessage}</>;
            case 'new_favorite':
                return <><strong>{actorName}</strong> {nc.savedYourProfile}</>;
            case 'profile_visit':
                return <><strong>{actorName}</strong> {nc.viewedYourProfile}</>;
            case 'new_match':
                return <><strong>{actorName}</strong> {nc.isAMatch}</>;
            case 'admin_notice': {
                if (notification.title) {
                    return notification.body
                        ? <><strong>{notification.title}</strong> — {notification.body}</>
                        : <strong>{notification.title}</strong>;
                }
                return notification.body || nc.defaultNotification;
            }
            default:
                return notification.title
                    ? <strong>{notification.title}</strong>
                    : nc.newNotificationFrom(actorName);
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
                        const iconCfg = typeIconConfig[n.type] ?? { icon: Bell, bg: 'bg-muted' };
                        const TypeIcon = iconCfg.icon;

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
                                <div className="relative flex-shrink-0 mt-1">
                                    {n.actorId ? (
                                        <Avatar seed={n.actorId} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center">
                                            <TypeIcon size={18} className="text-faint" />
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${iconCfg.bg}`}>
                                        <TypeIcon size={9} className="text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-muted">{getNotificationText(n)}</p>
                                    <p className="text-xs text-faint mt-0.5">{formatDistanceToNow(new Date(n.createdAt))} {componentCopy.notificationCenter.ago}</p>
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
