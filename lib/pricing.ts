/**
 * Trailblazer Pricing Engine
 *
 * Multi-factor pricing model for last-mile delivery jobs.
 * Produces a suggested price based on route data, package characteristics,
 * urgency, time-of-day, route complexity, and regional cost adjustments.
 *
 * All prices are in USD cents (integers) to avoid floating-point issues.
 */

/* ── Constants ────────────────────────────────────────────────────────────── */

/** Minimum fare floor in cents — ensures short trips are worth driver time */
const MINIMUM_FARE_CENTS = 500;

/** Base rate per km (applied to distance^0.85 curve) */
const BASE_RATE_PER_KM_CENTS = 150;

/** Cost per minute of estimated travel time */
const TIME_COST_PER_MIN_CENTS = 15;

/** Package size multipliers — reflects handling time, vehicle requirements */
const PACKAGE_MULTIPLIER: Record<string, number> = {
  ENVELOPE: 1.0,
  SMALL: 1.0,
  MEDIUM: 1.15,
  LARGE: 1.4,
  PALLET: 1.8,
};

/** Urgency multipliers — reflects opportunity cost and prioritization */
const URGENCY_MULTIPLIER: Record<string, number> = {
  STANDARD: 1.0,
  EXPRESS: 1.45,
  CRITICAL: 2.0,
};

/**
 * Time-of-day / day-of-week multipliers.
 * Reflects driver availability patterns and demand surges.
 */
function getTimeMultiplier(date: Date): { multiplier: number; label: string } {
  const hour = date.getHours();
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    if (hour >= 22 || hour < 6) return { multiplier: 1.25, label: 'Weekend night' };
    if (hour >= 18) return { multiplier: 1.15, label: 'Weekend evening' };
    return { multiplier: 1.1, label: 'Weekend' };
  }

  // Weekday
  if (hour >= 7 && hour < 9) return { multiplier: 1.2, label: 'Morning rush' };
  if (hour >= 17 && hour < 19) return { multiplier: 1.2, label: 'Evening rush' };
  if (hour >= 19 && hour < 22) return { multiplier: 1.1, label: 'Evening' };
  if (hour >= 22 || hour < 6) return { multiplier: 1.3, label: 'Late night' };

  return { multiplier: 1.0, label: 'Standard hours' };
}

/**
 * Route complexity factor.
 * Compares actual route distance to haversine straight-line distance.
 * High ratios indicate urban congestion, complex road networks, or detours.
 */
function getRouteComplexityFactor(
  routeDistanceKm: number,
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
): { factor: number; label: string } {
  const straightLineKm = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);

  if (straightLineKm < 0.5) {
    // Very short trip — complexity ratio is unreliable
    return { factor: 1.0, label: 'Short route' };
  }

  const ratio = routeDistanceKm / straightLineKm;

  if (ratio > 1.6) return { factor: 1.15, label: 'Complex urban route' };
  if (ratio > 1.4) return { factor: 1.08, label: 'Moderate complexity' };
  return { factor: 1.0, label: 'Direct route' };
}

/**
 * Regional cost-of-living multiplier.
 * Uses lat/lng bounding boxes for major metros.
 */
