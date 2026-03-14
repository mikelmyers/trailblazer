'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface DriverProfile {
  id: string;
  userName: string;
  email: string;
  image: string | null;
  vehicleType: string;
  serviceAreas: string[];
  rating: number;
  totalJobs: number;
}

/* ── Constants ────────────────────────────────────────────────────────────── */

const VEHICLE_TYPES = ['BIKE', 'CAR', 'VAN', 'TRUCK', 'CARGO_VAN'];

const METRO_AREAS = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA',
  'San Antonio, TX',
  'San Diego, CA',
  'Dallas, TX',
  'Austin, TX',
  'San Francisco, CA',
  'Seattle, WA',
  'Denver, CO',
  'Boston, MA',
  'Nashville, TN',
  'Portland, OR',
  'Atlanta, GA',
  'Miami, FL',
  'Minneapolis, MN',
  'Detroit, MI',
];

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function DriverProfilePage() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [vehicleType, setVehicleType] = useState('CAR');
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/drivers/me');
        if (res.ok) {
          const data: DriverProfile = await res.json();
          setProfile(data);
          setVehicleType(data.vehicleType);
          setServiceAreas(data.serviceAreas);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const toggleArea = (area: string) => {
    setServiceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleType, serviceAreas }),
      });

      if (res.ok) {
        setSaved(true);
      }
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-h2 font-bold tracking-tight-h2 text-text-primary">Profile</h1>

      {/* Rating + Total Jobs */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="section-label">Rating</p>
          <p className="text-display font-bold text-text-primary">
            {(profile?.rating ?? 5.0).toFixed(1)}
          </p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={i < Math.round(profile?.rating ?? 5) ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                className={
                  i < Math.round(profile?.rating ?? 5)
                    ? 'text-yellow-500'
                    : 'text-border-strong'
                }
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
        </Card>
        <Card className="text-center">
          <p className="section-label">Total Jobs</p>
          <p className="text-display font-bold font-mono text-text-primary">
            {profile?.totalJobs ?? 0}
          </p>
          <p className="text-xs text-text-muted mt-1">Completed deliveries</p>
        </Card>
      </div>

      {/* Vehicle Type */}
      <Card>
        <p className="section-label">Vehicle Type</p>
        <Select
          value={vehicleType}
          onChange={(e) => {
            setVehicleType(e.target.value);
            setSaved(false);
          }}
        >
          {VEHICLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace('_', ' ')}
            </option>
          ))}
        </Select>
      </Card>

      {/* Service Areas */}
      <Card>
        <p className="section-label">Service Areas</p>
        <p className="text-xs text-text-muted mb-3">
          Select the metro areas where you are available for deliveries.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {METRO_AREAS.map((area) => {
            const isSelected = serviceAreas.includes(area);
            return (
              <label
                key={area}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md border cursor-pointer transition ${
                  isSelected
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-white hover:bg-background-3'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleArea(area)}
                  className="w-4 h-4 rounded border-border-strong text-accent focus:ring-accent/20 focus:ring-2"
                />
                <span className={`text-sm ${isSelected ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                  {area}
                </span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {saved && (
          <span className="text-sm text-success font-medium">Changes saved successfully.</span>
        )}
      </div>
    </div>
  );
}
