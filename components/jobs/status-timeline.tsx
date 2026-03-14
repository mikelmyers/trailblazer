import React from 'react';

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

interface StatusTimestamps {
  createdAt: string | Date;
  matchedAt?: string | Date | null;
  pickedUpAt?: string | Date | null;
  deliveredAt?: string | Date | null;
}

interface StatusTimelineProps {
  currentStatus: JobStatus;
  timestamps: StatusTimestamps;
  className?: string;
}

interface TimelineStep {
  key: string;
  label: string;
  statuses: JobStatus[];
  timestampKey: keyof StatusTimestamps | null;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { key: 'posted', label: 'Posted', statuses: ['POSTED'], timestampKey: 'createdAt' },
  { key: 'matching', label: 'Matching', statuses: ['MATCHING'], timestampKey: null },
  { key: 'matched', label: 'Matched', statuses: ['MATCHED'], timestampKey: 'matchedAt' },
  { key: 'en_route_pickup', label: 'En Route to Pickup', statuses: ['EN_ROUTE_PICKUP'], timestampKey: null },
  { key: 'picked_up', label: 'Picked Up', statuses: ['PICKED_UP'], timestampKey: 'pickedUpAt' },
  { key: 'en_route_dropoff', label: 'En Route to Dropoff', statuses: ['EN_ROUTE_DROPOFF'], timestampKey: null },
  { key: 'delivered', label: 'Delivered', statuses: ['DELIVERED'], timestampKey: 'deliveredAt' },
];

const STATUS_ORDER: JobStatus[] = [
  'POSTED',
  'MATCHING',
  'MATCHED',
  'EN_ROUTE_PICKUP',
  'PICKED_UP',
  'EN_ROUTE_DROPOFF',
  'DELIVERED',
];

function getStatusIndex(status: JobStatus): number {
  return STATUS_ORDER.indexOf(status);
}

function formatTimestamp(date: string | Date): string {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  timestamps,
  className = '',
}) => {
  const isTerminal = currentStatus === 'CANCELLED' || currentStatus === 'FAILED';
  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className={`flex flex-col ${className}`}>
      {TIMELINE_STEPS.map((step, index) => {
        const stepIndex = getStatusIndex(step.statuses[0]);
        const isCompleted = !isTerminal && stepIndex < currentIndex;
        const isCurrent = !isTerminal && stepIndex === currentIndex;
        const isFuture = isTerminal || stepIndex > currentIndex;
        const isLast = index === TIMELINE_STEPS.length - 1;

        const timestamp =
          step.timestampKey && timestamps[step.timestampKey]
            ? timestamps[step.timestampKey]
            : null;

        return (
          <div key={step.key} className="flex items-start gap-3">
            {/* Dot and line column */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div
                className={`rounded-full shrink-0 ${
                  isCompleted
                    ? 'w-3 h-3 bg-accent'
                    : isCurrent
                      ? 'w-4 h-4 bg-accent ring-4 ring-accent/15'
                      : 'w-3 h-3 border-2 border-border-strong bg-white'
                }`}
              />
              {/* Connecting line */}
              {!isLast && (
                <div
                  className={`w-px h-8 ${
                    isCompleted
                      ? 'bg-accent'
                      : isFuture
                        ? 'bg-border border-l border-dashed border-border-strong w-0'
                        : 'bg-border'
                  }`}
                  style={
                    isFuture
                      ? {
                          backgroundImage:
                            'repeating-linear-gradient(to bottom, #D1D5DB 0, #D1D5DB 4px, transparent 4px, transparent 8px)',
                          width: '2px',
                          border: 'none',
                        }
                      : undefined
                  }
                />
              )}
            </div>

            {/* Label and timestamp */}
            <div className={`pb-6 ${isCurrent ? '-mt-0.5' : '-mt-px'}`}>
              <span
                className={`text-sm font-medium ${
                  isCompleted || isCurrent ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
              {timestamp && (isCompleted || isCurrent) && (
                <p className="text-[11px] text-text-secondary font-mono mt-0.5">
                  {formatTimestamp(timestamp)}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Terminal states */}
      {isTerminal && (
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-danger ring-4 ring-danger/15 shrink-0" />
          </div>
          <div className="-mt-0.5">
            <span className="text-sm font-medium text-danger">
              {currentStatus === 'CANCELLED' ? 'Cancelled' : 'Failed'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

StatusTimeline.displayName = 'StatusTimeline';

export { StatusTimeline };
export type { StatusTimelineProps, StatusTimestamps };
