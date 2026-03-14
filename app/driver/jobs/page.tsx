'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ── Types ────────────────────────────────────────────────────────────────── */

type StatusFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface Job {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  urgency: string;
  packageSize: string;
  createdAt: string;
  deliveredAt: string | null;
}

interface DriverInfo {
  isAvailable: boolean;
  activeJobId: string | null;
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

const urgencyBadgeVariant: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'info'> = {
  STANDARD: 'default',
  EXPRESS: 'warning',
  CRITICAL: 'danger',
};

const ACTIVE_STATUSES = ['MATCHED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'EN_ROUTE_DROPOFF'];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Job Card ─────────────────────────────────────────────────────────────── */

const JobCard: React.FC<{ job: Job; isAvailable?: boolean }> = ({ job, isAvailable }) => (
  <Card className="!p-5">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-text-muted">{job.id}</span>
          <Badge variant={statusBadgeVariant[job.status] ?? 'default'}>
            {statusLabel[job.status] ?? job.status}
          </Badge>
          <Badge variant={urgencyBadgeVariant[job.urgency] ?? 'default'}>
            {job.urgency}
          </Badge>
          <Badge>{job.packageSize}</Badge>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-text-muted">Pickup</p>
            <p className="text-sm text-text-primary">{job.pickupAddress}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Dropoff</p>
            <p className="text-sm text-text-primary">{job.dropoffAddress}</p>
          </div>
        </div>

        <p className="font-mono text-xs text-text-muted">
          Posted {timeAgo(job.createdAt)}
        </p>
      </div>

      <div className="flex-shrink-0">
        <Link
          href={`/driver/jobs/${job.id}`}
          className="inline-flex items-center justify-center rounded-md font-medium transition px-4 py-2 text-sm bg-accent text-white hover:opacity-90"
        >
          {isAvailable && job.status === 'POSTED' ? 'Accept Job' : 'View Details'}
        </Link>
      </div>
    </div>
  </Card>
);

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

const filterTabs: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function DriverJobsPage() {
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [history, setHistory] = useState<Job[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async (status: StatusFilter, pg: number) => {
    const params = new URLSearchParams({ page: String(pg), limit: '10' });
    if (status !== 'ALL') params.set('status', status);

    const res = await fetch(`/api/drivers/jobs?${params}`);
    if (res.ok) {
      const data = await res.json();
      setHistory(data.jobs ?? []);
      setTotalPages(data.totalPages ?? 1);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [infoRes] = await Promise.all([
          fetch('/api/drivers/me'),
        ]);

        if (infoRes.ok) {
          const data = await infoRes.json();
          setDriverInfo({ isAvailable: data.isAvailable, activeJobId: data.activeJobId ?? null });

          // If available and no active job, fetch available jobs
          if (data.isAvailable && !data.activeJobId) {
            const avRes = await fetch('/api/jobs/available');
            if (avRes.ok) {
              const avData = await avRes.json();
              setAvailableJobs(avData.jobs ?? []);
            }
          }
        }

        await fetchHistory('ALL', 1);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [fetchHistory]);

  useEffect(() => {
    fetchHistory(filter, page);
  }, [filter, page, fetchHistory]);

  const handleFilterChange = (f: StatusFilter) => {
    setFilter(f);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
      </div>
    );
  }

  const showAvailableSection =
    driverInfo?.isAvailable && !driverInfo.activeJobId && availableJobs.length > 0;

  return (
    <div className="space-y-8">
      <h1 className="text-h2 font-bold tracking-tight-h2 text-text-primary">Jobs</h1>

      {/* Available Jobs */}
      {showAvailableSection && (
        <section>
          <h2 className="text-h3 font-semibold tracking-tight-h3 text-text-primary mb-4">
            Available Jobs
          </h2>
          <div className="space-y-3">
            {availableJobs.map((job) => (
              <JobCard key={job.id} job={job} isAvailable />
            ))}
          </div>
        </section>
      )}

      {/* Job History */}
      <section>
        <h2 className="text-h3 font-semibold tracking-tight-h3 text-text-primary mb-4">
          Job History
        </h2>

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-4 border-b border-border">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                filter === tab.value
                  ? 'border-accent text-text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {history.length === 0 ? (
          <Card>
            <p className="text-sm text-text-secondary text-center py-8">
              No jobs found for this filter.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="font-mono text-xs text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
