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

  const thisWeekCount = jobs.filter((j) => isThisWeek(new Date(j.deliveredAt))).length;
  const thisMonthCount = jobs.filter((j) => isThisMonth(new Date(j.deliveredAt))).length;
  const allTimeCount = jobs.length;

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
          value={thisWeekCount}
          description="Deliveries completed"
        />
        <StatsCard
          label="This Month"
          value={thisMonthCount}
          description={new Date().toLocaleString('default', { month: 'long' })}
        />
        <StatsCard
          label="All Time"
          value={allTimeCount}
          description="Total deliveries"
        />
      </div>

      {/* Payment Note */}
      <div className="flex items-start gap-3 p-4 bg-background-3 rounded-lg border border-border">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 text-text-secondary mt-0.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-sm text-text-secondary">
          Payments are handled directly between you and the shipper. Trailblazer does not process
          delivery payments. Earnings shown here reflect completed delivery counts.
        </p>
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
