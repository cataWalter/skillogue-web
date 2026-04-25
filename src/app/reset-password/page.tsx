'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { authCopy } from '../../lib/app-copy';

const ResetPassword = () => {
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const appwriteUserId = searchParams.get('userId');
    const appwriteSecret = searchParams.get('secret');

    useEffect(() => {
        if (!appwriteUserId || !appwriteSecret) {
            setError(authCopy.resetPassword.invalidLink);
        }
    }, [appwriteSecret, appwriteUserId]);

    const isPasswordValid = (): boolean => {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            symbol: /[^A-Za-z0-9]/.test(password),
        };
        return Object.values(checks).every(Boolean);
    };

    const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!password || !confirmPassword) {
            setError(authCopy.resetPassword.emptyFieldsError);
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError(authCopy.resetPassword.mismatchError);
            setLoading(false);
            return;
        }

        if (!isPasswordValid()) {
            setError(authCopy.resetPassword.strengthError);
            setLoading(false);
            return;
        }

        try {
            if (!appwriteUserId || !appwriteSecret) {
                throw new Error(authCopy.resetPassword.invalidLink);
            }

            const response = await fetch('/api/auth/reset-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: appwriteUserId,
                    secret: appwriteSecret,
                    password,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.message || authCopy.resetPassword.submitError);
            }

            setShowSuccess(true);

            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : authCopy.resetPassword.submitError;
            setError(message);
            console.error('Password reset error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <main className="flex-grow flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden text-center p-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">{authCopy.resetPassword.successTitle}</h2>
                    <p className="text-gray-400 mt-2">
                        {authCopy.resetPassword.successSubtitle}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-grow flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent mb-2">
                        {authCopy.resetPassword.title}
                    </h2>
                    <p className="text-gray-400 text-center mb-8">
                        {authCopy.resetPassword.subtitle}
                    </p>

                    <form onSubmit={handleReset} className="space-y-6">
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-2">
                                {authCopy.resetPassword.newPassword}
                            </label>
                            <input
                                id="new-password"
                                name="newPassword"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500"
                                placeholder={authCopy.resetPassword.passwordPlaceholder}
                                autoComplete="new-password"
                            />
                            {/* Password Strength Meter Component */}
                            <div className="mt-3">
                                <PasswordStrengthMeter password={password} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                                {authCopy.resetPassword.confirmPassword}
                            </label>
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500"
                                placeholder={authCopy.resetPassword.passwordPlaceholder}
                                autoComplete="new-password"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/30 text-red-300 p-3 rounded-lg text-sm flex items-start">
                                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                    {authCopy.resetPassword.loading}
                                </>
                            ) : (
                                authCopy.resetPassword.submit
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default ResetPassword;
