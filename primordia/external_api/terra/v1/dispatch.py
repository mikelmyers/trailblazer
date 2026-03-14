"""POST /v1/dispatch/match

Cognitive dispatch matching — evaluates driver, vehicle, rating, tier,
experience, and zone familiarity against the job context to find the
optimal driver.

In production this calls DispatchConsole.optimizer.find_best_drivers().
Currently implements the full scoring algorithm inline.
"""

from __future__ import annotations

import math

from fastapi import APIRouter, Depends

from ..auth import require_auth
from ..models import (
    DispatchMatchRequest,
    DispatchMatchResult,
    DispatchSignals,
    DriverCandidate,
    JobContext,
)

router = APIRouter()


# ── Vehicle-Package Compatibility ────────────────────────────────────────────

_VEHICLE_CAPACITY = {"BIKE": 1, "CAR": 2, "VAN": 3, "CARGO_VAN": 4, "TRUCK": 5}
_PACKAGE_REQUIREMENT = {"ENVELOPE": 1, "SMALL": 1, "MEDIUM": 2, "LARGE": 3, "PALLET": 5}


def _score_vehicle_fit(vehicle_type: str, package_size: str) -> float:
    capacity = _VEHICLE_CAPACITY.get(vehicle_type, 2)
    required = _PACKAGE_REQUIREMENT.get(package_size, 2)
    if capacity < required:
        return 0.0  # can't carry it
    if capacity == required:
        return 1.0  # perfect fit
    if capacity == required + 1:
        return 0.85  # slightly oversized
    return 0.5  # way oversized


def _score_zone_familiarity(
    service_areas: list[str], pickup_addr: str, dropoff_addr: str
) -> float:
    if not service_areas:
        return 0.3
    combined = f"{pickup_addr} {dropoff_addr}".lower()
    match_count = sum(1 for area in service_areas if area.lower() in combined)
    if match_count >= 2:
        return 1.0
    if match_count == 1:
        return 0.7
    return 0.3


# ── Scoring Engine ───────────────────────────────────────────────────────────


def _compute_weights(job: JobContext) -> tuple[float, float, float, float, float, float]:
    """Returns (proximity, rating, vehicle, tier, experience, zone) weights.

    Weights shift dynamically based on job characteristics.
    """
    w_proximity = 0.30
    w_rating = 0.20
    w_vehicle = 0.20
    w_tier = 0.10
    w_experience = 0.10
    w_zone = 0.10

    if job.urgency.value == "CRITICAL":
        w_proximity = 0.45
        w_rating = 0.15
        w_vehicle = 0.15
        w_tier = 0.10
        w_experience = 0.08
        w_zone = 0.07

    if job.packageSize.value in ("PALLET", "LARGE"):
        w_vehicle = 0.30
        w_proximity = 0.25
        w_rating = 0.15
        w_tier = 0.10
        w_experience = 0.10
        w_zone = 0.10

    return w_proximity, w_rating, w_vehicle, w_tier, w_experience, w_zone


def _score_candidate(
    driver: DriverCandidate,
    job: JobContext,
    max_eta: float,
    max_jobs: int,
    weights: tuple[float, float, float, float, float, float],
) -> tuple[float, DispatchSignals]:
    w_prox, w_rating, w_vehicle, w_tier, w_exp, w_zone = weights

    proximity_score = max(0.0, 1 - driver.etaToPickupMin / max_eta) if max_eta > 0 else 0.5
    rating_score = driver.rating / 5.0
    vehicle_fit_score = _score_vehicle_fit(driver.vehicleType.value, job.packageSize.value)
    tier_boost = 1.0 if driver.subscriptionTier.value == "PRO" else 0.4
    experience_score = min(1.0, driver.totalJobs / max(max_jobs, 50))
    zone_familiarity_score = _score_zone_familiarity(
        driver.serviceAreas, job.pickupAddress, job.dropoffAddress
    )

    total = (
        proximity_score * w_prox
        + rating_score * w_rating
        + vehicle_fit_score * w_vehicle
        + tier_boost * w_tier
        + experience_score * w_exp
        + zone_familiarity_score * w_zone
    )

    signals = DispatchSignals(
        proximityScore=round(proximity_score, 2),
        ratingScore=round(rating_score, 2),
        vehicleFitScore=round(vehicle_fit_score, 2),
        tierBoost=round(tier_boost, 2),
        experienceScore=round(experience_score, 2),
        zoneFamiliarityScore=round(zone_familiarity_score, 2),
    )

    return total, signals


