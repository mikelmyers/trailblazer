'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const US_METROS = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin',
  'Miami', 'Atlanta', 'Seattle', 'Denver', 'Boston',
  'Nashville', 'Portland', 'Las Vegas', 'Detroit', 'Minneapolis',
];

const STEPS = [
  'Company Details',
  'Delivery Zones',
  'Subscription',
  'Terms',
  'First Job',
];

export default function ShipperOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [zones, setZones] = useState<string[]>([]);
  const [tier, setTier] = useState<'STARTER' | 'GROWTH'>('STARTER');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleZone = (zone: string) => {
    setZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tier === 'STARTER' ? 'SHIPPER_STARTER' : 'SHIPPER_GROWTH',
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push('/shipper');
      }
    } catch {
      router.push('/shipper');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-h1 font-bold tracking-tight-h1 text-text-primary mb-2">
          Welcome to Trailblazer
        </h1>
        <p className="text-text-secondary mb-10">
          Let&apos;s get your shipping account set up.
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-12">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= step
                    ? 'bg-accent text-white'
                    : 'bg-background-3 text-text-muted'
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 h-px ${
                    i < step ? 'bg-accent' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Company Details */}
        {step === 0 && (
          <div>
            <p className="section-label">COMPANY DETAILS</p>
            <h2 className="text-h2 font-bold tracking-tight-h2 mb-6">
              Tell us about your company
            </h2>
            <div className="space-y-4">
              <Input
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Logistics"
              />
            </div>
            <div className="mt-8">
              <Button
                onClick={() => setStep(1)}
                disabled={!companyName.trim()}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Delivery Zones */}
        {step === 1 && (
          <div>
            <p className="section-label">DELIVERY ZONES</p>
            <h2 className="text-h2 font-bold tracking-tight-h2 mb-6">
              Where do you need deliveries?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {US_METROS.map((metro) => (
                <button
                  key={metro}
                  onClick={() => toggleZone(metro)}
                  className={`px-4 py-3 rounded-md border text-sm font-medium transition ${
                    zones.includes(metro)
                      ? 'bg-accent text-white border-accent'
                      : 'bg-white text-text-primary border-border hover:bg-background-3'
                  }`}
                >
                  {metro}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="secondary" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)} disabled={zones.length === 0}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Subscription */}
        {step === 2 && (
          <div>
            <p className="section-label">SUBSCRIPTION</p>
            <h2 className="text-h2 font-bold tracking-tight-h2 mb-6">
              Choose your plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setTier('STARTER')}
                className={`p-6 rounded-lg border-2 text-left transition ${
                  tier === 'STARTER'
                    ? 'border-accent bg-white'
                    : 'border-border bg-white hover:border-border-strong'
                }`}
              >
                <p className="text-h3 font-semibold mb-1">Starter</p>
                <p className="text-h2 font-bold">
                  $199<span className="text-body text-text-muted">/mo</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                  <li>Up to 50 jobs/month</li>
                  <li>Terra basic visibility</li>
                  <li>Standard dispatch</li>
                </ul>
              </button>
              <button
                onClick={() => setTier('GROWTH')}
                className={`p-6 rounded-lg border-2 text-left transition relative ${
                  tier === 'GROWTH'
                    ? 'border-accent bg-white'
                    : 'border-border bg-white hover:border-border-strong'
                }`}
              >
                <span className="absolute -top-3 right-4 bg-accent text-white text-[10px] font-medium uppercase tracking-wide-label px-2 py-0.5 rounded">
                  Recommended
                </span>
                <p className="text-h3 font-semibold mb-1">Growth</p>
                <p className="text-h2 font-bold">
                  $399<span className="text-body text-text-muted">/mo</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                  <li>Unlimited jobs</li>
                  <li>Full Terra dashboard</li>
                  <li>Priority dispatch</li>
                  <li>Dedicated support</li>
                </ul>
              </button>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step 4: Terms */}
        {step === 3 && (
          <div>
            <p className="section-label">TERMS OF SERVICE</p>
            <h2 className="text-h2 font-bold tracking-tight-h2 mb-6">
              Review and accept
            </h2>
            <div className="border border-border rounded-lg p-6 max-h-64 overflow-y-auto mb-6 text-sm text-text-secondary">
              <p className="mb-4">
                By using Trailblazer, you agree to our Terms of Service and Privacy Policy.
                Trailblazer provides a dispatch platform connecting shippers with independent drivers.
                All delivery payments are handled directly between shippers and drivers.
              </p>
              <p className="mb-4">
                Subscription fees are billed monthly and are non-refundable. You may cancel
                your subscription at any time through the billing portal.
              </p>
              <p>
                Trailblazer reserves the right to suspend accounts that violate our
                community guidelines or terms of use.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-border-strong"
              />
              <span className="text-sm">
                I agree to the Terms of Service and Privacy Policy
              </span>
            </label>
            <div className="flex gap-3 mt-8">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={!termsAccepted}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Post First Job */}
        {step === 4 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-h2 font-bold tracking-tight-h2 mb-4">
              You&apos;re all set!
            </h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Your account is ready. Post your first job and experience
              cognitive dispatch powered by intelligent routing.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? 'Setting up...' : 'Complete Setup & Choose Plan'}
              </Button>
              <button
                onClick={() => router.push('/shipper/post')}
                className="text-sm text-accent-blue hover:underline"
              >
                Post your first job
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
