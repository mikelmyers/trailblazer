'use client';

import React, { useEffect, useState } from 'react';

interface AnalyticsData {
  totalDrivers: number;
  driversOnline: number;
  activeJobs: number;
  jobsToday: number;
  revenueThisMonth: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Failed to load analytics
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
        <span className="ml-3 text-sm text-text-secondary">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="section-label">Primordia Performance Metrics</div>
        <h2 className="text-h3 text-text-primary">Analytics Dashboard</h2>
      </div>

      {/* Revenue card */}
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-2">
          Revenue
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-md border border-border bg-white px-4 py-4">
            <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
              THIS MONTH
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight-h2 text-text-primary font-mono">
              ${stats?.revenueThisMonth?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Live stats cards */}
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-2">
          Live Overview
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-md border border-border bg-white px-4 py-4">
            <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
              TOTAL DRIVERS
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight-h2 text-text-primary font-mono">
              {stats?.totalDrivers?.toLocaleString() ?? '0'}
            </div>
          </div>
          <div className="rounded-md border border-border bg-white px-4 py-4">
            <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
              DRIVERS ONLINE
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight-h2 text-success font-mono">
              {stats?.driversOnline?.toLocaleString() ?? '0'}
            </div>
          </div>
          <div className="rounded-md border border-border bg-white px-4 py-4">
            <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
              ACTIVE JOBS
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight-h2 text-accent-blue font-mono">
              {stats?.activeJobs?.toLocaleString() ?? '0'}
            </div>
          </div>
          <div className="rounded-md border border-border bg-white px-4 py-4">
            <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
              JOBS TODAY
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight-h2 text-text-primary font-mono">
              {stats?.jobsToday?.toLocaleString() ?? '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Primordia engine stats */}
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-2">
          Primordia Engine
        </div>
        <div className="rounded-md border border-border bg-white px-4 py-6 text-center">
          <p className="text-sm text-text-secondary">
            Dispatch analytics will populate as jobs are processed through the Primordia engine.
          </p>
        </div>
      </div>
    </div>
  );
}
