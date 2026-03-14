'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface ProfileData {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  defaultPackageSize: string;
  defaultUrgency: string;
  notifyOnMatch: boolean;
  notifyOnPickup: boolean;
  notifyOnDelivery: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    defaultPackageSize: 'SMALL',
    defaultUrgency: 'STANDARD',
    notifyOnMatch: true,
    notifyOnPickup: true,
    notifyOnDelivery: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/shipper/profile');
      if (!res.ok) throw new Error('Failed to load profile');
      const data: ProfileData = await res.json();
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function updateField<K extends keyof ProfileData>(
    key: K,
    value: ProfileData[K]
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch('/api/shipper/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save profile');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="h-8 w-40 bg-background-3 rounded animate-pulse" />
        <div className="h-64 bg-white border border-border rounded-lg animate-pulse" />
        <div className="h-48 bg-white border border-border rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-h2 text-text-primary">Profile</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your company information and delivery preferences.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Company Info */}
      <Card>
        <p className="section-label">Company Information</p>
        <div className="space-y-4 mt-2">
          <Input
            label="Company Name"
            value={profile.companyName}
            onChange={(e) => updateField('companyName', e.target.value)}
            placeholder="Your company name"
          />
          <Input
            label="Contact Name"
            value={profile.contactName}
            onChange={(e) => updateField('contactName', e.target.value)}
            placeholder="Primary contact"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={profile.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              placeholder="contact@company.com"
            />
            <Input
              label="Phone"
              type="tel"
              value={profile.contactPhone}
              onChange={(e) => updateField('contactPhone', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>
      </Card>

      {/* Default Delivery Preferences */}
      <Card>
        <p className="section-label">Default Delivery Preferences</p>
        <p className="text-xs text-text-muted mb-4">
          These defaults will be pre-filled when you post a new job.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Default Package Size"
            value={profile.defaultPackageSize}
            onChange={(e) => updateField('defaultPackageSize', e.target.value)}
          >
            <option value="ENVELOPE">Envelope</option>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
            <option value="PALLET">Pallet</option>
          </Select>
          <Select
            label="Default Urgency"
            value={profile.defaultUrgency}
            onChange={(e) => updateField('defaultUrgency', e.target.value)}
          >
            <option value="STANDARD">Standard</option>
            <option value="EXPRESS">Express</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <p className="section-label">Notifications</p>
        <div className="space-y-3 mt-2">
          {[
            {
              key: 'notifyOnMatch' as const,
              label: 'Driver matched',
              description: 'Get notified when a driver accepts your job',
            },
            {
              key: 'notifyOnPickup' as const,
              label: 'Package picked up',
              description: 'Get notified when the driver picks up the package',
            },
            {
              key: 'notifyOnDelivery' as const,
              label: 'Package delivered',
              description: 'Get notified when the delivery is completed',
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={profile[item.key]}
                onChange={(e) => updateField(item.key, e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent/20 cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-text-primary group-hover:text-accent transition">
                  {item.label}
                </span>
                <span className="block text-xs text-text-muted">
                  {item.description}
                </span>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
        {saved && (
          <span className="text-sm text-success flex items-center gap-1.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Changes saved
          </span>
        )}
      </div>
    </div>
  );
}
