'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { createAppwriteBrowserAccount } from '@/lib/appwrite/browser';
import { authCopy } from '../../lib/app-copy';
import { trackAnalyticsEvent } from '../../lib/analytics';

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
        void trackAnalyticsEvent('email_verified');
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
    <main className="editorial-shell flex flex-grow items-center justify-center py-12 sm:py-16">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-8 text-center sm:p-10">
        {status === 'loading' && (
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand/20 mb-4 shadow-glass-sm">
            <Loader2 className="w-8 h-8 text-brand-soft animate-spin" />
          </div>
        )}

        {status === 'success' && (
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-approval/20 mb-4 shadow-glass-sm">
            <CheckCircle className="w-8 h-8 text-approval" />
          </div>
        )}

        {status === 'error' && (
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger/20 mb-4 shadow-glass-sm">
            <AlertCircle className="w-8 h-8 text-danger" />
          </div>
        )}

        <h1 className="text-2xl font-bold text-foreground mb-3">{authCopy.verifyEmail.title}</h1>
        <p className="text-muted mb-6">{message}</p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-start to-brand-end px-5 py-3 text-white shadow-glass-sm transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover hover:shadow-glass-md"
          >
            {authCopy.verifyEmail.backToLogin}
          </Link>
          <Link
            href="/signup"
            className="glass-surface inline-flex items-center justify-center rounded-xl px-5 py-3 text-muted transition-all duration-300 hover:-translate-y-0.5"
          >
            {authCopy.verifyEmail.backToSignUp}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default VerifyEmailPage;
