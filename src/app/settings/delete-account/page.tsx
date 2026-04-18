'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/Button';
import {
    SettingsBackLink,
    SettingsDangerPanel,
    SettingsHero,
    SettingsPage,
    SettingsStatusBanner,
} from '../../../components/settings/SettingsShell';
import { settingsCopy } from '../../../lib/app-copy';

/**
 * Renders the account deletion page.
 * This component provides a final confirmation step for users wishing to permanently
 * delete their account and all associated data.
 */
const DeleteAccount: React.FC = () => {
    const [confirmationText, setConfirmationText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const router = useRouter();

    /**
     * Handles the account deletion process.
     * It validates the user's confirmation, deletes the local profile graph,
     * removes the Appwrite account on the backend, and redirects them.
     */
    const handleDeleteAccount = async () => {
        if (confirmationText !== settingsCopy.deleteAccount.confirmPlaceholder) {
            setErrorMessage(settingsCopy.deleteAccount.confirmError);
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await fetch('/api/auth/account', {
                method: 'DELETE',
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.message || settingsCopy.deleteAccount.deleteFailed);
            }

            // Redirect to the home page.
            // Note: Next.js router.push doesn't support state like react-router-dom.
            // If we need to show a message, we could use a query param like /?deleted=true
            router.push('/?deleted=true');

        } catch (err: unknown) {
            console.error('Account deletion error:', err);
            const message = err instanceof Error ? err.message : settingsCopy.deleteAccount.unexpectedError;
            setErrorMessage(`${settingsCopy.deleteAccount.deleteFailed}: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsPage>
            <SettingsBackLink href="/settings" label={settingsCopy.deleteAccount.backToSettings} />
            <SettingsHero
                eyebrow={settingsCopy.deleteAccount.eyebrow}
                title={settingsCopy.deleteAccount.title}
                description={settingsCopy.deleteAccount.subtitle}
                icon={<AlertTriangle className="h-7 w-7" aria-hidden="true" />}
                highlights={settingsCopy.deleteAccount.checklist}
                tone="danger"
            />

            <div className="mt-6">
                <SettingsDangerPanel
                    title={settingsCopy.deleteAccount.warningTitle}
                    description={settingsCopy.deleteAccount.intro}
                    icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
                >
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                        <div className="rounded-2xl border border-danger/20 bg-surface/70 p-5">
                            <h3 className="text-lg font-semibold text-foreground">{settingsCopy.deleteAccount.checklistTitle}</h3>
                            <ul className="mt-4 space-y-3">
                                {settingsCopy.deleteAccount.checklist.map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <span className="mt-2 h-2 w-2 rounded-full bg-danger" />
                                        <p className="text-sm leading-6 text-faint">{item}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-line/30 bg-surface/75 p-5">
                            <label htmlFor="confirmation" className="block text-sm font-medium text-muted">
                                {settingsCopy.deleteAccount.confirmLabel}
                            </label>
                            <p className="mt-2 text-sm leading-6 text-faint">{settingsCopy.deleteAccount.confirmationHelp}</p>
                            <input
                                id="confirmation"
                                type="text"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                className="mt-4 w-full rounded-2xl border border-line/40 bg-surface-secondary px-4 py-3 text-foreground placeholder-faint transition focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/30"
                                placeholder={settingsCopy.deleteAccount.confirmPlaceholder}
                                disabled={isLoading}
                            />

                            {errorMessage ? (
                                <div className="mt-4">
                                    <SettingsStatusBanner
                                        title={settingsCopy.deleteAccount.warningTitle}
                                        description={errorMessage}
                                        icon={<AlertTriangle className="h-5 w-5" />}
                                        badge={settingsCopy.deleteAccount.eyebrow}
                                        tone="danger"
                                    />
                                </div>
                            ) : null}

                            <div className="mt-5">
                                <Button
                                    variant="danger"
                                    isLoading={isLoading}
                                    onClick={handleDeleteAccount}
                                    className="w-full"
                                >
                                    {settingsCopy.deleteAccount.submit}
                                </Button>
                            </div>
                        </div>
                    </div>
                </SettingsDangerPanel>
            </div>
        </SettingsPage>
    );
};

export default DeleteAccount;
