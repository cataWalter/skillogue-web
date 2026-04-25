'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { createAppwriteBrowserAccount } from '@/lib/appwrite/browser';
import { authCopy } from '../../lib/app-copy';

const VerifyEmailPage = () => {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>(authCopy.verifyEmail.loadingMessage);

  useEffect(() => {
    const verifyEmail = async () => {
      const userId = searchParams.get('userId');
      const secret = searchParams.get('secret');

      if (!userId || !secret) {
        setStatus('error');
        setMessage(authCopy.verifyEmail.invalidLink);
        return;
      }

      try {
        const account = createAppwriteBrowserAccount();
        await account.updateEmailVerification({ userId, secret });

        setStatus('success');
        setMessage(authCopy.verifyEmail.successMessage);
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error ? error.message : authCopy.verifyEmail.failure
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <main className="flex-grow flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden text-center p-8">
        {status === 'loading' && (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 rounded-full mb-4">
            <Loader2 className="w-8 h-8 text-indigo-300 animate-spin" />
          </div>
        )}

        {status === 'success' && (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        )}

        {status === 'error' && (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        )}

        <h1 className="text-2xl font-bold text-white mb-3">{authCopy.verifyEmail.title}</h1>
        <p className="text-gray-300 mb-6">{message}</p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            {authCopy.verifyEmail.backToLogin}
          </Link>
          <Link
            href="/signup"
            className="px-5 py-3 border border-gray-700 hover:border-gray-600 text-gray-200 rounded-lg transition-colors"
          >
            {authCopy.verifyEmail.backToSignUp}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default VerifyEmailPage;