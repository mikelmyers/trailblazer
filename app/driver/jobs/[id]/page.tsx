'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TerraMap } from '@/components/map/terra-map';
import { StatusTimeline } from '@/components/jobs/status-timeline';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface JobDetail {
  id: string;
  status: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  description: string | null;
  packageSize: string;
  urgency: string;
  createdAt: string;
  matchedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  priceCents: number | null;
  platformFeeCents: number | null;
  driverPayoutCents: number | null;
  platformFeePercent: number | null;
  paymentStatus: string | null;
  estimatedRoute: {
    distance: number;
    duration: number;
    geometry: { type: 'LineString'; coordinates: [number, number][] };
  } | null;
  shipper: {
    companyName: string;
    contactName: string | null;
    contactEmail: string | null;
  } | null;
}

/* ── Constants ────────────────────────────────────────────────────────────── */

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

interface ActionConfig {
  label: string;
  nextStatus: string;
}

const STATUS_ACTIONS: Record<string, ActionConfig> = {
  MATCHED: { label: 'Navigate to Pickup', nextStatus: 'EN_ROUTE_PICKUP' },
  EN_ROUTE_PICKUP: { label: 'Confirm Pickup', nextStatus: 'PICKED_UP' },
  PICKED_UP: { label: 'Navigate to Dropoff', nextStatus: 'EN_ROUTE_DROPOFF' },
  EN_ROUTE_DROPOFF: { label: 'Confirm Delivery', nextStatus: 'DELIVERED' },
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function DriverJobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/jobs/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Job not found.');
        } else {
          setError('Failed to load job details.');
        }
        return;
      }
      const data = await res.json();
      setJob(data.job ?? data);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleAction = async (nextStatus: string) => {
    if (!job) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        await fetchJob();
      }
    } catch {
      // Silent fail -- user can retry
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Loading state ─────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
      </div>
    );
  }

  /* ── Error state ───────────────────────────────────────────────────────── */

  if (error || !job) {
    return (
      <div className="text-center py-24 space-y-3">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto text-text-muted"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-sm text-text-secondary">{error ?? 'Job not found.'}</p>
        <button
          onClick={() => router.push('/driver/jobs')}
          className="text-sm text-accent hover:underline"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  const action = STATUS_ACTIONS[job.status];

  const mapMarkers = [
    { lat: job.pickupLat, lng: job.pickupLng, type: 'pickup' as const, label: 'Pickup', detail: job.pickupAddress },
    { lat: job.dropoffLat, lng: job.dropoffLng, type: 'dropoff' as const, label: 'Dropoff', detail: job.dropoffAddress },
  ];

  const mapCenter: [number, number] = [
    (job.pickupLng + job.dropoffLng) / 2,
    (job.pickupLat + job.dropoffLat) / 2,
  ];

  const routeGeoJSON = job.estimatedRoute?.geometry ?? {
    type: 'LineString' as const,
    coordinates: [
      [job.pickupLng, job.pickupLat] as [number, number],
      [job.dropoffLng, job.dropoffLat] as [number, number],
    ],
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push('/driver/jobs')}
        className="text-sm text-text-secondary hover:text-text-primary transition flex items-center gap-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Jobs
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-h2 font-bold tracking-tight-h2 text-text-primary">Job Detail</h1>
            <Badge variant={statusBadgeVariant[job.status] ?? 'default'}>
              {statusLabel[job.status] ?? job.status}
            </Badge>
          </div>
          <p className="font-mono text-xs text-text-muted mt-1">{job.id}</p>
        </div>
      </div>

      {/* Map */}
      <TerraMap
        center={mapCenter}
        zoom={11}
        markers={mapMarkers}
        route={routeGeoJSON}
        fitBounds={true}
        className="h-80"
      />

      {/* Terra route estimate */}
      {job.estimatedRoute && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-xs">Distance</span>
            <span className="font-mono font-medium text-text-primary">{job.estimatedRoute.distance} km</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-xs">ETA</span>
            <span className="font-mono font-medium text-text-primary">{job.estimatedRoute.duration} min</span>
          </div>
          <span className="text-[10px] text-text-muted tracking-wide-label uppercase ml-auto">Route by Terra</span>
        </div>
      )}

      {/* Payout Breakdown */}
      {job.priceCents != null && job.priceCents > 0 && (
        <Card>
          <p className="section-label">Payout</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Job Price</span>
              <span className="font-mono text-sm text-text-primary">${(job.priceCents / 100).toFixed(2)}</span>
            </div>
            {job.platformFeeCents != null && job.platformFeePercent != null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Platform Fee ({job.platformFeePercent}%)</span>
                <span className="font-mono text-sm text-text-muted">-${(job.platformFeeCents / 100).toFixed(2)}</span>
              </div>
            )}
            {job.driverPayoutCents != null && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-medium text-text-primary">Your Payout</span>
                <span className="font-mono text-h3 font-bold text-success">${(job.driverPayoutCents / 100).toFixed(2)}</span>
              </div>
            )}
            {job.paymentStatus && (
              <p className="text-xs text-text-muted mt-1 capitalize">
                Payment: {job.paymentStatus}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Status Timeline */}
      <Card>
        <p className="section-label">Progress</p>
        <StatusTimeline
          currentStatus={job.status as 'POSTED' | 'MATCHING' | 'MATCHED' | 'EN_ROUTE_PICKUP' | 'PICKED_UP' | 'EN_ROUTE_DROPOFF' | 'DELIVERED' | 'CANCELLED' | 'FAILED'}
          timestamps={{
            createdAt: job.createdAt,
            matchedAt: job.matchedAt,
            pickedUpAt: job.pickedUpAt,
            deliveredAt: job.deliveredAt,
          }}
        />
      </Card>

      {/* Job Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Addresses + Package Info */}
        <Card>
          <p className="section-label">Delivery Details</p>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-muted mb-0.5">Pickup Address</p>
              <p className="text-sm text-text-primary">{job.pickupAddress}</p>
              <p className="font-mono text-xs text-text-muted mt-0.5">
                {job.pickupLat.toFixed(6)}, {job.pickupLng.toFixed(6)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Dropoff Address</p>
              <p className="text-sm text-text-primary">{job.dropoffAddress}</p>
              <p className="font-mono text-xs text-text-muted mt-0.5">
                {job.dropoffLat.toFixed(6)}, {job.dropoffLng.toFixed(6)}
              </p>
            </div>
            {job.description && (
              <div>
                <p className="text-xs text-text-muted mb-0.5">Description</p>
                <p className="text-sm text-text-primary">{job.description}</p>
              </div>
            )}
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-text-muted mb-0.5">Package Size</p>
                <Badge>{job.packageSize}</Badge>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-0.5">Urgency</p>
                <Badge
                  variant={
                    job.urgency === 'CRITICAL'
                      ? 'danger'
                      : job.urgency === 'EXPRESS'
                        ? 'warning'
                        : 'default'
                  }
                >
                  {job.urgency}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Shipper Info + Timestamps */}
        <Card>
          <p className="section-label">Shipper &amp; Timing</p>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-muted mb-0.5">Shipper</p>
              <p className="text-sm text-text-primary font-medium">
                {job.shipper?.companyName ?? 'Unknown'}
              </p>
              {job.shipper?.contactName && (
                <p className="text-xs text-text-secondary mt-0.5">
                  {job.shipper.contactName}
                </p>
              )}
              {job.shipper?.contactEmail && (
                <p className="text-xs text-text-muted mt-0.5 font-mono">
                  {job.shipper.contactEmail}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Posted</p>
              <p className="font-mono text-xs text-text-primary">
                {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>
            {job.matchedAt && (
              <div>
                <p className="text-xs text-text-muted mb-0.5">Matched</p>
                <p className="font-mono text-xs text-text-primary">
                  {new Date(job.matchedAt).toLocaleString()}
                </p>
              </div>
            )}
            {job.pickedUpAt && (
              <div>
                <p className="text-xs text-text-muted mb-0.5">Picked Up</p>
                <p className="font-mono text-xs text-text-primary">
                  {new Date(job.pickedUpAt).toLocaleString()}
                </p>
              </div>
            )}
            {job.deliveredAt && (
              <div>
                <p className="text-xs text-text-muted mb-0.5">Delivered</p>
                <p className="font-mono text-xs text-text-primary">
                  {new Date(job.deliveredAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Action Button */}
      {action && (
        <div className="flex justify-center pt-2">
          <Button
            size="lg"
            disabled={actionLoading}
            onClick={() => handleAction(action.nextStatus)}
            className="min-w-[220px]"
          >
            {actionLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Updating...
              </span>
            ) : (
              action.label
            )}
          </Button>
        </div>
      )}

      {/* Delivered state */}
      {job.status === 'DELIVERED' && (
        <Card className="text-center !py-8">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-success mb-3"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="text-h3 font-semibold text-text-primary mb-1">Delivery Complete</p>
          <p className="text-sm text-text-secondary">
            This job has been successfully delivered.
          </p>
        </Card>
      )}

      {/* Powered by Terra */}
      <div className="flex justify-end">
        <span className="text-[10px] font-medium text-text-muted tracking-wide-label uppercase">
          Powered by Terra
        </span>
      </div>
    </div>
  );
}
