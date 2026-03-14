'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface SubscriptionInfo {
  plan: 'STANDARD' | 'PRO' | null;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING' | null;
  currentPeriodEnd: string | null;
}

/* ── Constants ────────────────────────────────────────────────────────────── */

interface PlanDef {
  id: 'STANDARD' | 'PRO';
  name: string;
  price: string;
  period: string;
  features: string[];
}

const PLANS: PlanDef[] = [
  {
    id: 'STANDARD',
    name: 'Standard',
    price: '$79',
    period: '/mo',
    features: [
      'Unlimited job matching',
      'Basic route optimization',
      'Standard support (email)',
      'Earnings dashboard',
      'Job history & analytics',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '$149',
    period: '/mo',
    features: [
      'Everything in Standard',
      'Priority job matching',
      'Advanced route optimization',
      'Priority support (phone & email)',
      'Real-time earnings analytics',
      'Multi-vehicle management',
      'Dedicated account manager',
    ],
  },
];

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELLED: 'danger',
  TRIALING: 'info',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  PAST_DUE: 'Past Due',
  CANCELLED: 'Cancelled',
  TRIALING: 'Trial',
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function DriverSubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    plan: null,
    status: null,
    currentPeriodEnd: null,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch('/api/drivers/me');
        if (res.ok) {
          const data = await res.json();
          setSubscription({
            plan: data.subscriptionTier ?? data.plan ?? null,
            status: data.subscriptionStatus ?? data.status ?? null,
            currentPeriodEnd: data.currentPeriodEnd ?? null,
          });
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setActionLoading(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
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
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading('billing');
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-h2 font-bold tracking-tight-h2 text-text-primary">Subscription</h1>

      {/* Current Plan Display */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="section-label">Current Plan</p>
            <div className="flex items-center gap-3">
              <p className="text-h3 font-semibold text-text-primary">
                {subscription.plan
                  ? PLANS.find((p) => p.id === subscription.plan)?.name ?? subscription.plan
                  : 'No active plan'}
              </p>
              {subscription.status && (
                <Badge variant={STATUS_BADGE_VARIANT[subscription.status] ?? 'default'}>
                  {STATUS_LABEL[subscription.status] ?? subscription.status}
                </Badge>
              )}
            </div>
            {subscription.currentPeriodEnd && (
              <p className="text-xs text-text-muted font-mono mt-1">
                Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          {subscription.plan && (
            <Button
              variant="secondary"
              onClick={handleManageBilling}
              disabled={actionLoading === 'billing'}
            >
              {actionLoading === 'billing' ? 'Loading...' : 'Manage Billing'}
            </Button>
          )}
        </div>
      </Card>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = subscription.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`bg-white border rounded-lg p-6 shadow-card transition-shadow hover:shadow-card-hover flex flex-col ${
                isCurrent ? 'border-accent ring-2 ring-accent/10' : 'border-border'
              }`}
            >
              {/* Plan header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-h3 font-semibold text-text-primary">{plan.name}</h3>
                  {isCurrent && <Badge variant="success">Current</Badge>}
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-display font-bold text-text-primary font-mono">
                    {plan.price}
                  </span>
                  <span className="text-sm text-text-muted">{plan.period}</span>
                </div>
              </div>

              {/* Features list */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 text-success mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action */}
              {isCurrent ? (
                <Button variant="secondary" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={actionLoading === plan.id}
                >
                  {actionLoading === plan.id ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Processing...
                    </span>
                  ) : subscription.plan ? (
                    `Switch to ${plan.name}`
                  ) : (
                    `Get Started with ${plan.name}`
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
