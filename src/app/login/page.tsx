'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { authCopy } from '../../lib/app-copy';
import FormCard from '../../components/FormCard';
import Input from '../../components/Input';
import { Button } from '../../components/Button';
import Spinner from '../../components/Spinner';

const EMAIL_VERIFICATION_REQUIRED_FRAGMENT = 'Please verify your email before signing in';

const buildResendVerificationUrl = (email: string) => {
    const searchParams = new URLSearchParams({ email });

    return `/verify-email/resend?${searchParams.toString()}`;
};

const Login: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const { signIn } = useAuth();
    const router = useRouter();

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
