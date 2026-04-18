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
    Sparkles,
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
    SettingsStatusBanner,
} from '../../components/settings/SettingsShell';
import { settingsCopy } from '../../lib/app-copy';

const Settings: React.FC = () => {
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

    const sectionGuide = [
        {
            badge: settingsCopy.main.quickGuideProfileBadge,
            description: settingsCopy.main.quickGuideProfileDescription,
            icon: <User className="h-5 w-5" />,
            title: settingsCopy.main.quickGuideProfileTitle,
        },
        {
            badge: settingsCopy.main.quickGuidePrivacyBadge,
            description: settingsCopy.main.quickGuidePrivacyDescription,
            icon: <EyeOff className="h-5 w-5" />,
            title: settingsCopy.main.quickGuidePrivacyTitle,
        },
        {
            badge: settingsCopy.main.quickGuideAccountBadge,
            description: settingsCopy.main.quickGuideAccountDescription,
            icon: <Lock className="h-5 w-5" />,
            title: settingsCopy.main.quickGuideAccountTitle,
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
                highlights={settingsCopy.main.heroHighlights}
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

            <section className="mt-6 rounded-[26px] border border-line/30 bg-surface/75 p-5 shadow-[0_18px_50px_-26px_rgba(15,23,42,0.4)] backdrop-blur-sm sm:p-6">
                <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0 space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{settingsCopy.main.quickGuideTitle}</h2>
                        <p className="max-w-3xl text-sm leading-6 text-faint">{settingsCopy.main.quickGuideDescription}</p>
                    </div>
                </div>
                <div className="mt-5 grid gap-4">
                    {sectionGuide.map((section) => (
                        <div key={section.title} className="rounded-2xl border border-line/25 bg-surface-secondary/45 p-4">
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-surface text-foreground shadow-sm">
                                    {section.icon}
                                </div>
                                <div className="min-w-0">
                                    <span className="inline-flex rounded-full border border-line/35 bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                                        {section.badge}
                                    </span>
                                    <h3 className="mt-3 text-lg font-semibold text-foreground">{section.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-faint">{section.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="mt-6 space-y-6">
                <SettingsSectionCard
                    title={settingsCopy.main.profile}
                    description={settingsCopy.main.profileDescription}
                    icon={<User className="h-6 w-6" />}
                    badge={settingsCopy.main.profilePanelBadge}
                    tone="brand"
                >
                    <div className="rounded-2xl border border-line/25 bg-surface-secondary/45 p-5">
                        <p className="text-sm leading-6 text-faint">{settingsCopy.main.profilePanelHelper}</p>
                        <div className="mt-4 grid gap-3">
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
                        </div>
                    </div>
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

                <SettingsStatusBanner
                    title={settingsCopy.main.dedicatedPageTitle}
                    description={settingsCopy.main.dedicatedPageNote}
                    helperText={settingsCopy.main.notificationHelper}
                    icon={<Sparkles className="h-5 w-5" />}
                    badge={settingsCopy.main.hubGuideBadge}
                    tone="brand"
                />
            </div>
        </SettingsPage>
    );
};

export default Settings;
