'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

/* ── Constants ────────────────────────────────────────────────────────────── */

const TOTAL_STEPS = 7;

const VEHICLE_TYPES = ['BIKE', 'CAR', 'VAN', 'TRUCK', 'CARGO_VAN'];

const METRO_AREAS = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA',
  'San Antonio, TX',
  'San Diego, CA',
  'Dallas, TX',
  'Austin, TX',
  'San Francisco, CA',
  'Seattle, WA',
  'Denver, CO',
  'Boston, MA',
  'Nashville, TN',
  'Portland, OR',
  'Atlanta, GA',
  'Miami, FL',
  'Minneapolis, MN',
  'Detroit, MI',
];

const PLAN_OPTIONS = [
  {
    tier: 'FREE' as const,
    name: 'Free',
    price: '$0',
    period: '',
    features: [
      'Listed in dispatch network',
      'Real-time job notifications',
      'Basic earnings dashboard',
      '12% platform fee per completed job',
      'No credit card required',
    ],
  },
  {
    tier: 'STANDARD' as const,
    name: 'Standard',
    price: '$49',
    period: '/mo',
    features: [
      'Everything in Free',
      '6% platform fee per completed job',
      'Advanced earnings dashboard',
      'In-app navigation',
      'Fee pays for itself at 9+ jobs/month',
    ],
  },
  {
    tier: 'PRO' as const,
    name: 'Pro',
    price: '$99',
    period: '/mo',
    features: [
      'Everything in Standard',
      '0% platform fee',
      'Priority dispatch weighting',
      'Performance insights and scoring',
      'Dedicated driver support line',
    ],
  },
];

/* ── Step Indicator (progress dots) ──────────────────────────────────────── */

const StepIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => {
      const stepNum = i + 1;
      const isComplete = stepNum < current;
      const isCurrent = stepNum === current;

      return (
        <React.Fragment key={i}>
          <div
            className={`rounded-full transition-all ${
              isComplete
                ? 'w-3 h-3 bg-success'
                : isCurrent
                  ? 'w-4 h-4 bg-accent ring-4 ring-accent/15'
                  : 'w-3 h-3 bg-border-strong'
            }`}
          />
          {i < total - 1 && (
            <div
              className={`w-6 h-0.5 ${
                stepNum < current ? 'bg-success' : 'bg-border'
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function DriverOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [vehicleType, setVehicleType] = useState('CAR');
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'STANDARD' | 'PRO'>('FREE');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectStatus, setConnectStatus] = useState<'pending' | 'complete'>('pending');

  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return serviceAreas.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return termsAccepted;
      case 6:
        return connectStatus === 'complete';
      case 7:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step === TOTAL_STEPS) {
      setSaving(true);
      try {
        await fetch('/api/drivers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleType,
            serviceAreas,
            subscriptionTier: selectedPlan,
            termsAcceptedAt,
            onboardingComplete: true,
          }),
        });

        router.push('/driver');
      } catch {
        router.push('/driver');
      } finally {
        setSaving(false);
      }
      return;
    }

    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const toggleArea = (area: string) => {
    setServiceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const handleTermsToggle = (checked: boolean) => {
    setTermsAccepted(checked);
    if (checked) {
      setTermsAcceptedAt(new Date().toISOString());
    } else {
      setTermsAcceptedAt(null);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm font-bold tracking-tight-h2 text-text-primary mb-1">TRAILBLAZER</p>
          <p className="text-xs text-text-secondary">Driver Onboarding</p>
        </div>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        <Card>
          {/* ── Step 1: Welcome ───────────────────────────────────────────── */}
          {step === 1 && (
            <div className="text-center space-y-4 py-4">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto text-accent"
              >
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <h2 className="text-h2 font-bold tracking-tight-h2 text-text-primary">
                Welcome to Trailblazer
              </h2>
              <p className="text-sm text-text-secondary max-w-sm mx-auto">
                You are signing up as a <span className="font-semibold text-text-primary">Driver</span>.
                We will walk you through setting up your vehicle, service areas, subscription, and profile
                in just a few steps.
              </p>
              <div className="inline-flex items-center gap-2 bg-background-3 rounded-md px-3 py-1.5 border border-border">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-xs font-medium text-text-primary">Role: Driver</span>
              </div>
            </div>
          )}

          {/* ── Step 2: Vehicle Type + Service Areas ─────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-h3 font-semibold tracking-tight-h3 text-text-primary mb-1">
                  Vehicle &amp; Service Areas
                </h2>
                <p className="text-sm text-text-secondary">
                  Tell us about your vehicle and where you want to deliver.
                </p>
              </div>

              <div>
                <p className="section-label">Vehicle Type</p>
                <Select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ')}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <p className="section-label">Service Areas</p>
                <p className="text-xs text-text-muted mb-3">
                  Select at least one metro area where you are available for deliveries.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {METRO_AREAS.map((area) => {
                    const isSelected = serviceAreas.includes(area);
                    return (
                      <label
                        key={area}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md border cursor-pointer transition ${
                          isSelected
                            ? 'border-accent bg-accent/5'
                            : 'border-border bg-white hover:bg-background-3'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleArea(area)}
                          className="w-4 h-4 rounded border-border-strong text-accent focus:ring-accent/20 focus:ring-2"
                        />
                        <span className={`text-sm ${isSelected ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                          {area}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Subscription Tier Selection ──────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-h3 font-semibold tracking-tight-h3 text-text-primary mb-1">
                  Choose Your Plan
                </h2>
                <p className="text-sm text-text-secondary">
                  Select a subscription plan to get started.
                </p>
              </div>

              <div className="space-y-4">
                {PLAN_OPTIONS.map((plan) => {
                  const isSelected = selectedPlan === plan.tier;
                  return (
                    <button
                      key={plan.tier}
                      type="button"
                      onClick={() => setSelectedPlan(plan.tier)}
                      className={`w-full text-left p-5 rounded-lg border-2 transition ${
                        isSelected
                          ? 'border-accent bg-white'
                          : 'border-border bg-background-3 hover:border-border-strong'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{plan.name}</p>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                          <span className="font-mono text-lg font-bold text-text-primary">
                            {plan.price}
                          </span>
                          <span className="text-xs text-text-muted">{plan.period}</span>
                        </div>
                      </div>

                      <ul className="space-y-1.5">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={isSelected ? 'text-success' : 'text-text-muted'}
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="text-xs text-text-secondary">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {isSelected && (
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-xs text-success font-medium">Selected</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 4: Profile Photo ────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-h3 font-semibold tracking-tight-h3 text-text-primary mb-1">
                  Profile Photo
                </h2>
                <p className="text-sm text-text-secondary">
                  Add a photo so shippers can identify you. This step is optional.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                {/* Styled upload area */}
                <label className="w-full cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-3 hover:border-border-strong hover:bg-background-3 transition">
                    <div className="w-20 h-20 rounded-full bg-background-3 border border-border flex items-center justify-center">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-text-muted"
                      >
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-accent">Click to upload</p>
                      <p className="text-xs text-text-muted mt-0.5">JPG or PNG, max 5 MB</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={() => {
                      // Photo upload is a placeholder -- file handling would be
                      // connected to an actual upload endpoint in production
                    }}
                  />
                </label>

                <p className="text-xs text-text-muted text-center">
                  You can always add or change your photo later from your profile settings.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 5: Terms of Service ─────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-h3 font-semibold tracking-tight-h3 text-text-primary mb-1">
                  Terms of Service
                </h2>
                <p className="text-sm text-text-secondary">
                  Please review and accept the terms of service to continue.
                </p>
              </div>

              <div className="bg-background-3 rounded-lg p-4 max-h-48 overflow-y-auto border border-border">
                <div className="text-xs text-text-secondary space-y-2 leading-relaxed">
                  <p>
                    By using the Trailblazer platform as a driver, you agree to the following terms
                    and conditions. You acknowledge that Trailblazer is a dispatch matching platform
                    and does not employ you directly.
                  </p>
                  <p>
                    You are responsible for maintaining valid insurance, a valid driver license, and
                    any required permits for your vehicle type and service areas. You agree to handle
                    all packages with reasonable care and deliver them in a timely manner.
                  </p>
                  <p>
                    Shippers pay the platform for each delivery. Trailblazer deducts a platform fee
                    based on your subscription tier (Free: 12%, Standard: 6%, Pro: 0%) and transfers
                    the remaining payout to your connected bank account via Stripe.
                  </p>
                  <p>
                    You agree to maintain a professional standard of conduct while representing
                    yourself on the Trailblazer platform, including punctuality, safe driving, and
                    courteous communication with shippers and recipients.
                  </p>
                  <p>
                    Trailblazer reserves the right to suspend or terminate your account for
                    violations of these terms, consistently poor ratings, or failure to maintain
                    an active subscription.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => handleTermsToggle(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border-strong text-accent focus:ring-accent/20 focus:ring-2"
                />
                <span className="text-sm text-text-primary">
                  I have read and agree to the Terms of Service and Privacy Policy.
                </span>
              </label>

              {termsAcceptedAt && (
                <p className="text-xs text-text-muted font-mono">
                  Accepted at {new Date(termsAcceptedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* ── Step 6: Stripe Connect (Payout Setup) ────────────────── */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-h3 font-semibold tracking-tight-h3 text-text-primary mb-1">
                  Set Up Payouts
                </h2>
                <p className="text-sm text-text-secondary">
                  Link your bank account to receive delivery payouts. Powered by Stripe.
                </p>
              </div>

              {connectStatus === 'complete' ? (
                <div className="flex items-center gap-3 p-4 bg-success/5 border border-success/20 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="text-sm font-medium text-success">Payout account connected</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-background-3 rounded-lg p-4 border border-border">
                    <ul className="text-sm text-text-secondary space-y-2">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                        <span>Click the button below to open Stripe</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                        <span>Enter your bank account or debit card details</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                        <span>Return here to continue onboarding</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={async () => {
                      setConnectLoading(true);
                      try {
                        const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' });
                        if (res.ok) {
                          const data = await res.json();
                          if (data.url) {
                            window.location.href = data.url;
                          }
                        }
                      } catch {
                        // Silent fail
                      } finally {
                        setConnectLoading(false);
                      }
                    }}
                    disabled={connectLoading}
                    className="w-full"
                  >
                    {connectLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Connecting...
                      </span>
                    ) : (
                      'Connect Bank Account'
                    )}
                  </Button>

                  <p className="text-xs text-text-muted text-center">
                    Payout setup is required to receive delivery payments. You can update your bank details later from your profile.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 7: Ready ────────────────────────────────────────────── */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="text-center py-2">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto text-success mb-3"
                >
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h2 className="text-h2 font-bold tracking-tight-h2 text-text-primary mb-1">
                  You are all set!
                </h2>
                <p className="text-sm text-text-secondary max-w-sm mx-auto">
                  Your driver account is ready. Once you reach your dashboard, toggle your
                  availability to start receiving job matches from the dispatch engine.
                </p>
              </div>

              <div className="bg-background-3 rounded-lg p-4 border border-border">
                <p className="section-label">How Availability Works</p>
                <ul className="text-sm text-text-secondary space-y-2">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Toggle your availability to &ldquo;Available for Dispatch&rdquo; from the dashboard</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>The cognitive dispatch engine will match you with nearby jobs in your service areas</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <span>Your location will be tracked while available to optimize matching</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                    <span>Toggle off when you are done for the day</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <div>
              {step > 1 && (
                <Button variant="secondary" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={!canAdvance() || saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Setting up...
                </span>
              ) : step === TOTAL_STEPS ? (
                'Go to Dashboard'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </Card>

        {/* Step counter */}
        <p className="text-center text-xs text-text-muted mt-4">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>
    </div>
  );
}
