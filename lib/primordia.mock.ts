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

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function mockDispatchMatch(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
  packageSize: string,
  urgency: string,
  availableDrivers: DriverCandidate[]
): Promise<DispatchMatchResult> {
  if (availableDrivers.length === 0) {
    throw new Error('No available drivers for dispatch matching');
  }

  const scored = availableDrivers
    .map((driver) => {
      const distToPickup = haversineDistance(
        driver.currentLat,
        driver.currentLng,
        pickupLat,
        pickupLng
      );
      const ratingScore = driver.rating / 5;
      const distScore = Math.max(0, 1 - distToPickup / 50);
      const score = distScore * 0.6 + ratingScore * 0.4;
      return { driver, score, distToPickup };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const confidence = parseFloat(randomBetween(0.85, 0.98).toFixed(2));
  const estimatedPickupTime = Math.round(best.distToPickup * 2.5 + randomBetween(3, 8));

  return {
    driverId: best.driver.id,
    confidence,
    estimatedPickupTime,
    reasoning: `Selected driver ${best.driver.id} (${best.driver.vehicleType}) based on proximity (${best.distToPickup.toFixed(1)}km), rating (${best.driver.rating}), and vehicle suitability for ${packageSize} package with ${urgency} urgency.`,
  };
}

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

export async function mockFlagAnomaly(
  jobId: string,
  eventType: string,
  eventData: Record<string, unknown>
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

  return {
    flagged: false,
  };
}
