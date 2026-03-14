import {
  mockDispatchMatch,
  mockOptimizeRoute,
  mockFlagAnomaly,
} from './primordia.mock';

const PRIMORDIA_API_URL = process.env.PRIMORDIA_API_URL || 'mock';
const PRIMORDIA_API_KEY = process.env.PRIMORDIA_API_KEY || '';

const isMock = PRIMORDIA_API_URL === 'mock';

/* ── Types ────────────────────────────────────────────────────────────────── */

/** Full driver context sent to Primordia for cognitive matching */
export interface DriverCandidate {
  id: string;
  name: string;
  currentLat: number;
  currentLng: number;
  rating: number;
  totalJobs: number;
  vehicleType: string;
  subscriptionTier: string;
  serviceAreas: string[];
  /** Terra-computed real road distance from driver to pickup (km) */
  routeToPickupKm: number;
  /** Terra-computed real ETA from driver to pickup (minutes) */
  etaToPickupMin: number;
}

/** Job context sent to Primordia */
export interface JobContext {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  packageSize: string;
  urgency: string;
  pickupAddress: string;
  dropoffAddress: string;
  description?: string;
}

export interface DispatchMatchResult {
  driverId: string;
  driverName: string;
  confidence: number;
  estimatedPickupTime: number;
  reasoning: string;
  /** Breakdown of scoring signals for admin visibility */
  signals: {
    proximityScore: number;
    ratingScore: number;
    vehicleFitScore: number;
    tierBoost: number;
    experienceScore: number;
    zoneFamiliarityScore: number;
  };
}

export interface RouteResult {
  distance: number;
  duration: number;
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  steps: { instruction: string; distance: number; duration: number }[];
}

export interface AnomalyResult {
  flagged: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
}

/* ── Internal fetch helper ────────────────────────────────────────────────── */

async function primordiaFetch<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout per spec

  try {
    const response = await fetch(`${PRIMORDIA_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PRIMORDIA_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Primordia API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Terra: Route Optimization ────────────────────────────────────────────── */

/**
 * Calls Terra to compute an optimized route between two points.
 * Used for: job route preview, driver-to-pickup ETA calculation.
 */
export async function optimizeRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  waypoints?: { lat: number; lng: number }[]
): Promise<RouteResult> {
  if (isMock) {
    return mockOptimizeRoute(startLat, startLng, endLat, endLng, waypoints);
  }

  return primordiaFetch<RouteResult>('/v1/route/optimize', {
    startLat,
    startLng,
    endLat,
    endLng,
    waypoints,
  });
}

/**
 * Batch-computes Terra routes from each driver to the pickup point.
 * Returns enriched driver candidates with real road distance and ETA.
 */
export async function computeDriverPickupRoutes(
  drivers: Omit<DriverCandidate, 'routeToPickupKm' | 'etaToPickupMin'>[],
  pickupLat: number,
  pickupLng: number
): Promise<DriverCandidate[]> {
  const enriched = await Promise.all(
    drivers.map(async (driver) => {
      try {
        const route = await optimizeRoute(
          driver.currentLat,
          driver.currentLng,
          pickupLat,
          pickupLng
        );
        return {
          ...driver,
          routeToPickupKm: route.distance,
          etaToPickupMin: route.duration,
        };
      } catch {
        // Fallback to haversine estimate if Terra fails for this driver
        const R = 6371;
        const dLat = ((pickupLat - driver.currentLat) * Math.PI) / 180;
        const dLng = ((pickupLng - driver.currentLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((driver.currentLat * Math.PI) / 180) *
            Math.cos((pickupLat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const straightLine = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const estimatedRoad = straightLine * 1.35;
        return {
          ...driver,
          routeToPickupKm: Math.round(estimatedRoad * 10) / 10,
          etaToPickupMin: Math.round((estimatedRoad / 35) * 60),
        };
      }
    })
  );

  return enriched;
}

/* ── Primordia: Cognitive Dispatch Match ───────────────────────────────────── */

/**
 * Sends full job context + Terra-enriched driver candidates to Primordia.
 * Primordia evaluates: proximity (via Terra ETA), driver rating, vehicle-package
 * compatibility, subscription tier priority, job history/experience, and
 * service area familiarity — then returns the optimal match with reasoning.
 */
export async function dispatchMatch(
  job: JobContext,
  candidates: DriverCandidate[]
): Promise<DispatchMatchResult> {
  if (isMock) {
    return mockDispatchMatch(job, candidates);
  }

  return primordiaFetch<DispatchMatchResult>('/v1/dispatch/match', {
    job,
    candidates,
  });
}

/* ── Primordia: Anomaly Detection ─────────────────────────────────────────── */

export async function flagAnomaly(
  jobId: string,
  eventType: string,
  eventData: Record<string, unknown>
): Promise<AnomalyResult> {
  if (isMock) {
    return mockFlagAnomaly(jobId, eventType, eventData);
  }

  return primordiaFetch<AnomalyResult>('/v1/anomaly/flag', {
    jobId,
    eventType,
    eventData,
  });
}
