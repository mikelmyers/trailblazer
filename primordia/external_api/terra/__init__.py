"""Terra API — route optimization, cognitive dispatch, anomaly detection.

Run (development, auth disabled):
    TERRA_API_AUTH_DISABLED=true python -m primordia.external_api.terra

Run (with API key):
    TERRA_API_DEV_KEY=some-secret python -m primordia.external_api.terra

Docs: http://localhost:8100/docs

Environment variables:
    TERRA_API_PORT           Port to listen on (default: 8100)
    TERRA_API_DEV_KEY        Static API key for Bearer auth
    TERRA_API_JWT_SECRET     JWT signing secret for token auth
    TERRA_API_AUTH_DISABLED  Set to "true" to skip auth (dev only)
    TERRA_API_RELOAD         Set to "true" for uvicorn auto-reload
    OSRM_BASE_URL            OSRM server URL (empty = haversine fallback)
"""
