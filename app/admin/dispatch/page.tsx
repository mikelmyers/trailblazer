'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface PostedJob {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  description: string | null;
  packageSize: string;
  urgency: string;
  status: string;
  createdAt: string;
  dispatchMatch: DispatchMatchData | null;
  shipper: {
    id: string;
    companyName: string;
  };
}

interface DispatchMatchData {
  driverId: string;
  confidence: number;
  reasoning: string[];
  estimatedPickupMinutes?: number;
  driverName?: string;
}

interface AvailableDriver {
  id: string;
  vehicleType: string;
  rating: number;
  totalJobs: number;
  serviceAreas: string[];
  currentLat: number | null;
  currentLng: number | null;
  subscriptionTier: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface JobsResponse {
  jobs: PostedJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DriversResponse {
  drivers: AvailableDriver[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminDispatchPage() {
  const [postedJobs, setPostedJobs] = useState<PostedJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [driversLoading, setDriversLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDriverId, setConfirmDriverId] = useState<string | null>(null);

  const fetchPostedJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs?status=POSTED&limit=100');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const json: JobsResponse = await res.json();
      setPostedJobs(json.jobs ?? []);
      setError(null);
    } catch {
      setError('Failed to load posted jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPostedJobs();
  }, [fetchPostedJobs]);

  const fetchAvailableDrivers = useCallback(async () => {
    setDriversLoading(true);
    try {
      const res = await fetch('/api/drivers?availability=true&limit=50');
      if (!res.ok) throw new Error('Failed to fetch drivers');
      const json: DriversResponse = await res.json();
      setAvailableDrivers(json.drivers ?? []);
    } catch {
      setError('Failed to load available drivers.');
      setAvailableDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchAvailableDrivers();
    } else {
      setAvailableDrivers([]);
      setConfirmDriverId(null);
    }
  }, [selectedJobId, fetchAvailableDrivers]);

  async function handleDispatch(driverId: string) {
    if (!selectedJobId) return;

    setDispatching(true);
    setSuccessMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${selectedJobId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Dispatch failed' }));
        throw new Error(errData.error || 'Dispatch failed');
      }

      setSuccessMessage('Job dispatched successfully.');
      setSelectedJobId('');
      setConfirmDriverId(null);
      setAvailableDrivers([]);
      await fetchPostedJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch job.');
    } finally {
      setDispatching(false);
    }
  }

  const selectedJob = postedJobs.find((j) => j.id === selectedJobId);
  const dispatchMatch = selectedJob?.dispatchMatch ?? null;

  const urgencyColors: Record<string, string> = {
    STANDARD: 'text-text-secondary',
    EXPRESS: 'text-amber-600',
    CRITICAL: 'text-danger',
  };

  const urgencyBadgeColors: Record<string, string> = {
    STANDARD: 'bg-background-2 text-text-secondary border-border',
    EXPRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  };

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="section-label">Primordia Override</div>
        <h2 className="text-h3 text-text-primary">Manual Dispatch</h2>
      </div>

      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Left panel: Posted Jobs */}
        <div className="col-span-1 space-y-4">
          <div className="rounded-md border border-border bg-white">
            <div className="border-b border-border px-4 py-3">
              <div className="text-[13px] font-semibold tracking-tight-h3 text-text-primary">
                Posted Jobs
              </div>
              <div className="text-[11px] text-text-muted">
                {postedJobs.length} jobs awaiting dispatch
              </div>
            </div>
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-[11px] text-text-muted animate-pulse">
                    Loading jobs...
                  </div>
                </div>
              ) : postedJobs.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-[11px] text-text-muted">
                    No posted jobs available
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {postedJobs.map((job) => (
                    <li key={job.id}>
                      <button
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setConfirmDriverId(null);
                        }}
                        className={`w-full text-left px-4 py-3 transition ${
                          selectedJobId === job.id
                            ? 'bg-surface-dark text-white'
                            : 'hover:bg-background-2'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-[11px] font-medium ${
                              selectedJobId === job.id
                                ? 'text-white'
                                : 'text-text-primary'
                            }`}
                          >
                            {job.id.slice(0, 8)}...
                          </span>
                          <span
                            className={`text-[10px] font-medium uppercase tracking-wide-label ${
                              selectedJobId === job.id
                                ? 'text-white/70'
                                : urgencyColors[job.urgency] ??
                                  'text-text-secondary'
                            }`}
                          >
                            {job.urgency}
                          </span>
                        </div>
                        <div
                          className={`mt-1 text-[11px] ${
                            selectedJobId === job.id
                              ? 'text-white/80'
                              : 'text-text-secondary'
                          }`}
                        >
                          {job.shipper.companyName}
                        </div>
                        <div
                          className={`mt-0.5 text-[10px] ${
                            selectedJobId === job.id
                              ? 'text-white/60'
                              : 'text-text-muted'
                          }`}
                        >
                          {job.packageSize} &middot;{' '}
                          {formatDate(job.createdAt)}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right panel: Job Details + Drivers */}
        <div className="col-span-2 space-y-4">
          {!selectedJob ? (
            <div className="rounded-md border border-border bg-white flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-[11px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
                  No Job Selected
                </div>
                <div className="text-[12px] text-text-secondary">
                  Select a posted job from the left panel to begin dispatch
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Job details card */}
              <div className="rounded-md border border-border bg-white">
                <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold tracking-tight-h3 text-text-primary">
                      Job Details
                    </div>
                    <div className="text-[11px] font-mono text-text-muted">
                      {selectedJob.id}
                    </div>
                  </div>
                  <span
                    className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide-label ${
                      urgencyBadgeColors[selectedJob.urgency] ??
                      'bg-background-2 text-text-secondary border-border'
                    }`}
                  >
                    {selectedJob.urgency}
                  </span>
                </div>
                <div className="px-4 py-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
                      Shipper
                    </div>
                    <div className="text-[12px] text-text-primary">
                      {selectedJob.shipper.companyName}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
                      Package Size
                    </div>
                    <div className="text-[12px] font-mono text-text-primary">
                      {selectedJob.packageSize}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
                      Pickup
                    </div>
                    <div className="text-[12px] text-text-primary">
                      {selectedJob.pickupAddress}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
                      Dropoff
                    </div>
                    <div className="text-[12px] text-text-primary">
                      {selectedJob.dropoffAddress}
                    </div>
                  </div>
                  {selectedJob.description && (
                    <div className="col-span-2">
                      <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-1">
                        Description
                      </div>
                      <div className="text-[12px] text-text-secondary">
                        {selectedJob.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Primordia dispatch reasoning */}
              {dispatchMatch && (
                <div className="rounded-md border border-violet-200 bg-violet-50/50">
                  <div className="flex items-center justify-between border-b border-violet-200 px-4 py-3">
                    <div className="text-[13px] font-semibold tracking-tight-h3 text-violet-900">
                      Primordia Recommendation
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium uppercase tracking-wide-label text-violet-600">
                        Confidence
                      </span>
                      <span className="font-mono text-[14px] font-semibold text-violet-700">
                        {(dispatchMatch.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-text-primary font-medium">
                        {dispatchMatch.driverName ?? 'Driver'}{' '}
                        <span className="font-mono text-[10px] text-text-muted">
                          ({dispatchMatch.driverId.slice(0, 8)})
                        </span>
                      </span>
                      {dispatchMatch.estimatedPickupMinutes != null && (
                        <span className="font-mono text-[10px] text-text-muted">
                          ETA {dispatchMatch.estimatedPickupMinutes} min
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-medium uppercase tracking-wide-label text-violet-600 mt-2">
                      Dispatch Reasoning
                    </div>
                    <ul className="space-y-1">
                      {dispatchMatch.reasoning.map(
                        (reason: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-[11px] text-text-secondary"
                          >
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                            {reason}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Available drivers */}
              <div className="rounded-md border border-border bg-white overflow-hidden">
                <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold tracking-tight-h3 text-text-primary">
                      Available Drivers
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {availableDrivers.length} drivers currently available
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                      Live
                    </span>
                  </div>
                </div>

                {driversLoading ? (
                  <div className="px-4 py-8 text-center">
                    <div className="text-[11px] text-text-muted animate-pulse">
                      Loading available drivers...
                    </div>
                  </div>
                ) : availableDrivers.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[12px] text-text-muted">
                    No available drivers found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border bg-background-2">
                          <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                            Driver
                          </th>
                          <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                            Vehicle
                          </th>
                          <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                            Rating
                          </th>
                          <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                            Jobs
                          </th>
                          <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                            Tier
                          </th>
                          <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {availableDrivers.map((driver) => {
                          const isPrimordiaMatch =
                            dispatchMatch?.driverId === driver.id;
                          return (
                            <tr
                              key={driver.id}
                              className={`transition-colors ${
                                isPrimordiaMatch
                                  ? 'bg-violet-50/50'
                                  : 'hover:bg-background-2'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="text-[12px] font-medium text-text-primary">
                                    {driver.user.name ?? 'Unnamed'}
                                  </div>
                                  {isPrimordiaMatch && (
                                    <span className="text-[9px] font-medium uppercase tracking-wide-label px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
                                      Primordia
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-text-muted">
                                  {driver.user.email}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-text-secondary">
                                {driver.vehicleType}
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-text-secondary">
                                {driver.rating.toFixed(1)}
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-text-secondary">
                                {driver.totalJobs}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-block rounded border bg-background-2 border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide-label text-text-secondary">
                                  {driver.subscriptionTier}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {confirmDriverId === driver.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() =>
                                        handleDispatch(driver.id)
                                      }
                                      disabled={dispatching}
                                      className="rounded bg-surface-dark px-2.5 py-1 text-[10px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                                    >
                                      {dispatching
                                        ? 'Dispatching...'
                                        : 'Confirm'}
                                    </button>
                                    <button
                                      onClick={() =>
                                        setConfirmDriverId(null)
                                      }
                                      disabled={dispatching}
                                      className="rounded border border-border px-2.5 py-1 text-[10px] font-medium text-text-secondary transition hover:bg-background-2 disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setConfirmDriverId(driver.id)
                                    }
                                    className="rounded border border-accent-blue/20 px-2.5 py-1 text-[10px] font-medium text-accent-blue transition hover:bg-accent-blue/5"
                                  >
                                    Assign Driver
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
