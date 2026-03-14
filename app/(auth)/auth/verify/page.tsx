'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function VerifyPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    setResending(true);
    try {
      await fetch('/api/auth/resend-verification', { method: 'POST' });
      setResent(true);
    } catch {
      // Silently handle — user can try again
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="text-center">
      {/* Mail icon */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-background-2">
        <svg
          className="h-8 w-8 text-text-primary"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="2"
            y="4"
            width="20"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="text-h2 mb-3">Check your email</h1>
      <p className="text-sm text-text-secondary leading-relaxed max-w-[340px] mx-auto mb-8">
        We&apos;ve sent a verification link to your email. Click the link to activate your account.
      </p>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || resent}
        className="w-full rounded-md border border-border bg-white py-2.5 text-sm font-medium text-text-primary transition hover:bg-background-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:opacity-50 disabled:pointer-events-none"
      >
        {resent
          ? 'Verification email sent'
          : resending
            ? 'Resending\u2026'
            : 'Resend verification email'}
      </button>

      <p className="mt-6 text-sm text-text-secondary">
        <Link href="/auth/signin" className="font-medium text-text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
