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

from config import settings

logger = logging.getLogger(__name__)


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
        headers["Authorization"] = f"Bearer {settings.agno_api_key}"
    else:
        logger.error("No authorization configured for business lookup; cannot validate ownership")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business ownership verification unavailable",
        )

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url, headers=headers)
    except httpx.RequestError as exc:
        logger.error("Business ownership request failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business ownership verification failed",
        ) from exc

    if resp.status_code == 404:
        return None
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

    return resp.json()


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
        if not settings.better_auth_secret:
            logger.error("BETTER_AUTH_SECRET is not configured; refusing to decode JWT")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication misconfigured",
            )

        try:
            claims = jwt.decode(
                token,
                settings.better_auth_secret,
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

    try:
        business = await _fetch_business(workspace_id, business_id, auth_header)
    except HTTPException:
        raise
    except httpx.RequestError as exc:
        logger.error("Business ownership check failed due to request error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business ownership verification failed",
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Business ownership check failed unexpectedly: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business ownership verification failed",
        )

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
