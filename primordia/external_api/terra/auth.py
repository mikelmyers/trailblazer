"""API key + JWT authentication for external Terra clients.

Auth modes:
    - TERRA_API_AUTH_DISABLED=true  → all requests pass (development only)
    - TERRA_API_DEV_KEY=<key>       → static API key in Authorization header
    - TERRA_API_JWT_SECRET=<secret> → JWT bearer token validation
"""

from __future__ import annotations

import os
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer_scheme = HTTPBearer(auto_error=False)

AUTH_DISABLED = os.getenv("TERRA_API_AUTH_DISABLED", "").lower() in ("true", "1", "yes")
DEV_KEY = os.getenv("TERRA_API_DEV_KEY", "")
JWT_SECRET = os.getenv("TERRA_API_JWT_SECRET", "")
JWT_ALGORITHM = "HS256"


def _validate_dev_key(token: str) -> bool:
    return DEV_KEY != "" and token == DEV_KEY


def _validate_jwt(token: str) -> Optional[dict]:
    if not JWT_SECRET:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        return None


async def require_auth(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> dict:
    """FastAPI dependency that enforces authentication.

    Returns a context dict with auth metadata (or empty dict if auth disabled).
    """
    if AUTH_DISABLED:
        return {"auth": "disabled", "client": "dev"}

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Use Bearer <api-key> or Bearer <jwt>.",
        )

    token = credentials.credentials

    # Try static API key first
    if _validate_dev_key(token):
        return {"auth": "api_key", "client": "dev_key"}

    # Try JWT
    jwt_payload = _validate_jwt(token)
    if jwt_payload is not None:
        return {"auth": "jwt", "client": jwt_payload.get("sub", "unknown"), **jwt_payload}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials. Provide a valid API key or JWT.",
    )
