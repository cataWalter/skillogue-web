// src/pages/ResetPassword.js

import {useEffect, useState} from 'react';
import {supabase} from '../supabaseClient';
import {useNavigate} from 'react-router-dom';
import {AlertCircle, Loader2} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); // Only show success AFTER reset

    const navigate = useNavigate();

    // ✅ Don't auto-set success just because there's a session
    // Just verify we're in a reset context
    useEffect(() => {
        const checkSession = async () => {
            const {data} = await supabase.auth.getSession();
            if (!data.session) {
                setError('Invalid or expired link. Please request a new password reset.');
            }
            // We don't set success here — only after form submission
        };
        checkSession();
    }, []);

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!password || !confirmPassword) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            // ✅ This is where we actually update the password
            const {data, error} = await supabase.auth.updateUser({password});

            if (error) throw error;

            // ✅ Only now mark success
            setShowSuccess(true);

            // Optional: Refresh session or redirect after a delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to reset password');
            console.error('Password reset error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col">
                <Navbar/>
                <main className="flex-grow flex items-center justify-center px-6 py-12">
                    <div
                        className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden text-center p-8">
                        <div
                            className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white">Password Updated!</h2>
                        <p className="text-gray-400 mt-2">Redirecting to your dashboard...</p>
                    </div>
                </main>
                <Footer/>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar/>

            <main className="flex-grow flex items-center justify-center px-6 py-12">
                <div
                    className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="text-center p-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                            Set New Password
                        </h1>
                        <p className="mt-2 text-gray-400">Securely reset your password</p>
                    </div>

                    {error && (
                        <div
                            className="px-8 mx-6 mb-4 bg-red-900/30 text-red-300 p-3 rounded-lg text-sm flex items-start">
                            <AlertCircle className="w-5 h-5 mr-2 mt-0.5"/>
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
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">Min. 6 characters</p>
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
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5"/>
                                    Updating Password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                </div>
            </main>

            <Footer/>
        </div>
    );
};

export default ResetPassword;