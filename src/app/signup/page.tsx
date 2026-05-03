'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { signUpCopy, authCopy } from '../../lib/app-copy';
import FormCard from '../../components/FormCard';
import Input from '../../components/Input';
import { Button } from '../../components/Button';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';
import { useSignIn } from '@clerk/nextjs/legacy';

const SignUp: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [googleLoading, setGoogleLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [agreed, setAgreed] = useState<boolean>(false);
    const { signUp } = useAuth();
    const router = useRouter();
    const { signIn: clerkSignIn } = useSignIn();

    const handleGoogleSignUp = async () => {
        setGoogleLoading(true);
        try {
            await clerkSignIn?.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: `${window.location.origin}/sso-callback`,
                redirectUrlComplete: '/dashboard',
            });
        } catch (err) {
            console.error('[Google OAuth] sign-up error:', err);
            toast.error(signUpCopy.unexpectedError, { id: 'google-oauth-error' });
            setGoogleLoading(false);
        }
    };

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
            toast.error(signUpCopy.emptyFieldsAlert, { id: 'signup-error' });
            return;
        }

        if (!isPasswordValid()) {
            toast.error(signUpCopy.strengthAlert, { id: 'signup-error' });
            return;
        }

        if (!agreed) {
            toast.error(signUpCopy.agreementAlert, { id: 'signup-error' });
            return;
        }

        try {
            setLoading(true);
            await signUp(email, password);
            toast.success(signUpCopy.successAlert, { duration: 6000 });
            router.push('/verify-email');
        } catch (error: unknown) {
            console.error('Signup error:', error);
            const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error(message, { id: 'signup-error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormCard title={signUpCopy.createAccount} subtitle={signUpCopy.subtitle}>
            {/* Google OAuth */}
            <Button
                type="button"
                variant="outline"
                fullWidth
                disabled={googleLoading || loading}
                onClick={handleGoogleSignUp}
                className="mb-4 flex items-center justify-center gap-3"
            >
                {googleLoading ? (
                    <>
                        <Spinner className="h-5 w-5" />
                        {authCopy.login.signInWithGoogleLoading}
                    </>
                ) : (
                    <>
                        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
                            <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z" />
                            <path fill="#FBBC05" d="M24 46c5.6 0 10.6-1.9 14.5-5.1l-6.7-5.5C29.8 37 27 38 24 38c-5.8 0-10.7-3.1-11.8-7.5l-7 5.4C8.6 41.9 15.8 46 24 46z" />
                            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.6 2.7-2.3 5-4.8 6.5l6.7 5.5C42 36.8 45 31 45 24c0-1.3-.2-2.7-.5-4z" />
                        </svg>
                        {signUpCopy.signUpWithGoogle}
                    </>
                )}
            </Button>

            <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-line/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-surface px-2 text-faint">{signUpCopy.orContinueWith}</span>
                </div>
            </div>

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

                <div id="clerk-captcha" />

                <Button type="submit" disabled={loading} fullWidth>
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <Spinner className="-ml-1 mr-3 h-5 w-5 text-white" />
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
