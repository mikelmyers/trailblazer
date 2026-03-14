import type { DriverCandidate, JobContext, DispatchMatchResult, RouteResult, AnomalyResult } from './primordia';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function interpolateCoords(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  steps: number
): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = startLat + (endLat - startLat) * t + randomBetween(-0.002, 0.002);
    const lng = startLng + (endLng - startLng) * t + randomBetween(-0.002, 0.002);
    coords.push([lng, lat]);
  }
  return coords;
}

/* ── Vehicle-Package Compatibility Matrix ─────────────────────────────────── */

const VEHICLE_CAPACITY: Record<string, number> = {
  BIKE: 1,
  CAR: 2,
  VAN: 3,
  CARGO_VAN: 4,
  TRUCK: 5,
};

const PACKAGE_REQUIREMENT: Record<string, number> = {
  ENVELOPE: 1,
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 3,
  PALLET: 5,
};

/**
 * Scores vehicle-package compatibility.
 * - 0.0 = vehicle cannot carry this package (e.g., BIKE + PALLET)
 * - 0.5 = vehicle is oversized for the package (e.g., TRUCK + ENVELOPE)
 * - 1.0 = vehicle is the right fit
 */
function scoreVehicleFit(vehicleType: string, packageSize: string): number {
  const capacity = VEHICLE_CAPACITY[vehicleType] ?? 2;
  const required = PACKAGE_REQUIREMENT[packageSize] ?? 2;

  if (capacity < required) return 0; // can't carry it
  if (capacity === required) return 1.0; // perfect fit
  if (capacity === required + 1) return 0.85; // slightly oversized, still good
  return 0.5; // way oversized — wasteful but possible
}

/* ── Zone Familiarity ─────────────────────────────────────────────────────── */

/** Simple heuristic: does the driver's service area list contain the pickup/dropoff zone? */
function scoreZoneFamiliarity(serviceAreas: string[], pickupAddress: string, dropoffAddress: string): number {
  if (serviceAreas.length === 0) return 0.3; // no areas listed = unknown
  const addressLower = `${pickupAddress} ${dropoffAddress}`.toLowerCase();
  const matchCount = serviceAreas.filter(area => addressLower.includes(area.toLowerCase())).length;
  if (matchCount >= 2) return 1.0;
  if (matchCount === 1) return 0.7;
  return 0.3;
}

/* ── Mock Dispatch Match (Cognitive Scoring) ──────────────────────────────── */

/**
 * Simulates Primordia's cognitive dispatch engine.
 *
 * Scoring signals (weighted):
 *   1. Proximity (Terra ETA)     — 30%  Closest driver by real road time
 *   2. Driver rating             — 20%  Higher rated = more reliable
 *   3. Vehicle-package fit       — 20%  Right vehicle for the package
 *   4. Subscription tier boost   — 10%  PRO drivers get priority
 *   5. Experience (total jobs)   — 10%  More experienced = better
 *   6. Zone familiarity          — 10%  Knows the area = faster delivery
 *
 * For CRITICAL urgency, proximity weight increases to 45%.
 * For PALLET/LARGE packages, vehicle fit weight increases to 30%.
 */
