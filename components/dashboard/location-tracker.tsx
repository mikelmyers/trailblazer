'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface LocationTrackerProps {
  isActive: boolean;
  onLocationUpdate?: (location: LocationData) => void;
  className?: string;
}

type TrackerStatus = 'idle' | 'tracking' | 'error';

/* ── Constants ────────────────────────────────────────────────────────────── */

const SEND_INTERVAL_MS = 30_000;

/* ── Server sync ─────────────────────────────────────────────────────────── */

async function sendLocationToServer(lat: number, lng: number): Promise<void> {
  const res = await fetch('/api/drivers/location', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update location: ${res.status}`);
  }
}

/* ── Component ────────────────────────────────────────────────────────────── */

const LocationTracker: React.FC<LocationTrackerProps> = ({
  isActive,
  onLocationUpdate,
  className = '',
}) => {
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestLocationRef = useRef<LocationData | null>(null);

  /* ── Geolocation callbacks ─────────────────────────────────────────────── */

  const handlePositionUpdate = useCallback(
    (position: GeolocationPosition) => {
      const location: LocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      latestLocationRef.current = location;
      setStatus('tracking');
      setErrorMessage(null);

      if (onLocationUpdate) {
        onLocationUpdate(location);
      }
    },
    [onLocationUpdate]
  );

  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    setStatus('error');
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setErrorMessage(
          'Location permission denied. Please enable location access in your browser settings.'
        );
        break;
      case error.POSITION_UNAVAILABLE:
        setErrorMessage('Location information is unavailable.');
        break;
      case error.TIMEOUT:
        setErrorMessage('Location request timed out.');
        break;
      default:
        setErrorMessage('An unknown location error occurred.');
        break;
    }
  }, []);

  /* ── Send location to server ───────────────────────────────────────────── */

  const sendLocation = useCallback(async () => {
    const location = latestLocationRef.current;
    if (!location) return;

    try {
      await sendLocationToServer(location.lat, location.lng);
      setLastSentAt(Date.now());
    } catch {
      // Silently fail on send errors -- will retry on next interval
    }
  }, []);

  /* ── Start/stop tracking based on isActive ─────────────────────────────── */

  useEffect(() => {
    if (!isActive) {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setStatus('idle');
      latestLocationRef.current = null;
      return;
    }

    // Check for geolocation support
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setErrorMessage('Geolocation is not supported by this browser.');
      return;
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 10_000,
      }
    );

    // Send location to server immediately and then every 30 seconds
    sendLocation();
    intervalRef.current = setInterval(sendLocation, SEND_INTERVAL_MS);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, handlePositionUpdate, handlePositionError, sendLocation]);

  /* ── Render nothing when idle and inactive ─────────────────────────────── */

  if (!isActive && status === 'idle') {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {status === 'tracking' && (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          <span className="text-xs text-text-secondary">
            Location tracking active
            {lastSentAt && (
              <span className="text-text-muted ml-1">
                &middot; synced {Math.round((Date.now() - lastSentAt) / 1000)}s ago
              </span>
            )}
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
          </span>
          <span className="text-xs text-danger">
            {errorMessage || 'Location error'}
          </span>
        </>
      )}

      {status === 'idle' && isActive && (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-text-muted" />
          </span>
          <span className="text-xs text-text-muted">
            Initializing location...
          </span>
        </>
      )}
    </div>
  );
};

LocationTracker.displayName = 'LocationTracker';

export { LocationTracker };
export type { LocationTrackerProps, LocationData };
