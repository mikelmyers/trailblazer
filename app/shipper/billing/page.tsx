'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BillingData {
  currentTier: string;
  jobsThisMonth: number;
  monthlyLimit: number | null;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

interface Plan {
  tier: string;
  name: string;
  price: string;
  priceDetail: string;
  features: string[];
  highlighted: boolean;
}

const plans: Plan[] = [
  {
    tier: 'STARTER',
    name: 'Starter',
    price: '$0',
    priceDetail: 'Free forever',
    features: [
      'Up to 25 jobs per month',
      'Standard matching',
      'Basic tracking',
      'Email support',
    ],
    highlighted: false,
  },
  {
    tier: 'GROWTH',
    name: 'Growth',
    price: '$99',
    priceDetail: 'per month',
    features: [
      'Unlimited job postings',
      'Priority driver matching',
      'Driver directory access',
      'Analytics dashboard',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    price: '$299',
    priceDetail: 'per month',
    features: [
      'Everything in Growth',
      'Dedicated account manager',
      'Custom integrations & API',
      'SLA guarantees',
      'Volume discounts',
      'Phone support',
    ],
    highlighted: false,
  },
];

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch('/api/shipper/billing');
      if (!res.ok) throw new Error('Failed to load billing data');
      const data: BillingData = await res.json();
      setBilling(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/shipper/billing/portal', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to open billing portal');
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setPortalLoading(false);
    }
  }

  async function handleUpgrade(tier: string) {
    setUpgradeLoading(tier);
    try {
      const res = await fetch('/api/shipper/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      if (!res.ok) throw new Error('Failed to start upgrade');
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setUpgradeLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-background-3 rounded animate-pulse" />
        <div className="h-40 bg-white border border-border rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-72 bg-white border border-border rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-danger mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchBilling}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const usagePercent = billing?.monthlyLimit
    ? Math.min(
        100,
        Math.round(((billing.jobsThisMonth ?? 0) / billing.monthlyLimit) * 100)
      )
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h2 text-text-primary">Billing</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your subscription and usage.
        </p>
      </div>

      {/* Current Plan + Usage */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="section-label">Current Plan</p>
            <div className="flex items-center gap-3">
              <span className="text-h3 text-text-primary">
                {billing?.currentTier === 'STARTER'
                  ? 'Starter'
                  : billing?.currentTier === 'GROWTH'
                  ? 'Growth'
                  : 'Enterprise'}
              </span>
              <Badge
                variant={
                  billing?.currentTier === 'STARTER'
                    ? 'default'
                    : billing?.currentTier === 'GROWTH'
                    ? 'info'
                    : 'success'
                }
              >
                {billing?.currentTier}
              </Badge>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleManageBilling}
            disabled={portalLoading}
          >
            {portalLoading ? 'Opening...' : 'Manage Billing'}
          </Button>
        </div>

        {/* Usage Bar (Starter only) */}
        {billing?.monthlyLimit && usagePercent !== null && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="section-label mb-0">Monthly Usage</p>
              <span className="text-sm font-mono text-text-primary">
                {billing.jobsThisMonth} / {billing.monthlyLimit}
              </span>
            </div>
            <div className="w-full bg-background-3 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  usagePercent >= 90
                    ? 'bg-danger'
                    : usagePercent >= 70
                    ? 'bg-yellow-500'
                    : 'bg-success'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              {billing.monthlyLimit - billing.jobsThisMonth} jobs remaining
              this billing period
            </p>
          </div>
        )}

        {!billing?.monthlyLimit && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="section-label mb-0">Jobs This Month</p>
              <span className="text-sm font-mono text-text-primary">
                {billing?.jobsThisMonth ?? 0}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">Unlimited postings</p>
          </div>
        )}
      </Card>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-h3 text-text-primary mb-4">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = billing?.currentTier === plan.tier;
            const isDowngrade =
              billing?.currentTier === 'ENTERPRISE' ||
              (billing?.currentTier === 'GROWTH' && plan.tier === 'STARTER');

            return (
              <div
                key={plan.tier}
                className={`bg-white border rounded-lg p-6 flex flex-col ${
                  plan.highlighted
                    ? 'border-accent ring-1 ring-accent'
                    : 'border-border'
                } ${isCurrent ? 'ring-2 ring-success/30' : ''}`}
              >
                {plan.highlighted && (
                  <Badge variant="info" className="self-start mb-3">
                    Most Popular
                  </Badge>
                )}
                {isCurrent && (
                  <Badge variant="success" className="self-start mb-3">
                    Current Plan
                  </Badge>
                )}

                <h3 className="text-h3 text-text-primary">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-h2 font-bold font-mono text-text-primary">
                    {plan.price}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {plan.priceDetail}
                  </span>
                </div>

                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-success mt-0.5 flex-shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={handleManageBilling}
                    >
                      Contact Support
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlighted ? 'primary' : 'secondary'}
                      className="w-full"
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={upgradeLoading === plan.tier}
                    >
                      {upgradeLoading === plan.tier
                        ? 'Processing...'
                        : 'Upgrade Plan'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
