'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface Job {
  id: string;
  shipperName: string;
  driverName: string | null;
  status: string;
  urgency: string;
  pickupAddress: string;
  dropoffAddress: string;
  createdAt: string;
}

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUSES = ['ALL', 'POSTED', 'MATCHED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] as const;
const URGENCIES = ['ALL', 'LOW', 'STANDARD', 'HIGH', 'CRITICAL'] as const;
const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  POSTED: 'bg-amber-50 text-amber-700 border-amber-200',
  MATCHED: 'bg-blue-50 text-blue-700 border-blue-200',
  ACCEPTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PICKED_UP: 'bg-violet-50 text-violet-700 border-violet-200',
  IN_TRANSIT: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const urgencyColors: Record<string, string> = {
  LOW: 'text-text-muted',
  STANDARD: 'text-text-secondary',
  HIGH: 'text-amber-600',
  CRITICAL: 'text-danger',
};

export default function AdminJobsPage() {
  const [data, setData] = useState<JobsResponse>({ jobs: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (urgencyFilter !== 'ALL') params.set('urgency', urgencyFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/jobs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, urgencyFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function handleDispatchOverride(jobId: string) {
    if (!confirm('Trigger manual dispatch for this job?')) return;
    setDispatching(jobId);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/dispatch`, { method: 'POST' });
      if (!res.ok) throw new Error('Dispatch failed');
      await fetchJobs();
    } catch {
      alert('Failed to trigger dispatch.');
    } finally {
      setDispatching(null);
    }
  }

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="section-label">Job Management</div>
          <h2 className="text-h3 text-text-primary">All Jobs</h2>
        </div>
        <div className="text-[11px] font-mono text-text-muted">
          {data.total.toLocaleString()} total records
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-white px-3 md:px-4 py-3">
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded border border-border bg-white px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
            Urgency
          </label>
          <select
            value={urgencyFilter}
            onChange={(e) => { setUrgencyFilter(e.target.value); setPage(1); }}
            className="rounded border border-border bg-white px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20"
          >
            {URGENCIES.map((u) => (
              <option key={u} value={u}>{u === 'ALL' ? 'All Urgencies' : u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded border border-border bg-white px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded border border-border bg-white px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20"
          />
        </div>
        <button
          onClick={() => { setStatusFilter('ALL'); setUrgencyFilter('ALL'); setDateFrom(''); setDateTo(''); setPage(1); }}
          className="text-[11px] text-text-secondary hover:text-text-primary transition px-2 py-1.5"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-background-2">
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Job ID</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Shipper</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Driver</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Status</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Urgency</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Pickup</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Dropoff</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Created</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-background-3 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.jobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[12px] text-text-muted">
                    No jobs found matching the current filters.
                  </td>
                </tr>
              ) : (
                data.jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-background-2 transition-colors">
                    <td className="px-4 py-3 font-mono text-[12px] text-text-primary font-medium">
                      {job.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-primary">{job.shipperName}</td>
                    <td className="px-4 py-3 text-[12px] text-text-secondary">
                      {job.driverName ?? <span className="text-text-muted italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide-label ${statusColors[job.status] ?? 'bg-background-2 text-text-secondary border-border'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[11px] font-medium ${urgencyColors[job.urgency] ?? 'text-text-secondary'}`}>
                        {job.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-secondary max-w-[160px] truncate">
                      {job.pickupAddress}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-secondary max-w-[160px] truncate">
                      {job.dropoffAddress}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {job.status === 'POSTED' && (
                        <button
                          onClick={() => handleDispatchOverride(job.id)}
                          disabled={dispatching === job.id}
                          className="rounded bg-surface-dark px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide-label text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                          {dispatching === job.id ? 'Dispatching...' : 'Dispatch'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="text-[11px] text-text-muted">
              Page <span className="font-mono font-medium text-text-secondary">{page}</span> of{' '}
              <span className="font-mono font-medium text-text-secondary">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-border px-3 py-1 text-[11px] font-medium text-text-secondary transition hover:bg-background-2 disabled:opacity-40 disabled:pointer-events-none"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = page <= 3 ? i + 1 : page + i - 2;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`rounded px-2.5 py-1 text-[11px] font-mono font-medium transition ${
                      pageNum === page
                        ? 'bg-surface-dark text-white'
                        : 'text-text-secondary hover:bg-background-2'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border border-border px-3 py-1 text-[11px] font-medium text-text-secondary transition hover:bg-background-2 disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
