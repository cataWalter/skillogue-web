'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { signUpCopy } from '../../lib/app-copy';

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
        <div className="flex-grow flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="text-center p-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                        {signUpCopy.createAccount}
                    </h1>
                    <p className="mt-2 text-gray-400">{signUpCopy.subtitle}</p>
                </div>

                <form onSubmit={handleSignUp} className="px-8 pb-8 space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                            {signUpCopy.emailAddress}
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder={signUpCopy.emailPlaceholder}
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                            autoComplete="email"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            {signUpCopy.password}
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder={signUpCopy.passwordPlaceholder}
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                            autoComplete="new-password"
                            disabled={loading}
                        />
                        <PasswordStrengthMeter password={password} />
                    </div>

                    <div className="flex items-start gap-3">
                        <input
                            id="agreed"
                            name="agreed"
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="agreed" className="text-sm text-gray-400">
                            {signUpCopy.agreementPrefix}{' '}<Link href="/terms-of-service" className="text-indigo-400 hover:underline" target="_blank">{signUpCopy.termsOfService}</Link>{' '}and{' '}<Link href="/privacy-policy" className="text-indigo-400 hover:underline" target="_blank">{signUpCopy.privacyPolicy}</Link>{signUpCopy.agreementSuffix}
                        </label>
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
                                {signUpCopy.creatingAccount}
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <UserPlus size={20} />
                                {signUpCopy.signUp}
                            </span>
                        )}
                    </button>
                </form>

                <div className="bg-gray-800/50 p-6 text-center border-t border-gray-800">
                    <p className="text-gray-400 text-sm">
                        {signUpCopy.alreadyHaveAccount}{' '}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                            {signUpCopy.signIn}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;