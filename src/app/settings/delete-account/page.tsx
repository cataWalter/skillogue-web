'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/Button';

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
        if (confirmationText !== 'DELETE') {
            setErrorMessage('To confirm, you must type "DELETE" in the box.');
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
                throw new Error(payload?.message || 'Failed to delete account');
            }

            // Redirect to the home page.
            // Note: Next.js router.push doesn't support state like react-router-dom.
            // If we need to show a message, we could use a query param like /?deleted=true
            router.push('/?deleted=true');

        } catch (err: unknown) {
            console.error('Account deletion error:', err);
            const message = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again later.';
            setErrorMessage(`Failed to delete account: ${message}`);
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
                    <h2 className="text-2xl font-bold text-white">Delete Account</h2>
                    <p className="mt-2 text-gray-400">
                        This is a permanent action and cannot be undone. All your data, including your profile, messages, and connections, will be permanently removed.
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="confirmation" className="block text-sm font-medium text-gray-300 mb-2">
                            To confirm, please type &quot;<strong>DELETE</strong>&quot; below:
                        </label>
                        <input
                            id="confirmation"
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-500"
                            placeholder="DELETE"
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
                        Permanently Delete Account
                    </Button>
                </div>
            </div>
        </main>
    );
};

export default DeleteAccount;
