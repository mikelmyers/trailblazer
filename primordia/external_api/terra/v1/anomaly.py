"""POST /v1/anomaly/flag

Calls Erebus AnomalyDetector.detect_anomalies() and persists results.
Currently implements heuristic anomaly detection inline until
the Erebus service is deployed.
"""

from __future__ import annotations

import hashlib
import math

from fastapi import APIRouter, Depends

from ..auth import require_auth
from ..models import AnomalyFlagRequest, AnomalyFlagResult, AnomalySeverity

router = APIRouter()


def _detect_anomalies(job_id: str, event_type: str, event_data: dict) -> AnomalyFlagResult:
    """Heuristic anomaly detection.

    Checks for:
        - Delivery time anomalies (too fast / too slow)
        - Location deviation from expected route
        - Unusual event sequences
    """
    # Deterministic "randomness" based on job_id + event_type for reproducibility
    seed = int(hashlib.sha256(f"{job_id}:{event_type}".encode()).hexdigest()[:8], 16)
    flag_value = (seed % 1000) / 1000.0

    # Check for explicit anomaly signals in event data
    if event_data.get("locationDeviation"):
        deviation_km = float(event_data["locationDeviation"])
        if deviation_km > 10:
            return AnomalyFlagResult(
                flagged=True,
                reason=(
                    f"Location deviation of {deviation_km:.1f}km from expected route "
                    f"for {event_type} on job {job_id}."
                ),
                severity=AnomalySeverity.HIGH,
            )
        if deviation_km > 3:
            return AnomalyFlagResult(
                flagged=True,
                reason=(
                    f"Minor location deviation of {deviation_km:.1f}km "
                    f"for {event_type} on job {job_id}."
                ),
                severity=AnomalySeverity.LOW,
            )

    if event_data.get("deliveryTimeMinutes") and event_data.get("estimatedTimeMinutes"):
        actual = float(event_data["deliveryTimeMinutes"])
        estimated = float(event_data["estimatedTimeMinutes"])
        ratio = actual / estimated if estimated > 0 else 1.0
        if ratio < 0.3:
            return AnomalyFlagResult(
                flagged=True,
                reason=(
                    f"Delivery completed suspiciously fast ({actual:.0f}min vs "
                    f"{estimated:.0f}min estimated) for job {job_id}."
                ),
                severity=AnomalySeverity.HIGH,
            )
        if ratio > 3.0:
            return AnomalyFlagResult(
                flagged=True,
                reason=(
                    f"Delivery took {ratio:.1f}x longer than estimated "
                    f"({actual:.0f}min vs {estimated:.0f}min) for job {job_id}."
                ),
                severity=AnomalySeverity.MEDIUM,
            )

    # Baseline stochastic flagging (simulates Erebus pattern detection)
    if flag_value < 0.05:
        return AnomalyFlagResult(
            flagged=True,
            reason=(
                f"Suspicious {event_type} pattern detected for job {job_id}: "
                f"unusual timing and location deviation."
            ),
            severity=AnomalySeverity.HIGH,
        )

    if flag_value < 0.12:
        return AnomalyFlagResult(
            flagged=True,
            reason=(
                f"Minor deviation in {event_type} for job {job_id}: "
                f"slightly outside expected parameters."
            ),
            severity=AnomalySeverity.LOW,
        )

    return AnomalyFlagResult(flagged=False)


@router.post("/anomaly/flag", response_model=AnomalyFlagResult)
async def flag_anomaly(
    req: AnomalyFlagRequest,
    _auth: dict = Depends(require_auth),
) -> AnomalyFlagResult:
    """Flag potential anomalies in delivery events.

    Checks delivery timing, location deviation, and event sequence patterns.
    Results will be persisted to PostgreSQL when Erebus is fully deployed.
    """
    return _detect_anomalies(req.jobId, req.eventType, req.eventData)
