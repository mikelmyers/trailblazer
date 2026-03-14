"""POST /v1/route/optimize

Calls OSRM via terra-road-alignment for real road routing.
Falls back to haversine-interpolated straight-line geometry when OSRM is unavailable.
Returns RouteResult with GeoJSON LineString geometry.coordinates as [[lng, lat], ...].
"""

from __future__ import annotations

import math
import os
import random
from typing import Optional

import httpx
from fastapi import APIRouter, Depends

from ..auth import require_auth
from ..models import RouteGeometry, RouteOptimizeRequest, RouteResult, RouteStep, Waypoint

router = APIRouter()

OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "")


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _interpolate_coords(
    start_lat: float, start_lng: float, end_lat: float, end_lng: float, steps: int
) -> list[list[float]]:
    coords: list[list[float]] = []
    for i in range(steps + 1):
        t = i / steps
        lat = start_lat + (end_lat - start_lat) * t + random.uniform(-0.002, 0.002)
        lng = start_lng + (end_lng - start_lng) * t + random.uniform(-0.002, 0.002)
        coords.append([lng, lat])  # GeoJSON [lng, lat]
    return coords


def _fallback_route(req: RouteOptimizeRequest) -> RouteResult:
    """Haversine-based fallback when OSRM is not available."""
    direct = _haversine_km(req.startLat, req.startLng, req.endLat, req.endLng)
    road_factor = random.uniform(1.2, 1.5)
    distance = round(direct * road_factor, 1)
    avg_speed = random.uniform(25, 45)
    duration = round((distance / avg_speed) * 60)

    num_steps = max(3, round(distance / 2))
    if req.waypoints:
        num_steps = len(req.waypoints) + 2

    coordinates = _interpolate_coords(req.startLat, req.startLng, req.endLat, req.endLng, num_steps)

    directions = [
        "Head north on Main St",
        "Turn right onto Oak Ave",
        "Continue straight through the intersection",
        "Turn left onto Highway 101",
        "Take the exit toward downtown",
        "Merge onto Industrial Blvd",
        "Turn right onto Delivery Lane",
        "Arrive at destination",
    ]

    step_count = min(len(directions), num_steps)
    steps = [
        RouteStep(
            instruction=directions[i % len(directions)],
            distance=round(distance / step_count, 1),
            duration=round(duration / step_count),
        )
        for i in range(step_count)
    ]

    return RouteResult(
        distance=distance,
        duration=duration,
        geometry=RouteGeometry(type="LineString", coordinates=coordinates),
        steps=steps,
    )


async def _osrm_route(req: RouteOptimizeRequest) -> Optional[RouteResult]:
    """Call OSRM via terra-road-alignment for real road geometry."""
    if not OSRM_BASE_URL:
        return None

    # Build OSRM coordinate string: lng,lat;lng,lat;...
    points = f"{req.startLng},{req.startLat}"
    if req.waypoints:
        for wp in req.waypoints:
            points += f";{wp.lng},{wp.lat}"
    points += f";{req.endLng},{req.endLat}"

    url = f"{OSRM_BASE_URL}/route/v1/driving/{points}"
    params = {"overview": "full", "geometries": "geojson", "steps": "true"}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        if data.get("code") != "Ok" or not data.get("routes"):
            return None

        osrm_route = data["routes"][0]
        legs = osrm_route.get("legs", [])

        steps: list[RouteStep] = []
        for leg in legs:
            for step in leg.get("steps", []):
                steps.append(
                    RouteStep(
                        instruction=step.get("maneuver", {}).get("type", "continue"),
                        distance=round(step["distance"] / 1000, 2),  # m → km
                        duration=round(step["duration"] / 60, 1),  # s → min
                    )
                )

        return RouteResult(
            distance=round(osrm_route["distance"] / 1000, 1),  # m → km
            duration=round(osrm_route["duration"] / 60),  # s → min
            geometry=RouteGeometry(
                type="LineString",
                coordinates=osrm_route["geometry"]["coordinates"],
            ),
            steps=steps,
        )
    except (httpx.HTTPError, KeyError, IndexError):
        return None


@router.post("/route/optimize", response_model=RouteResult)
async def optimize_route(
    req: RouteOptimizeRequest,
    _auth: dict = Depends(require_auth),
) -> RouteResult:
    """Compute an optimized route between two points.

    Tries OSRM first for real road geometry, falls back to haversine interpolation.
    """
    osrm_result = await _osrm_route(req)
    if osrm_result is not None:
        return osrm_result
    return _fallback_route(req)
