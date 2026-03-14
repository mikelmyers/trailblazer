'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info';

interface DashboardStats {
  activeJobs: number;
  jobsThisMonth: number;
  monthlyLimit: number | null;
  averageRating: number;
  tier: string;
}

interface ActiveJob {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  driverName: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusBadgeMap: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Pending', variant: 'default' },
  MATCHED: { label: 'Matched', variant: 'info' },
  PICKUP_EN_ROUTE: { label: 'En Route to Pickup', variant: 'info' },
  PICKED_UP: { label: 'Picked Up', variant: 'warning' },
  IN_TRANSIT: { label: 'In Transit', variant: 'warning' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
};

function getStatusBadge(status: string) {
  const config = statusBadgeMap[status] || { label: status, variant: 'default' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function ShipperDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        fetch('/api/shipper/stats'),
        fetch('/api/shipper/jobs?status=active&limit=10'),
      ]);

      if (!statsRes.ok || !jobsRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const [statsData, jobsData] = await Promise.all([
        statsRes.json(),
        jobsRes.json(),
      ]);

      setStats(statsData);
      setActiveJobs(jobsData.jobs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-background-3 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-white border border-border rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 bg-white border border-border rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-danger mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchDashboardData}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome + Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your shipments and track deliveries in real time.
          </p>
        </div>
        <Link href="/shipper/post">
          <Button>
            <span className="flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Post a New Job
            </span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Active Jobs"
          value={stats?.activeJobs ?? 0}
          description="Currently in progress"
        />
        <StatsCard
          label="Jobs This Month"
          value={stats?.jobsThisMonth ?? 0}
          description={
            stats?.monthlyLimit
              ? `of ${stats.monthlyLimit} limit`
              : 'Unlimited'
          }
        />
        {stats?.tier === 'STARTER' && stats?.monthlyLimit && (
          <StatsCard
            label="Monthly Limit"
            value={`${stats.monthlyLimit - (stats.jobsThisMonth ?? 0)}`}
            description="Remaining this month"
          />
        )}
        {stats?.tier !== 'STARTER' && (
          <StatsCard
            label="Plan"
            value={stats?.tier === 'GROWTH' ? 'Growth' : 'Enterprise'}
            description="Unlimited postings"
          />
        )}
        <StatsCard
          label="Avg Rating Given"
          value={
            stats?.averageRating
              ? stats.averageRating.toFixed(1)
              : '--'
          }
          description="Driver ratings"
        />
      </div>

      {/* Active Jobs List */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-h3 text-text-primary">Active Jobs</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Real-time visibility powered by Terra
            </p>
          </div>
          <Link
            href="/shipper/jobs"
            className="text-sm text-text-secondary hover:text-text-primary transition"
          >
            View all
          </Link>
        </div>

        {activeJobs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-secondary mb-4">
              No active jobs right now.
            </p>
            <Link href="/shipper/post">
              <Button variant="secondary" size="sm">
                Post your first job
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeJobs.map((job) => (
              <Link
                key={job.id}
                href={`/shipper/jobs/${job.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-background-3 transition group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono text-text-secondary">
                      {job.id.slice(0, 8)}
                    </span>
                    {getStatusBadge(job.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-primary truncate">
                    <span className="truncate">{job.pickupAddress}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 text-text-muted"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                    <span className="truncate">{job.dropoffAddress}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {job.driverName && (
                    <span className="text-sm text-text-secondary">
                      {job.driverName}
                    </span>
                  )}
                  <span className="text-xs text-text-muted">
                    {formatTime(job.updatedAt)}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-muted group-hover:text-text-primary transition"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
