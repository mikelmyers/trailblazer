'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PasswordStrength, isPasswordValid } from '@/components/auth/password-strength';

type Role = 'DRIVER' | 'SHIPPER';

export default function SignUpPage() {
  const router = useRouter();

  // Step 1: Role selection
  const [role, setRole] = useState<Role | null>(null);

  // Step 2: Registration form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword;
  const formValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    isPasswordValid(password) &&
    passwordsMatch &&
    agreedToTerms;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formValid || !role) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Something went wrong. Please try again.');
        return;
      }

      router.push('/auth/verify');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // Role selection step
  if (!role) {
    return (
      <div>
        <h1 className="text-h2 text-center mb-2">Create your account</h1>
        <p className="text-center text-sm text-text-secondary mb-8">
          Choose how you&apos;ll use Trailblazer
        </p>

        <div className="grid gap-4">
          <button
            type="button"
            onClick={() => setRole('DRIVER')}
            className="group rounded-lg border border-border bg-white p-6 text-left transition hover:border-accent hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background-2 text-text-primary group-hover:bg-accent group-hover:text-white transition">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 17h1a2 2 0 104 0h4a2 2 0 104 0h1M3 13V8a2 2 0 012-2h9l4 4v3M3 13h18v-3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary mb-1">I&apos;m a Driver</h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Deliver shipments, manage routes, and earn on your schedule with AI-optimized dispatching.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole('SHIPPER')}
            className="group rounded-lg border border-border bg-white p-6 text-left transition hover:border-accent hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background-2 text-text-primary group-hover:bg-accent group-hover:text-white transition">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary mb-1">I&apos;m a Shipper</h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Post shipments, track deliveries in real time, and access intelligent dispatch tools.
                </p>
              </div>
            </div>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-medium text-text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  // Registration form step
  return (
    <div>
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setRole(null)}
          className="mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <h1 className="text-h2 mb-1">Create your account</h1>
        <p className="text-sm text-text-secondary">
          Signing up as a{' '}
          <span className="font-medium text-text-primary">
            {role === 'DRIVER' ? 'Driver' : 'Shipper'}
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="block w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10 transition"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-text-primary mb-1.5">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="block w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10 transition"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-text-primary mb-1.5">
            Password
          </label>
          <input
            id="signup-password"
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
          <label htmlFor="confirm-password" className="block text-sm font-medium text-text-primary mb-1.5">
            Confirm password
          </label>
          <input
            id="confirm-password"
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

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent/20"
          />
          <span className="text-sm text-text-secondary leading-snug">
            I agree to the{' '}
            <Link href="/terms" className="text-text-primary underline hover:no-underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-text-primary underline hover:no-underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={!formValid || loading}
          className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? 'Creating account\u2026' : 'Create account'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link href="/auth/signin" className="font-medium text-text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
