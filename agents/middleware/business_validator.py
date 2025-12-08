"""
Business ownership validation for AgentOS (Story 14-8).

Validates that the requested business belongs to the authenticated workspace.
Uses NestJS API (settings.api_base_url) to verify ownership; fails closed if
verification cannot be completed.
"""

import logging
from typing import Optional

import httpx
import jwt
from fastapi import HTTPException, Request, status

from config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


def _unwrap_secret(secret) -> Optional[str]:
    try:
        return secret.get_secret_value()  # type: ignore[attr-defined]
    except AttributeError:
        return secret

async def _fetch_business(
    workspace_id: str, business_id: str, auth_header: Optional[str]
) -> Optional[dict]:
    """
    Fetch business from NestJS API to verify workspace ownership.
    Returns business data on 200, None on 404. Raises for other errors.
    """
    url = f"{settings.api_base_url}/api/workspaces/{workspace_id}/businesses/{business_id}"
    timeout = httpx.Timeout(5.0, connect=2.0)
    headers = {}

    if auth_header:
        headers["Authorization"] = auth_header
    elif settings.agno_api_key:
        api_key = _unwrap_secret(settings.agno_api_key)
        if not api_key:
            logger.error("AGNO_API_KEY configured but empty; refusing to call upstream")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Business ownership verification unavailable",
            )
        headers["Authorization"] = f"Bearer {api_key}"
    else:
        logger.error("No authorization configured for business lookup; cannot validate ownership")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business ownership verification unavailable",
        )

    timeout = httpx.Timeout(5.0, connect=2.0)
    # Reuse a shared client to avoid connection churn
    if not hasattr(_fetch_business, "_client"):
        setattr(_fetch_business, "_client", httpx.AsyncClient(timeout=timeout))
    client: httpx.AsyncClient = getattr(_fetch_business, "_client")

    try:
        resp = await client.get(url, headers=headers)
    except httpx.RequestError as exc:
        logger.error("Business ownership request failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business ownership verification failed",
        ) from exc

    if resp.status_code == 404:
        return None
    if resp.status_code in (401, 403):
        raise HTTPException(
            status_code=resp.status_code,
            detail="Business ownership verification failed: unauthorized",
        )
    if resp.status_code >= 500:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business ownership check unavailable",
        )

    try:
        resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.error("Unexpected response during business lookup: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business ownership verification failed",
        ) from exc

    try:
        return resp.json()
    except ValueError as exc:
        logger.error("Failed to decode business lookup response: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business ownership verification failed",
        ) from exc


def _derive_identity(request: Request) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Derive workspace_id and user_id from request state or Authorization header.
    """
    workspace_id = getattr(request.state, "workspace_id", None)
    user_id = getattr(request.state, "user_id", None)
    auth_header = request.headers.get("Authorization")

    if workspace_id and user_id:
        return workspace_id, user_id, auth_header

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
        secret = _unwrap_secret(settings.better_auth_secret)
        if not secret:
            logger.error("BETTER_AUTH_SECRET is not configured; refusing to decode JWT")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication misconfigured",
            )

        try:
            claims = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
            )
            return (
                claims.get("workspaceId") or claims.get("workspace_id"),
                claims.get("sub"),
                auth_header,
            )
        except jwt.ExpiredSignatureError as exc:
            logger.warning("JWT expired for ownership check: %s", exc)
        except jwt.InvalidTokenError as exc:
            logger.warning("Invalid JWT for ownership check: %s", exc)

    return workspace_id, user_id, auth_header


async def validate_business_ownership(request: Request, business_id: str) -> None:
    """
    Validate that the business belongs to the authenticated workspace.

    Raises:
        HTTPException 400 if business_id missing
        HTTPException 401 if identity missing
        HTTPException 403 if business not found/owned
        HTTPException 503 if upstream verification fails
    """
    if not business_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="business_id is required",
        )

    workspace_id, user_id, auth_header = _derive_identity(request)
    if not workspace_id or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for business validation",
        )

    business = await _fetch_business(workspace_id, business_id, auth_header)

    if not business or str(business.get("workspaceId") or business.get("workspace_id")) != str(
        workspace_id
    ):
        logger.warning(
            "Unauthorized business access attempt",
            extra={"user_id": user_id, "workspace_id": workspace_id, "business_id": business_id},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business not found or access denied",
        )

    # Success: no return needed
