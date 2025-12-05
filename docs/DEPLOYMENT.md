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

### Production Redis Requirements

- **TLS:** Always use `rediss://` protocol in production
- **Authentication:** Require password
- **Persistence:** Enable AOF or RDB for queue durability

### Upstash Configuration (Recommended)

```bash
REDIS_URL="rediss://default:password@your-endpoint.upstash.io:6379"
```

### Rate Limiting Migration

**Important:** The default in-memory rate limiter is NOT production-ready. Migrate to Redis:

```typescript
// Use Redis-based rate limiting in production
// See: apps/web/src/lib/utils/rate-limit.ts
```

### Redis Streams for Event Bus

The event bus uses Redis Streams. Ensure your Redis instance:
- Has sufficient memory for stream data
- Has persistence enabled (data survives restarts)
- Is in the same region as your application

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
```

### Recommended Monitoring

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

### Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| API p99 latency | > 1s | > 3s |
| Error rate | > 1% | > 5% |
| DB connections | > 80% | > 95% |
| DLQ size | > 100 | > 500 |
| Memory usage | > 80% | > 95% |

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

*Last updated: 2025-12-05*
