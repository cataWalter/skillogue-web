// src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { AlertCircle, Mail, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (!email) {
            setError('Email is required');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setMessage('✅ Password reset link sent! Check your email.');
            setEmail('');
        } catch (err: any) {
            setError(`Failed to send reset link: ${err.message}`);
            console.error('Reset password error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
            <Layout>        <SEO
                title="Skillogue"
                description="Skillogue brings together people who share your interests — not just your looks. Discover people who love what you love."
            />
            <main className="flex-grow flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                        Reset Your Password
                    </h2>
                    <p className="text-gray-400 text-center mt-2">
                        Enter your email to receive a password reset link
                    </p>

                    <form onSubmit={handleReset} className="space-y-6 mt-8">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500"
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/30 text-red-300 p-3 rounded-lg text-sm flex items-start">
                                <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                                {error}
                            </div>
                        )}

                        {message && <p className="text-green-400 text-sm text-center">{message}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                    Sending Reset Email...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2" size={20} />
                                    Send Reset Link
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6 text-gray-400">
                        <Link to="/login" className="text-indigo-400 hover:underline">
                            ← Back to Login
                        </Link>
                    </p>
                </div>
            </main>
        </Layout>
    );
};

export default ForgotPassword;