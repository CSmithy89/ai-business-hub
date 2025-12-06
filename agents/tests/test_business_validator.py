"""
Business ownership validation tests (Story 14-8).
"""

import pytest
import respx
from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.testclient import TestClient
from starlette.middleware.base import BaseHTTPMiddleware

from middleware.business_validator import validate_business_ownership
from config import settings


class IdentityMiddleware(BaseHTTPMiddleware):
    """Test middleware to inject identity from headers."""

    async def dispatch(self, request: Request, call_next):
        request.state.workspace_id = request.headers.get("x-workspace-id")
        request.state.user_id = request.headers.get("x-user-id")
        return await call_next(request)


def create_app():
    app = FastAPI()
    app.add_middleware(IdentityMiddleware)

    @app.post("/guard")
    async def guarded(req: Request, payload: dict = Body(...)):
        await validate_business_ownership(req, payload.get("businessId"))
        return {"ok": True}

    return TestClient(app)


@respx.mock
def test_allows_owned_business():
    client = create_app()
    workspace_id = "ws1"
    business_id = "biz1"
    respx.get(f"{settings.api_base_url}/api/workspaces/{workspace_id}/businesses/{business_id}").mock(
        return_value=respx.Response(200, json={"id": business_id, "workspaceId": workspace_id})
    )

    res = client.post(
        "/guard",
        headers={"x-workspace-id": workspace_id, "x-user-id": "user1"},
        json={"businessId": business_id},
    )
    assert res.status_code == 200
    assert res.json()["ok"] is True


@respx.mock
def test_rejects_not_owned_business():
    client = create_app()
    workspace_id = "ws1"
    business_id = "biz-mismatch"
    respx.get(f"{settings.api_base_url}/api/workspaces/{workspace_id}/businesses/{business_id}").mock(
        return_value=respx.Response(404)
    )

    res = client.post(
        "/guard",
        headers={"x-workspace-id": workspace_id, "x-user-id": "user1"},
        json={"businessId": business_id},
    )
    assert res.status_code == 403
    assert "access denied" in res.json().get("detail", "").lower()


@respx.mock
def test_requires_identity():
    client = create_app()
    res = client.post("/guard", json={"businessId": "biz1"})
    assert res.status_code == 401


@respx.mock
def test_upstream_failure_returns_503():
    client = create_app()
    workspace_id = "ws1"
    business_id = "biz1"
    respx.get(f"{settings.api_base_url}/api/workspaces/{workspace_id}/businesses/{business_id}").mock(
        return_value=respx.Response(500)
    )

    res = client.post(
        "/guard",
        headers={"x-workspace-id": workspace_id, "x-user-id": "user1"},
        json={"businessId": business_id},
    )
    assert res.status_code == 503
