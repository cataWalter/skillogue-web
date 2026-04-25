'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { authCopy } from '../../lib/app-copy';

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
        <div className="flex-grow flex items-center justify-center px-6 py-12">
            <div
                className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="text-center p-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                        {authCopy.login.title}
                    </h1>
                    <p className="text-gray-400 mt-2">{authCopy.login.signInSubtitle}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="p-8 pt-0">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                {authCopy.login.email}
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition"
                                placeholder={authCopy.login.emailPlaceholder}
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                {authCopy.login.password}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition"
                                placeholder={authCopy.login.passwordPlaceholder}
                                autoComplete="current-password"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-70"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none"
                                        viewBox="0 0 24 24">
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
                                    {authCopy.login.loading}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <LogIn size={20} />
                                    {authCopy.login.signIn}
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="bg-gray-800/50 p-6 text-center border-t border-gray-800">
                    <p className="text-gray-400 text-sm mb-4">
                        {authCopy.login.footerPrefix}{' '}
                        <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                            {authCopy.login.signUp}
                        </Link>
                    </p>
                    <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-400 transition">
                        {authCopy.login.forgotPassword}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;