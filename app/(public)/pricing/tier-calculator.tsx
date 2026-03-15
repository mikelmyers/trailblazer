'use client';

import { useState, useMemo } from 'react';

export default function TierCalculator() {
  const [jobs, setJobs] = useState(10);
  const [avgValue, setAvgValue] = useState(45);

  const costs = useMemo(() => {
    const free = jobs * avgValue * 0.12;
    const standard = 49 + jobs * avgValue * 0.06;
    const pro = 99;
    return { free, standard, pro };
  }, [jobs, avgValue]);

  const cheapest = useMemo(() => {
    const { free, standard, pro } = costs;
    if (free <= standard && free <= pro) return 'free';
    if (standard <= pro) return 'standard';
    return 'pro';
  }, [costs]);

  const formatCost = (cost: number) => `$${cost.toFixed(2)}`;

  const tiers = [
    { key: 'free', label: 'Free', cost: costs.free, description: 'No subscription + 12% fee' },
    { key: 'standard', label: 'Standard', cost: costs.standard, description: '$49/mo + 6% fee' },
    { key: 'pro', label: 'Pro', cost: costs.pro, description: '$99/mo + 0% fee' },
  ] as const;

  return (
    <div className="border border-border rounded p-8 bg-background">
      <h3 className="text-h3">Find your best plan</h3>
      <p className="mt-2 text-sm text-text-secondary">
        Adjust your estimated volume to see which tier costs the least.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Jobs slider */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <label htmlFor="calc-jobs" className="text-sm font-medium text-text-primary">
              Estimated jobs per month
            </label>
            <span className="font-mono text-sm text-text-primary">{jobs}</span>
          </div>
          <input
            id="calc-jobs"
            type="range"
            min={1}
            max={60}
            value={jobs}
            onChange={(e) => setJobs(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>1</span>
            <span>60</span>
          </div>
        </div>

        {/* Avg value slider */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <label htmlFor="calc-value" className="text-sm font-medium text-text-primary">
              Average job value
            </label>
            <span className="font-mono text-sm text-text-primary">${avgValue}</span>
          </div>
          <input
            id="calc-value"
            type="range"
            min={20}
            max={200}
            step={5}
            value={avgValue}
            onChange={(e) => setAvgValue(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>$20</span>
            <span>$200</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const isBest = cheapest === tier.key;
          return (
            <div
              key={tier.key}
              className={`rounded p-5 border transition-colors ${
                isBest
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-background-2'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-text-primary">{tier.label}</p>
                {isBest && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
                    Best value
                  </span>
                )}
              </div>
              <p className="font-mono text-h2 text-text-primary">{formatCost(tier.cost)}</p>
              <p className="text-xs text-text-muted mt-1">{tier.description}</p>
              <p className="text-xs text-text-secondary mt-0.5">per month total</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
