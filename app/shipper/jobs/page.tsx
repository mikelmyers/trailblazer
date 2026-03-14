'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info';
type FilterTab = 'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED';

interface Job {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  driverName: string | null;
  createdAt: string;
}

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
}

const statusBadgeMap: Record<string, { label: string; variant: BadgeVariant }> = {
  POSTED: { label: 'Posted', variant: 'default' },
  MATCHING: { label: 'Matching', variant: 'info' },
  MATCHED: { label: 'Matched', variant: 'info' },
  EN_ROUTE_PICKUP: { label: 'En Route', variant: 'info' },
  PICKED_UP: { label: 'Picked Up', variant: 'warning' },
  EN_ROUTE_DROPOFF: { label: 'In Transit', variant: 'warning' },
  IN_TRANSIT: { label: 'In Transit', variant: 'warning' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
  FAILED: { label: 'Failed', variant: 'danger' },
};

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const PAGE_SIZE = 15;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialLimit = parseInt(searchParams.get('limit') || String(PAGE_SIZE), 10);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (filter !== 'ALL') {
        params.set('status', filter === 'ACTIVE' ? 'active' : filter.toLowerCase());
      }

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load jobs');

      const data: JobsResponse = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter, searchQuery]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (limit !== PAGE_SIZE) params.set('limit', String(limit));
    const qs = params.toString();
    router.replace(`/shipper/jobs${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [page, limit, router]);

  function handleFilterChange(tab: FilterTab) {
    setFilter(tab);
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearchQuery(value);
    setPage(1);
  }

  function handleRowClick(jobId: string) {
    router.push(`/shipper/jobs/${jobId}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  /* Skeleton rows */
  function SkeletonRows() {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <div className="h-4 w-20 bg-background-3 rounded animate-pulse" />
            <div className="h-4 flex-1 bg-background-3 rounded animate-pulse" />
            <div className="h-4 flex-1 bg-background-3 rounded animate-pulse" />
            <div className="h-5 w-16 bg-background-3 rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-background-3 rounded animate-pulse" />
            <div className="h-4 w-24 bg-background-3 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 text-text-primary font-inter">Jobs</h1>
          <p className="text-sm text-text-secondary mt-1">
            View and manage all your delivery jobs.
          </p>
        </div>
        <Link href="/shipper/post">
          <Button>Post a Job</Button>
        </Link>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-background-3 p-1 rounded-lg">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                filter === tab.key
                  ? 'bg-white font-medium text-text-primary shadow-card'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search by address or ID..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Jobs Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <SkeletonRows />
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-danger mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchJobs}>
              Retry
            </Button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-secondary mb-4">
              {searchQuery ? 'No jobs match your search.' : 'No jobs found.'}
            </p>
            {!searchQuery && (
              <Link href="/shipper/post">
                <Button variant="secondary" size="sm">
                  Post your first job
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[100px_1fr_1fr_100px_120px_110px] gap-4 px-6 py-3 border-b border-border bg-background-3 text-[11px] font-medium uppercase tracking-wider text-text-secondary">
              <span>Job ID</span>
              <span>Pickup</span>
              <span>Dropoff</span>
              <span>Status</span>
              <span>Driver</span>
              <span>Created</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {jobs.map((job) => {
                const statusConfig = statusBadgeMap[job.status] || {
                  label: job.status,
                  variant: 'default' as BadgeVariant,
                };

                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleRowClick(job.id)}
                    className="w-full text-left grid grid-cols-1 md:grid-cols-[100px_1fr_1fr_100px_120px_110px] gap-2 md:gap-4 px-6 py-4 hover:bg-background-3 transition items-center group cursor-pointer"
                  >
                    <span className="text-xs font-mono text-text-secondary group-hover:text-text-primary transition font-jetbrains">
                      {job.id.slice(0, 8)}
                    </span>
                    <span className="text-sm text-text-primary truncate">
                      {job.pickupAddress}
                    </span>
                    <span className="text-sm text-text-primary truncate">
                      {job.dropoffAddress}
                    </span>
                    <span>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </span>
                    <span className="text-sm text-text-secondary truncate">
                      {job.driverName || '--'}
                    </span>
                    <span className="text-xs text-text-muted font-mono font-jetbrains">
                      {formatDate(job.createdAt)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {(page - 1) * limit + 1}
            {' '}&ndash;{' '}
            {Math.min(page * limit, total)} of {total} jobs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-text-secondary font-mono px-2">
              {page} / {totalPages}
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
        </div>
      )}
    </div>
  );
}
