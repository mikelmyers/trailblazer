export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { priceEstimateSchema } from '@/lib/validations/job';
import { optimizeRoute } from '@/lib/primordia';
import { calculateSuggestedPrice, formatCents } from '@/lib/pricing';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = priceEstimateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { pickupLat, pickupLng, dropoffLat, dropoffLng, packageSize, urgency } = parsed.data;

    // Get route data from Terra
    const route = await optimizeRoute(pickupLat, pickupLng, dropoffLat, dropoffLng);

    // Calculate suggested price
    const suggestion = calculateSuggestedPrice({
      distanceKm: route.distance,
      durationMin: route.duration,
      packageSize,
      urgency,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    });

    return NextResponse.json({
      suggestedPriceCents: suggestion.suggestedPriceCents,
      suggestedPriceFormatted: formatCents(suggestion.suggestedPriceCents),
      priceRange: {
        minCents: suggestion.priceRange.minCents,
        maxCents: suggestion.priceRange.maxCents,
        minFormatted: formatCents(suggestion.priceRange.minCents),
        maxFormatted: formatCents(suggestion.priceRange.maxCents),
      },
      breakdown: {
        baseCost: formatCents(suggestion.breakdown.baseCostCents),
        package: `${suggestion.breakdown.packageLabel} (${suggestion.breakdown.packageMultiplier}x)`,
        urgency: `${suggestion.breakdown.urgencyLabel} (${suggestion.breakdown.urgencyMultiplier}x)`,
        time: `${suggestion.breakdown.timeLabel} (${suggestion.breakdown.timeMultiplier}x)`,
        routeComplexity: `${suggestion.breakdown.routeComplexityLabel} (${suggestion.breakdown.routeComplexityFactor}x)`,
        region: `${suggestion.breakdown.regionLabel} (${suggestion.breakdown.regionMultiplier}x)`,
      },
      route: {
        distanceKm: route.distance,
        durationMin: route.duration,
      },
    });
  } catch (error) {
    console.error('Price estimate error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
