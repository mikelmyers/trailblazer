"""FastAPI application factory for the Terra API service."""

from __future__ import annotations

from fastapi import FastAPI

from .v1.anomaly import router as anomaly_router
from .v1.dispatch import router as dispatch_router
from .v1.route import router as route_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Terra API",
        description=(
            "Primordia Terra service — route optimization, cognitive dispatch matching, "
            "and anomaly detection for the Trailblazer delivery platform."
        ),
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.include_router(route_router, prefix="/v1", tags=["Route Optimization"])
    app.include_router(dispatch_router, prefix="/v1", tags=["Dispatch Matching"])
    app.include_router(anomaly_router, prefix="/v1", tags=["Anomaly Detection"])

    @app.get("/health")
    async def health() -> dict:
        return {"status": "ok", "service": "terra"}

    return app
