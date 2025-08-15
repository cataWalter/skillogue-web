// src/pages/Login.tsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, UserPlus } from 'lucide-react';
import Layout from '../components/Layout';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import { Button } from '../components/Button';

const Login: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email || !password) {
            alert('Please fill in both fields');
            return;
        }
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            navigate('/dashboard');
        } catch (error: any) {
            console.error('Login error:', error);
            alert(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
                <form onSubmit={handleLogin}>
                    <div className="space-y-6">
                        <FormInput
                            id="email"
                            type="email"
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            disabled={loading}
                        />
                        <FormInput
                            id="password"
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            isLoading={loading}
                            icon={<LogIn size={20} />}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </div>
                </form>

                <div className="mt-4">
                    <Link to="/signup">
                        <Button
                            variant="secondary"
                            icon={<UserPlus size={20} />}
                            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        >
                            Create a New Account
                        </Button>
                    </Link>
                </div>

                <div className="text-center mt-6">
                    <Link
                        to="/forgot-password"
                        className="inline-flex items-center text-sm text-gray-400 hover:text-gray-300 hover:underline transition duration-200"
                    >
                        <Mail className="mr-1" size={16} />
                        Forgot password?
                    </Link>
                </div>
            </AuthLayout>
        </Layout>
    );
};

export default Login;