interface RegionDef {
  name: string;
  multiplier: number;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

const REGIONS: RegionDef[] = [
  // Tier 1: High-cost metros
  { name: 'New York City', multiplier: 1.35, bounds: { minLat: 40.49, maxLat: 40.92, minLng: -74.26, maxLng: -73.70 } },
  { name: 'San Francisco', multiplier: 1.30, bounds: { minLat: 37.63, maxLat: 37.85, minLng: -122.52, maxLng: -122.35 } },
  { name: 'Los Angeles', multiplier: 1.25, bounds: { minLat: 33.70, maxLat: 34.34, minLng: -118.67, maxLng: -117.90 } },
  { name: 'Seattle', multiplier: 1.20, bounds: { minLat: 47.49, maxLat: 47.74, minLng: -122.44, maxLng: -122.24 } },
  { name: 'Boston', multiplier: 1.25, bounds: { minLat: 42.23, maxLat: 42.40, minLng: -71.19, maxLng: -70.92 } },
  { name: 'Washington DC', multiplier: 1.20, bounds: { minLat: 38.79, maxLat: 38.99, minLng: -77.12, maxLng: -76.91 } },

  // Tier 2: Mid-cost metros
  { name: 'Chicago', multiplier: 1.15, bounds: { minLat: 41.64, maxLat: 42.02, minLng: -87.84, maxLng: -87.52 } },
  { name: 'Miami', multiplier: 1.15, bounds: { minLat: 25.60, maxLat: 25.90, minLng: -80.35, maxLng: -80.13 } },
  { name: 'Denver', multiplier: 1.10, bounds: { minLat: 39.61, maxLat: 39.82, minLng: -105.06, maxLng: -104.60 } },
  { name: 'Austin', multiplier: 1.10, bounds: { minLat: 30.18, maxLat: 30.45, minLng: -97.90, maxLng: -97.60 } },
  { name: 'Nashville', multiplier: 1.05, bounds: { minLat: 36.05, maxLat: 36.28, minLng: -86.92, maxLng: -86.62 } },
  { name: 'Portland', multiplier: 1.10, bounds: { minLat: 45.43, maxLat: 45.60, minLng: -122.84, maxLng: -122.50 } },
  { name: 'Atlanta', multiplier: 1.10, bounds: { minLat: 33.65, maxLat: 33.89, minLng: -84.55, maxLng: -84.28 } },
  { name: 'Minneapolis', multiplier: 1.05, bounds: { minLat: 44.89, maxLat: 45.05, minLng: -93.33, maxLng: -93.19 } },
];

function getRegionMultiplier(lat: number, lng: number): { multiplier: number; region: string } {
  for (const region of REGIONS) {
    const { bounds } = region;
    if (lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng) {
      return { multiplier: region.multiplier, region: region.name };
    }
  }
  return { multiplier: 1.0, region: 'Standard' };
}

/* ── Haversine ────────────────────────────────────────────────────────────── */

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface PriceEstimateInput {
  distanceKm: number;
  durationMin: number;
  packageSize: string;
  urgency: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}

export interface PriceBreakdown {
  baseCostCents: number;
  packageMultiplier: number;
  packageLabel: string;
  urgencyMultiplier: number;
  urgencyLabel: string;
  timeMultiplier: number;
  timeLabel: string;
  routeComplexityFactor: number;
  routeComplexityLabel: string;
  regionMultiplier: number;
  regionLabel: string;
}

export interface PriceSuggestion {
  suggestedPriceCents: number;
  breakdown: PriceBreakdown;
  priceRange: { minCents: number; maxCents: number };
}

/* ── Core Pricing Function ────────────────────────────────────────────────── */

export function calculateSuggestedPrice(input: PriceEstimateInput): PriceSuggestion {
  const {
    distanceKm,
    durationMin,
    packageSize,
    urgency,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
  } = input;

  // Layer 1: Non-linear base cost
  // distance^0.85 means first km costs more than the 20th km
  const distanceCost = Math.pow(Math.max(distanceKm, 0.5), 0.85) * BASE_RATE_PER_KM_CENTS;
  const timeCost = Math.max(durationMin, 1) * TIME_COST_PER_MIN_CENTS;
  const baseCostCents = MINIMUM_FARE_CENTS + distanceCost + timeCost;

  // Layer 2: Package multiplier
  const pkgMult = PACKAGE_MULTIPLIER[packageSize] ?? 1.0;

  // Layer 3: Urgency multiplier
  const urgMult = URGENCY_MULTIPLIER[urgency] ?? 1.0;

  // Layer 4: Time of day
  const { multiplier: timeMult, label: timeLabel } = getTimeMultiplier(new Date());

  // Layer 5: Route complexity
  const { factor: complexityFactor, label: complexityLabel } = getRouteComplexityFactor(
    distanceKm,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
  );

  // Layer 6: Region
  const { multiplier: regionMult, region: regionLabel } = getRegionMultiplier(pickupLat, pickupLng);

  // Compound all layers
  const rawCents = baseCostCents * pkgMult * urgMult * timeMult * complexityFactor * regionMult;

  // Round to nearest 50 cents
  const suggestedPriceCents = Math.round(rawCents / 50) * 50;

  // Price range: 70% to 140% of suggested
  const minCents = Math.round((suggestedPriceCents * 0.7) / 50) * 50;
  const maxCents = Math.round((suggestedPriceCents * 1.4) / 50) * 50;

  return {
    suggestedPriceCents: Math.max(suggestedPriceCents, MINIMUM_FARE_CENTS),
    breakdown: {
      baseCostCents: Math.round(baseCostCents),
      packageMultiplier: pkgMult,
      packageLabel: packageSize,
      urgencyMultiplier: urgMult,
      urgencyLabel: urgency,
      timeMultiplier: timeMult,
      timeLabel,
      routeComplexityFactor: complexityFactor,
      routeComplexityLabel: complexityLabel,
      regionMultiplier: regionMult,
      regionLabel,
    },
    priceRange: {
      minCents: Math.max(minCents, MINIMUM_FARE_CENTS),
      maxCents,
    },
  };
}

/* ── Platform Fee Calculation ─────────────────────────────────────────────── */

export const PLATFORM_FEE_PERCENT: Record<string, number> = {
  FREE: 12,
  STANDARD: 6,
  PRO: 0,
};

export function calculatePlatformFee(
  priceCents: number,
  driverTier: string,
): { platformFeeCents: number; driverPayoutCents: number; feePercent: number } {
  const feePercent = PLATFORM_FEE_PERCENT[driverTier] ?? 12;
  const platformFeeCents = Math.round(priceCents * feePercent / 100);
  const driverPayoutCents = priceCents - platformFeeCents;
  return { platformFeeCents, driverPayoutCents, feePercent };
}

/* ── Formatting Helper ────────────────────────────────────────────────────── */

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
