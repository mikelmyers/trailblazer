import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { BadgeVariant } from '@/components/ui/badge';

type JobStatus =
  | 'POSTED'
  | 'MATCHING'
  | 'MATCHED'
  | 'EN_ROUTE_PICKUP'
  | 'PICKED_UP'
  | 'EN_ROUTE_DROPOFF'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

type Urgency = 'STANDARD' | 'EXPRESS' | 'CRITICAL';
type PackageSize = 'ENVELOPE' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'PALLET';

interface Job {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: JobStatus;
  urgency: Urgency;
  packageSize: PackageSize;
  createdAt: string | Date;
  driverId?: string | null;
  priceCents?: number | null;
  driverPayoutCents?: number | null;
}

interface JobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
  className?: string;
  /** Show driver payout instead of shipper price */
  showPayout?: boolean;
}

const STATUS_VARIANT: Record<JobStatus, BadgeVariant> = {
  POSTED: 'default',
  MATCHING: 'info',
  MATCHED: 'info',
  EN_ROUTE_PICKUP: 'warning',
  PICKED_UP: 'warning',
  EN_ROUTE_DROPOFF: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  FAILED: 'danger',
};

const STATUS_LABEL: Record<JobStatus, string> = {
  POSTED: 'Posted',
  MATCHING: 'Matching',
  MATCHED: 'Matched',
  EN_ROUTE_PICKUP: 'En Route',
  PICKED_UP: 'Picked Up',
  EN_ROUTE_DROPOFF: 'In Transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

const URGENCY_VARIANT: Record<Urgency, BadgeVariant> = {
  STANDARD: 'default',
  EXPRESS: 'warning',
  CRITICAL: 'danger',
};

const PACKAGE_LABEL: Record<PackageSize, string> = {
  ENVELOPE: 'Envelope',
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
  PALLET: 'Pallet',
};

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '\u2026';
}

function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick, className = '', showPayout = false }) => {
  const handleClick = () => {
    if (onClick) onClick(job);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(job);
    }
  };

  return (
    <div
      className={`bg-white border border-border rounded-lg p-4 transition-shadow hover:shadow-card-hover ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-text-secondary truncate max-w-[120px]">
          {job.id}
        </span>
        <div className="flex items-center gap-3">
          {showPayout && job.driverPayoutCents != null && job.driverPayoutCents > 0 ? (
            <span className="font-mono text-sm font-semibold text-success">
              {formatCents(job.driverPayoutCents)}
            </span>
          ) : !showPayout && job.priceCents != null && job.priceCents > 0 ? (
            <span className="font-mono text-sm font-semibold text-text-primary">
              {formatCents(job.priceCents)}
            </span>
          ) : null}
          <span className="text-[11px] text-text-muted">
            {formatRelativeTime(job.createdAt)}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span className="text-sm text-text-primary truncate">
            {truncate(job.pickupAddress, 40)}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
          <span className="text-sm text-text-primary truncate">
            {truncate(job.dropoffAddress, 40)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={STATUS_VARIANT[job.status]}>
          {STATUS_LABEL[job.status]}
        </Badge>
        <Badge variant={URGENCY_VARIANT[job.urgency]}>
          {job.urgency}
        </Badge>
        <span className="text-[11px] text-text-secondary font-medium">
          {PACKAGE_LABEL[job.packageSize]}
        </span>
      </div>
    </div>
  );
};

JobCard.displayName = 'JobCard';

export { JobCard };
export type { JobCardProps, Job, JobStatus, Urgency, PackageSize };
