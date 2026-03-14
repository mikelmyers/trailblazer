'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { AvailabilityToggle } from '@/components/dashboard/availability-toggle';

/* ── Constants ────────────────────────────────────────────────────────────── */

const TOTAL_STEPS = 6;

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
    tier: 'STANDARD',
    name: 'Standard',
    price: '$9.99/mo',
    description: 'Access to job feed, real-time dispatch matching, and basic route optimization.',
  },
  {
    tier: 'PRO',
    name: 'Pro',
    price: '$24.99/mo',
    description:
      'Priority dispatch matching, advanced analytics, premium support, and advanced route optimization.',
  },
];

/* ── Step Indicator ───────────────────────────────────────────────────────── */

const StepIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => {
      const stepNum = i + 1;
      const isComplete = stepNum < current;
      const isCurrent = stepNum === current;

      return (
        <React.Fragment key={i}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition ${
              isComplete
                ? 'bg-success text-white'
                : isCurrent
                  ? 'bg-accent text-white'
                  : 'bg-background-3 text-text-muted border border-border'
            }`}
          >
            {isComplete ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              stepNum
            )}
          </div>
          {i < total - 1 && (
            <div
              className={`flex-1 h-0.5 ${
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
  const [selectedPlan, setSelectedPlan] = useState('STANDARD');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return true; // Welcome
      case 2:
        return serviceAreas.length > 0;
      case 3:
        return true; // Subscription choice
      case 4:
        return true; // Photo optional
      case 5:
        return termsAccepted;
      case 6:
        return true; // Ready
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step === TOTAL_STEPS) {
      // Final step: save and redirect
      setSaving(true);
      try {
        // Save profile
        await fetch('/api/drivers/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleType, serviceAreas }),
        });

        // Upload photo if present
        if (photoFile) {
          const formData = new FormData();
          formData.append('photo', photoFile);
          await fetch('/api/drivers/photo', { method: 'POST', body: formData });
        }

        // Start subscription checkout
        const subRes = await fetch('/api/drivers/subscription/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: selectedPlan }),
        });

        if (subRes.ok) {
          const data = await subRes.json();
          if (data.url) {
            window.location.href = data.url;
            return;
          }
        }

        // Mark onboarding complete
        await fetch('/api/drivers/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true }),
        });

        router.push('/driver');
      } catch {
        // Silent fail -- still navigate
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleArea = (area: string) => {
    setServiceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  return (
    <div className="min-h-screen bg-background-2 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm font-bold tracking-tight-h2 text-text-primary mb-1">TRAILBLAZER</p>
          <p className="text-xs text-text-secondary">Driver Onboarding</p>
        </div>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        <Card>
          {/* Step 1: Welcome */}
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
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <h2 className="text-h2 font-bold tracking-tight-h2 text-text-primary">
                Welcome to Trailblazer
              </h2>
              <p className="text-sm text-text-secondary max-w-sm mx-auto">
                Let us set up your driver account. This will only take a few minutes. You will
                configure your vehicle, service areas, and subscription.
              </p>
            </div>
          )}

          {/* Step 2: Vehicle & Service Areas */}
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
                  Select at least one metro area.
                </p>
                <div className="flex flex-wrap gap-2">
                  {METRO_AREAS.map((area) => {
                    const isSelected = serviceAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleArea(area)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition border ${
                          isSelected
                            ? 'bg-accent text-white border-accent'
                            : 'bg-background-3 text-text-secondary border-border hover:border-border-strong'
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Subscription */}
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

              <div className="space-y-3">
                {PLAN_OPTIONS.map((plan) => {
                  const isSelected = selectedPlan === plan.tier;
                  return (
                    <button
                      key={plan.tier}
                      type="button"
                      onClick={() => setSelectedPlan(plan.tier)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition ${
                        isSelected
                          ? 'border-accent bg-white'
                          : 'border-border bg-background-3 hover:border-border-strong'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{plan.name}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{plan.description}</p>
                        </div>
                        <p className="font-mono text-sm font-bold text-text-primary whitespace-nowrap ml-4">
                          {plan.price}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 mt-2">
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

          {/* Step 4: Profile Photo */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-h3 font-semibold tracking-tight-h3 text-text-primary mb-1">
                  Profile Photo
                </h2>
                <p className="text-sm text-text-secondary">
                  Add a photo so shippers can identify you. This is optional.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-background-3 border border-border flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      width="40"
                      height="40"
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
                  )}
                </div>

                <label className="inline-flex items-center justify-center rounded-md font-medium transition px-4 py-2 text-sm bg-transparent text-accent border border-border-strong hover:bg-background-3 cursor-pointer">
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handlePhotoChange}
                  />
                </label>
                <p className="text-xs text-text-muted">JPG or PNG, max 5 MB</p>
              </div>
            </div>
          )}

          {/* Step 5: Terms */}
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

              <div className="bg-background-3 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="text-xs text-text-secondary space-y-2">
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
                    Payments for deliveries are handled directly between you and the shipper.
                    Trailblazer charges a monthly subscription fee for access to the platform, which
                    is billed through Stripe.
                  </p>
                  <p>
                    You agree to maintain a professional standard of conduct while representing
                    yourself on the Trailblazer platform, including punctuality, safe driving, and
                    courteous communication with shippers and recipients.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border-strong text-accent focus:ring-accent/20"
                />
                <span className="text-sm text-text-primary">
                  I have read and agree to the Terms of Service and Privacy Policy.
                </span>
              </label>
            </div>
          )}

          {/* Step 6: Ready */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center">
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
                <p className="text-sm text-text-secondary">
                  Your account is configured. Toggle your availability to start receiving jobs.
                </p>
              </div>

              <div className="flex justify-center">
                <AvailabilityToggle />
              </div>

              <div className="bg-background-3 rounded-lg p-4">
                <p className="section-label">How It Works</p>
                <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
                  <li>Toggle your availability to &ldquo;Available for Dispatch&rdquo;</li>
                  <li>Our cognitive dispatch engine will match you with nearby jobs</li>
                  <li>Accept a job and follow the pickup and delivery flow</li>
                  <li>Complete the delivery and get rated by the shipper</li>
                </ol>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
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
              {saving
                ? 'Setting up...'
                : step === TOTAL_STEPS
                  ? 'Go to Dashboard'
                  : 'Next'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
