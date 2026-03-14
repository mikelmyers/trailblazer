'use client';

import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (pw: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'At least 12 characters', test: (pw) => pw.length >= 12 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One number', test: (pw) => /\d/.test(pw) },
  { label: 'One special character', test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pw) },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  return (
    <ul className="mt-2 space-y-1.5">
      {requirements.map((req) => {
        const met = password.length > 0 && req.test(password);
        return (
          <li key={req.label} className="flex items-center gap-2 text-sm">
            {met ? (
              <svg
                className="h-4 w-4 shrink-0 text-success"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M13.25 4.75L6 12 2.75 8.75"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 shrink-0 text-text-muted"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
            <span className={met ? 'text-success' : 'text-text-muted'}>
              {req.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function isPasswordValid(password: string): boolean {
  return requirements.every((req) => req.test(password));
}
