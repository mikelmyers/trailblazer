import React from 'react';

type TrendDirection = 'up' | 'down';

interface StatsCardProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    direction: TrendDirection;
    value: string;
  };
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  description,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`bg-white border border-border rounded-lg p-6 shadow-card hover:shadow-card-hover transition-shadow ${className}`}
    >
      {/* Section label / eyebrow */}
      <p className="section-label">{label}</p>

      {/* Big number */}
      <p className="text-h2 font-bold text-text-primary font-mono">{value}</p>

      {/* Bottom row: description + trend */}
      <div className="flex items-center justify-between mt-2">
        {description && (
          <p className="text-sm text-text-secondary">{description}</p>
        )}

        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              trend.direction === 'up' ? 'text-success' : 'text-danger'
            }`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={trend.direction === 'down' ? 'rotate-180' : ''}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};

StatsCard.displayName = 'StatsCard';

export { StatsCard };
export type { StatsCardProps, TrendDirection };
