# Production Deployment Guide

This guide covers deploying HYVVE to a production environment with security best practices.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Encryption Key Management](#encryption-key-management)
5. [Redis Configuration](#redis-configuration)
6. [PgBouncer Configuration](#pgbouncer-configuration)
7. [Application Deployment](#application-deployment)
8. [Security Checklist](#security-checklist)
9. [Monitoring & Observability](#monitoring--observability)

---

## Prerequisites

### Infrastructure Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| PostgreSQL | 16+ | Managed (Supabase, RDS, Cloud SQL) |
| Redis | 7+ | Managed (Upstash, ElastiCache) |
| Node.js | 20+ | Latest LTS |
| Python | 3.12+ | 3.12.x |

### Recommended Hosting

| Service | Purpose | Provider Options |
|---------|---------|------------------|
| Frontend | Next.js hosting | Vercel, Cloudflare Pages |
| API | NestJS hosting | Railway, Render, AWS ECS |
| AgentOS | Python hosting | Railway, Render, AWS ECS |
| Database | PostgreSQL | Supabase, Neon, RDS |
| Cache | Redis | Upstash, ElastiCache |
| Storage | File uploads | S3, Supabase Storage |

---

## Environment Configuration

### Required Environment Variables

```bash
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL="postgresql://user:password@host:5432/hyvve?schema=public&sslmode=require"

# ===========================================
# AUTHENTICATION (CRITICAL)
# ===========================================
# Must be at least 32 characters with high entropy
BETTER_AUTH_SECRET="<generate-with-openssl-rand-base64-32>"
BETTER_AUTH_URL="https://your-domain.com"

# ===========================================
# ENCRYPTION (CRITICAL)
# ===========================================
# Must be at least 32 characters - see Encryption Key Management section
ENCRYPTION_MASTER_KEY="<generate-with-openssl-rand-base64-32>"

# ===========================================
# REDIS
# ===========================================
REDIS_URL="redis://:password@host:6379"
# Or for TLS:
REDIS_URL="rediss://:password@host:6379"

# ===========================================
# EMAIL
# ===========================================
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="<sendgrid-api-key>"
EMAIL_FROM="noreply@your-domain.com"

# ===========================================
# OAUTH PROVIDERS (Optional)
# ===========================================
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
MICROSOFT_CLIENT_ID="..."
MICROSOFT_CLIENT_SECRET="..."

# ===========================================
# AI PROVIDERS (User-configured via BYOAI)
# ===========================================
# These are stored encrypted in the database per-tenant
# No default AI keys needed at infrastructure level

# ===========================================
# APPLICATION
# ===========================================
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://api.your-domain.com"
NEXT_PUBLIC_AGENTS_URL="https://agents.your-domain.com"
```

### Generate Secure Keys

```bash
# Generate BETTER_AUTH_SECRET (32+ chars)
openssl rand -base64 32

# Generate ENCRYPTION_MASTER_KEY (32+ chars)
openssl rand -base64 32

# Verify entropy
echo -n "your-key-here" | wc -c  # Should be >= 32
```

---

## Database Setup

### PostgreSQL Configuration

```sql
-- Create database
CREATE DATABASE hyvve;

-- Create application user (not superuser)
CREATE USER hyvve_app WITH PASSWORD 'secure-password';
GRANT CONNECT ON DATABASE hyvve TO hyvve_app;

-- After running migrations, grant permissions
GRANT USAGE ON SCHEMA public TO hyvve_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hyvve_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hyvve_app;
```

### Run Migrations

```bash
# Production migration
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

### Enable Row-Level Security (RLS)

HYVVE uses PostgreSQL RLS for multi-tenant isolation. The migrations automatically create RLS policies, but verify they're enabled:

```sql
-- Check RLS is enabled on tenant-scoped tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('Workspace', 'WorkspaceMember', 'ApprovalItem');
```

### Index Verification

```sql
-- Verify critical indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'ApprovalItem'
AND indexname LIKE '%tenant%';
```

---

## Encryption Key Management

### ENCRYPTION_MASTER_KEY Requirements

The `ENCRYPTION_MASTER_KEY` encrypts sensitive data including:
- AI provider API keys
- OAuth tokens
- Other credentials

**Requirements:**
- Minimum 32 characters
- High entropy (use `openssl rand -base64 32`)
- Never commit to version control
- Store in secure secrets manager

### Key Storage Options

| Provider | Configuration |
|----------|---------------|
| **Vercel** | Environment Variables (encrypted at rest) |
| **AWS** | Secrets Manager or Parameter Store |
| **Google Cloud** | Secret Manager |
| **Azure** | Key Vault |
| **Railway** | Environment Variables |

### Key Rotation Procedure

1. **Generate new key:**
   ```bash
   openssl rand -base64 32
   ```

2. **Update environment variable** in your secrets manager

3. **Re-encrypt existing data** (requires custom migration):
   ```typescript
   // Decrypt with old key, encrypt with new key
   // Run as one-time migration script
   ```

4. **Verify application works** with new key

5. **Revoke old key** after verification period

### Startup Validation

The application should validate the encryption key on startup:

```typescript
// Recommended: Add to application startup
if (!process.env.ENCRYPTION_MASTER_KEY ||
    process.env.ENCRYPTION_MASTER_KEY.length < 32) {
  throw new Error('ENCRYPTION_MASTER_KEY must be at least 32 characters');
}
```

---

## Redis Configuration

HYVVE uses two Redis instances for different purposes:
1. **Standard Redis** (via `REDIS_URL`) - Event bus, queues, caching
2. **Upstash Redis REST API** (via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) - Distributed rate limiting

### Production Redis Requirements

- **TLS:** Always use `rediss://` protocol in production
- **Authentication:** Require password
- **Persistence:** Enable AOF or RDB for queue durability

### Standard Redis for Event Bus

The event bus uses Redis Streams. Ensure your Redis instance:
- Has sufficient memory for stream data
- Has persistence enabled (data survives restarts)
- Is in the same region as your application

```bash
# Production configuration
REDIS_URL="rediss://default:password@your-endpoint.upstash.io:6379"
```

---

### Upstash Redis for Rate Limiting (Required for Production)

**Why Upstash?**
- Serverless-first with REST API (perfect for Next.js Edge/Serverless)
- Global replication available
- ~1ms latency
- Generous free tier
- Automatic scaling

**Important:** The in-memory rate limiter fallback is NOT production-ready:
- Rate limits reset on every server restart
- Does not work across multiple instances/regions
- No persistence or durability guarantees

#### Step 1: Create Upstash Account

1. Visit https://console.upstash.com
2. Sign up with GitHub or email
3. Verify your email address

#### Step 2: Create Redis Database

1. Click "Create Database" in the Upstash Console
2. Configure your database:
   - **Name:** `hyvve-rate-limiting` (or your preferred name)
   - **Type:** Choose "Regional" for single-region or "Global" for multi-region
   - **Region:** Select the region closest to your application
     - For Vercel: Choose the same region as your deployment
     - For AWS: Match your ECS/Lambda region
   - **Eviction:** Select "No Eviction" (rate limiting data should not be evicted)
3. Click "Create"

#### Step 3: Get Connection Credentials

After creating the database:
1. Navigate to your database in the Upstash Console
2. Go to the "Details" tab
3. Find the "REST API" section
4. Copy the following values:
   - **UPSTASH_REDIS_REST_URL** - The REST API endpoint URL
   - **UPSTASH_REDIS_REST_TOKEN** - The REST API authentication token

Example values:
```bash
UPSTASH_REDIS_REST_URL="https://us1-supreme-butterfly-12345.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AYNxASQgMTk5ZjE4YmEtZjk2Ny00..."
```

#### Step 4: Configure Environment Variables

Add the credentials to your environment:

**Local Development (.env.local):**
```bash
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-rest-token-here"
```

**Production (Vercel/Railway/etc.):**
1. Add environment variables via your hosting platform's dashboard
2. Set the same variables for all environments (preview, production)
3. Redeploy to apply changes

**Environment Variable Validation:**
```bash
# Verify variables are set
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

#### Step 5: Test Connection

After configuring environment variables, test the connection:

**Method 1: Check Application Logs**
```bash
# Start your application
pnpm dev

# Look for this log message:
# [rate-limit] Redis configured - using distributed rate limiting
```

**Method 2: Test with curl**
```bash
# Test REST API connection
curl https://your-database.upstash.io/get/test \
  -H "Authorization: Bearer your-rest-token"

# Expected: {"result":null}  (key doesn't exist)
```

**Method 3: Trigger Rate Limit**
```bash
# Make 6 consecutive 2FA attempts to trigger rate limit
# The 6th attempt should return 429 Too Many Attempts

# Restart the server
pnpm dev

# Try again - should still be rate limited (proves persistence)
```

#### Step 6: Verify Rate Limiting Works

**Test Scenarios:**

1. **Persistence Test:**
   - Make 5 2FA verification attempts (use invalid code)
   - Restart the application server
   - Make a 6th attempt - should be rate limited

2. **Multi-Instance Test:**
   - Deploy to two separate instances/regions
   - Make 3 attempts on instance A
   - Make 3 attempts on instance B
   - Total count should be 6 (distributed tracking works)

3. **Fallback Test:**
   - Remove `UPSTASH_REDIS_REST_URL` from environment
   - Restart application
   - Check logs for: `[rate-limit] Redis not configured - using in-memory`
   - Verify rate limiting still works (but won't persist)

#### Fallback Behavior

The rate limiter automatically falls back to in-memory storage when Redis is unavailable:

**Fallback Triggers:**
- Environment variables not set
- Network connection failure to Upstash
- Invalid credentials
- Upstash service outage

**Fallback Characteristics:**
- ✅ Rate limiting still works
- ❌ Limits reset on server restart
- ❌ No distributed tracking across instances
- ⚠️ Not suitable for production

**Application Logs:**
```bash
# Redis configured successfully:
[rate-limit] Redis configured - using distributed rate limiting

# Fallback active:
[rate-limit] Redis not configured - using in-memory rate limiting (NOT production-ready)

# Fallback after error:
[rate-limit] Redis error, falling back to in-memory: <error message>
```

#### Rate Limiting Configuration

Current rate limits configured in the application:

| Endpoint | Limit | Window | Key Format |
|----------|-------|--------|-----------|
| 2FA Verification | 5 attempts | 15 minutes | `2fa:{userId}` |
| Login | 10 attempts | 15 minutes | `login:{identifier}` |
| Password Reset | 3 attempts | 1 hour | `password-reset:{identifier}` |
| Email Resend | 3 attempts | 5 minutes | `email-resend:{identifier}` |
| API General | 100 requests | 1 minute | `api:{identifier}` |

**Rate Limit Storage:**
- Redis keys are prefixed with `hyvve:ratelimit:` for namespace isolation
- Keys automatically expire after their window duration
- Uses Upstash sliding window algorithm for accurate tracking

#### Monitoring

**Upstash Console:**
1. Go to your database in Upstash Console
2. Click "Data Browser" to see rate limit keys
3. Monitor metrics: Commands/sec, Memory usage, Hit rate

**Expected Key Patterns:**
```
hyvve:ratelimit:2fa:user-id-123
hyvve:ratelimit:login:user@example.com
hyvve:ratelimit:api:client-ip-address
```

**Memory Usage:**
- Typical rate limit entry: ~100 bytes
- 1000 concurrent users: ~100 KB
- 10,000 concurrent users: ~1 MB

#### Troubleshooting

**Issue: Rate limiting not persisting**
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Check application logs for Redis configuration message
- Test curl command to verify credentials work

**Issue: "Redis error" in logs**
- Check Upstash database status in console
- Verify network connectivity to Upstash
- Check region - ensure low latency (<50ms)

**Issue: 429 errors not appearing**
- Verify rate limiter is being called (check code)
- Check if fallback to in-memory is active
- Verify identifier is consistent across requests

**Issue: Keys not expiring**
- Check Upstash database eviction policy (should be "No Eviction")
- Verify keys have TTL set: `TTL hyvve:ratelimit:2fa:user-123`
- Sliding window algorithm handles expiration automatically

#### Security Considerations

**Token Security:**
- Never commit `UPSTASH_REDIS_REST_TOKEN` to version control
- Store in secure secrets manager (Vercel env vars, AWS Secrets Manager, etc.)
- Rotate tokens periodically (every 90 days recommended)

**Network Security:**
- Upstash uses HTTPS for REST API (TLS 1.3)
- No need for additional encryption layer
- Consider IP allowlisting in Upstash for extra security

**Rate Limit Bypass Prevention:**
- Use consistent identifiers (userId, email, IP)
- Don't rely solely on client-provided identifiers
- Monitor for unusual patterns in Upstash console

#### Cost Management

**Upstash Free Tier:**
- 10,000 commands/day
- 256 MB storage
- Sufficient for small-medium applications

**Typical Usage:**
- 1 rate limit check = 1 command
- 1000 daily active users = ~5,000 commands/day
- Well within free tier for most use cases

**Upgrade Triggers:**
- Exceeding 10,000 commands/day consistently
- Need for global replication
- Need for >256 MB storage

---

## PgBouncer Configuration

### Why PgBouncer?

PostgreSQL Row-Level Security (RLS) requires **session mode** in PgBouncer, not transaction mode.

### Session Mode Requirement

```ini
# pgbouncer.ini
[pgbouncer]
pool_mode = session  # REQUIRED for RLS
max_client_conn = 1000
default_pool_size = 20

[databases]
hyvve = host=your-postgres-host port=5432 dbname=hyvve
```

### Connection String for PgBouncer

```bash
# Connect through PgBouncer
DATABASE_URL="postgresql://user:password@pgbouncer-host:6432/hyvve?schema=public&pgbouncer=true"
```

### Managed Database Considerations

| Provider | PgBouncer | RLS Support |
|----------|-----------|-------------|
| Supabase | Built-in (session mode available) | Full support |
| Neon | Built-in | Full support |
| AWS RDS | Requires separate setup | Full support |
| Railway | No built-in | Full support |

---

## Application Deployment

### Next.js (Frontend)

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Environment Variables for Vercel

Set in Vercel Dashboard or via CLI:
```bash
vercel env add NEXT_PUBLIC_API_URL
vercel env add BETTER_AUTH_SECRET
# ... other variables
```

### NestJS (API)

#### Docker Deployment

```dockerfile
# Dockerfile for API
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @hyvve/api build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
```

### AgentOS (Python)

#### Docker Deployment

```dockerfile
# Dockerfile for AgentOS
FROM python:3.12-slim
WORKDIR /app
COPY apps/agents/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/agents .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Security Checklist

### Before Go-Live

- [ ] **HTTPS Only:** All traffic uses TLS 1.3
- [ ] **Encryption Key:** `ENCRYPTION_MASTER_KEY` is 32+ chars, high entropy
- [ ] **Auth Secret:** `BETTER_AUTH_SECRET` is 32+ chars
- [ ] **Database:** RLS policies verified and enabled
- [ ] **Redis:** Using TLS (`rediss://`) with authentication
- [ ] **Rate Limiting:** Migrated from in-memory to Redis
- [ ] **CSRF:** Protection enabled on state-changing routes
- [ ] **Headers:** Security headers configured (HSTS, CSP, etc.)
- [ ] **Secrets:** No secrets in version control
- [ ] **Logging:** Sensitive data not logged

### Security Headers (nginx/CDN)

```nginx
# Recommended security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

---

## Monitoring & Observability

### Health Checks

```bash
# Frontend health
curl https://your-domain.com/api/health

# API health
curl https://api.your-domain.com/health

# AgentOS health
curl https://agents.your-domain.com/health

# Agent team health checks
curl https://agents.your-domain.com/agents/validation/health
curl https://agents.your-domain.com/agents/planning/health
curl https://agents.your-domain.com/agents/branding/health
```

### Prometheus Metrics Endpoint

HYVVE exposes Prometheus-compatible metrics at `/api/metrics`:

```bash
curl https://api.your-domain.com/api/metrics
```

**Available Metrics:**

| Metric | Type | Description |
|--------|------|-------------|
| `event_bus_throughput_total` | Counter | Total events published to event bus |
| `event_bus_consumer_lag` | Gauge | Consumer lag in events |
| `event_bus_dlq_size` | Gauge | Dead letter queue size |
| `http_request_duration_seconds` | Histogram | HTTP request latency |
| `http_requests_total` | Counter | Total HTTP requests |
| `approval_queue_depth` | Gauge | Approval items by status |
| `ai_provider_health` | Gauge | AI provider health (1=healthy, 0=unhealthy) |
| `active_websocket_connections` | Gauge | Active WebSocket connections |
| `agent_api_requests_total` | Counter | Agent API calls by team |
| `agent_api_rate_limit_hits` | Counter | Rate limit blocks on agent APIs |

### Grafana Dashboard Setup

Import the Prometheus metrics into Grafana:

1. Add Prometheus data source pointing to your metrics endpoint
2. Create dashboards for:
   - Event Bus Health (throughput, lag, DLQ)
   - API Performance (latency percentiles, error rates)
   - Approval Queue Status (depth by status)
   - AI Provider Status (health by provider)
   - Agent API Metrics (requests, rate limits)

### Recommended Monitoring Stack

| Aspect | Tool Options |
|--------|--------------|
| APM | Sentry, Datadog, New Relic |
| Logs | Logflare, Papertrail, CloudWatch |
| Uptime | Betterstack, Pingdom, UptimeRobot |
| Metrics | Prometheus + Grafana |

### Key Metrics to Monitor

- API response times (p50, p95, p99)
- Error rates by endpoint
- Database connection pool utilization
- Redis memory and connection count
- Event bus queue depth
- DLQ (Dead Letter Queue) size
- Agent API rate limit hits
- AI provider health status

### Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| API p99 latency | > 1s | > 3s |
| Error rate | > 1% | > 5% |
| DB connections | > 80% | > 95% |
| DLQ size | > 100 | > 500 |
| Memory usage | > 80% | > 95% |
| Agent rate limit hits | > 50/hr | > 200/hr |
| AI provider health | Any unhealthy | All unhealthy |

### Operational Runbooks

Runbooks are available in `docs/runbooks/`:

| Runbook | Purpose |
|---------|---------|
| `dlq-management.md` | View, retry, and purge failed events |
| `database-recovery.md` | Backup and restore procedures |
| `incident-response.md` | General incident handling |
| `key-rotation.md` | Encryption key rotation |

---

## Troubleshooting Production Issues

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'hyvve';
```

### Redis Connection Issues

```bash
# Test connection
redis-cli -u $REDIS_URL ping
```

### Event Bus Issues

See [Event Bus Runbook](runbooks/event-bus.md) for DLQ management and recovery procedures.

---

*Last updated: 2025-12-13*
*Foundation Phase Complete - Ready for Production Deployment*