# ── Endpoint ─────────────────────────────────────────────────────────────────


@router.post("/dispatch/match", response_model=DispatchMatchResult)
async def dispatch_match(
    req: DispatchMatchRequest,
    _auth: dict = Depends(require_auth),
) -> DispatchMatchResult:
    """Evaluate all driver candidates against the job and return the best match.

    Scoring signals (weighted):
        1. Proximity (Terra ETA)     — 30%  (45% for CRITICAL urgency)
        2. Driver rating             — 20%
        3. Vehicle-package fit       — 20%  (30% for PALLET/LARGE)
        4. Subscription tier boost   — 10%
        5. Experience (total jobs)   — 10%
        6. Zone familiarity          — 10%
    """
    candidates = req.candidates
    job = req.job

    max_eta = max((c.etaToPickupMin for c in candidates), default=1)
    max_jobs = max((c.totalJobs for c in candidates), default=1)
    weights = _compute_weights(job)

    scored = []
    for driver in candidates:
        total, signals = _score_candidate(driver, job, max_eta, max_jobs, weights)
        scored.append((driver, total, signals))

    # Filter drivers whose vehicle cannot carry the package
    eligible = [(d, s, sig) for d, s, sig in scored if sig.vehicleFitScore > 0]
    pool = eligible if eligible else scored
    pool.sort(key=lambda x: x[1], reverse=True)

    best_driver, best_score, best_signals = pool[0]

    # Confidence based on score gap to second-best
    if len(pool) < 2:
        confidence = 0.92
    else:
        gap = best_score - pool[1][1]
        confidence = min(0.98, 0.80 + gap * 2)
    confidence = round(confidence, 2)

    # Build reasoning
    reasons: list[str] = []

    if best_signals.proximityScore > 0.7:
        reasons.append(f"closest to pickup ({best_driver.etaToPickupMin:.0f}min ETA via Terra routing)")
    else:
        reasons.append(f"{best_driver.etaToPickupMin:.0f}min ETA to pickup")

    reasons.append(f"{best_driver.rating}/5 driver rating")

    if best_signals.vehicleFitScore == 1.0:
        reasons.append(f"{best_driver.vehicleType.value} is ideal for {job.packageSize.value} package")
    elif best_signals.vehicleFitScore >= 0.85:
        reasons.append(f"{best_driver.vehicleType.value} suitable for {job.packageSize.value} package")

    if best_driver.subscriptionTier.value == "PRO":
        reasons.append("PRO tier driver (priority weighting)")

    if best_signals.experienceScore > 0.5:
        reasons.append(f"{best_driver.totalJobs} completed deliveries")

    if best_signals.zoneFamiliarityScore >= 0.7:
        reasons.append("familiar with delivery zone")

    reasoning = (
        f"Selected {best_driver.name} ({best_driver.vehicleType.value}, "
        f"{best_driver.subscriptionTier.value}): {', '.join(reasons)}. "
        f"Composite score: {best_score * 100:.1f}% across {len(candidates)} "
        f"candidate{'s' if len(candidates) > 1 else ''}."
    )

    return DispatchMatchResult(
        driverId=best_driver.id,
        driverName=best_driver.name,
        confidence=confidence,
        estimatedPickupTime=best_driver.etaToPickupMin,
        reasoning=reasoning,
        signals=best_signals,
    )
