// src/pages/SignUp.tsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import Layout from '../components/Layout';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import { Button } from '../components/Button';

const SignUp: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const navigate = useNavigate();

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email || !password) {
            alert('Please fill in both fields');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;

            alert('🎉 Check your email for the confirmation link!');
            navigate('/login');
        } catch (error: any) {
            console.error('Signup error:', error);
            alert(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <AuthLayout
                title="Create Your Account"
                subtitle="Start building real connections today"
            >
                <form onSubmit={handleSignUp} className="space-y-6">
                    <FormInput
                        id="email"
                        type="email"
                        label="Email Address"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                    <div>
                        <FormInput
                            id="password"
                            type="password"
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                        <p className="mt-1 text-xs text-gray-500">Min. 6 characters</p>
                    </div>

                    <Button
                        type="submit"
                        isLoading={loading}
                        icon={<UserPlus size={20} />}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>

                    <p className="text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-indigo-400 hover:text-indigo-300 transition duration-200"
                        >
                            Log in
                        </Link>
                    </p>
                </form>
            </AuthLayout>
        </Layout>
    );
};

export default SignUp;
