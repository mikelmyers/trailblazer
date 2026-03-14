'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface SubscriptionInfo {
  tier: 'STANDARD' | 'PRO';
  status: string | null;
  stripeCustomerId: string | null;
}

/* ── Plan data ────────────────────────────────────────────────────────────── */

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanDef {
  name: string;
  tier: 'STANDARD' | 'PRO';
  price: string;
  description: string;
  features: PlanFeature[];
}

const PLANS: PlanDef[] = [
  {
    name: 'Standard',
    tier: 'STANDARD',
    price: '$9.99/mo',
    description: 'Everything you need to start delivering.',
    features: [
      { text: 'Access to job feed', included: true },
      { text: 'Real-time dispatch matching', included: true },
      { text: 'Basic route optimization', included: true },
      { text: 'Standard support', included: true },
      { text: 'Priority dispatch matching', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Premium support', included: false },
    ],
  },
  {
    name: 'Pro',
    tier: 'PRO',
    price: '$24.99/mo',
    description: 'Priority matching and advanced features for serious drivers.',
    features: [
      { text: 'Access to job feed', included: true },
      { text: 'Real-time dispatch matching', included: true },
      { text: 'Advanced route optimization', included: true },
      { text: 'Standard support', included: true },
      { text: 'Priority dispatch matching', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Premium support', included: true },
    ],
  },
];

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function DriverSubscriptionPage() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchSub() {
      try {
        const res = await fetch('/api/drivers/subscription');
        if (res.ok) {
          const data = await res.json();
          setSub(data);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchSub();
  }, []);

  const handlePlanAction = async (targetTier: 'STANDARD' | 'PRO') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/drivers/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/drivers/subscription/portal', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
      </div>
    );
  }

  const currentTier = sub?.tier ?? 'STANDARD';

  const statusBadgeVariant =
    sub?.status === 'active'
      ? 'success'
      : sub?.status === 'trialing'
        ? 'info'
        : sub?.status === 'past_due'
          ? 'danger'
          : ('default' as const);

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-h2 font-bold tracking-tight-h2 text-text-primary">Subscription</h1>

      {/* Current Plan */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">Current Plan</p>
            <div className="flex items-center gap-3">
              <p className="text-h3 font-semibold text-text-primary">
                {currentTier === 'PRO' ? 'Pro' : 'Standard'}
              </p>
              {sub?.status && (
                <Badge variant={statusBadgeVariant}>
                  {sub.status}
                </Badge>
              )}
            </div>
          </div>
          {sub?.stripeCustomerId && (
            <Button
              variant="secondary"
              onClick={handleManageBilling}
              disabled={actionLoading}
            >
              Manage Billing
            </Button>
          )}
        </div>
      </Card>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const isUpgrade = plan.tier === 'PRO' && currentTier === 'STANDARD';
          const isDowngrade = plan.tier === 'STANDARD' && currentTier === 'PRO';

          return (
            <Card
              key={plan.tier}
              className={`flex flex-col ${
                isCurrent ? 'border-accent border-2' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-h3 font-semibold text-text-primary">{plan.name}</h3>
                  <p className="text-sm text-text-secondary mt-0.5">{plan.description}</p>
                </div>
                {isCurrent && (
                  <Badge variant="default">Current</Badge>
                )}
              </div>

              <p className="text-h2 font-bold tracking-tight-h2 text-text-primary mb-4 font-mono">
                {plan.price}
              </p>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2.5">
                    {feature.included ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="flex-shrink-0 mt-0.5 text-success"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="flex-shrink-0 mt-0.5 text-text-muted"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                    <span
                      className={`text-sm ${
                        feature.included ? 'text-text-primary' : 'text-text-muted'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="secondary" disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button
                  variant={isUpgrade ? 'primary' : 'secondary'}
                  onClick={() => handlePlanAction(plan.tier)}
                  disabled={actionLoading}
                  className="w-full"
                >
                  {actionLoading
                    ? 'Redirecting...'
                    : isUpgrade
                      ? 'Upgrade to Pro'
                      : 'Downgrade to Standard'}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
