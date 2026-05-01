'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authCopy } from '../../lib/app-copy';
import FormCard from '../../components/FormCard';
import Input from '../../components/Input';
import { Button } from '../../components/Button';

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
      <main className="editorial-shell flex flex-grow items-center justify-center py-12 sm:py-16">
        <div className="glass-panel w-full max-w-md rounded-[2rem] p-8 text-center sm:p-10">
          <div className="glass-surface mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Mail className="h-8 w-8 text-brand" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">{authCopy.forgotPassword.submittedTitle}</h1>
          <p className="mb-6 text-faint">
            {authCopy.forgotPassword.submittedPrefix} <strong>{email}</strong>
          </p>
          <Button onClick={() => router.push('/login')} fullWidth>
            {authCopy.forgotPassword.backToLogin}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <FormCard title={authCopy.forgotPassword.title} subtitle={authCopy.forgotPassword.subtitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          id="email"
          type="email"
          label={authCopy.forgotPassword.emailAddress}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={authCopy.forgotPassword.emailPlaceholder}
          required
          disabled={loading}
        />

        <Button type="submit" disabled={loading} fullWidth>
          {loading ? authCopy.forgotPassword.loading : authCopy.forgotPassword.submit}
        </Button>
      </form>

      <div className="mt-8 border-t border-line/20 pt-6 text-center">
        <Link href="/login" className="inline-flex items-center justify-center gap-2 text-faint transition hover:text-foreground">
          <ArrowLeft size={16} />
          {authCopy.forgotPassword.backToLogin}
        </Link>
      </div>
    </FormCard>
  );
};

export default ForgotPassword;
