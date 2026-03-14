"""Published request/response contracts for the Terra API.

These are the exact shapes the Next.js client expects.
Changes here must stay backwards-compatible or be versioned.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ────────────────────────────────────────────────────────────────────


class VehicleType(str, Enum):
    BIKE = "BIKE"
    CAR = "CAR"
    VAN = "VAN"
    CARGO_VAN = "CARGO_VAN"
    TRUCK = "TRUCK"


class PackageSize(str, Enum):
    ENVELOPE = "ENVELOPE"
    SMALL = "SMALL"
    MEDIUM = "MEDIUM"
    LARGE = "LARGE"
    PALLET = "PALLET"


class Urgency(str, Enum):
    STANDARD = "STANDARD"
    EXPRESS = "EXPRESS"
    CRITICAL = "CRITICAL"


class SubscriptionTier(str, Enum):
    STANDARD = "STANDARD"
    PRO = "PRO"


class AnomalySeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# ── Route Optimization ──────────────────────────────────────────────────────


class Waypoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class RouteOptimizeRequest(BaseModel):
    startLat: float = Field(..., ge=-90, le=90)
    startLng: float = Field(..., ge=-180, le=180)
    endLat: float = Field(..., ge=-90, le=90)
    endLng: float = Field(..., ge=-180, le=180)
    waypoints: Optional[list[Waypoint]] = None


class RouteStep(BaseModel):
    instruction: str
    distance: float
    duration: float


class RouteGeometry(BaseModel):
    type: str = "LineString"
    coordinates: list[list[float]]


class RouteResult(BaseModel):
    distance: float = Field(..., description="Route distance in km")
    duration: float = Field(..., description="Route duration in minutes")
    geometry: RouteGeometry
    steps: list[RouteStep]


# ── Dispatch Matching ────────────────────────────────────────────────────────


class DriverCandidate(BaseModel):
    id: str
    name: str
    currentLat: float
    currentLng: float
    rating: float = Field(..., ge=0, le=5)
    totalJobs: int = Field(..., ge=0)
    vehicleType: VehicleType
    subscriptionTier: SubscriptionTier
    serviceAreas: list[str] = []
    routeToPickupKm: float = Field(..., description="Terra-computed road distance to pickup")
    etaToPickupMin: float = Field(..., description="Terra-computed ETA to pickup in minutes")


class JobContext(BaseModel):
    pickupLat: float
    pickupLng: float
    dropoffLat: float
    dropoffLng: float
    packageSize: PackageSize
    urgency: Urgency
    pickupAddress: str
    dropoffAddress: str
    description: Optional[str] = None


class DispatchMatchRequest(BaseModel):
    job: JobContext
    candidates: list[DriverCandidate] = Field(..., min_length=1)


class DispatchSignals(BaseModel):
    proximityScore: float
    ratingScore: float
    vehicleFitScore: float
    tierBoost: float
    experienceScore: float
    zoneFamiliarityScore: float


class DispatchMatchResult(BaseModel):
    driverId: str
    driverName: str
    confidence: float = Field(..., ge=0, le=1)
    estimatedPickupTime: float = Field(..., description="Minutes until driver reaches pickup")
    reasoning: str
    signals: DispatchSignals


# ── Anomaly Detection ────────────────────────────────────────────────────────


class AnomalyFlagRequest(BaseModel):
    jobId: str
    eventType: str
    eventData: dict


class AnomalyFlagResult(BaseModel):
    flagged: bool
    reason: Optional[str] = None
    severity: Optional[AnomalySeverity] = None
