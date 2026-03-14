'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { JobPostForm } from '@/components/jobs/job-post-form';
import type { JobPostFormData } from '@/components/jobs/job-post-form';
import { Card } from '@/components/ui/card';

export default function PostJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (data: JobPostFormData) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 401) {
            throw new Error('You must be signed in to post a job.');
          }
          if (res.status === 403) {
            throw new Error(
              'You have reached your monthly job limit. Upgrade your plan to post more jobs.'
            );
          }
          if (res.status === 422) {
            throw new Error(
              body.error || 'Please check your form inputs and try again.'
            );
          }
          throw new Error(
            body.error || 'Something went wrong. Please try again.'
          );
        }

        const result = await res.json();
        router.push(`/shipper/jobs/${result.id}`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred.'
        );
        setIsSubmitting(false);
      }
    },
    [router]
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h2 text-text-primary font-inter">Post a New Job</h1>
        <p className="text-sm text-text-secondary mt-1">
          Fill in the delivery details to dispatch a driver.
        </p>
      </div>

      <Card>
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-danger mt-0.5 shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p className="text-sm font-medium text-danger">
                  Unable to post job
                </p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}

        <JobPostForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          className="mx-auto"
        />
      </Card>
    </div>
  );
}
