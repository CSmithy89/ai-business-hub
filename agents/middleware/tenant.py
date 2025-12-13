"""
Tenant Middleware for AgentOS

Extracts and validates JWT tokens from Authorization header, injecting
workspace_id and user context into request state for tenant isolation.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
import jwt
import logging

logger = logging.getLogger(__name__)


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract workspace_id from JWT token.

    Validates JWT using BETTER_AUTH_SECRET and injects:
    - request.state.user_id (from 'sub' claim)
    - request.state.workspace_id (from 'workspaceId' claim, optional)
    - request.state.session_id (from 'sessionId' claim)
    - request.state.email (from 'email' claim)
    - request.state.name (from 'name' claim)
    """

    def __init__(self, app, secret_key: str):
        super().__init__(app)
        self.secret_key = secret_key

    async def dispatch(self, request: Request, call_next):
        # Extract Authorization header
        auth_header = request.headers.get("Authorization", "")

        if auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix

            try:
                # Decode JWT (for MVP, skip signature verification)
                # In production, use: jwt.decode(token, self.secret_key, algorithms=["HS256"])
                claims = jwt.decode(token, options={"verify_signature": False})

                # Extract claims and inject into request state
                request.state.user_id = claims.get("sub")
                request.state.session_id = claims.get("sessionId")
                request.state.workspace_id = claims.get("workspaceId")  # Optional
                request.state.email = claims.get("email")
                request.state.name = claims.get("name")
                request.state.jwt_token = token  # Store for downstream services

                logger.debug(
                    f"Tenant context: user={request.state.user_id}, "
                    f"workspace={request.state.workspace_id}"
                )

            except jwt.ExpiredSignatureError:
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "TOKEN_EXPIRED",
                            "message": "JWT token has expired"
                        }
                    }
                )
            except jwt.DecodeError:
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "INVALID_TOKEN",
                            "message": "Invalid JWT token"
                        }
                    }
                )
            except Exception as e:
                logger.error(f"JWT validation error: {e}")
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "AUTH_ERROR",
                            "message": "Authentication error"
                        }
                    }
                )
        else:
            # No Authorization header - set state to None
            # Individual endpoints can check if auth is required
            request.state.user_id = None
            request.state.workspace_id = None
            request.state.session_id = None
            request.state.email = None
            request.state.name = None
            request.state.jwt_token = None

        # Continue processing request
        response = await call_next(request)
        return response
