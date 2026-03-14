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

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function DriverEarningsPage() {
  const [thisWeek, setThisWeek] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [allTime, setAllTime] = useState(0);
  const [jobs, setJobs] = useState<DeliveredJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/jobs?status=DELIVERED');
        if (res.ok) {
          const data = await res.json();
          const delivered: DeliveredJob[] = data.jobs ?? data ?? [];
          setJobs(delivered);

          // Compute earnings estimates from delivered jobs
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);

          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          let weekTotal = 0;
          let monthTotal = 0;
          const perJobEstimate = 25; // Estimate per delivery

          delivered.forEach((job) => {
            const deliveredDate = new Date(job.deliveredAt || job.createdAt);
            if (deliveredDate >= startOfWeek) weekTotal += perJobEstimate;
            if (deliveredDate >= startOfMonth) monthTotal += perJobEstimate;
          });

          setThisWeek(weekTotal);
          setThisMonth(monthTotal);
          setAllTime(delivered.length * perJobEstimate);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="This Week"
          value={`$${thisWeek.toFixed(2)}`}
          description="Mon - Sun"
        />
        <StatsCard
          label="This Month"
          value={`$${thisMonth.toFixed(2)}`}
          description={new Date().toLocaleString('default', { month: 'long' })}
        />
        <StatsCard
          label="All Time"
          value={`$${allTime.toFixed(2)}`}
          description="Total earned"
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
          delivery payments. Earnings shown here are estimates based on completed jobs.
        </p>
      </div>

      {/* Job History Table */}
      <Card>
        <p className="section-label">Job History</p>

        {jobs.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">
            No delivered jobs yet.
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
                      {new Date(job.deliveredAt || job.createdAt).toLocaleDateString()}
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
