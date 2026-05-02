'use client';

import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { AdminSystemControls } from '@/lib/admin-dashboard';
import { DEFAULT_ADMIN_SYSTEM_CONTROLS } from '@/lib/admin-dashboard';
import { PanelShell } from '@/components/admin/AdminDashboardPrimitives';
import { adminCopy } from '@/lib/app-copy';
import {
    adminCardClassName,
    adminFieldClassName,
    fetchJson,
    createLastUpdatedLabel,
} from '../_shared';

export default function AdminControlsPage() {
    const [settings, setSettings] = useState<AdminSystemControls>(DEFAULT_ADMIN_SYSTEM_CONTROLS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const payload = await fetchJson<AdminSystemControls>('/api/admin/settings');
                setSettings(payload);
            } catch (loadError) {
                console.error('Error loading admin settings:', loadError);
                setError(loadError instanceof Error ? loadError.message : 'Failed to load settings.');
            } finally {
                setLoading(false);
            }
        };

        void loadSettings();
    }, []);

    const handleSaveSettings = async () => {
        setSaving(true);

        try {
            const payload = await fetchJson<AdminSystemControls>('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            setSettings(payload);
            toast.success(adminCopy.dashboard.actionMessages.controlsSaved);
        } catch (saveError) {
            console.error('Error saving admin settings:', saveError);
            toast.error(
                saveError instanceof Error ? saveError.message : 'Failed to save system controls.'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-foreground">Loading system controls...</div>;
    }

    if (error) {
        return <div className="text-danger-soft">{error}</div>;
    }

    return (
        <div className="space-y-8 text-foreground">
            {/* Header */}
            <div className="rounded-3xl border border-line/30 bg-surface/80 p-8 shadow-2xl shadow-black/10">
                <p className="text-xs uppercase tracking-[0.35em] text-brand">{adminCopy.dashboard.eyebrow}</p>
                <h1 className="mt-3 text-4xl font-semibold">{adminCopy.layout.controls}</h1>
                <p className="mt-2 text-sm text-muted">{adminCopy.dashboard.controlsSubtitle}</p>
                <p className="mt-2 text-sm text-faint">{createLastUpdatedLabel(settings.updatedAt ?? null)}</p>
            </div>

            <PanelShell
                icon={<SlidersHorizontal className="text-warning" />}
                title={adminCopy.dashboard.controlsTitle}
                description={adminCopy.dashboard.controlsSubtitle}
                action={
                    <div className="text-sm text-faint">
                        {createLastUpdatedLabel(settings.updatedAt ?? null)}
                    </div>
                }
            >
                <div className="space-y-4">
                    <label className="block text-sm text-muted">
                        <span>{adminCopy.dashboard.maintenanceBannerLabel}</span>
                        <textarea
                            value={settings.maintenanceBannerText}
                            onChange={(event) =>
                                setSettings((current) => ({
                                    ...current,
                                    maintenanceBannerText: event.target.value,
                                }))
                            }
                            placeholder={adminCopy.dashboard.maintenanceBannerPlaceholder}
                            className={`mt-2 min-h-[120px] ${adminFieldClassName}`}
                        />
                    </label>

                    <label
                        className={`flex items-start gap-3 ${adminCardClassName} cursor-pointer text-sm text-muted`}
                    >
                        <input
                            type="checkbox"
                            checked={settings.moderationHold}
                            onChange={(event) =>
                                setSettings((current) => ({
                                    ...current,
                                    moderationHold: event.target.checked,
                                }))
                            }
                            className="mt-1 h-4 w-4 rounded border-line/50 bg-surface text-brand focus:ring-brand"
                        />
                        <span>
                            <span className="block font-medium text-foreground">
                                {adminCopy.dashboard.moderationHoldLabel}
                            </span>
                            <span className="mt-1 block text-muted">
                                {adminCopy.dashboard.moderationHoldDescription}
                            </span>
                        </span>
                    </label>

                    <button
                        type="button"
                        onClick={() => void handleSaveSettings()}
                        disabled={saving}
                        className="w-full rounded-xl bg-warning px-4 py-3 text-sm font-semibold text-surface-overlay hover:bg-warning-start-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {adminCopy.dashboard.saveControlsAction}
                    </button>
                </div>
            </PanelShell>
        </div>
    );
}
