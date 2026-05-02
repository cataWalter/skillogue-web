'use client';

import { appClient } from '../../../lib/appClient';

import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, XCircle, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../../components/Button';
import {
    SettingsBackLink,
    SettingsHero,
    SettingsPage,
    SettingsSectionCard,
    SettingsStatusBanner,
} from '../../../components/settings/SettingsShell';
import { settingsCopy } from '../../../lib/app-copy';

export default function VerificationPage() {
    const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVerificationStatus();
    }, []);

    const fetchVerificationStatus = async () => {
        try {
            const { data: { user } } = await appClient.auth.getUser();
            if (!user) return;

            // Check if user is already verified in profile
            const { data: profile } = await appClient
                .from('profiles')
                .select('verified')
                .eq('id', user.id)
                .single();

            if (profile?.verified) {
                setStatus('approved');
                setLoading(false);
                return;
            }

            // Check for pending request
            const { data: request } = await appClient
                .from('verification_requests')
                .select('status')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (request) {
                setStatus(request.status as 'pending' | 'approved' | 'rejected');
            } else {
                setStatus('none');
            }
        } catch (error) {
            console.error('Error fetching verification status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestVerification = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await appClient.auth.getUser();
            if (!user) throw new Error(settingsCopy.verification.notAuthenticated);

            const { error } = await appClient
                .from('verification_requests')
                .insert({ user_id: user.id });

            if (error) throw error;

            setStatus('pending');
            toast.success(settingsCopy.verification.requestSubmitted);
        } catch (error: unknown) {
            console.error('Error requesting verification:', error);
            const message = error instanceof Error ? error.message : settingsCopy.verification.submitError;
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const statusBadge = {
        approved: settingsCopy.verification.approvedTitle,
        none: settingsCopy.verification.noneBadge,
        pending: settingsCopy.verification.pendingBadge,
        rejected: settingsCopy.verification.rejectedBadge,
    }[status];

    const statusTone = {
        approved: 'approval',
        none: 'brand',
        pending: 'warning',
        rejected: 'danger',
    }[status] as 'approval' | 'brand' | 'danger' | 'warning';

    return (
        <SettingsPage>
            <SettingsBackLink href="/settings" label={settingsCopy.verification.backToSettings} />
            <SettingsHero
                eyebrow={settingsCopy.verification.eyebrow}
                title={settingsCopy.verification.title}
                description={settingsCopy.verification.intro}
                icon={<ShieldCheck className="h-7 w-7" />}
                highlights={[statusBadge, settingsCopy.verification.requestNote]}
                tone={statusTone}
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <SettingsSectionCard
                    title={settingsCopy.verification.title}
                    description={settingsCopy.verification.intro}
                    icon={<ShieldCheck className="h-6 w-6" />}
                    badge={statusBadge}
                    tone={statusTone}
                >
                    {loading ? (
                        <SettingsStatusBanner
                            title={settingsCopy.verification.loading}
                            description={settingsCopy.verification.loadingDescription}
                            icon={<Loader2 role="status" aria-label={settingsCopy.verification.loading} className="h-5 w-5 animate-spin" />}
                            badge={statusBadge}
                            tone={statusTone}
                        />
                    ) : null}

                    {!loading && status === 'none' ? (
                        <>
                            <SettingsStatusBanner
                                title={settingsCopy.verification.noneTitle}
                                description={settingsCopy.verification.intro}
                                helperText={settingsCopy.verification.noneHelper}
                                icon={<ShieldCheck className="h-5 w-5" />}
                                badge={settingsCopy.verification.noneBadge}
                                tone="brand"
                            />
                            <div className="flex flex-col gap-3 rounded-2xl border border-line/25 bg-surface-secondary/45 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm leading-6 text-faint">{settingsCopy.verification.requestNote}</p>
                                <Button onClick={handleRequestVerification} className="w-full sm:w-auto">
                                    {settingsCopy.verification.requestButton}
                                </Button>
                            </div>
                        </>
                    ) : null}

                    {!loading && status === 'pending' ? (
                        <SettingsStatusBanner
                            title={settingsCopy.verification.pendingTitle}
                            description={settingsCopy.verification.pendingDescription}
                            helperText={settingsCopy.verification.pendingHelper}
                            icon={<Clock className="h-5 w-5" />}
                            badge={settingsCopy.verification.pendingBadge}
                            tone="warning"
                        />
                    ) : null}

                    {!loading && status === 'approved' ? (
                        <SettingsStatusBanner
                            title={settingsCopy.verification.approvedTitle}
                            description={settingsCopy.verification.approvedDescription}
                            helperText={settingsCopy.verification.approvedHelper}
                            icon={<CheckCircle className="h-5 w-5" />}
                            badge={settingsCopy.verification.approvedTitle}
                            tone="approval"
                        />
                    ) : null}

                    {!loading && status === 'rejected' ? (
                        <SettingsStatusBanner
                            title={settingsCopy.verification.rejectedTitle}
                            description={settingsCopy.verification.rejectedDescription}
                            helperText={settingsCopy.verification.rejectedHelper}
                            icon={<XCircle className="h-5 w-5" />}
                            badge={settingsCopy.verification.rejectedBadge}
                            tone="danger"
                            action={
                                <Button onClick={handleRequestVerification} variant="outline" className="!border-danger/30 !text-danger-soft hover:!bg-danger/10">
                                    {settingsCopy.verification.tryAgain}
                                </Button>
                            }
                        />
                    ) : null}
                </SettingsSectionCard>

                <SettingsSectionCard
                    title={settingsCopy.verification.benefitsTitle}
                    description={settingsCopy.verification.requestNote}
                    icon={<Sparkles className="h-6 w-6" />}
                    badge={settingsCopy.verification.eyebrow}
                    tone="brand"
                >
                    {settingsCopy.verification.benefits.map((benefit) => (
                        <div key={benefit} className="rounded-2xl border border-line/25 bg-surface-secondary/45 px-4 py-4">
                            <p className="text-sm leading-6 text-faint">{benefit}</p>
                        </div>
                    ))}
                </SettingsSectionCard>
            </div>
        </SettingsPage>
    );
}
