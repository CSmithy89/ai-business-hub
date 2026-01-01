# DM-11.13: Metrics Endpoint Authentication

**Epic:** DM-11 - Advanced Features & Optimizations
**Points:** 3
**Status:** Done

## User Story

As a **DevOps engineer**, I want to optionally protect the /metrics endpoint with authentication so that I can expose it on public networks without unauthorized access.

## Background

From DM-09 Code Review (RQ1):
> "Consider auth options for metrics exposure (bearer token or IP allowlist)"

The /metrics endpoint currently has no authentication. While rate limiting provides some protection, exposing metrics publicly can leak system information.

## Acceptance Criteria

- [x] Add METRICS_REQUIRE_AUTH environment variable (default: false)
- [x] Add METRICS_API_KEY environment variable for the authentication key
- [x] Support Bearer token authentication (Prometheus native)
- [x] Support X-Metrics-Key header (alternative for custom scrapers)
- [x] Return 401 if auth enabled but credentials invalid
- [x] Return 500 if auth enabled but no key configured (misconfiguration)
- [x] Unit tests for all authentication scenarios

## Technical Implementation

### 1. OTelSettings Configuration Update
**File:** `agents/observability/config.py`

Added new configuration fields:
```python
metrics_require_auth: bool = Field(
    default=False,
    description="Require authentication for /metrics endpoint",
)
metrics_api_key: Optional[str] = Field(
    default=None,
    description="API key for metrics endpoint (required if metrics_require_auth=True)",
)
```

### 2. Authentication Middleware
**File:** `agents/api/middleware/metrics_auth.py`

Created FastAPI dependency that:
- Checks if authentication is enabled
- Validates Bearer token from Authorization header
- Validates X-Metrics-Key header as alternative
- Returns appropriate HTTP errors for failures

### 3. Metrics Route Update
**File:** `agents/api/routes/metrics.py`

Applied authentication dependency to the route:
```python
@router.get(
    "/metrics",
    dependencies=[Depends(verify_metrics_auth)],
    ...
)
```

### 4. Unit Tests
**File:** `agents/tests/test_metrics_auth.py`

9 test cases covering:
- Auth disabled allows all requests
- Auth enabled rejects missing credentials
- Auth enabled accepts valid Bearer token
- Auth enabled accepts valid X-Metrics-Key
- Auth enabled rejects wrong Bearer token
- Auth enabled rejects wrong X-Metrics-Key
- Misconfiguration (auth enabled, no key) returns 500
- Bearer scheme is case-insensitive
- Basic auth scheme is rejected

## Usage

```bash
# Enable metrics authentication
export METRICS_REQUIRE_AUTH=true
export METRICS_API_KEY=your-secret-key

# Prometheus scrape config with auth
scrape_configs:
  - job_name: 'agentos'
    bearer_token: 'your-secret-key'
    static_configs:
      - targets: ['agentos:8000']
    metrics_path: /metrics
```

## Files Changed

- `agents/observability/config.py` - Added auth settings
- `agents/api/middleware/__init__.py` - New middleware package
- `agents/api/middleware/metrics_auth.py` - Authentication middleware
- `agents/api/routes/metrics.py` - Applied auth dependency
- `agents/tests/test_metrics_auth.py` - Unit tests

## Definition of Done

- [x] Config fields added to OTelSettings
- [x] Authentication middleware implemented
- [x] Metrics route uses authentication dependency
- [x] Unit tests pass (9/9)
- [x] Documentation updated in route docstring
