'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { authCopy, settingsCopy } from '../../lib/app-copy';
import FormCard from '../../components/FormCard';
import Input from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const router = useRouter();
    const { changePassword } = useAuth();

    const isPasswordValid = (): boolean => {
        const checks = {
            length: newPassword.length >= 8,
            uppercase: /[A-Z]/.test(newPassword),
            number: /[0-9]/.test(newPassword),
            symbol: /[^A-Za-z0-9]/.test(newPassword),
        };
        return Object.values(checks).every(Boolean);
    };

    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError(authCopy.resetPassword.emptyFieldsError);
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
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
            await changePassword(currentPassword, newPassword);

            setShowSuccess(true);

            setTimeout(() => {
                router.push('/settings');
            }, 2000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : authCopy.resetPassword.submitError;
            setError(message);
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
                    <h2 className="text-xl font-semibold text-foreground">Password Update Successful</h2>
                    <p className="text-faint mt-2">
                        Your password has been successfully changed.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <FormCard title={settingsCopy.main.changePassword} subtitle="Update your account password">
            <form onSubmit={handleChangePassword} className="space-y-6">
                <Input
                    id="current-password"
                    name="currentPassword"
                    type="password"
                    label="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                />

                <div className="pt-2">
                    <Input
                        id="new-password"
                        name="newPassword"
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        autoComplete="new-password"
                    />
                    <div className="mt-3">
                        <PasswordStrengthMeter password={newPassword} />
                    </div>
                </div>

                <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    label={authCopy.resetPassword.confirmPassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    autoComplete="off"
                />

                {error && (
                    <div className="flex items-start rounded-xl bg-danger/10 p-3 text-sm text-danger-soft">
                        <AlertCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                    <Button type="submit" disabled={loading} fullWidth>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Password"
                        )}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => router.push('/settings')} disabled={loading} fullWidth>
                        Cancel
                    </Button>
                </div>
            </form>
        </FormCard>
    );
};

export default ChangePassword;
