'use client';

import React from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    BadgeCheck,
    BellRing,
    Download,
    EyeOff,
    KeyRound,
    Lock,
    Settings as SettingsIcon,
    User,
    UserPen,
    UserX,
} from 'lucide-react';
import PushNotificationToggle from '../../components/PushNotificationToggle';
import {
    SettingsActionRow,
    SettingsBackLink,
    SettingsHero,
    SettingsPage,
    SettingsSectionCard,
} from '../../components/settings/SettingsShell';
import { settingsCopy } from '../../lib/app-copy';
import { useProfileGate } from '../../hooks/useProfileGate';

const Settings: React.FC = () => {
    useProfileGate();
    const accountActions = [
        {
            actionLabel: settingsCopy.main.requestVerificationAction,
            description: settingsCopy.main.requestVerificationDescription,
            href: '/settings/verification',
            icon: <BadgeCheck size={20} />,
            status: settingsCopy.main.requestVerificationStatus,
            title: settingsCopy.main.requestVerification,
            tone: 'brand' as const,
        },
        {
            actionLabel: settingsCopy.main.changePasswordAction,
            description: settingsCopy.main.changePasswordDescription,
            href: '/change-password',
            icon: <KeyRound size={20} />,
            status: settingsCopy.main.changePasswordStatus,
            title: settingsCopy.main.changePassword,
            tone: 'info' as const,
        },
        {
            actionLabel: settingsCopy.main.deleteAccountAction,
            description: settingsCopy.main.deleteAccountDescription,
            href: '/settings/delete-account',
            icon: <AlertTriangle size={20} />,
            status: settingsCopy.main.deleteAccountStatus,
            title: settingsCopy.main.deleteAccount,
            tone: 'danger' as const,
        },
    ];

    const privacyActions = [
        {
            actionLabel: settingsCopy.main.profileVisibilityPrivacyAction,
            description: settingsCopy.main.profileVisibilityPrivacyDescription,
            href: '/settings/privacy',
            icon: <EyeOff size={20} />,
            status: settingsCopy.main.profileVisibilityPrivacyStatus,
            title: settingsCopy.main.profileVisibilityPrivacy,
            tone: 'discovery' as const,
        },
        {
            actionLabel: settingsCopy.main.manageBlockedUsersAction,
            description: settingsCopy.main.manageBlockedUsersDescription,
            href: '/settings/blocked',
            icon: <UserX size={20} />,
            status: settingsCopy.main.manageBlockedUsersStatus,
            title: settingsCopy.main.manageBlockedUsers,
            tone: 'danger' as const,
        },
        {
            actionLabel: settingsCopy.main.downloadMyDataAction,
            description: settingsCopy.main.downloadMyDataDescription,
            href: '/settings/data-export',
            icon: <Download size={20} />,
            status: settingsCopy.main.downloadMyDataStatus,
            title: settingsCopy.main.downloadMyData,
            tone: 'info' as const,
        },
    ];

    return (
        <SettingsPage>
            <SettingsBackLink href="/dashboard" label={settingsCopy.main.backToDashboard} />

            <SettingsHero
                eyebrow={settingsCopy.main.eyebrow}
                title={settingsCopy.main.title}
                description={settingsCopy.main.overview}
                icon={<SettingsIcon className="h-7 w-7" />}
                actions={
                    <>
                        <Link
                            href="/edit-profile"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-start to-brand-end px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-xl sm:w-auto"
                        >
                            <UserPen size={18} />
                            {settingsCopy.main.editProfileDetails}
                        </Link>
                        <Link
                            href="/profile"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line/40 bg-surface-secondary/70 px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:bg-surface-secondary sm:w-auto"
                        >
                            <User size={18} />
                            {settingsCopy.main.viewMyProfile}
                        </Link>
                    </>
                }
            />

            <div className="mt-6 space-y-6">
                <SettingsSectionCard
                    title={settingsCopy.main.profile}
                    description={settingsCopy.main.profileDescription}
                    icon={<User className="h-6 w-6" />}
                    badge={settingsCopy.main.profilePanelBadge}
                    tone="brand"
                >
                    <SettingsActionRow
                        title={settingsCopy.main.viewMyProfile}
                        actionLabel={settingsCopy.main.viewMyProfileAction}
                        description={settingsCopy.main.viewMyProfileDescription}
                        href="/profile"
                        icon={<User size={20} />}
                        status={settingsCopy.main.viewMyProfileStatus}
                        tone="brand"
                    />
                    <SettingsActionRow
                        title={settingsCopy.main.editProfileDetails}
                        actionLabel={settingsCopy.main.editProfileDetailsAction}
                        description={settingsCopy.main.editProfileDescription}
                        href="/edit-profile"
                        icon={<UserPen size={20} />}
                        status={settingsCopy.main.editProfileStatus}
                        tone="brand"
                    />
                </SettingsSectionCard>

                <SettingsSectionCard
                    title={settingsCopy.main.account}
                    description={settingsCopy.main.accountDescription}
                    icon={<Lock className="h-6 w-6" />}
                    badge="Security"
                    tone="brand"
                >
                    {accountActions.map((action) => (
                        <SettingsActionRow key={action.title} {...action} />
                    ))}
                </SettingsSectionCard>

                <SettingsSectionCard
                    title={settingsCopy.main.privacy}
                    description={settingsCopy.main.privacyDescription}
                    icon={<EyeOff className="h-6 w-6" />}
                    badge="Visibility"
                    tone="discovery"
                >
                    {privacyActions.map((action) => (
                        <SettingsActionRow key={action.title} {...action} />
                    ))}
                </SettingsSectionCard>

                <SettingsSectionCard
                    title={settingsCopy.main.notifications}
                    description={settingsCopy.main.notificationsDescription}
                    icon={<BellRing className="h-6 w-6" />}
                    badge="Device alerts"
                    tone="info"
                >
                    <PushNotificationToggle />
                </SettingsSectionCard>

            </div>
        </SettingsPage>
    );
};

export default Settings;
