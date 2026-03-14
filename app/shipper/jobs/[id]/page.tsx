'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TerraMap } from '@/components/map/terra-map';
import type { MapMarker, RouteGeoJSON } from '@/components/map/terra-map';
import { StatusTimeline } from '@/components/jobs/status-timeline';
import type { StatusTimestamps } from '@/components/jobs/status-timeline';
import { RatingInput } from '@/components/jobs/rating-input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info';

interface DriverInfo {
  id: string;
  name: string;
  vehicleType: string;
  vehiclePlate: string;
  rating: number;
  totalJobs: number;
  phone: string;
}

interface JobDetail {
  id: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  packageSize: string;
  description: string;
  urgency: string;
  specialInstructions: string;
  status: string;
  createdAt: string;
  matchedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  driver: DriverInfo | null;
  estimatedRoute: {
    distance: number;
    duration: number;
    geometry: RouteGeoJSON;
  } | null;
  rating: number | null;
}

const statusBadgeMap: Record<string, { label: string; variant: BadgeVariant }> = {
  POSTED: { label: 'Posted', variant: 'default' },
  MATCHING: { label: 'Matching', variant: 'info' },
  MATCHED: { label: 'Matched', variant: 'info' },
  EN_ROUTE_PICKUP: { label: 'En Route to Pickup', variant: 'info' },
  PICKED_UP: { label: 'Picked Up', variant: 'warning' },
  EN_ROUTE_DROPOFF: { label: 'In Transit', variant: 'warning' },
  IN_TRANSIT: { label: 'In Transit', variant: 'warning' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
  FAILED: { label: 'Failed', variant: 'danger' },
};

const urgencyLabels: Record<string, string> = {
  STANDARD: 'Standard',
  EXPRESS: 'Express',
  CRITICAL: 'Critical',
};

const packageLabels: Record<string, string> = {
  ENVELOPE: 'Envelope',
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
  PALLET: 'Pallet',
};

function formatTimestamp(dateStr: string | null) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < rating ? '#0A0A0F' : 'none'}
          stroke={i < rating ? '#0A0A0F' : '#D1D5DB'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratingValue, setRatingValue] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Job not found.');
        throw new Error('Failed to load job details.');
      }
      const data = await res.json();
      const jobData: JobDetail = data.job ?? data;
      setJob(jobData);
      if (jobData.rating) {
        setRatingValue(data.rating);
        setRatingSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleRatingSubmit = async () => {
    if (ratingValue === 0) return;
    setRatingSubmitting(true);
    setRatingError(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingValue }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to submit rating.');
      }

      setRatingSuccess(true);
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-background-3 rounded animate-pulse" />
        <div className="h-[400px] bg-background-3 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-background-3 rounded-lg animate-pulse" />
          <div className="h-64 bg-background-3 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-danger mb-3">{error || 'Job not found.'}</p>
          <div className="flex items-center gap-3 justify-center">
            <Button variant="secondary" size="sm" onClick={fetchJob}>
              Retry
            </Button>
            <Link href="/shipper/jobs">
              <Button variant="secondary" size="sm">
                Back to Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = statusBadgeMap[job.status] || {
    label: job.status,
    variant: 'default' as BadgeVariant,
  };

  const mapMarkers: MapMarker[] = [
    {
      lat: job.pickupLat,
      lng: job.pickupLng,
      type: 'pickup',
      label: `Pickup: ${job.pickupAddress}`,
    },
    {
      lat: job.dropoffLat,
      lng: job.dropoffLng,
      type: 'dropoff',
      label: `Dropoff: ${job.dropoffAddress}`,
    },
  ];

  const mapCenter: [number, number] = [
    (job.pickupLng + job.dropoffLng) / 2,
    (job.pickupLat + job.dropoffLat) / 2,
  ];

  const timestamps: StatusTimestamps = {
    createdAt: job.createdAt,
    matchedAt: job.matchedAt,
    pickedUpAt: job.pickedUpAt,
    deliveredAt: job.deliveredAt,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/shipper/jobs"
            className="text-sm text-text-secondary hover:text-text-primary transition mb-2 inline-flex items-center gap-1"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Jobs
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-h2 text-text-primary font-inter">Job Detail</h1>
            <span className="text-sm font-mono text-text-secondary font-jetbrains">
              {job.id.slice(0, 8)}
            </span>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <TerraMap
          center={mapCenter}
          zoom={11}
          markers={mapMarkers}
          route={job.estimatedRoute?.geometry || undefined}
          className="h-[400px]"
          showDrivers={false}
        />
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 rounded text-[10px] text-text-muted font-mono">
          Navigation powered by Terra
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Job info + rating */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Info Panel */}
          <Card>
            <h2 className="text-h3 text-text-primary mb-4">Job Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1">
                  Pickup Address
                </p>
                <p className="text-sm text-text-primary">{job.pickupAddress}</p>
                <p className="text-xs text-text-muted font-mono font-jetbrains mt-0.5">
                  {job.pickupLat.toFixed(6)}, {job.pickupLng.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1">
                  Dropoff Address
                </p>
                <p className="text-sm text-text-primary">{job.dropoffAddress}</p>
                <p className="text-xs text-text-muted font-mono font-jetbrains mt-0.5">
                  {job.dropoffLat.toFixed(6)}, {job.dropoffLng.toFixed(6)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1">
                  Package Size
                </p>
                <p className="text-sm text-text-primary">
                  {packageLabels[job.packageSize] || job.packageSize}
                </p>
                {job.description && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    {job.description}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1">
                  Urgency
                </p>
                <Badge
                  variant={
                    job.urgency === 'CRITICAL'
                      ? 'danger'
                      : job.urgency === 'EXPRESS'
                        ? 'warning'
                        : 'default'
                  }
                >
                  {urgencyLabels[job.urgency] || job.urgency}
                </Badge>
              </div>
            </div>

            {job.specialInstructions && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1">
                  Special Instructions
                </p>
                <p className="text-sm text-text-secondary">
                  {job.specialInstructions}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-3">
                Timestamps
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-text-muted">Created</p>
                  <p className="text-xs font-mono text-text-primary font-jetbrains">
                    {formatTimestamp(job.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Matched</p>
                  <p className="text-xs font-mono text-text-primary font-jetbrains">
                    {formatTimestamp(job.matchedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Picked Up</p>
                  <p className="text-xs font-mono text-text-primary font-jetbrains">
                    {formatTimestamp(job.pickedUpAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Delivered</p>
                  <p className="text-xs font-mono text-text-primary font-jetbrains">
                    {formatTimestamp(job.deliveredAt)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Driver Info Card */}
          {job.driver && (
            <Card>
              <h2 className="text-h3 text-text-primary mb-4">Assigned Driver</h2>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-background-3 flex items-center justify-center shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-secondary"
                  >
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {job.driver.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StarDisplay rating={Math.round(job.driver.rating)} />
                    <span className="text-xs text-text-muted font-mono font-jetbrains">
                      {job.driver.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-text-muted">Vehicle</p>
                      <p className="text-sm text-text-primary">
                        {job.driver.vehicleType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Plate</p>
                      <p className="text-sm font-mono text-text-primary font-jetbrains">
                        {job.driver.vehiclePlate}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Total Jobs</p>
                      <p className="text-sm font-mono text-text-primary font-jetbrains">
                        {job.driver.totalJobs}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Phone</p>
                      <p className="text-sm font-mono text-text-primary font-jetbrains">
                        {job.driver.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Rating Section (only for DELIVERED) */}
          {job.status === 'DELIVERED' && (
            <Card>
              <h2 className="text-h3 text-text-primary mb-4">
                {ratingSuccess ? 'Your Rating' : 'Rate This Delivery'}
              </h2>

              {ratingSuccess ? (
                <div className="flex items-center gap-3">
                  <RatingInput
                    value={ratingValue}
                    onChange={() => {}}
                    disabled
                    size="lg"
                  />
                  <span className="text-sm text-text-secondary">
                    Thank you for your feedback.
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-text-secondary">
                    How was your delivery experience? Rate the driver.
                  </p>
                  <RatingInput
                    value={ratingValue}
                    onChange={setRatingValue}
                    size="lg"
                  />
                  {ratingError && (
                    <p className="text-sm text-danger">{ratingError}</p>
                  )}
                  <Button
                    onClick={handleRatingSubmit}
                    disabled={ratingValue === 0 || ratingSubmitting}
                    size="sm"
                  >
                    {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right column: Status Timeline */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-h3 text-text-primary mb-4">Status</h2>
            <StatusTimeline
              currentStatus={job.status as 'POSTED' | 'MATCHING' | 'MATCHED' | 'EN_ROUTE_PICKUP' | 'PICKED_UP' | 'EN_ROUTE_DROPOFF' | 'DELIVERED' | 'CANCELLED' | 'FAILED'}
              timestamps={timestamps}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
