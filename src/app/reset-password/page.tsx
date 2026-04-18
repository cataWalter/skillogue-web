'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { authCopy } from '../../lib/app-copy';
import FormCard from '../../components/FormCard';
import Input from '../../components/Input';
import { Button } from '../../components/Button';

import ForgotPassword from '../forgot-password/page';

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

    // If missing tokens, we ask them to request a new link
    if (!appwriteUserId || !appwriteSecret) {
        return <ForgotPassword />;
    }

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
            <main className="editorial-shell flex flex-grow items-center justify-center py-12 sm:py-16">
                <div className="glass-panel w-full max-w-md rounded-[2rem] p-8 text-center sm:p-10">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-approval/20 mb-4">
                        <CheckCircle className="w-8 h-8 text-approval" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">{authCopy.resetPassword.successTitle}</h2>
                    <p className="text-faint mt-2">
                        {authCopy.resetPassword.successSubtitle}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <FormCard title={authCopy.resetPassword.title} subtitle={authCopy.resetPassword.subtitle}>
            <form onSubmit={handleReset} className="space-y-6">
                <div>
                    <Input
                        id="new-password"
                        name="newPassword"
                        type="password"
                        label={authCopy.resetPassword.newPassword}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={authCopy.resetPassword.passwordPlaceholder}
                        autoComplete="new-password"
                    />
                    <div className="mt-3">
                        <PasswordStrengthMeter password={password} />
                    </div>
                </div>

                <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    label={authCopy.resetPassword.confirmPassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={authCopy.resetPassword.passwordPlaceholder}
                    autoComplete="new-password"
                />

                {error && (
                    <div className="flex items-start rounded-xl bg-danger/10 p-3 text-sm text-danger-soft">
                        <AlertCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <Button type="submit" disabled={loading} fullWidth>
                    {loading ? (
                        <>
                            <Loader2 className="-ml-1 mr-3 h-5 w-5 animate-spin" />
                            {authCopy.resetPassword.loading}
                        </>
                    ) : (
                        authCopy.resetPassword.submit
                    )}
                </Button>
            </form>
        </FormCard>
    );
};

export default ResetPassword;
