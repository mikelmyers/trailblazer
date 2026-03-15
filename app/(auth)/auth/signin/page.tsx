'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';

type AuthMethod = 'credentials' | 'magic-link' | 'google';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '';
  const hasExplicitCallback = !!searchParams.get('callbackUrl');
  const urlError = searchParams.get('error');

  const [method, setMethod] = useState<AuthMethod>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked: 'This email is already associated with another sign-in method.',
    Default: 'An error occurred. Please try again.',
  };

  const displayError =
    error ?? (urlError ? errorMessages[urlError] ?? errorMessages.Default : null);

  async function handleCredentials(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        callbackUrl,
        redirect: false,
      });
      if (res?.error) {
        // NextAuth v5 returns the authorize() error message in res.error when it's a CredentialsSignin,
        // or the error code for other error types.
        if (res.code && res.code !== 'credentials') {
          setError(errorMessages[res.code] ?? errorMessages.Default);
        } else {
          // Extract custom error message from authorize() throw
          setError(res.error === 'CredentialsSignin'
            ? (res.code || 'Invalid email or password.')
            : (errorMessages[res.error] ?? res.error));
        }
      } else if (res?.ok) {
        // If user came from a specific page, send them back there.
        // Otherwise, redirect based on their role.
        if (hasExplicitCallback && callbackUrl) {
          window.location.href = callbackUrl;
        } else {
          const session = await getSession();
          const role = (session?.user as any)?.role;
          const roleRedirects: Record<string, string> = {
            ADMIN: '/admin',
            DRIVER: '/driver',
            SHIPPER: '/shipper',
          };
          window.location.href = roleRedirects[role] ?? '/';
        }
      }
    } catch {
      setError(errorMessages.Default);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn('email', {
        email: magicEmail,
        callbackUrl,
        redirect: false,
      });
      if (res?.error) {
        setError('Failed to send magic link. Please try again.');
      } else {
        setMagicLinkSent(true);
      }
    } catch {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    await signIn('google', { callbackUrl });
  }

  const tabs: { key: AuthMethod; label: string }[] = [
    { key: 'credentials', label: 'Email' },
    { key: 'magic-link', label: 'Magic Link' },
    { key: 'google', label: 'Google' },
  ];

  return (
    <div>
      <h1 className="text-h2 text-center mb-8">Sign in</h1>

      {displayError && (
        <div className="mb-6 rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {displayError}
        </div>
      )}

      {/* Method tabs */}
      <div className="mb-8 flex rounded-md border border-border bg-background-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setMethod(tab.key);
              setError(null);
            }}
            className={`flex-1 py-2.5 text-sm font-medium transition ${
              method === tab.key
                ? 'bg-white text-text-primary shadow-sm rounded-md -m-px border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Email / Password */}
      {method === 'credentials' && (
        <form onSubmit={handleCredentials} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
              Email
            </label>
            <input
              id="email"
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
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-text-secondary hover:text-text-primary transition"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="block w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Signing in\u2026' : 'Sign in'}
          </button>
        </form>
      )}

      {/* Magic Link */}
      {method === 'magic-link' && (
        <>
          {magicLinkSent ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <svg className="h-6 w-6 text-success" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-text-secondary">
                We&apos;ve sent a magic link to <strong className="text-text-primary">{magicEmail}</strong>.
                Check your inbox and click the link to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-5">
              <div>
                <label htmlFor="magic-email" className="block text-sm font-medium text-text-primary mb-1.5">
                  Email
                </label>
                <input
                  id="magic-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="block w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Sending\u2026' : 'Send magic link'}
              </button>
            </form>
          )}
        </>
      )}

      {/* Google */}
      {method === 'google' && (
        <div className="space-y-5">
          <p className="text-sm text-text-secondary text-center">
            Sign in with your Google account to continue.
          </p>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-white py-2.5 text-sm font-medium text-text-primary transition hover:bg-background-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:opacity-50 disabled:pointer-events-none"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? 'Redirecting\u2026' : 'Continue with Google'}
          </button>
        </div>
      )}

      {/* Sign up link */}
      <p className="mt-8 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="font-medium text-text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
