// src/app/(main)/notifications/page.tsx

import Link from 'next/link';
import { getNotifications, markNotificationsAsRead } from './actions';
import { BellIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export default async function NotificationsPage() {
    // Mark notifications as read when the page is loaded
    await markNotificationsAsRead();

    const { notifications, error } = await getNotifications();

    if (error) {
        return <div className="text-red-500 text-center p-8">{error}</div>;
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_follower':
                return <UserPlusIcon className="h-6 w-6 text-blue-500" />;
            // Add cases for other notification types here
            default:
                return <BellIcon className="h-6 w-6 text-gray-500" />;
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Notifications</h1>
            <div className="space-y-4">
                {notifications && notifications.length > 0 ? (
                    notifications.map(notif => (
                        <Link href={notif.link || '#'} key={notif.id} legacyBehavior>
                            <a className={`block p-4 rounded-lg shadow hover:bg-gray-100 ${notif.read ? 'bg-white' : 'bg-blue-50'}`}>
                                <div className="flex items-center space-x-4">
                                    <div>{getIcon(notif.type)}</div>
                                    <div>
                                        <p className="text-gray-800">{notif.message}</p>
                                        <p className="text-xs text-gray-500">{new Date(notif.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </a>
                        </Link>
                    ))
                ) : (
                    <div className="text-center p-8 bg-white rounded-lg shadow">
                        <p>You have no notifications.</p>
                    </div>
                )}
            </div>
        </div>
    );
}