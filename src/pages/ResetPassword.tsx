// src/pages/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'; // 👈 Import the strength meter
import SEO from '../components/SEO';

const ResetPassword = () => {
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                setError('Invalid or expired link. Please request a new password reset.');
            }
        };
        checkSession();
    }, []);

    // 👇 New validation logic
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
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // 👇 Use the new validation function
        if (!isPasswordValid()) {
            setError('Please ensure your new password meets all the strength requirements.');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            setShowSuccess(true);

            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
            console.error('Password reset error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
                <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            />
                <main className="flex-grow flex items-center justify-center px-6 py-12">
                    <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden text-center p-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Password Updated!</h2>
                        <p className="text-gray-400 mt-2">Redirecting to your dashboard...</p>
                    </div>
                </main>
            </Layout>
        );
    }

    return (
            <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            />
            <main className="flex-grow flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="text-center p-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                            Set New Password
                        </h1>
                        <p className="mt-2 text-gray-400">Securely reset your password</p>
                    </div>

                    {error && (
                        <div className="mx-6 mb-4 bg-red-900/30 text-red-300 p-3 rounded-lg text-sm flex items-start">
                            <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleReset} className="px-8 pb-8 space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                            />
                            {/* 👇 Add the strength meter component */}
                            <PasswordStrengthMeter password={password} />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isPasswordValid() || password !== confirmPassword} // 👈 Disable button if invalid
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                    Updating Password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </Layout>
    );
};

export default ResetPassword;