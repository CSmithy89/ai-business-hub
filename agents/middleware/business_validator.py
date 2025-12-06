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


async def _fetch_business(workspace_id: str, business_id: str) -> Optional[dict]:
    """
    Fetch business from NestJS API to verify workspace ownership.
    Returns business data on 200, None on 404. Raises for other errors.
    """
    url = f"{settings.api_base_url}/api/workspaces/{workspace_id}/businesses/{business_id}"
    timeout = httpx.Timeout(5.0, connect=2.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(url)
    if resp.status_code == 404:
        return None
    if resp.status_code >= 500:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Business ownership check unavailable",
        )
    resp.raise_for_status()
    return resp.json()


def _derive_identity(request: Request) -> tuple[Optional[str], Optional[str]]:
    """
    Derive workspace_id and user_id from request state or Authorization header.
    """
    workspace_id = getattr(request.state, "workspace_id", None)
    user_id = getattr(request.state, "user_id", None)

    if workspace_id and user_id:
        return workspace_id, user_id

    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            claims = jwt.decode(
                token,
                settings.better_auth_secret,
                algorithms=["HS256"],
                options={"verify_signature": bool(settings.better_auth_secret)},
            )
            return claims.get("workspaceId") or claims.get("workspace_id"), claims.get("sub")
        except Exception as exc:  # noqa: BLE001 - treat as unauthenticated
            logger.warning("Failed to decode JWT for ownership check: %s", exc)
    return workspace_id, user_id


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

    workspace_id, user_id = _derive_identity(request)
    if not workspace_id or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for business validation",
        )

    try:
        business = await _fetch_business(workspace_id, business_id)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.error("Business ownership check failed: %s", exc, exc_info=True)
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

