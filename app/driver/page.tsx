'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/dashboard/stats-card';
import { AvailabilityToggle } from '@/components/dashboard/availability-toggle';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface DriverProfile {
  id: string;
  userName: string;
  isAvailable: boolean;
  rating: number;
  totalJobs: number;
}

interface ActiveJob {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  urgency: string;
  packageSize: string;
  createdAt: string;
}

interface DashboardStats {
  todayDeliveries: number;
  weekEarnings: number;
  rating: number;
  totalJobs: number;
}

interface RecentJob {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  deliveredAt: string | null;
  createdAt: string;
}

/* ── Status helpers ───────────────────────────────────────────────────────── */

const statusBadgeVariant: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'info'> = {
  POSTED: 'info',
  MATCHING: 'info',
  MATCHED: 'warning',
  EN_ROUTE_PICKUP: 'warning',
  PICKED_UP: 'warning',
  EN_ROUTE_DROPOFF: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  FAILED: 'danger',
};

const statusLabel: Record<string, string> = {
  POSTED: 'Posted',
  MATCHING: 'Matching',
  MATCHED: 'Matched',
  EN_ROUTE_PICKUP: 'En Route to Pickup',
  PICKED_UP: 'Picked Up',
  EN_ROUTE_DROPOFF: 'En Route to Dropoff',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

/* ── Component ────────────────────────────────────────────────────────────── */

export default function DriverDashboardPage() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [profileRes, activeRes, statsRes, recentRes] = await Promise.all([
          fetch('/api/drivers/me'),
          fetch('/api/drivers/active-job'),
          fetch('/api/drivers/stats'),
          fetch('/api/drivers/recent-jobs?limit=5'),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
        }
        if (activeRes.ok) {
          const data = await activeRes.json();
          setActiveJob(data.job ?? null);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
        if (recentRes.ok) {
          const data = await recentRes.json();
          setRecentJobs(data.jobs ?? []);
        }
      } catch {
        // Silent fail -- empty dashboard rendered
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
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
      {/* Welcome + Availability */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold tracking-tight-h2 text-text-primary">
            Welcome back{profile?.userName ? `, ${profile.userName}` : ''}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Here is your delivery overview for today.
          </p>
        </div>

        <AvailabilityToggle initialAvailable={profile?.isAvailable ?? false} />
      </div>

      {/* Active Job */}
      {activeJob && (
        <Card className="border-l-4 border-l-success">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="section-label !mb-0">Active Job</p>
                <Badge variant={statusBadgeVariant[activeJob.status] ?? 'default'}>
                  {statusLabel[activeJob.status] ?? activeJob.status}
                </Badge>
              </div>
              <p className="font-mono text-xs text-text-muted">{activeJob.id}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Pickup</p>
                  <p className="text-sm text-text-primary">{activeJob.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Dropoff</p>
                  <p className="text-sm text-text-primary">{activeJob.dropoffAddress}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <Link
                href={`/driver/jobs/${activeJob.id}`}
                className="inline-flex items-center justify-center rounded-md font-medium transition px-5 py-2.5 text-sm bg-accent text-white hover:opacity-90"
              >
                View Job
              </Link>
              <a
                href={`https://maps.google.com/maps?daddr=${activeJob.dropoffLat},${activeJob.dropoffLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent-blue hover:underline"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Today's Deliveries"
          value={stats?.todayDeliveries ?? 0}
          description="Completed today"
        />
        <StatsCard
          label="This Week's Earnings"
          value={`$${(stats?.weekEarnings ?? 0).toFixed(2)}`}
          description="Mon - Sun"
        />
        <StatsCard
          label="Rating"
          value={(stats?.rating ?? 5.0).toFixed(1)}
          description="Driver rating"
        />
        <StatsCard
          label="Total Jobs"
          value={stats?.totalJobs ?? 0}
          description="All time"
        />
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-h3 font-semibold tracking-tight-h3 text-text-primary mb-4">
          Recent Activity
        </h2>

        {recentJobs.length === 0 ? (
          <Card>
            <p className="text-sm text-text-secondary text-center py-4">
              No recent activity to show.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <Card key={job.id} className="!p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-text-muted truncate">
                        {job.id}
                      </span>
                      <Badge variant={statusBadgeVariant[job.status] ?? 'default'}>
                        {statusLabel[job.status] ?? job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-primary truncate">
                      {job.pickupAddress}
                      <span className="text-text-muted mx-1.5">&rarr;</span>
                      {job.dropoffAddress}
                    </p>
                  </div>

                  <span className="font-mono text-xs text-text-muted whitespace-nowrap">
                    {job.deliveredAt
                      ? new Date(job.deliveredAt).toLocaleDateString()
                      : new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
