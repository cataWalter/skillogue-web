'use client';

import React from 'react';
import Link from 'next/link';
import { useNotifications } from '../../context/NotificationContext';
import Avatar from '../../components/Avatar';
import { Bell, CheckCheck, MessageCircle, Heart, Eye, Sparkles, Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { componentCopy } from '../../lib/app-copy';
import { useProfileGate } from '../../hooks/useProfileGate';
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

const NotificationsPage: React.FC = () => {
    const { notifications, unreadCount, markAsRead } = useNotifications();
    useProfileGate();

    const getNotificationLink = (notification: typeof notifications[number]): string => {
        if (notification.url) return notification.url;
        if (!notification.actorId) {
            return notification.type === 'admin_notice' ? '/notifications' : '#';
        }
        switch (notification.type) {
            case 'new_message': return `/messages?conversation=${notification.actorId}`;
            case 'new_favorite':
            case 'profile_visit': return `/user/${notification.actorId}`;
            case 'new_match': return `/messages?conversation=${notification.actorId}`;
            default: return '#';
        }
    };

    const getNotificationText = (notification: typeof notifications[number]): React.ReactNode => {
        const nc = componentCopy.notificationCenter;
        const actorName = notification.actorName || nc.genericActorName;

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
                    : nc.defaultNotification;
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
                        {notifications.map(n => {
                            const iconCfg = typeIconConfig[n.type] ?? { icon: Bell, bg: 'bg-muted' };
                            const TypeIcon = iconCfg.icon;

                            return (
                                <li key={n.id}>
                                    <Link
                                        href={getNotificationLink(n)}
                                        onClick={() => handleNotificationOpen(n)}
                                        className={`flex items-start gap-4 p-4 transition-all duration-300 ${n.read ? 'hover:bg-surface-secondary/35' : 'bg-brand/12 hover:bg-brand/18'}`}
                                    >
                                        <div className="relative flex-shrink-0 mt-1">
                                            {n.actorId ? (
                                                <Avatar seed={n.actorId} className="w-12 h-12 rounded-full" />
                                            ) : (
                                                <div className="glass-surface h-12 w-12 rounded-full flex items-center justify-center">
                                                    <TypeIcon size={22} className="text-faint" />
                                                </div>
                                            )}
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center ${iconCfg.bg}`}>
                                                <TypeIcon size={10} className="text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
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
                            );
                        })}
                    </ul>
                )}
            </div>
        </main>
    );
};

export default NotificationsPage;
