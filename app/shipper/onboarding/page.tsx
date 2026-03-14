'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TOTAL_STEPS = 5;

const METRO_AREAS = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Francisco',
  'Austin',
  'Seattle',
  'Denver',
  'Boston',
  'Atlanta',
  'Miami',
  'Minneapolis',
  'Portland',
  'Detroit',
  'Charlotte',
];

interface OnboardingData {
  companyName: string;
  companyWebsite: string;
  companySize: string;
  deliveryZones: string[];
  selectedTier: 'STARTER' | 'GROWTH';
  agreedToTerms: boolean;
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const isCompleted = step < current;
        const isCurrent = step === current;

        return (
          <div
            key={step}
            className={`transition-all duration-300 rounded-full ${
              isCurrent
                ? 'w-8 h-2.5 bg-accent'
                : isCompleted
                  ? 'w-2.5 h-2.5 bg-accent'
                  : 'w-2.5 h-2.5 bg-border'
            }`}
          />
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    companyWebsite: '',
    companySize: '',
    deliveryZones: [],
    selectedTier: 'STARTER',
    agreedToTerms: false,
  });

  const updateField = useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleZone = useCallback((zone: string) => {
    setData((prev) => ({
      ...prev,
      deliveryZones: prev.deliveryZones.includes(zone)
        ? prev.deliveryZones.filter((z) => z !== zone)
        : [...prev.deliveryZones, zone],
    }));
  }, []);

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return data.companyName.trim().length >= 2;
      case 2:
        return data.deliveryZones.length > 0;
      case 3:
        return true;
      case 4:
        return data.agreedToTerms;
      case 5:
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS && canProceed()) {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  }

  async function handleComplete() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/shipper/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save onboarding data.');
      }

      router.push('/shipper');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  const companySizeOptions = [
    { value: '1-5', label: '1-5 employees' },
    { value: '6-20', label: '6-20 employees' },
    { value: '21-50', label: '21-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '200+', label: '200+ employees' },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-h2 text-text-primary font-inter">
            Welcome to Trailblazer
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Let&apos;s get your account set up in a few quick steps.
          </p>
        </div>

        {/* Step Dots */}
        <StepDots current={step} total={TOTAL_STEPS} />

        <Card>
          {/* Step 1: Company Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Step 1 of 5
                </p>
                <h2 className="text-h3 text-text-primary mt-1">
                  Company Details
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Tell us about your business.
                </p>
              </div>

              <Input
                label="Company Name"
                placeholder="Acme Logistics"
                value={data.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                autoFocus
              />

              <Input
                label="Website (optional)"
                placeholder="https://example.com"
                value={data.companyWebsite}
                onChange={(e) => updateField('companyWebsite', e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Company Size
                </label>
                <select
                  value={data.companySize}
                  onChange={(e) => updateField('companySize', e.target.value)}
                  className="w-full px-3 py-2 bg-background-3 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                >
                  <option value="">Select size...</option>
                  {companySizeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Delivery Zones */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Step 2 of 5
                </p>
                <h2 className="text-h3 text-text-primary mt-1">
                  Primary Delivery Zones
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Select the metro areas where you need deliveries.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                {METRO_AREAS.map((area) => {
                  const isSelected = data.deliveryZones.includes(area);
                  return (
                    <label
                      key={area}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition ${
                        isSelected
                          ? 'border-accent bg-background-3'
                          : 'border-border hover:border-border-strong'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleZone(area)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-accent border-accent'
                            : 'border-border-strong bg-white'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              d="M11.5 3.5L5.5 10.5L2.5 7.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-text-primary">{area}</span>
                    </label>
                  );
                })}
              </div>

              {data.deliveryZones.length > 0 && (
                <p className="text-xs text-text-muted">
                  <span className="font-mono font-jetbrains">
                    {data.deliveryZones.length}
                  </span>{' '}
                  zone{data.deliveryZones.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {/* Step 3: Subscription Tier */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Step 3 of 5
                </p>
                <h2 className="text-h3 text-text-primary mt-1">
                  Choose Your Plan
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Select the plan that fits your needs. You can upgrade anytime.
                </p>
              </div>

              <div className="space-y-3">
                {/* Starter */}
                <button
                  type="button"
                  onClick={() => updateField('selectedTier', 'STARTER')}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    data.selectedTier === 'STARTER'
                      ? 'border-accent bg-background-3'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        Starter
                      </span>
                      {data.selectedTier === 'STARTER' && (
                        <Badge variant="info">Selected</Badge>
                      )}
                    </div>
                    <span className="text-lg font-bold text-text-primary font-jetbrains">
                      $199
                      <span className="text-xs font-normal text-text-muted">
                        /mo
                      </span>
                    </span>
                  </div>
                  <ul className="space-y-1">
                    <li className="text-xs text-text-secondary flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Up to 50 jobs per month
                    </li>
                    <li className="text-xs text-text-secondary flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Standard driver matching
                    </li>
                    <li className="text-xs text-text-secondary flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Email support
                    </li>
                  </ul>
                </button>

                {/* Growth */}
                <button
                  type="button"
                  onClick={() => updateField('selectedTier', 'GROWTH')}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    data.selectedTier === 'GROWTH'
                      ? 'border-accent bg-background-3'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        Growth
                      </span>
                      <Badge variant="success">Recommended</Badge>
                      {data.selectedTier === 'GROWTH' && (
                        <Badge variant="info">Selected</Badge>
                      )}
                    </div>
                    <span className="text-lg font-bold text-text-primary font-jetbrains">
                      $399
                      <span className="text-xs font-normal text-text-muted">
                        /mo
                      </span>
                    </span>
                  </div>
                  <ul className="space-y-1">
                    <li className="text-xs text-text-secondary flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Unlimited job postings
                    </li>
                    <li className="text-xs text-text-secondary flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Priority driver matching
                    </li>
                    <li className="text-xs text-text-secondary flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Driver directory access
                    </li>
                    <li className="text-xs text-text-secondary flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Analytics dashboard & priority support
                    </li>
                  </ul>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Terms of Service */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Step 4 of 5
                </p>
                <h2 className="text-h3 text-text-primary mt-1">
                  Terms of Service
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Please review and accept our terms to continue.
                </p>
              </div>

              <div className="bg-background-3 rounded-lg p-4 max-h-[200px] overflow-y-auto text-xs text-text-secondary leading-relaxed space-y-2">
                <p>
                  By using Trailblazer, you agree to comply with all applicable
                  laws and regulations regarding the shipment and delivery of
                  goods. You represent that all package descriptions are accurate
                  and that shipments do not contain prohibited items.
                </p>
                <p>
                  Trailblazer acts as a platform connecting shippers with
                  independent delivery drivers. We do not assume liability for
                  lost, damaged, or delayed shipments beyond the scope of our
                  service guarantees as described in your subscription tier.
                </p>
                <p>
                  Payment is processed securely through Stripe. Subscription fees
                  are billed monthly and are non-refundable except as required by
                  applicable law. You may cancel or change your subscription tier
                  at any time through your billing settings.
                </p>
                <p>
                  We reserve the right to suspend or terminate accounts that
                  violate our terms of service, engage in fraudulent activity, or
                  misuse the platform. For full terms, contact our support team.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={data.agreedToTerms}
                  onChange={(e) =>
                    updateField('agreedToTerms', e.target.checked)
                  }
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                    data.agreedToTerms
                      ? 'bg-accent border-accent'
                      : 'border-border-strong bg-white group-hover:border-accent/50'
                  }`}
                >
                  {data.agreedToTerms && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M11.5 3.5L5.5 10.5L2.5 7.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-text-primary">
                  I agree to the Terms of Service and Privacy Policy
                </span>
              </label>
            </div>
          )}

          {/* Step 5: Post Your First Job */}
          {step === 5 && (
            <div className="space-y-6 text-center py-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Step 5 of 5
                </p>
                <h2 className="text-h3 text-text-primary mt-1">
                  You&apos;re All Set
                </h2>
                <p className="text-sm text-text-secondary mt-2">
                  Your account is ready. Start by posting your first delivery
                  job.
                </p>
              </div>

              <div className="bg-background-3 rounded-lg p-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-accent"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text-primary mb-1">
                  Welcome, {data.companyName || 'there'}!
                </p>
                <p className="text-xs text-text-secondary mb-4">
                  {data.selectedTier === 'GROWTH'
                    ? 'Growth plan selected with unlimited job postings.'
                    : 'Starter plan selected with up to 50 jobs/month.'}
                </p>

                <Link href="/shipper/post">
                  <Button className="w-full">
                    <span className="flex items-center gap-2 justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Post Your First Job
                    </span>
                  </Button>
                </Link>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={saving}>
                {saving ? 'Finishing...' : 'Go to Dashboard'}
              </Button>
            )}
          </div>
        </Card>

        {/* Skip link */}
        <div className="text-center mt-4">
          <Link
            href="/shipper"
            className="text-xs text-text-muted hover:text-text-primary transition"
          >
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}
