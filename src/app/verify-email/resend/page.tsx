'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react';

const DEFAULT_MESSAGE =
  "If you didn't receive the verification email, confirm your password and we'll send another one.";

const ResendVerificationPage = () => {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const handleResendVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setStatus('error');
      setMessage('Email and password are required to send another verification email.');
      return;
    }

    try {
      setLoading(true);
      setStatus('idle');
      setMessage(DEFAULT_MESSAGE);

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to resend verification email.');
      }

      setStatus('success');
      setMessage(payload?.message || 'We sent you a new verification email. Please check your inbox.');
      setPassword('');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'Failed to resend verification email.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center border-b border-gray-800 bg-gray-900/80">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/15 mb-4">
            {loading ? (
              <Loader2 className="w-8 h-8 text-indigo-300 animate-spin" />
            ) : status === 'success' ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : status === 'error' ? (
              <AlertCircle className="w-8 h-8 text-red-400" />
            ) : (
              <Mail className="w-8 h-8 text-indigo-300" />
            )}
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
            Need Another Verification Email?
          </h1>
          <p className="mt-3 text-gray-300">{message}</p>
        </div>

        {status !== 'success' && (
          <form onSubmit={handleResendVerification} className="p-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-70"
            >
              {loading ? 'Sending...' : 'Send Another Verification Email'}
            </button>
          </form>
        )}

        <div className="bg-gray-800/50 p-6 text-center border-t border-gray-800 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Login
          </Link>
          <Link
            href="/signup"
            className="px-5 py-3 border border-gray-700 hover:border-gray-600 text-gray-200 rounded-lg transition-colors"
          >
            Back to Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ResendVerificationPage;