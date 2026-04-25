'use client';

import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { settingsCopy } from '../lib/app-copy';

const PushNotificationToggle: React.FC = () => {
    const { isSupported, subscription, subscribe, unsubscribe, loading } = usePushNotifications();

    if (!isSupported) {
        return (
            <div className="text-gray-500 text-sm">
                {settingsCopy.pushNotifications.notSupported}
            </div>
        );
    }

    if (loading) {
        return <Loader2 role="status" aria-label={settingsCopy.pushNotifications.loadingAriaLabel} className="animate-spin w-5 h-5 text-indigo-500" />;
    }

    return (
        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-3">
                {subscription ? <Bell className="text-green-400" /> : <BellOff className="text-gray-400" />}
                <div>
                    <p className="font-medium text-white">{settingsCopy.pushNotifications.title}</p>
                    <p className="text-sm text-gray-400">
                        {subscription ? settingsCopy.pushNotifications.enabledDescription : settingsCopy.pushNotifications.disabledDescription}
                    </p>
                </div>
            </div>
            <button
                onClick={subscription ? unsubscribe : subscribe}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                    subscription
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
            >
                {subscription ? settingsCopy.pushNotifications.disable : settingsCopy.pushNotifications.enable}
            </button>
        </div>
    );
};

export default PushNotificationToggle;
