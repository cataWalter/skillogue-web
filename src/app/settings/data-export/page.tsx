'use client';

import { useState } from 'react';
import { getUserData } from '@/app/actions/export-data';
import { CheckCircle2, Download, FileJson, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    SettingsBackLink,
    SettingsHero,
    SettingsPage,
    SettingsSectionCard,
    SettingsStatusBanner,
} from '../../../components/settings/SettingsShell';
import { settingsCopy } from '../../../lib/app-copy';

export default function DataExportPage() {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const data = await getUserData();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `skillogue-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success(settingsCopy.dataExport.exportStarted);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error(settingsCopy.dataExport.exportError);
        } finally {
            setLoading(false);
        }
    };

    const includedItems = [
        settingsCopy.dataExport.includedProfileDetails,
        settingsCopy.dataExport.includedAccountInfo,
        settingsCopy.dataExport.includedPassionsLanguages,
        settingsCopy.dataExport.includedMessages,
        settingsCopy.dataExport.includedBlockedUsers,
    ];

    return (
        <SettingsPage>
            <SettingsBackLink href="/settings" label={settingsCopy.dataExport.backToSettings} />
            <SettingsHero
                eyebrow={settingsCopy.dataExport.eyebrow}
                title={settingsCopy.dataExport.title}
                description={settingsCopy.dataExport.intro}
                icon={<FileJson className="h-7 w-7" />}
                highlights={[settingsCopy.dataExport.formatBadge, settingsCopy.dataExport.downloadNote]}
                tone="info"
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <SettingsSectionCard
                    title={settingsCopy.dataExport.includedTitle}
                    description={settingsCopy.dataExport.includedLead}
                    icon={<FileJson className="h-6 w-6" />}
                    badge={settingsCopy.dataExport.formatBadge}
                    tone="info"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        {includedItems.map((item) => (
                            <div key={item} className="flex items-start gap-3 rounded-2xl border border-line/25 bg-surface-secondary/45 px-4 py-4">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-info" />
                                <p className="text-sm leading-6 text-faint">{item}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={loading}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-start to-brand-end px-6 py-3 font-semibold text-white shadow-lg shadow-brand/20 transition hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" size={20} />
                                {settingsCopy.dataExport.preparing}
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                {settingsCopy.dataExport.downloadButton}
                            </>
                        )}
                    </button>
                </SettingsSectionCard>

                <div className="space-y-6">
                    <SettingsSectionCard
                        title={settingsCopy.dataExport.expectationsTitle}
                        description={settingsCopy.dataExport.downloadNote}
                        icon={<Sparkles className="h-6 w-6" />}
                        badge={settingsCopy.dataExport.eyebrow}
                        tone="brand"
                    >
                        {settingsCopy.dataExport.expectations.map((expectation) => (
                            <div key={expectation} className="rounded-2xl border border-line/25 bg-surface-secondary/45 px-4 py-4">
                                <p className="text-sm leading-6 text-faint">{expectation}</p>
                            </div>
                        ))}
                    </SettingsSectionCard>

                    <SettingsStatusBanner
                        title={settingsCopy.dataExport.downloadButton}
                        description={settingsCopy.dataExport.securityNote}
                        helperText={settingsCopy.dataExport.downloadNote}
                        icon={<ShieldCheck className="h-5 w-5" />}
                        badge={settingsCopy.dataExport.formatBadge}
                        tone="warning"
                    />
                </div>
            </div>
        </SettingsPage>
    );
}