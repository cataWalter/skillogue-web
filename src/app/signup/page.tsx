'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { signUpCopy } from '../../lib/app-copy';
import { trackAnalyticsEvent } from '../../lib/analytics';
import FormCard from '../../components/FormCard';
import Input from '../../components/Input';
import { Button } from '../../components/Button';

const SignUp: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [agreed, setAgreed] = useState<boolean>(false);
    const { signUp } = useAuth();
    const router = useRouter();

    const isPasswordValid = (): boolean => {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            symbol: /[^A-Za-z0-9]/.test(password),
        };
        return Object.values(checks).every(Boolean);
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email || !password) {
            alert(signUpCopy.emptyFieldsAlert);
            return;
        }

        if (!isPasswordValid()) {
            alert(signUpCopy.strengthAlert);
            return;
        }

        if (!agreed) {
            alert(signUpCopy.agreementAlert);
            return;
        }

        try {
            setLoading(true);
            await signUp(email, password);
            void trackAnalyticsEvent('signup_completed', {
                emailDomain: email.includes('@') ? email.split('@')[1] : null,
            });

            alert(signUpCopy.successAlert);
            router.push('/login');
        } catch (error: unknown) {
            console.error('Signup error:', error);
            const message = error instanceof Error ? error.message : 'An error occurred';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormCard title={signUpCopy.createAccount} subtitle={signUpCopy.subtitle}>
            <form onSubmit={handleSignUp} className="space-y-6">
                <Input
                    id="email"
                    name="email"
                    type="email"
                    label={signUpCopy.emailAddress}
                    placeholder={signUpCopy.emailPlaceholder}
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                />

                <div>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        label={signUpCopy.password}
                        placeholder={signUpCopy.passwordPlaceholder}
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        disabled={loading}
                    />
                    <PasswordStrengthMeter password={password} />
                </div>

                <div className="glass-surface flex items-start gap-3 rounded-2xl p-4">
                    <input
                        id="agreed"
                        name="agreed"
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-line/40 bg-surface-secondary text-brand focus:ring-brand"
                    />
                    <label htmlFor="agreed" className="text-sm text-faint">
                        {signUpCopy.agreementPrefix}{' '}<Link href="/terms-of-service" className="text-brand hover:underline" target="_blank">{signUpCopy.termsOfService}</Link>{' '}and{' '}<Link href="/privacy-policy" className="text-brand hover:underline" target="_blank">{signUpCopy.privacyPolicy}</Link>{signUpCopy.agreementSuffix}
                    </label>
                </div>

                <Button type="submit" disabled={loading} fullWidth>
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            {signUpCopy.creatingAccount}
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <UserPlus size={20} />
                            {signUpCopy.signUp}
                        </span>
                    )}
                </Button>
            </form>

            <div className="mt-8 border-t border-line/20 pt-6 text-center">
                <p className="text-sm text-faint">
                    {signUpCopy.alreadyHaveAccount}{' '}
                    <Link href="/login" className="font-medium text-brand transition hover:text-brand-soft">
                        {signUpCopy.signIn}
                    </Link>
                </p>
            </div>
        </FormCard>
    );
};

export default SignUp;
