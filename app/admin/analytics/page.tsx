import React from 'react';

const REVENUE_CARDS = [
  { label: 'TODAY', value: '$4,280.00' },
  { label: 'THIS WEEK', value: '$28,640.00' },
  { label: 'THIS MONTH', value: '$124,350.00' },
  { label: 'ALL TIME', value: '$1,847,920.00' },
];

const JOB_VOLUME_CARDS = [
  { label: 'TOTAL JOBS', value: '12,847', color: 'text-text-primary' },
  { label: 'COMPLETED', value: '11,203', color: 'text-success' },
  { label: 'ACTIVE', value: '186', color: 'text-accent-blue' },
  { label: 'FAILED', value: '342', color: 'text-danger' },
];

const PERFORMANCE_METRICS = [
  { label: 'AVG DISPATCH TIME', value: '4.2 min', sub: 'from job posted to matched' },
  { label: 'MATCH CONFIDENCE', value: '94.7%', sub: 'Primordia engine average' },
  { label: 'ON-TIME RATE', value: '97.3%', sub: 'deliveries within ETA window' },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="section-label">Primordia Performance Metrics</div>
        <h2 className="text-h3 text-text-primary">Analytics Dashboard</h2>
      </div>

      {/* Revenue cards */}
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-2">
          Revenue
        </div>
        <div className="grid grid-cols-4 gap-4">
          {REVENUE_CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-md border border-border bg-white px-4 py-4"
            >
              <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                {card.label}
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight-h2 text-text-primary font-mono">
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job volume cards */}
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-2">
          Job Volume
        </div>
        <div className="grid grid-cols-4 gap-4">
          {JOB_VOLUME_CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-md border border-border bg-white px-4 py-4"
            >
              <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                {card.label}
              </div>
              <div
                className={`mt-2 text-2xl font-semibold tracking-tight-h2 font-mono ${card.color}`}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance metrics */}
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-2">
          Performance
        </div>
        <div className="grid grid-cols-3 gap-4">
          {PERFORMANCE_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="rounded-md border border-border bg-white px-4 py-4"
            >
              <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                {metric.label}
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight-h2 text-text-primary font-mono">
                {metric.value}
              </div>
              <div className="mt-1 text-[11px] text-text-secondary">
                {metric.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart placeholders */}
      <div className="grid grid-cols-2 gap-4">
        {/* Job Volume Trend */}
        <div className="rounded-md border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-[13px] font-semibold tracking-tight-h3 text-text-primary">
                Job Volume Trend
              </div>
              <div className="text-[11px] text-text-muted">Last 30 days</div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-text-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-accent-blue" />
                Posted
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success" />
                Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-danger" />
                Failed
              </span>
            </div>
          </div>
          <div className="flex h-64 items-end justify-between gap-1 px-4 py-6">
            {Array.from({ length: 30 }).map((_, i) => {
              const height = 20 + Math.sin(i * 0.5) * 30 + Math.random() * 20;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-accent-blue/20"
                  style={{ height: `${height}%` }}
                >
                  <div
                    className="w-full rounded-t bg-accent-blue"
                    style={{ height: `${60 + Math.random() * 30}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="border-t border-border px-4 py-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-muted">30d ago</span>
            <span className="font-mono text-[10px] text-text-muted">Today</span>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="rounded-md border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-[13px] font-semibold tracking-tight-h3 text-text-primary">
                Revenue Trend
              </div>
              <div className="text-[11px] text-text-muted">Last 30 days</div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-text-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success" />
                Revenue
              </span>
            </div>
          </div>
          <div className="flex h-64 items-end justify-between gap-1 px-4 py-6">
            {Array.from({ length: 30 }).map((_, i) => {
              const height = 30 + Math.sin(i * 0.3) * 25 + i * 0.8;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-success/70"
                  style={{ height: `${Math.min(height, 95)}%` }}
                />
              );
            })}
          </div>
          <div className="border-t border-border px-4 py-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-muted">30d ago</span>
            <span className="font-mono text-[10px] text-text-muted">Today</span>
          </div>
        </div>
      </div>

      {/* Primordia engine stats */}
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted mb-2">
          Primordia Engine
        </div>
        <div className="rounded-md border border-border bg-white">
          <div className="grid grid-cols-4 divide-x divide-border">
            <div className="px-4 py-4">
              <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                Dispatches Today
              </div>
              <div className="mt-2 text-xl font-semibold font-mono text-text-primary">
                47
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                Avg Confidence
              </div>
              <div className="mt-2 text-xl font-semibold font-mono text-text-primary">
                94.7%
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                Manual Overrides
              </div>
              <div className="mt-2 text-xl font-semibold font-mono text-text-primary">
                3
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                Override Rate
              </div>
              <div className="mt-2 text-xl font-semibold font-mono text-text-primary">
                6.4%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
