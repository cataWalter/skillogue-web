// src/pages/DeleteAccount.tsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

/**
 * Renders the account deletion page.
 * This component provides a final confirmation step for users wishing to permanently
 * delete their account and all associated data.
 */
const DeleteAccount: React.FC = () => {
    const [confirmationText, setConfirmationText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const navigate = useNavigate();

    /**
     * Handles the account deletion process.
     * It validates the user's confirmation, calls a secure Supabase RPC function
     * to perform the deletion on the backend, signs the user out, and redirects them.
     */
    const handleDeleteAccount = async () => {
        if (confirmationText !== 'DELETE') {
            setErrorMessage('To confirm, you must type "DELETE" in the box.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            // This RPC function must be created in your Supabase SQL editor.
            // It needs to be a SECURITY DEFINER function to have the necessary permissions
            // to delete user data across different tables and the auth schema.
            const { error: rpcError } = await supabase.rpc('delete_user_account');

            if (rpcError) {
                // If the RPC call fails, throw an error to be caught by the catch block.
                throw rpcError;
            }

            // On successful deletion from the backend, sign the user out from the client session.
            await supabase.auth.signOut();

            // Redirect to the home page with a success message passed in the navigation state.
            navigate('/', { state: { message: 'Your account has been successfully deleted.' } });

        } catch (err: any) {
            console.error('Account deletion error:', err);
            setErrorMessage(`Failed to delete account: ${err.message || 'An unexpected error occurred. Please try again later.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
            <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            />
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
                                To confirm, please type "<strong>DELETE</strong>" below:
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
                            variant="secondary"
                            onClick={handleDeleteAccount}
                            isLoading={isLoading}
                            disabled={confirmationText !== 'DELETE' || isLoading}
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Trash2 className="mr-2" size={20} />
                            Delete My Account Permanently
                        </Button>
                    </div>
                </div>
            </main>
        </Layout>
    );
};

export default DeleteAccount;
