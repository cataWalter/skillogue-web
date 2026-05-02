'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { OAuthProvider } from 'appwrite';
import { authCopy } from '../../lib/app-copy';
import FormCard from '../../components/FormCard';
import Input from '../../components/Input';
import { Button } from '../../components/Button';
import Spinner from '../../components/Spinner';
import { createAppwriteBrowserAccount } from '../../lib/appwrite/browser';

const EMAIL_VERIFICATION_REQUIRED_FRAGMENT = 'Please verify your email before signing in';

const buildResendVerificationUrl = (email: string) => {
    const searchParams = new URLSearchParams({ email });

    return `/verify-email/resend?${searchParams.toString()}`;
};

const Login: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [googleLoading, setGoogleLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const { signIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('error') === 'oauth') {
            const message = searchParams.get('message') ?? authCopy.login.unexpectedError;
            toast.error(message, { id: 'oauth-error' });
        }
    }, [searchParams]);

    const handleGoogleSignIn = () => {
        setGoogleLoading(true);
        try {
            const account = createAppwriteBrowserAccount();
            account.createOAuth2Token(
                OAuthProvider.Google,
                `${window.location.origin}/api/auth/oauth/callback`,
                `${window.location.origin}/login?error=oauth`,
            );
        } catch (err) {
            console.error('[Google OAuth] sign-in error:', err);
            toast.error(authCopy.login.unexpectedError, { id: 'google-oauth-error' });
            setGoogleLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error(authCopy.login.emptyFieldsError, {
                id: 'login-error',
            });
            return;
        }
        try {
            setLoading(true);
            await signIn(email, password);
            router.push('/dashboard');
        } catch (error: unknown) {
            console.error('Login error:', error);
            const message = error instanceof Error ? error.message : authCopy.login.unexpectedError;

            if (message.includes(EMAIL_VERIFICATION_REQUIRED_FRAGMENT)) {
                router.push(buildResendVerificationUrl(email));
                return;
            }

            toast.error(message, {
                id: 'login-error',
                duration: 4000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormCard title={authCopy.login.title} subtitle={authCopy.login.signInSubtitle}>
            {/* Google OAuth */}
            <Button
                type="button"
                variant="outline"
                fullWidth
                disabled={googleLoading || loading}
                onClick={handleGoogleSignIn}
                className="mb-4 flex items-center justify-center gap-3"
            >
                {googleLoading ? (
                    <>
                        <Spinner className="h-5 w-5" />
                        {authCopy.login.signInWithGoogleLoading}
                    </>
                ) : (
                    <>
                        {/* Google "G" logo */}
                        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
                            <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z" />
                            <path fill="#FBBC05" d="M24 46c5.6 0 10.6-1.9 14.5-5.1l-6.7-5.5C29.8 37 27 38 24 38c-5.8 0-10.7-3.1-11.8-7.5l-7 5.4C8.6 41.9 15.8 46 24 46z" />
                            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.6 2.7-2.3 5-4.8 6.5l6.7 5.5C42 36.8 45 31 45 24c0-1.3-.2-2.7-.5-4z" />
                        </svg>
                        {authCopy.login.signInWithGoogle}
                    </>
                )}
            </Button>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-line/20" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-faint">or</span>
                </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <Input
                    id="email"
                    name="email"
                    type="email"
                    label={authCopy.login.email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={authCopy.login.emailPlaceholder}
                    autoComplete="email"
                    disabled={loading}
                />

                <Input
                    id="password"
                    name="password"
                    type="password"
                    label={authCopy.login.password}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={authCopy.login.passwordPlaceholder}
                    autoComplete="current-password"
                    disabled={loading}
                />

                <Button type="submit" disabled={loading} fullWidth>
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <Spinner className="-ml-1 mr-3 h-5 w-5 text-white" />
                            {authCopy.login.loading}
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <LogIn size={20} />
                            {authCopy.login.signIn}
                        </span>
                    )}
                </Button>
            </form>

            <div className="mt-8 border-t border-line/20 pt-6 text-center">
                <p className="mb-4 text-sm text-faint">
                    {authCopy.login.footerPrefix}{' '}
                    <Link href="/signup" className="font-medium text-brand transition hover:text-brand-soft">
                        {authCopy.login.signUp}
                    </Link>
                </p>
                <Link href="/forgot-password" className="text-sm text-faint transition hover:text-muted">
                    {authCopy.login.forgotPassword}
                </Link>
            </div>
        </FormCard>
    );
};

export default Login;
