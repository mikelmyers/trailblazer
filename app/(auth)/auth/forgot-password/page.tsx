'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setSent(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg className="h-8 w-8 text-success" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-h2 mb-3">Check your email</h1>
        <p className="text-sm text-text-secondary leading-relaxed max-w-[340px] mx-auto mb-8">
          If an account exists for <strong className="text-text-primary">{email}</strong>,
          we&apos;ve sent a password reset link.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center text-sm font-medium text-text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-h2 text-center mb-2">Reset your password</h1>
      <p className="text-center text-sm text-text-secondary mb-8">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {error && (
        <div className="mb-6 rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-text-primary mb-1.5">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="block w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? 'Sending\u2026' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        <Link href="/auth/signin" className="font-medium text-text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
