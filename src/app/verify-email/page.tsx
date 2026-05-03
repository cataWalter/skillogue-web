'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs/legacy';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { authCopy } from '../../lib/app-copy';
import Input from '../../components/Input';
import { Button } from '../../components/Button';

const VerifyEmailPage = () => {
  const router = useRouter();
  const { signUp, isLoaded } = useSignUp();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setStatus('loading');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        setStatus('success');
        setMessage(authCopy.verifyEmail.successMessage);
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setStatus('error');
        setMessage(authCopy.verifyEmail.failure);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : authCopy.verifyEmail.failure);
    }
  };

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

        {status === 'idle' || status === 'error' ? (
          <>
            <p className="text-muted mb-6">
              {status === 'error' ? message : authCopy.verifyEmail.loadingMessage}
            </p>
            <form onSubmit={handleVerify} className="space-y-4 text-left">
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                label="Verification Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
              />
              <Button type="submit" fullWidth>
                Verify Email
              </Button>
            </form>
          </>
        ) : (
          <p className="text-muted mb-6">{message || authCopy.verifyEmail.loadingMessage}</p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
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
