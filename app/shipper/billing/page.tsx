'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BillingData {
  tier: 'STARTER' | 'GROWTH';
  jobsThisMonth: number;
  monthlyLimit: number | null;
  billingCycleEnd: string | null;
}

const planDetails = {
  STARTER: {
    name: 'Starter',
    price: '$199',
    period: '/mo',
    features: [
      'Up to 50 jobs per month',
      'Standard driver matching',
      'Email support',
      'Basic job tracking',
      'Route optimization by Terra',
    ],
  },
  GROWTH: {
    name: 'Growth',
    price: '$399',
    period: '/mo',
    features: [
      'Unlimited job postings',
      'Priority driver matching',
      'Driver directory access',
      'Analytics dashboard',
      'Priority support',
      'Route optimization by Terra',
      'Custom delivery zones',
    ],
  },
};

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/subscription');
      if (!res.ok) throw new Error('Failed to load billing information.');
      const data = await res.json();
      setBilling({
        tier: data.tier || 'STARTER',
        jobsThisMonth: data.jobsThisMonth ?? 0,
        monthlyLimit: data.monthlyLimit ?? 50,
        billingCycleEnd: data.billingCycleEnd ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'GROWTH' }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to start checkout.');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to open billing portal.');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-background-3 rounded animate-pulse" />
        <div className="h-32 bg-background-3 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-background-3 rounded-lg animate-pulse" />
          <div className="h-80 bg-background-3 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !billing) {
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

  const currentTier = billing?.tier || 'STARTER';
  const currentPlan = planDetails[currentTier];
  const jobsUsed = billing?.jobsThisMonth ?? 0;
  const jobsLimit = billing?.monthlyLimit ?? 50;
  const usagePercent = jobsLimit ? Math.min((jobsUsed / jobsLimit) * 100, 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-h2 text-text-primary font-inter">Billing</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your subscription and view usage.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-h3 text-text-primary">Current Plan</h2>
            <Badge variant={currentTier === 'GROWTH' ? 'info' : 'default'}>
              {currentPlan.name}
            </Badge>
          </div>
          <div className="text-right">
            <span className="text-2xl font-semibold text-text-primary font-jetbrains">
              {currentPlan.price}
            </span>
            <span className="text-sm text-text-muted">{currentPlan.period}</span>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="bg-background-3 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-primary">
              <span className="font-mono font-semibold font-jetbrains">{jobsUsed}</span> jobs
              posted this month
              {jobsLimit && (
                <span className="text-text-muted">
                  {' '}(out of {jobsLimit})
                </span>
              )}
            </p>
            {jobsLimit && (
              <span className="text-xs font-mono text-text-muted font-jetbrains">
                {Math.round(usagePercent)}%
              </span>
            )}
          </div>
          {jobsLimit && (
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercent >= 90
                    ? 'bg-danger'
                    : usagePercent >= 70
                      ? 'bg-yellow-500'
                      : 'bg-accent'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
          {billing?.billingCycleEnd && (
            <p className="text-xs text-text-muted mt-2">
              Billing cycle resets{' '}
              <span className="font-mono font-jetbrains">
                {new Date(billing.billingCycleEnd).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </p>
          )}
        </div>

        {/* Manage Billing Button */}
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={handleManageBilling}
            disabled={portalLoading}
          >
            {portalLoading ? 'Opening...' : 'Manage Billing'}
          </Button>
        </div>
      </Card>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-h3 text-text-primary mb-4">Compare Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Starter */}
          <Card
            className={`flex flex-col ${
              currentTier === 'STARTER' ? 'ring-2 ring-accent' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Starter</h3>
                <p className="text-xs text-text-secondary">For small businesses</p>
              </div>
              {currentTier === 'STARTER' && (
                <Badge variant="info">Current</Badge>
              )}
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-text-primary font-jetbrains">
                $199
              </span>
              <span className="text-sm text-text-muted">/mo</span>
            </div>

            <ul className="space-y-3 flex-1">
              {planDetails.STARTER.features.map((feature) => (
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
                    className="text-success shrink-0 mt-0.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {currentTier === 'STARTER' && (
              <div className="mt-6 pt-4 border-t border-border">
                <Button variant="secondary" disabled className="w-full">
                  Current Plan
                </Button>
              </div>
            )}
          </Card>

          {/* Growth */}
          <Card
            className={`flex flex-col ${
              currentTier === 'GROWTH' ? 'ring-2 ring-accent' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Growth</h3>
                <p className="text-xs text-text-secondary">
                  For scaling operations
                </p>
              </div>
              {currentTier === 'GROWTH' ? (
                <Badge variant="info">Current</Badge>
              ) : (
                <Badge variant="success">Recommended</Badge>
              )}
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-text-primary font-jetbrains">
                $399
              </span>
              <span className="text-sm text-text-muted">/mo</span>
            </div>

            <ul className="space-y-3 flex-1">
              {planDetails.GROWTH.features.map((feature) => (
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
                    className="text-success shrink-0 mt-0.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-4 border-t border-border">
              {currentTier === 'GROWTH' ? (
                <Button variant="secondary" disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={upgradeLoading}
                  className="w-full"
                >
                  {upgradeLoading ? 'Processing...' : 'Upgrade to Growth'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
