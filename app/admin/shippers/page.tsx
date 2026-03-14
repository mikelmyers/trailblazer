'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Shipper {
  id: string;
  companyName: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  monthlyJobCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ShippersResponse {
  shippers: Shipper[];
  pagination: Pagination;
}

const TIERS = ['ALL', 'STARTER', 'GROWTH'] as const;
const PAGE_SIZE = 20;

export default function AdminShippersPage() {
  const [data, setData] = useState<ShippersResponse>({
    shippers: [],
    pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const fetchShippers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search.trim()) params.set('search', search.trim());
      if (tierFilter !== 'ALL') params.set('tier', tierFilter);

      const res = await fetch(`/api/shippers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch shippers');
      const json: ShippersResponse = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError('Failed to load shippers.');
    } finally {
      setLoading(false);
    }
  }, [page, search, tierFilter]);

  useEffect(() => {
    fetchShippers();
  }, [fetchShippers]);

  useEffect(() => {
    setPage(1);
  }, [search, tierFilter]);

  const totalPages = data.pagination.totalPages;

  const tierBadgeColors: Record<string, string> = {
    STARTER: 'bg-background-2 text-text-secondary border-border',
    GROWTH: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const statusBadgeColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    trialing: 'bg-amber-50 text-amber-700 border-amber-200',
    past_due: 'bg-red-50 text-red-700 border-red-200',
    canceled: 'bg-background-2 text-text-muted border-border',
    incomplete: 'bg-background-2 text-text-muted border-border',
  };

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="section-label">Shipper Management</div>
          <h2 className="text-h3 text-text-primary">All Shippers</h2>
        </div>
        <div className="text-[11px] font-mono text-text-muted">
          {data.pagination.total.toLocaleString()} total accounts
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-end gap-3 rounded-md border border-border bg-white px-4 py-3">
        <div className="flex-1 max-w-xs">
          <label className="block text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name..."
            className="w-full rounded border border-border bg-white px-2.5 py-1.5 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
            Tier
          </label>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="rounded border border-border bg-white px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All Tiers' : t}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setSearch('');
            setTierFilter('ALL');
            setPage(1);
          }}
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
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                  Company Name
                </th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                  Contact Email
                </th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                  Tier
                </th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                  Monthly Jobs
                </th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                  Subscription Status
                </th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                  Created
                </th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 rounded bg-background-3 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.shippers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-[12px] text-text-muted"
                  >
                    No shippers found matching the current filters.
                  </td>
                </tr>
              ) : (
                data.shippers.map((shipper) => (
                  <tr
                    key={shipper.id}
                    className="hover:bg-background-2 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-[12px] font-medium text-text-primary">
                        {shipper.companyName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[12px] text-text-secondary">
                        {shipper.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide-label ${
                          tierBadgeColors[shipper.subscriptionTier] ??
                          'bg-background-2 text-text-secondary border-border'
                        }`}
                      >
                        {shipper.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">
                      {shipper.monthlyJobCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide-label ${
                          statusBadgeColors[shipper.subscriptionStatus ?? ''] ??
                          'bg-background-2 text-text-secondary border-border'
                        }`}
                      >
                        {shipper.subscriptionStatus ?? 'none'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted">
                      {formatDate(shipper.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/shippers/${shipper.id}`}
                        className="rounded border border-border px-2.5 py-1 text-[10px] font-medium text-text-secondary hover:bg-background-2 transition"
                      >
                        View Details
                      </Link>
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
              Page{' '}
              <span className="font-mono font-medium text-text-secondary">
                {page}
              </span>{' '}
              of{' '}
              <span className="font-mono font-medium text-text-secondary">
                {totalPages}
              </span>
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
