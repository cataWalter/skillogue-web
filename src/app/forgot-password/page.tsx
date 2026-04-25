'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authCopy } from '../../lib/app-copy';

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      await resetPassword(email);
      setSubmitted(true);
    } catch (error) {
      console.error('Password reset error:', error);
      alert(error instanceof Error ? error.message : authCopy.forgotPassword.failure);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-8 text-center">
          <Mail className="mx-auto h-12 w-12 text-indigo-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{authCopy.forgotPassword.submittedTitle}</h1>
          <p className="text-gray-400 mb-6">
            {authCopy.forgotPassword.submittedPrefix} <strong>{email}</strong>
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {authCopy.forgotPassword.backToLogin}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
            {authCopy.forgotPassword.title}
          </h1>
          <p className="text-gray-400 mt-2">{authCopy.forgotPassword.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              {authCopy.forgotPassword.emailAddress}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400"
              placeholder={authCopy.forgotPassword.emailPlaceholder}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-70"
          >
            {loading ? authCopy.forgotPassword.loading : authCopy.forgotPassword.submit}
          </button>
        </form>

        <div className="bg-gray-800/50 p-6 text-center border-t border-gray-800">
          <Link href="/login" className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowLeft size={16} />
            {authCopy.forgotPassword.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;