'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface Driver {
  id: string;
  name: string;
  vehicleType: string;
  vehiclePlate: string;
  isOnline: boolean;
  tier: string;
  rating: number;
  totalJobs: number;
  lastActive: string;
}

interface DriversResponse {
  drivers: Driver[];
  total: number;
  page: number;
  pageSize: number;
}

const TIERS = ['ALL', 'STANDARD', 'PRIORITY', 'ELITE'] as const;
const AVAILABILITY = ['ALL', 'ONLINE', 'OFFLINE'] as const;
const VEHICLE_TYPES = ['ALL', 'SEDAN', 'SUV', 'VAN', 'TRUCK', 'BOX_TRUCK'] as const;
const PAGE_SIZE = 20;

export default function AdminDriversPage() {
  const [data, setData] = useState<DriversResponse>({ drivers: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [vehicleFilter, setVehicleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (availabilityFilter !== 'ALL') params.set('availability', availabilityFilter);
      if (tierFilter !== 'ALL') params.set('tier', tierFilter);
      if (vehicleFilter !== 'ALL') params.set('vehicleType', vehicleFilter);

      const res = await fetch(`/api/admin/drivers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch drivers');
      setData(await res.json());
      setError(null);
    } catch {
      setError('Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  }, [page, availabilityFilter, tierFilter, vehicleFilter]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  async function handleAction(driverId: string, action: 'suspend' | 'changeTier', tierValue?: string) {
    setActionLoading(driverId);
    try {
      const body: Record<string, string> = { action };
      if (tierValue) body.tier = tierValue;

      const res = await fetch(`/api/admin/drivers/${driverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Action failed');
      await fetchDrivers();
    } catch {
      alert(`Failed to ${action} driver.`);
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  const tierBadgeColors: Record<string, string> = {
    STANDARD: 'bg-background-2 text-text-secondary border-border',
    PRIORITY: 'bg-amber-50 text-amber-700 border-amber-200',
    ELITE: 'bg-violet-50 text-violet-700 border-violet-200',
  };

  function renderStars(rating: number) {
    return (
      <span className="font-mono text-[11px] text-text-primary">
        {rating.toFixed(1)}
      </span>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="section-label">Fleet Management</div>
          <h2 className="text-h3 text-text-primary">All Drivers</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded border border-border bg-white px-2.5 py-1.5">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-[11px] font-mono text-text-secondary">
              {data.drivers.filter((d) => d.isOnline).length} online
            </span>
          </div>
          <div className="text-[11px] font-mono text-text-muted">
            {data.total.toLocaleString()} total
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-end gap-3 rounded-md border border-border bg-white px-4 py-3">
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
            Availability
          </label>
          <select
            value={availabilityFilter}
            onChange={(e) => { setAvailabilityFilter(e.target.value); setPage(1); }}
            className="rounded border border-border bg-white px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20"
          >
            {AVAILABILITY.map((a) => (
              <option key={a} value={a}>{a === 'ALL' ? 'All' : a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
            Tier
          </label>
          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
            className="rounded border border-border bg-white px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>{t === 'ALL' ? 'All Tiers' : t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
            Vehicle Type
          </label>
          <select
            value={vehicleFilter}
            onChange={(e) => { setVehicleFilter(e.target.value); setPage(1); }}
            className="rounded border border-border bg-white px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20"
          >
            {VEHICLE_TYPES.map((v) => (
              <option key={v} value={v}>{v === 'ALL' ? 'All Vehicles' : v.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { setAvailabilityFilter('ALL'); setTierFilter('ALL'); setVehicleFilter('ALL'); setPage(1); }}
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
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Name</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Vehicle</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Status</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Tier</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Rating</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Total Jobs</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Last Active</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-background-3 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.drivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[12px] text-text-muted">
                    No drivers found matching the current filters.
                  </td>
                </tr>
              ) : (
                data.drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-background-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-[12px] font-medium text-text-primary">{driver.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[12px] text-text-primary">{driver.vehicleType}</div>
                      <div className="font-mono text-[10px] text-text-muted">{driver.vehiclePlate}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        driver.isOnline
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-background-2 text-text-muted'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${driver.isOnline ? 'bg-success' : 'bg-text-muted'}`} />
                        {driver.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide-label ${tierBadgeColors[driver.tier] ?? 'bg-background-2 text-text-secondary border-border'}`}>
                        {driver.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">{renderStars(driver.rating)}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">
                      {driver.totalJobs.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {new Date(driver.lastActive).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          className="rounded px-2 py-1 text-[10px] font-medium text-text-secondary border border-border hover:bg-background-2 transition"
                          onClick={() => window.location.href = `/admin/drivers/${driver.id}`}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleAction(driver.id, 'suspend')}
                          disabled={actionLoading === driver.id}
                          className="rounded px-2 py-1 text-[10px] font-medium text-danger border border-danger/20 hover:bg-danger/5 transition disabled:opacity-50"
                        >
                          Suspend
                        </button>
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleAction(driver.id, 'changeTier', e.target.value);
                            e.target.value = '';
                          }}
                          defaultValue=""
                          className="rounded border border-border bg-white px-1.5 py-1 text-[10px] text-text-secondary focus:outline-none"
                        >
                          <option value="" disabled>Tier</option>
                          {TIERS.filter((t) => t !== 'ALL' && t !== driver.tier).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
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
                      pageNum === page ? 'bg-surface-dark text-white' : 'text-text-secondary hover:bg-background-2'
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
