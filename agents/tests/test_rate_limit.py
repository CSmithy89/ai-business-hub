"""
Rate limiting tests for AgentOS (Story 14-7).

Uses in-memory backend to avoid external Redis dependency.
"""

from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from middleware.rate_limit import init_rate_limiting
from middleware.tenant import TenantMiddleware


def create_app(limit: str = "2/minute") -> TestClient:
    app = FastAPI()

    # Minimal tenant middleware to inject user/workspace from headers for test
    class _TestTenant(TenantMiddleware):
        async def dispatch(self, request: Request, call_next):
            request.state.user_id = request.headers.get("x-user-id")
            request.state.workspace_id = request.headers.get("x-workspace-id")
            return await call_next(request)

    app.add_middleware(_TestTenant, secret_key="dummy")
    limiter = init_rate_limiting(app, redis_url=None, default_rate=limit)

    @app.post("/agents/test")
    @limiter.limit(limit)
    async def test_endpoint():
        return {"ok": True}

    return TestClient(app)


def test_rate_limit_blocks_after_threshold():
    client = create_app("2/minute")
    headers = {"x-user-id": "user1", "x-workspace-id": "ws1"}

    # First two requests allowed
    assert client.post("/agents/test", headers=headers).status_code == 200
    assert client.post("/agents/test", headers=headers).status_code == 200
    # Third should be limited
    res = client.post("/agents/test", headers=headers)
    assert res.status_code == 429
    assert res.json().get("detail")  # slowapi default error body


def test_rate_limit_keys_by_identity_not_ip():
    client = create_app("2/minute")
    headers_user1 = {"x-user-id": "user1", "x-workspace-id": "ws1"}
    headers_user2 = {"x-user-id": "user2", "x-workspace-id": "ws1"}

    # user1 consumes quota
    assert client.post("/agents/test", headers=headers_user1).status_code == 200
    assert client.post("/agents/test", headers=headers_user1).status_code == 200
    assert client.post("/agents/test", headers=headers_user1).status_code == 429

    # user2 should still be allowed (different identity)
    assert client.post("/agents/test", headers=headers_user2).status_code == 200
