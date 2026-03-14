'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { SubscriptionGate } from '@/components/auth/subscription-gate';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Driver {
  id: string;
  name: string;
  vehicleType: string;
  rating: number;
  totalJobs: number;
  serviceAreas: string[];
}

function VehicleIcon({ type }: { type: string }) {
  const lower = type.toLowerCase();

  if (lower.includes('van')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    );
  }

  if (lower.includes('truck') || lower.includes('freight')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    );
  }

  if (lower.includes('motorcycle') || lower.includes('moto')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
        <circle cx="5" cy="17" r="3" />
        <circle cx="19" cy="17" r="3" />
        <path d="M5 14l4-7h6l3 4" />
        <path d="M9 7l3 7" />
      </svg>
    );
  }

  if (lower.includes('bicycle') || lower.includes('bike')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6a1 1 0 100-2 1 1 0 000 2z" />
        <path d="M12 17.5V14l-3-3 4-3 2 3h3" />
      </svg>
    );
  }

  // Default: car
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
      <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17a2 2 0 002 2h2a2 2 0 002-2M15 17a2 2 0 002 2h2a2 2 0 002-2" />
    </svg>
  );
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
          fill={i < Math.round(rating) ? '#0A0A0F' : 'none'}
          stroke={i < Math.round(rating) ? '#0A0A0F' : '#D1D5DB'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-xs font-mono text-text-muted ml-1 font-jetbrains">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function DriverDirectoryContent() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/drivers');
      if (!res.ok) throw new Error('Failed to load drivers');
      const data = await res.json();
      setDrivers(data.drivers || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return drivers;
    const q = searchQuery.toLowerCase();
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.vehicleType.toLowerCase().includes(q) ||
        d.serviceAreas.some((area) => area.toLowerCase().includes(q))
    );
  }, [drivers, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-background-3 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-white border border-border rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-danger mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchDrivers}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="w-full sm:w-80">
        <Input
          placeholder="Search drivers by name, vehicle, or area..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Driver Grid */}
      {filteredDrivers.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-text-secondary">
            {searchQuery
              ? 'No drivers match your search.'
              : 'No drivers available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((driver) => (
            <Card key={driver.id} className="flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-background-3 flex items-center justify-center shrink-0">
                  <VehicleIcon type={driver.vehicleType} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {driver.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {driver.vehicleType}
                  </p>
                </div>
              </div>

              <StarDisplay rating={driver.rating} />

              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-text-muted">
                  <span className="font-mono font-jetbrains">{driver.totalJobs}</span>{' '}
                  completed jobs
                </p>
              </div>

              {driver.serviceAreas.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
                  {driver.serviceAreas.map((area) => (
                    <Badge key={area} variant="default">
                      {area}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DriversPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 text-text-primary font-inter">Driver Directory</h1>
        <p className="text-sm text-text-secondary mt-1">
          Browse available drivers and their service areas.
        </p>
      </div>

      <SubscriptionGate requiredTier="GROWTH" featureName="Driver Directory">
        <DriverDirectoryContent />
      </SubscriptionGate>
    </div>
  );
}
