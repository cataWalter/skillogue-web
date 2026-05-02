'use client';

import { appClient } from '../../../lib/appClient';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, MapPin, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    SettingsBackLink,
    SettingsHero,
    SettingsPage,
    SettingsSectionCard,
    SettingsStatusBanner,
    SettingsToggleRow,
} from '../../../components/settings/SettingsShell';
import { settingsCopy } from '../../../lib/app-copy';

const PrivacySettings: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        is_private: false,
        show_age: true,
        show_location: true
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await appClient.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await appClient
                .from('profiles')
                .select('is_private, show_age, show_location')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching privacy settings:', error);
                // Don't show error toast on initial load if columns don't exist yet, just default
            } else if (data) {
                setSettings({
                    is_private: data.is_private || false,
                    show_age: data.show_age ?? true,
                    show_location: data.show_location ?? true
                });
            }
            setLoading(false);
        };

        fetchSettings();
    }, [router]);

    const updateSetting = async (key: keyof typeof settings, value: boolean) => {
        // Optimistic update
        setSettings(prev => ({ ...prev, [key]: value }));

        const { data: { user } } = await appClient.auth.getUser();
        if (!user) return;

        const { error } = await appClient
            .from('profiles')
            .update({ [key]: value })
            .eq('id', user.id);

        if (error) {
            console.error(`Error updating ${key}:`, error);
            toast.error(settingsCopy.privacy.updateError);
            // Rollback
            setSettings(prev => ({ ...prev, [key]: !value }));
        } else {
            toast.success(settingsCopy.privacy.updateSuccess);
        }
    };

    const visibilityHighlights = Array.from(new Set([
        settings.is_private ? settingsCopy.privacy.privateProfileEnabled : settingsCopy.privacy.privateProfileDisabled,
        settings.show_age ? settingsCopy.privacy.showAgeEnabled : settingsCopy.privacy.showAgeDisabled,
        settings.show_location ? settingsCopy.privacy.showLocationEnabled : settingsCopy.privacy.showLocationDisabled,
    ]));

    if (loading) {
        return (
            <SettingsPage>
                <SettingsBackLink href="/settings" label={settingsCopy.privacy.backToSettings} />
                <SettingsHero
                    eyebrow={settingsCopy.privacy.eyebrow}
                    title={settingsCopy.privacy.title}
                    description={settingsCopy.privacy.subtitle}
                    icon={<Lock className="h-7 w-7" />}
                    highlights={visibilityHighlights}
                    tone="discovery"
                />
                <div className="mt-6">
                    <SettingsStatusBanner
                        title={settingsCopy.privacy.loading}
                        description={settingsCopy.privacy.loadingDescription}
                        icon={<Loader2 role="status" aria-label={settingsCopy.privacy.loading} className="h-5 w-5 animate-spin" />}
                        badge={settingsCopy.privacy.eyebrow}
                        tone="discovery"
                    />
                </div>
            </SettingsPage>
        );
    }

    return (
        <SettingsPage>
            <SettingsBackLink href="/settings" label={settingsCopy.privacy.backToSettings} />
            <SettingsHero
                eyebrow={settingsCopy.privacy.eyebrow}
                title={settingsCopy.privacy.title}
                description={settingsCopy.privacy.subtitle}
                icon={<Lock className="h-7 w-7" />}
                highlights={visibilityHighlights}
                tone="discovery"
            />

            <div className="mt-6">
                <SettingsSectionCard
                    title={settingsCopy.main.profileVisibilityPrivacy}
                    description={settingsCopy.privacy.saveHint}
                    icon={<Eye className="h-6 w-6" />}
                    badge={settingsCopy.privacy.eyebrow}
                    tone="discovery"
                >
                    <SettingsToggleRow
                        title={settingsCopy.privacy.privateProfileTitle}
                        description={settingsCopy.privacy.privateProfileDescription}
                        icon={<Eye size={20} />}
                        checked={settings.is_private}
                        checkedLabel={settingsCopy.privacy.privateProfileEnabled}
                        uncheckedLabel={settingsCopy.privacy.privateProfileDisabled}
                        onChange={(checked) => {
                            void updateSetting('is_private', checked);
                        }}
                        tone="discovery"
                    />
                    <SettingsToggleRow
                        title={settingsCopy.privacy.showAgeTitle}
                        description={settingsCopy.privacy.showAgeDescription}
                        icon={<Calendar size={20} />}
                        checked={settings.show_age}
                        checkedLabel={settingsCopy.privacy.showAgeEnabled}
                        uncheckedLabel={settingsCopy.privacy.showAgeDisabled}
                        onChange={(checked) => {
                            void updateSetting('show_age', checked);
                        }}
                        tone="brand"
                    />
                    <SettingsToggleRow
                        title={settingsCopy.privacy.showLocationTitle}
                        description={settingsCopy.privacy.showLocationDescription}
                        icon={<MapPin size={20} />}
                        checked={settings.show_location}
                        checkedLabel={settingsCopy.privacy.showLocationEnabled}
                        uncheckedLabel={settingsCopy.privacy.showLocationDisabled}
                        onChange={(checked) => {
                            void updateSetting('show_location', checked);
                        }}
                        tone="info"
                    />
                </SettingsSectionCard>

            </div>
        </SettingsPage>
    );
};

export default PrivacySettings;
