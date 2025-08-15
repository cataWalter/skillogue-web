// src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { AlertCircle, Mail } from 'lucide-react';
import Layout from '../components/Layout';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import { Button } from '../components/Button';

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
                redirectTo: window.location.origin + '/reset-password',
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
        <Layout>
            <AuthLayout
                title="Reset Your Password"
                subtitle="Enter your email to receive a password reset link"
            >
                <form onSubmit={handleReset} className="space-y-6">
                    <FormInput
                        id="email"
                        type="email"
                        label="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={loading}
                    />

                    {error && (
                        <div className="bg-red-900/30 text-red-300 p-3 rounded-lg text-sm flex items-start">
                            <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {message && <p className="text-green-400 text-sm">{message}</p>}

                    <Button
                        type="submit"
                        isLoading={loading}
                        icon={<Mail size={20} />}
                    >
                        {loading ? 'Sending Reset Email...' : 'Send Reset Link'}
                    </Button>
                </form>

                <p className="text-center text-sm mt-6 text-gray-400">
                    <Link to="/login" className="text-indigo-400 hover:underline">
                        ← Back to Login
                    </Link>
                </p>
            </AuthLayout>
        </Layout>
    );
};

export default ForgotPassword;
