// src/pages/ForgotPassword.js
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:3000/reset-password',
            });

            if (error) throw error;

            setMessage('Password reset link sent to your email!');
        } catch (error) {
            setMessage('Error: ' + (error.message || 'Failed to send reset link'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />
            <main className="flex-grow flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                        Reset Your Password
                    </h2>
                    <p className="text-gray-400 text-center mt-2">
                        Enter your email to receive a reset link
                    </p>

                    <form onSubmit={handleReset} className="space-y-6 mt-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 rounded-lg font-semibold"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        {message && (
                            <p className="text-sm text-center mt-4 text-gray-300">{message}</p>
                        )}
                    </form>

                    <p className="text-center text-sm mt-6">
                        <Link to="/login" className="text-indigo-400 hover:underline">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ForgotPassword;