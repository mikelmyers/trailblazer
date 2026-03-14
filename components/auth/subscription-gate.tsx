'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type SubscriptionTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

interface SubscriptionGateProps {
  requiredTier: SubscriptionTier;
  children: React.ReactNode;
  featureName: string;
}

const tierRank: Record<SubscriptionTier, number> = {
  STARTER: 0,
  GROWTH: 1,
  ENTERPRISE: 2,
};

const tierLabels: Record<SubscriptionTier, string> = {
  STARTER: 'Starter',
  GROWTH: 'Growth',
  ENTERPRISE: 'Enterprise',
};

function SubscriptionGate({
  requiredTier,
  children,
  featureName,
}: SubscriptionGateProps) {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch('/api/subscription');
        if (!res.ok) throw new Error('Failed to load subscription');
        const data = await res.json();
        setCurrentTier(data.tier as SubscriptionTier);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-text-secondary">
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm">Checking subscription...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-danger mb-3">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const hasAccess =
    currentTier !== null && tierRank[currentTier] >= tierRank[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative">
        <div className="pointer-events-none select-none opacity-20 blur-[2px]">
          {children}
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg">
          <div className="text-center max-w-sm px-6">
            <div className="w-12 h-12 rounded-full bg-background-3 flex items-center justify-center mx-auto mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-secondary"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h3 className="text-h3 text-text-primary mb-2">
              {featureName}
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              This feature requires the {tierLabels[requiredTier]} plan or
              higher. Upgrade to unlock {featureName.toLowerCase()}.
            </p>
            <Button onClick={() => setShowUpgradeModal(true)}>
              Upgrade Plan
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade Your Plan"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            To access <span className="font-medium text-text-primary">{featureName}</span>,
            you need the {tierLabels[requiredTier]} plan or higher.
          </p>

          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">
                {tierLabels[requiredTier]} Plan
              </span>
              <span className="text-sm font-mono text-text-primary">
                {requiredTier === 'GROWTH' ? '$99/mo' : '$299/mo'}
              </span>
            </div>
            <ul className="space-y-1.5">
              {requiredTier === 'GROWTH' && (
                <>
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="text-success">&#10003;</span> Unlimited job postings
                  </li>
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="text-success">&#10003;</span> Driver directory access
                  </li>
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="text-success">&#10003;</span> Priority matching
                  </li>
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="text-success">&#10003;</span> Analytics dashboard
                  </li>
                </>
              )}
              {requiredTier === 'ENTERPRISE' && (
                <>
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="text-success">&#10003;</span> Everything in Growth
                  </li>
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="text-success">&#10003;</span> Dedicated account manager
                  </li>
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="text-success">&#10003;</span> Custom integrations
                  </li>
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="text-success">&#10003;</span> SLA guarantees
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="flex gap-3">
            <Link href="/shipper/billing" className="flex-1">
              <Button className="w-full">
                View Plans
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => setShowUpgradeModal(false)}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

SubscriptionGate.displayName = 'SubscriptionGate';

export { SubscriptionGate };
export type { SubscriptionGateProps, SubscriptionTier };
