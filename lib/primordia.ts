import {
  mockDispatchMatch,
  mockOptimizeRoute,
  mockFlagAnomaly,
} from './primordia.mock';

const PRIMORDIA_API_URL = process.env.PRIMORDIA_API_URL || 'mock';
const PRIMORDIA_API_KEY = process.env.PRIMORDIA_API_KEY || '';

const isMock = PRIMORDIA_API_URL === 'mock';

interface DriverCandidate {
  id: string;
  currentLat: number;
  currentLng: number;
  rating: number;
  vehicleType: string;
}

interface DispatchMatchResult {
  driverId: string;
  confidence: number;
  estimatedPickupTime: number;
  reasoning: string;
}

interface RouteResult {
  distance: number;
  duration: number;
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  steps: { instruction: string; distance: number; duration: number }[];
}

interface AnomalyResult {
  flagged: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
}

async function primordiaFetch<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${PRIMORDIA_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PRIMORDIA_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Primordia API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export async function dispatchMatch(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
  packageSize: string,
  urgency: string,
  availableDrivers: DriverCandidate[]
): Promise<DispatchMatchResult> {
  if (isMock) {
    return mockDispatchMatch(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      packageSize,
      urgency,
      availableDrivers
    );
  }

  return primordiaFetch<DispatchMatchResult>('/v1/dispatch/match', {
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    packageSize,
    urgency,
    availableDrivers,
  });
}

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
