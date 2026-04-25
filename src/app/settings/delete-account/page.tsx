'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/Button';
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
        <main className="flex-grow flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-lg bg-gray-900/70 backdrop-blur-sm border border-red-500/50 rounded-2xl shadow-2xl p-8">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{settingsCopy.deleteAccount.title}</h2>
                    <p className="mt-2 text-gray-400">
                        {settingsCopy.deleteAccount.intro}
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="confirmation" className="block text-sm font-medium text-gray-300 mb-2">
                            {settingsCopy.deleteAccount.confirmLabel}
                        </label>
                        <input
                            id="confirmation"
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-500"
                            placeholder={settingsCopy.deleteAccount.confirmPlaceholder}
                            disabled={isLoading}
                        />
                    </div>

                    {errorMessage && (
                        <div className="bg-red-900/30 text-red-300 p-3 rounded-lg text-sm flex items-start">
                            <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
                            {errorMessage}
                        </div>
                    )}

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
        </main>
    );
};

export default DeleteAccount;
