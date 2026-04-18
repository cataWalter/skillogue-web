'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react';
import { authCopy } from '../../../lib/app-copy';
import FormCard from '../../../components/FormCard';
import Input from '../../../components/Input';
import { Button } from '../../../components/Button';

const DEFAULT_MESSAGE = authCopy.resendVerification.defaultMessage;

const ResendVerificationPage = () => {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>(DEFAULT_MESSAGE);

  const handleResendVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setStatus('error');
      setMessage(authCopy.resendVerification.emailPasswordRequired);
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
        throw new Error(payload?.message || authCopy.resendVerification.failure);
      }

      setStatus('success');
      setMessage(payload?.message || authCopy.resendVerification.success);
      setPassword('');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : authCopy.resendVerification.failure
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormCard title={authCopy.resendVerification.title} subtitle={message}>
      <div className="mb-6 text-center">
          <div className="glass-surface inline-flex h-16 w-16 items-center justify-center rounded-full mb-4">
            {loading ? (
              <Loader2 className="w-8 h-8 text-brand-soft animate-spin" />
            ) : status === 'success' ? (
              <CheckCircle className="w-8 h-8 text-approval" />
            ) : status === 'error' ? (
              <AlertCircle className="w-8 h-8 text-danger" />
            ) : (
              <Mail className="w-8 h-8 text-brand-soft" />
            )}
          </div>
      </div>

        {status !== 'success' && (
          <form onSubmit={handleResendVerification} className="space-y-6">
            <Input
              id="email"
              name="email"
              type="email"
              label={authCopy.resendVerification.email}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={authCopy.resendVerification.emailPlaceholder}
              autoComplete="email"
              disabled={loading}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label={authCopy.resendVerification.password}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={authCopy.resendVerification.passwordPlaceholder}
              autoComplete="current-password"
              disabled={loading}
            />

            <Button type="submit" disabled={loading} fullWidth>
              {loading ? authCopy.resendVerification.loading : authCopy.resendVerification.submit}
            </Button>
          </form>
        )}

        <div className="mt-8 flex items-center justify-center gap-3 border-t border-line/20 pt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-start to-brand-end px-5 py-3 text-white shadow-glass-sm transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover"
          >
            {authCopy.resendVerification.backToLogin}
          </Link>
          <Link
            href="/signup"
            className="glass-surface inline-flex items-center justify-center rounded-xl px-5 py-3 text-muted transition-all duration-300 hover:-translate-y-0.5"
          >
            {authCopy.resendVerification.backToSignUp}
          </Link>
        </div>
    </FormCard>
  );
};

export default ResendVerificationPage;