'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TerraMap } from '@/components/map/terra-map';
import type { MapMarker, RouteGeoJSON } from '@/components/map/terra-map';

interface ActiveJob {
  id: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  status: string;
  estimatedRoute: {
    geometry: RouteGeoJSON;
  } | null;
}

interface OnlineDriver {
  id: string;
  currentLat: number;
  currentLng: number;
  userName: string;
}

interface NetworkStats {
  totalDrivers: number;
  driversOnline: number;
  activeJobs: number;
  jobsToday: number;
  revenueThisMonth: number;
}

interface DispatchEvent {
  id: string;
  type: 'DISPATCH' | 'COMPLETION' | 'CANCELLATION' | 'DRIVER_ONLINE' | 'SYSTEM';
  message: string;
  timestamp: string;
}

interface SystemHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: string;
}

const FALLBACK_STATS: NetworkStats = {
  totalDrivers: 0,
  driversOnline: 0,
  activeJobs: 0,
  jobsToday: 0,
  revenueThisMonth: 0,
};

const FALLBACK_EVENTS: DispatchEvent[] = [];
const FALLBACK_HEALTH: SystemHealth[] = [];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<NetworkStats>(FALLBACK_STATS);
  const [events, setEvents] = useState<DispatchEvent[]>(FALLBACK_EVENTS);
  const [health, setHealth] = useState<SystemHealth[]>(FALLBACK_HEALTH);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState<OnlineDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, eventsRes, healthRes, jobsRes, driversRes] = await Promise.allSettled([
        fetch('/api/admin/stats'),
        fetch('/api/admin/dispatch-events?limit=20'),
        fetch('/api/admin/health'),
        fetch('/api/jobs?status=EN_ROUTE_PICKUP,PICKED_UP,EN_ROUTE_DROPOFF,MATCHED&limit=50'),
        fetch('/api/drivers?availability=true&limit=100'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        setStats(await statsRes.value.json());
      }
      if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
        setEvents(await eventsRes.value.json());
      }
      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        setHealth(await healthRes.value.json());
      }
      if (jobsRes.status === 'fulfilled' && jobsRes.value.ok) {
        const data = await jobsRes.value.json();
        setActiveJobs(data.jobs ?? data ?? []);
      }
      if (driversRes.status === 'fulfilled' && driversRes.value.ok) {
        const data = await driversRes.value.json();
        setOnlineDrivers(data.drivers ?? data ?? []);
      }

      setError(null);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const statCards: { label: string; value: string | number; sub?: string }[] = [
    { label: 'TOTAL DRIVERS', value: stats.totalDrivers.toLocaleString() },
    { label: 'DRIVERS ONLINE', value: stats.driversOnline.toLocaleString(), sub: `${stats.totalDrivers > 0 ? ((stats.driversOnline / stats.totalDrivers) * 100).toFixed(0) : 0}% of fleet` },
    { label: 'ACTIVE JOBS', value: stats.activeJobs.toLocaleString() },
    { label: 'JOBS TODAY', value: stats.jobsToday.toLocaleString() },
    { label: 'REVENUE THIS MONTH', value: `$${stats.revenueThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
  ];

  const eventTypeColors: Record<string, string> = {
    DISPATCH: 'bg-accent-blue',
    COMPLETION: 'bg-success',
    CANCELLATION: 'bg-danger',
    DRIVER_ONLINE: 'bg-emerald-500',
    SYSTEM: 'bg-text-muted',
  };

  const healthStatusColors: Record<string, string> = {
    healthy: 'bg-success',
    degraded: 'bg-amber-500',
    down: 'bg-danger',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="section-label">Primordia Dispatch Engine</div>
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-md border border-border bg-white animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-96 rounded-md border border-border bg-white animate-pulse" />
          <div className="h-96 rounded-md border border-border bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section label */}
      <div className="section-label">Primordia Dispatch Engine</div>

      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Network overview stats */}
      <div className="grid grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-white px-4 py-4">
            <div className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
              {card.label}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight-h2 text-text-primary font-mono">
              {card.value}
            </div>
            {card.sub && (
              <div className="mt-1 text-[11px] text-text-secondary">{card.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Map + Activity feed */}
      <div className="grid grid-cols-3 gap-4">
        {/* TerraMap — live active dispatches */}
        <div className="col-span-2 rounded-md border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-[13px] font-semibold tracking-tight-h3 text-text-primary">
                Active Jobs Map
              </div>
              <div className="text-[11px] text-text-muted">
                TerraMap &mdash; {activeJobs.length} active dispatch{activeJobs.length !== 1 ? 'es' : ''}, {onlineDrivers.length} driver{onlineDrivers.length !== 1 ? 's' : ''} online
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-medium uppercase tracking-wide-label text-text-muted">
                Live
              </span>
            </div>
          </div>
          <TerraMap
            center={(() => {
              // Center on first active job, or first online driver, or default NYC
              const firstJob = activeJobs[0];
              const firstDriver = onlineDrivers[0];
              if (firstJob) return [(firstJob.pickupLng + firstJob.dropoffLng) / 2, (firstJob.pickupLat + firstJob.dropoffLat) / 2] as [number, number];
              if (firstDriver) return [firstDriver.currentLng, firstDriver.currentLat] as [number, number];
              return [-73.935242, 40.73061] as [number, number];
            })()}
            zoom={11}
            markers={[
              ...activeJobs.flatMap((job): MapMarker[] => [
                { lat: job.pickupLat, lng: job.pickupLng, type: 'pickup', label: `Pickup — ${job.id.slice(0, 8)}` },
                { lat: job.dropoffLat, lng: job.dropoffLng, type: 'dropoff', label: `Dropoff — ${job.id.slice(0, 8)}` },
              ]),
              ...onlineDrivers
                .filter((d) => d.currentLat && d.currentLng)
                .map((d): MapMarker => ({
                  lat: d.currentLat,
                  lng: d.currentLng,
                  type: 'driver',
                  label: d.userName || d.id.slice(0, 8),
                })),
            ]}
            route={activeJobs[0]?.estimatedRoute?.geometry || undefined}
            className="h-80"
            showDrivers={true}
          />
        </div>

        {/* Recent dispatch activity feed */}
        <div className="rounded-md border border-border bg-white flex flex-col">
          <div className="border-b border-border px-4 py-3">
            <div className="text-[13px] font-semibold tracking-tight-h3 text-text-primary">
              Recent Activity
            </div>
            <div className="text-[11px] text-text-muted">
              Dispatch event stream
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-80">
            {events.length === 0 ? (
              <div className="flex h-full items-center justify-center py-12">
                <p className="text-[11px] text-text-muted">No recent events</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {events.map((event) => (
                  <li key={event.id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${eventTypeColors[event.type] ?? 'bg-text-muted'}`} />
                      <div className="min-w-0">
                        <p className="text-[12px] text-text-primary leading-snug">
                          {event.message}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-[10px] text-text-muted">
                            {event.type}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* System health indicators */}
      <div>
        <div className="section-label">System Health</div>
        <div className="rounded-md border border-border bg-white">
          {health.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[11px] text-text-muted">No health data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 divide-x divide-border">
              {health.map((svc) => (
                <div key={svc.service} className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-2 w-2 rounded-full ${healthStatusColors[svc.status] ?? 'bg-text-muted'}`} />
                    <span className="text-[12px] font-medium text-text-primary">{svc.service}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-text-muted uppercase tracking-wide-label">Status</span>
                      <span className={`text-[11px] font-mono font-medium ${
                        svc.status === 'healthy' ? 'text-success' : svc.status === 'degraded' ? 'text-amber-600' : 'text-danger'
                      }`}>
                        {svc.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-text-muted uppercase tracking-wide-label">Latency</span>
                      <span className="text-[11px] font-mono text-text-secondary">{svc.latency}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-text-muted uppercase tracking-wide-label">Uptime</span>
                      <span className="text-[11px] font-mono text-text-secondary">{svc.uptime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
