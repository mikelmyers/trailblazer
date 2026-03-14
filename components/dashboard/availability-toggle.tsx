'use client';

import React, { useState, useCallback } from 'react';

interface AvailabilityToggleProps {
  initialAvailable?: boolean;
  onToggle?: (isAvailable: boolean) => void;
  className?: string;
}

const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
  initialAvailable = false,
  onToggle,
  className = '',
}) => {
  const [isAvailable, setIsAvailable] = useState(initialAvailable);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    const next = !isAvailable;
    setIsLoading(true);

    try {
      const res = await fetch('/api/drivers/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: next }),
      });

      if (!res.ok) {
        throw new Error('Failed to update availability');
      }

      setIsAvailable(next);
      onToggle?.(next);
    } catch {
      // Revert on failure -- state stays the same
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, onToggle]);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={isAvailable}
        aria-label={isAvailable ? 'Available for Dispatch' : 'Offline'}
        disabled={isLoading}
        onClick={handleToggle}
        className={`
          relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          disabled:opacity-60 disabled:cursor-not-allowed
          ${isAvailable
            ? 'bg-success focus-visible:ring-success/30'
            : 'bg-border-strong focus-visible:ring-border-strong/30'
          }
        `}
      >
        <span
          className={`
            inline-block h-6 w-6 rounded-full bg-white shadow-card transition-transform duration-200 ease-in-out
            ${isAvailable ? 'translate-x-7' : 'translate-x-1'}
          `}
        />
      </button>

      <div className="flex flex-col">
        <span
          className={`text-sm font-medium ${
            isAvailable ? 'text-success' : 'text-text-secondary'
          }`}
        >
          {isLoading
            ? 'Updating...'
            : isAvailable
              ? 'Available for Dispatch'
              : 'Offline'}
        </span>
        <span className="text-xs text-text-muted">
          {isAvailable
            ? 'You will receive job matches'
            : 'Toggle on to receive jobs'}
        </span>
      </div>
    </div>
  );
};

AvailabilityToggle.displayName = 'AvailabilityToggle';

export { AvailabilityToggle };
export type { AvailabilityToggleProps };
