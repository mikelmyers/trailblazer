'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ProfileData {
  companyName: string;
  contactEmail: string;
  defaultPackageSize: string;
  defaultUrgency: string;
  defaultSpecialInstructions: string;
}

const packageSizeOptions = [
  { value: 'ENVELOPE', label: 'Envelope' },
  { value: 'SMALL', label: 'Small' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LARGE', label: 'Large' },
  { value: 'PALLET', label: 'Pallet' },
];

const urgencyOptions = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'EXPRESS', label: 'Express' },
  { value: 'CRITICAL', label: 'Critical' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    companyName: '',
    contactEmail: '',
    defaultPackageSize: 'SMALL',
    defaultUrgency: 'STANDARD',
    defaultSpecialInstructions: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/shipper/profile');
      if (!res.ok) throw new Error('Failed to load profile.');
      const data = await res.json();
      setProfile({
        companyName: data.companyName || '',
        contactEmail: data.contactEmail || data.email || '',
        defaultPackageSize: data.defaultPackageSize || 'SMALL',
        defaultUrgency: data.defaultUrgency || 'STANDARD',
        defaultSpecialInstructions: data.defaultSpecialInstructions || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/shipper/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: profile.companyName,
          defaultPackageSize: profile.defaultPackageSize,
          defaultUrgency: profile.defaultUrgency,
          defaultSpecialInstructions: profile.defaultSpecialInstructions,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save profile.');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="h-8 w-48 bg-background-3 rounded animate-pulse" />
        <div className="h-64 bg-background-3 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-h2 text-text-primary font-inter">Profile</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your company details and default preferences.
        </p>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-success">Profile saved successfully.</p>
        </div>
      )}

      {/* Company Info */}
      <Card>
        <h2 className="text-h3 text-text-primary mb-4">Company Information</h2>
        <div className="space-y-4">
          <Input
            label="Company Name"
            placeholder="Enter your company name"
            value={profile.companyName}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, companyName: e.target.value }))
            }
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Contact Email
            </label>
            <input
              type="email"
              value={profile.contactEmail}
              readOnly
              disabled
              className="w-full px-3 py-2 bg-background-3 border border-border rounded-md text-sm text-text-muted cursor-not-allowed"
            />
            <p className="text-xs text-text-muted mt-1">
              Email is managed through your authentication settings.
            </p>
          </div>
        </div>
      </Card>

      {/* Default Delivery Preferences */}
      <Card>
        <h2 className="text-h3 text-text-primary mb-4">
          Default Delivery Preferences
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          These defaults will be pre-filled when posting new jobs.
        </p>
        <div className="space-y-4">
          {/* Default Package Size */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Default Package Size
            </label>
            <select
              value={profile.defaultPackageSize}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  defaultPackageSize: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-background-3 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
            >
              {packageSizeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Default Urgency */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Default Urgency
            </label>
            <select
              value={profile.defaultUrgency}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  defaultUrgency: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-background-3 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
            >
              {urgencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Default Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Default Special Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Instructions that apply to most of your deliveries..."
              value={profile.defaultSpecialInstructions}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  defaultSpecialInstructions: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-background-3 border border-border rounded-md text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {success && (
          <span className="text-sm text-success">Saved.</span>
        )}
      </div>
    </div>
  );
}
