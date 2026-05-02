'use client';

import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { SettingsStatusBanner } from './settings/SettingsShell';
import { settingsCopy } from '../lib/app-copy';

const PushNotificationToggle: React.FC = () => {
    const { isSupported, subscription, subscribe, unsubscribe, loading } = usePushNotifications();
    const isSubscribed = Boolean(subscription);

    if (!isSupported) {
        return (
            <SettingsStatusBanner
                title={settingsCopy.pushNotifications.unsupportedTitle}
                description={settingsCopy.pushNotifications.notSupported}
                helperText={settingsCopy.pushNotifications.notSupportedHelper}
                icon={<BellOff className="h-5 w-5" />}
                badge={settingsCopy.pushNotifications.statusLabel}
                tone="warning"
            />
        );
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-line/25 bg-surface-secondary/45 p-5">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-brand/12 text-brand">
                        <Loader2
                            role="status"
                            aria-label={settingsCopy.pushNotifications.loadingAriaLabel}
                            className="h-5 w-5 animate-spin"
                        />
                    </div>
                    <div>
                        <p className="text-base font-semibold text-foreground">{settingsCopy.pushNotifications.title}</p>
                        <p className="mt-2 text-sm leading-6 text-faint">{settingsCopy.pushNotifications.loadingDescription}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-[24px] border border-line/25 bg-surface-secondary/45 p-5">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    <div
                        className={[
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10',
                            isSubscribed
                                ? 'bg-approval/12 text-approval'
                                : 'bg-surface/80 text-faint',
                        ].join(' ')}
                    >
                        {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-foreground">{settingsCopy.pushNotifications.title}</p>
                            <span
                                className={[
                                    'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                                    isSubscribed
                                        ? 'border-approval/20 bg-approval/10 text-approval-soft'
                                        : 'border-line/40 bg-surface/70 text-muted',
                                ].join(' ')}
                            >
                                {isSubscribed
                                    ? settingsCopy.pushNotifications.enabledState
                                    : settingsCopy.pushNotifications.disabledState}
                            </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-faint">
                            {isSubscribed
                                ? settingsCopy.pushNotifications.enabledDescription
                                : settingsCopy.pushNotifications.disabledDescription}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted">{settingsCopy.pushNotifications.helper}</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    className={[
                        'inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 lg:w-auto',
                        isSubscribed
                            ? 'border border-danger/25 bg-danger/10 text-danger-soft hover:bg-danger/15'
                            : 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-lg shadow-brand/20 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-xl',
                    ].join(' ')}
                >
                    {isSubscribed ? settingsCopy.pushNotifications.disable : settingsCopy.pushNotifications.enable}
                </button>
            </div>

        </div>
    );
};

export default PushNotificationToggle;
