'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/stats-card';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface DeliveredJob {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  deliveredAt: string;
  createdAt: string;
  priceCents: number | null;
  driverPayoutCents: number | null;
  platformFeeCents: number | null;
  platformFeePercent: number | null;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}

function isThisMonth(date: Date): boolean {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function sumPayouts(jobs: DeliveredJob[]): number {
  return jobs.reduce((sum, j) => sum + (j.driverPayoutCents ?? j.priceCents ?? 0), 0);
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function DriverEarningsPage() {
  const [jobs, setJobs] = useState<DeliveredJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeliveredJobs() {
      try {
        const res = await fetch('/api/jobs?status=DELIVERED');
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs ?? data ?? []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchDeliveredJobs();
  }, []);

  /* ── Compute earnings summary ──────────────────────────────────────────── */

  const weekJobs = jobs.filter((j) => isThisWeek(new Date(j.deliveredAt)));
  const monthJobs = jobs.filter((j) => isThisMonth(new Date(j.deliveredAt)));

  const weekEarnings = sumPayouts(weekJobs);
  const monthEarnings = sumPayouts(monthJobs);
  const allTimeEarnings = sumPayouts(jobs);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-h2 font-bold tracking-tight-h2 text-text-primary">Earnings</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="This Week"
          value={formatCents(weekEarnings)}
          description={`${weekJobs.length} deliveries`}
        />
        <StatsCard
          label="This Month"
          value={formatCents(monthEarnings)}
          description={`${monthJobs.length} deliveries`}
        />
        <StatsCard
          label="All Time"
          value={formatCents(allTimeEarnings)}
          description={`${jobs.length} deliveries`}
        />
      </div>

      {/* Job History Table */}
      <Card>
        <p className="section-label">Job History</p>

        {jobs.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">
            No completed deliveries yet.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-6 text-xs font-medium uppercase tracking-wide-section text-text-secondary">
                    Date
                  </th>
                  <th className="text-left py-2.5 px-6 text-xs font-medium uppercase tracking-wide-section text-text-secondary">
                    Job ID
                  </th>
                  <th className="text-left py-2.5 px-6 text-xs font-medium uppercase tracking-wide-section text-text-secondary">
                    Pickup
                  </th>
                  <th className="text-left py-2.5 px-6 text-xs font-medium uppercase tracking-wide-section text-text-secondary">
                    Dropoff
                  </th>
                  <th className="text-right py-2.5 px-6 text-xs font-medium uppercase tracking-wide-section text-text-secondary">
                    Payout
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-border last:border-b-0 hover:bg-background-3 transition"
                  >
                    <td className="py-3 px-6 font-mono text-xs text-text-muted whitespace-nowrap">
                      {new Date(job.deliveredAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 font-mono text-xs text-text-muted whitespace-nowrap">
                      {job.id}
                    </td>
                    <td className="py-3 px-6 text-text-primary truncate max-w-[200px]">
                      {job.pickupAddress}
                    </td>
                    <td className="py-3 px-6 text-text-primary truncate max-w-[200px]">
                      {job.dropoffAddress}
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-medium text-success whitespace-nowrap">
                      {job.driverPayoutCents != null
                        ? formatCents(job.driverPayoutCents)
                        : job.priceCents != null
                          ? formatCents(job.priceCents)
                          : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
