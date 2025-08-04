// src/pages/Login.js
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            alert('Please fill in both fields');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            navigate('/dashboard') // ✅ Change this from '/' to '/dashboard'
        } catch (error) {
            alert(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-600/20 to-purple-800/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-600/20 to-red-800/20 rounded-full blur-3xl"></div>
            </div>

            {/* Navbar */}
            <header className="px-6 py-6">
                <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Skillogue
                </Link>
            </header>

            {/* Main Login Form */}
            <main className="flex-grow flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="text-center p-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                            Welcome Back
                        </h1>
                        <p className="mt-2 text-gray-400">Sign in to continue building real connections</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="px-8 pb-8 space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                                disabled={loading}
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                                disabled={loading}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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
                                    Signing In...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <LogIn className="mr-2" size={20} />
                                    Log In
                                </span>
                            )}
                        </button>

                        {/* Sign Up Link */}
                        <p className="text-center text-sm text-gray-400 mt-6">
                            Don’t have an account?{' '}
                            <Link
                                to="/signup"
                                className="font-medium text-indigo-400 hover:text-indigo-300 transition duration-200"
                            >
                                Sign up for free
                            </Link>
                        </p>

                        {/* Forgot Password? (Optional) */}
                        <div className="text-center">
                            <Link
                                to="/reset-password"
                                className="text-sm text-gray-400 hover:text-gray-300 transition duration-200"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </form>
                </div>
            </main>

            {/* Footer */}
            <footer className="px-6 py-4 text-center text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} Skillogue. For real human connection.
            </footer>
        </div>
    );
};

export default Login;