'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PasswordStrength, isPasswordValid } from '@/components/auth/password-strength';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const formValid = isPasswordValid(password) && passwordsMatch && !!token;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formValid) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Failed to reset password. The link may have expired.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-h2 mb-3">Invalid link</h1>
        <p className="text-sm text-text-secondary mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center text-sm font-medium text-text-primary hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg className="h-8 w-8 text-success" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-h2 mb-3">Password reset successfully</h1>
        <p className="text-sm text-text-secondary mb-8">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex w-full justify-center rounded-md bg-accent py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-h2 text-center mb-2">Set a new password</h1>
      <p className="text-center text-sm text-text-secondary mb-8">
        Choose a strong password to secure your account.
      </p>

      {error && (
        <div className="mb-6 rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-text-primary mb-1.5">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            className="block w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10 transition"
          />
          <PasswordStrength password={password} />
        </div>

        <div>
          <label htmlFor="confirm-new-password" className="block text-sm font-medium text-text-primary mb-1.5">
            Confirm new password
          </label>
          <input
            id="confirm-new-password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className={`block w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 transition ${
              confirmPassword.length > 0 && !passwordsMatch
                ? 'border-danger focus:border-danger focus:ring-danger/10'
                : 'border-border focus:border-accent focus:ring-accent/10'
            }`}
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1.5 text-sm text-danger">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!formValid || loading}
          className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? 'Resetting\u2026' : 'Reset password'}
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