export async function mockDispatchMatch(
  job: JobContext,
  candidates: DriverCandidate[]
): Promise<DispatchMatchResult> {
  if (candidates.length === 0) {
    throw new Error('No available drivers for dispatch matching');
  }

  // Adjust weights based on job characteristics
  let wProximity = 0.30;
  let wRating = 0.20;
  let wVehicle = 0.20;
  let wTier = 0.10;
  let wExperience = 0.10;
  let wZone = 0.10;

  if (job.urgency === 'CRITICAL') {
    wProximity = 0.45;
    wRating = 0.15;
    wVehicle = 0.15;
    wTier = 0.10;
    wExperience = 0.08;
    wZone = 0.07;
  }

  if (job.packageSize === 'PALLET' || job.packageSize === 'LARGE') {
    wVehicle = 0.30;
    wProximity = 0.25;
    wRating = 0.15;
    wTier = 0.10;
    wExperience = 0.10;
    wZone = 0.10;
  }

  // Find max values for normalization
  const maxEta = Math.max(...candidates.map(c => c.etaToPickupMin), 1);
  const maxJobs = Math.max(...candidates.map(c => c.totalJobs), 1);

  const scored = candidates.map((driver) => {
    // 1. Proximity: lower ETA = better (inverted, normalized)
    const proximityScore = Math.max(0, 1 - driver.etaToPickupMin / maxEta);

    // 2. Rating: 0-5 normalized to 0-1
    const ratingScore = driver.rating / 5;

    // 3. Vehicle-package compatibility
    const vehicleFitScore = scoreVehicleFit(driver.vehicleType, job.packageSize);

    // 4. Tier boost: PRO drivers get priority weighting
    const tierBoost = driver.subscriptionTier === 'PRO' ? 1.0 : 0.4;

    // 5. Experience: more completed jobs = more reliable
    const experienceScore = Math.min(1, driver.totalJobs / Math.max(maxJobs, 50));

    // 6. Zone familiarity
    const zoneFamiliarityScore = scoreZoneFamiliarity(
      driver.serviceAreas,
      job.pickupAddress,
      job.dropoffAddress
    );

    // Weighted composite score
    const totalScore =
      proximityScore * wProximity +
      ratingScore * wRating +
      vehicleFitScore * wVehicle +
      tierBoost * wTier +
      experienceScore * wExperience +
      zoneFamiliarityScore * wZone;

    return {
      driver,
      totalScore,
      signals: {
        proximityScore: Math.round(proximityScore * 100) / 100,
        ratingScore: Math.round(ratingScore * 100) / 100,
        vehicleFitScore: Math.round(vehicleFitScore * 100) / 100,
        tierBoost: Math.round(tierBoost * 100) / 100,
        experienceScore: Math.round(experienceScore * 100) / 100,
        zoneFamiliarityScore: Math.round(zoneFamiliarityScore * 100) / 100,
      },
    };
  });

  // Filter out drivers whose vehicle can't carry the package
  const eligible = scored.filter(s => s.signals.vehicleFitScore > 0);
  const pool = eligible.length > 0 ? eligible : scored; // fallback if none eligible

  pool.sort((a, b) => b.totalScore - a.totalScore);

  const best = pool[0];
  const secondBest = pool[1];

  // Confidence based on gap between best and second-best
  let confidence: number;
  if (!secondBest) {
    confidence = 0.92;
  } else {
    const gap = best.totalScore - secondBest.totalScore;
    confidence = Math.min(0.98, 0.80 + gap * 2);
  }
  confidence = Math.round(confidence * 100) / 100;

  // Build human-readable reasoning
  const reasons: string[] = [];

  if (best.signals.proximityScore > 0.7) {
    reasons.push(`closest to pickup (${best.driver.etaToPickupMin}min ETA via Terra routing)`);
  } else {
    reasons.push(`${best.driver.etaToPickupMin}min ETA to pickup`);
  }

  reasons.push(`${best.driver.rating}/5 driver rating`);

  if (best.signals.vehicleFitScore === 1.0) {
    reasons.push(`${best.driver.vehicleType} is ideal for ${job.packageSize} package`);
  } else if (best.signals.vehicleFitScore >= 0.85) {
    reasons.push(`${best.driver.vehicleType} suitable for ${job.packageSize} package`);
  }

  if (best.driver.subscriptionTier === 'PRO') {
    reasons.push('PRO tier driver (priority weighting)');
  }

  if (best.signals.experienceScore > 0.5) {
    reasons.push(`${best.driver.totalJobs} completed deliveries`);
  }

  if (best.signals.zoneFamiliarityScore >= 0.7) {
    reasons.push('familiar with delivery zone');
  }

  return {
    driverId: best.driver.id,
    driverName: best.driver.name,
    confidence,
    estimatedPickupTime: best.driver.etaToPickupMin,
    reasoning: `Selected ${best.driver.name} (${best.driver.vehicleType}, ${best.driver.subscriptionTier}): ${reasons.join(', ')}. Composite score: ${(best.totalScore * 100).toFixed(1)}% across ${candidates.length} candidate${candidates.length > 1 ? 's' : ''}.`,
    signals: best.signals,
  };
}

/* ── Mock Route Optimization (Terra) ──────────────────────────────────────── */

export async function mockOptimizeRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  waypoints?: { lat: number; lng: number }[]
): Promise<RouteResult> {
  const directDistance = haversineDistance(startLat, startLng, endLat, endLng);
  const routeDistance = parseFloat((directDistance * randomBetween(1.2, 1.5)).toFixed(1));
  const averageSpeed = randomBetween(25, 45);
  const duration = Math.round((routeDistance / averageSpeed) * 60);

  const numSteps = waypoints ? waypoints.length + 2 : Math.max(3, Math.round(routeDistance / 2));
  const coordinates = interpolateCoords(startLat, startLng, endLat, endLng, numSteps);

  const directions = [
    'Head north on Main St',
    'Turn right onto Oak Ave',
    'Continue straight through the intersection',
    'Turn left onto Highway 101',
    'Take the exit toward downtown',
    'Merge onto Industrial Blvd',
    'Turn right onto Delivery Lane',
    'Arrive at destination',
  ];

  const steps = [];
  const stepCount = Math.min(directions.length, numSteps);
  for (let i = 0; i < stepCount; i++) {
    steps.push({
      instruction: directions[i % directions.length],
      distance: parseFloat((routeDistance / stepCount).toFixed(1)),
      duration: Math.round(duration / stepCount),
    });
  }

  return {
    distance: routeDistance,
    duration,
    geometry: {
      type: 'LineString',
      coordinates,
    },
    steps,
  };
}

/* ── Mock Anomaly Detection ───────────────────────────────────────────────── */

export async function mockFlagAnomaly(
  jobId: string,
  eventType: string,
  _eventData: Record<string, unknown>
): Promise<AnomalyResult> {
  const flagChance = Math.random();

  if (flagChance < 0.05) {
    return {
      flagged: true,
      reason: `Suspicious ${eventType} pattern detected for job ${jobId}: unusual timing and location deviation.`,
      severity: 'high',
    };
  }

  if (flagChance < 0.12) {
    return {
      flagged: true,
      reason: `Minor deviation in ${eventType} for job ${jobId}: slightly outside expected parameters.`,
      severity: 'low',
    };
  }

  return { flagged: false };
}
