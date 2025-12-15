# Epic 10 Technical Specification: Platform Hardening

**Epic:** EPIC-10
**Status:** In Progress
**Created:** 2025-12-06
**Stories:** 8
**Points:** 21
**Priority:** P0/P1 - Critical/High

---

## Overview

Epic 10 addresses all P0 critical and P1 high-priority security and infrastructure issues identified during Epic 00-09 retrospectives. This epic transforms the platform from a functional MVP into a production-ready, enterprise-grade system by eliminating known vulnerabilities and ensuring reliable operation at scale.

**Business Value:**
- Eliminates critical security vulnerabilities that could prevent production deployment
- Ensures platform reliability across server restarts and serverless deployments
- Provides enterprise-grade security controls for authentication and authorization
- Establishes operational confidence through validated migrations and hardened error handling

**Technical Scope:**
- Security hardening (rate limiting, encryption validation, CSRF, XSS, race conditions)
- Infrastructure stabilization (Redis migration, database migrations, validation pipeline)
- Trusted device feature resolution (removal or full implementation)

---

## Architecture Context

### Current State

**Rate Limiting (P0 Critical)**
- Two duplicate in-memory rate limiters using Map storage
- Clears on server restart, bypassed in serverless deployments
- Each instance maintains its own rate limit state
- Locations: `apps/web/src/lib/utils/rate-limit.ts`, `apps/web/src/app/api/auth/2fa/verify-login/route.ts`

**Encryption (P0 Critical)**
- `BETTER_AUTH_SECRET` used for JWT signing and session encryption
- No startup validation of key entropy or length
- Weak keys could compromise all session security

**Trusted Device (P0 Critical)**
- Creates cookies during 2FA login but never validates them
- `isTrustedDevice()` function always returns `false`
- Dead code path misleads users who enable "trust this device"

**ValidationPipe (P0 Critical)**
- Global ValidationPipe enabled in NestJS `main.ts` with proper configuration
- DTOs have validation decorators but need verification of end-to-end flow
- Location: `apps/api/src/main.ts`

**Database Migrations (P0 Critical)**
- AgentChatMessage and AgentSession models added in Epic 08
- Migration not yet run against production database
- Multi-tenant isolation needs verification

**CSRF Protection (P1 High)**
- No CSRF token validation on state-changing routes (POST/PUT/DELETE)
- All endpoints currently vulnerable to cross-site request forgery

**XSS Sanitization (P1 High)**
- Current regex-based sanitization can be bypassed
- Location: `apps/web/src/app/api/workspaces/[id]/roles/route.ts`
- Uses `sanitizeInput()` which may not cover all XSS vectors

**Backup Code Race Condition (P1 High)**
- Time window between bcrypt verify and mark-as-used
- Same code could be used twice under high concurrency
- Location: `apps/web/src/app/api/auth/2fa/verify-login/route.ts:86-99`
- Current implementation uses transaction with Serializable isolation but could be optimized

### Target State

**After Epic 10 Completion:**
- ✅ Redis-based distributed rate limiting (Upstash) with in-memory fallback
- ✅ Encryption key validation at startup (fail-fast for production)
- ✅ Trusted device feature either fully implemented OR completely removed
- ✅ ValidationPipe verified and tested end-to-end
- ✅ Database migrations executed and verified with multi-tenant isolation
- ✅ CSRF protection on all state-changing routes
- ✅ DOMPurify-based XSS sanitization with comprehensive test coverage
- ✅ Race condition-free backup code verification with pessimistic locking

---

## Story Technical Specifications

### Story 10.1: Redis Rate Limiting Migration

**Priority:** P0 Critical
**Points:** 3
**Dependencies:** None (can start immediately)

#### Scope

Migrate from in-memory rate limiting to Redis-based distributed rate limiting using Upstash. This ensures rate limits persist across server restarts and work correctly in serverless/multi-instance deployments.

#### Current Implementation Analysis

The codebase already has a unified rate limiter at `apps/web/src/lib/utils/rate-limit.ts` that:
- ✅ Uses `@upstash/ratelimit` package
- ✅ Checks for `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` at module load
- ✅ Falls back to in-memory Map when Redis unavailable
- ✅ Provides helper functions: `checkTwoFactorRateLimit`, `checkLoginRateLimit`, etc.
- ✅ Already used in `verify-login/route.ts`

**Current Code Quality:** Good implementation with proper fallback mechanism.

#### Implementation Approach

1. **Verify Upstash Configuration**
   - Add environment variables to `.env.example`
   - Document Upstash setup in `docs/DEPLOYMENT.md`
   - Verify Redis client initialization

2. **Test in Development**
   - Set up local Upstash Redis instance or use Upstash free tier
   - Verify rate limits persist across server restarts
   - Test fallback behavior when Redis unavailable

3. **Consolidate Duplicate Implementations**
   - The code is already consolidated in single file
   - Remove any duplicate rate limiter references if found

4. **Verify Production Readiness**
   - Test in staging environment
   - Verify rate limit persistence
   - Confirm serverless compatibility

#### Files to Modify/Create

**Existing Files:**
- `apps/web/src/lib/utils/rate-limit.ts` - Already Redis-ready, verify implementation
- `apps/web/src/app/api/auth/2fa/verify-login/route.ts` - Already using unified limiter
- `packages/config/.env.example` - Add Upstash variables

**New Files:**
- `docs/DEPLOYMENT.md` (section) - Upstash Redis setup instructions

#### Configuration

```bash
# .env.example additions
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

#### Code Patterns

The existing implementation is solid. Key patterns to preserve:

```typescript
// Fallback mechanism
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  isRedisConfigured = true
}

// Try Redis first, fall back to in-memory
const limiter = getRatelimiter({ limit, windowSeconds })
if (limiter) {
  try {
    const result = await limiter.limit(key)
    return { isRateLimited: !result.success, ... }
  } catch (error) {
    console.warn('[rate-limit] Redis error, falling back to in-memory:', error)
  }
}
return checkRateLimitInMemory(key, limit, windowSeconds)
```

#### Testing Strategy

- Unit tests for rate limit functionality (already exist)
- Integration tests for Redis connectivity
- Test rate limit persistence across server restarts
- Test fallback to in-memory when Redis unavailable
- Load test to verify distributed rate limiting works across multiple instances

#### Acceptance Criteria Validation

- [ ] AC1: Verify `@upstash/ratelimit` installed (check package.json)
- [ ] AC2: Verify Redis utility exists and is configured
- [ ] AC3: Configure Upstash env vars in deployment guide
- [ ] AC4: Verify `verify-login/route.ts` uses unified limiter
- [ ] AC5: Code already consolidated (verify no duplicates exist)
- [ ] AC6: Fallback implemented and tested
- [ ] AC7: Test rate limit persistence in staging
- [ ] AC8: Update `docs/DEPLOYMENT.md` with Upstash setup

---

### Story 10.2: Encryption Key Validation

**Priority:** P0 Critical
**Points:** 2
**Dependencies:** None

#### Scope

Add startup validation for `BETTER_AUTH_SECRET` to ensure it meets minimum entropy and length requirements before the application starts. This prevents weak keys from being deployed to production.

#### Security Context

`BETTER_AUTH_SECRET` is used for:
- JWT token signing
- Session encryption
- 2FA secret encryption (via `encryptSecret()` and `decryptSecret()`)

Weak keys compromise:
- All user sessions
- 2FA security
- API token validation

#### Implementation Approach

1. **Create Validation Utility**
   - Check key exists
   - Validate minimum length (32 bytes = 64 hex chars)
   - Check entropy (not simple patterns like "aaaa..." or "1234...")
   - Detect dictionary words or common patterns

2. **Entropy Validation Algorithm**
   ```typescript
   // Calculate Shannon entropy
   function calculateEntropy(str: string): number {
     const len = str.length
     const frequencies = new Map<string, number>()

     for (const char of str) {
       frequencies.set(char, (frequencies.get(char) || 0) + 1)
     }

     let entropy = 0
     for (const freq of frequencies.values()) {
       const p = freq / len
       entropy -= p * Math.log2(p)
     }

     return entropy
   }
   ```

3. **Add to Next.js Instrumentation**
   - Use `instrumentation.ts` for startup hooks
   - Available in Next.js 15 App Router
   - Runs before app initialization

4. **Environment-Specific Behavior**
   - Development: Log warning but allow app to start
   - Production: Fail startup with clear error message

#### Files to Modify/Create

**New Files:**
- `apps/web/src/lib/utils/validate-secrets.ts` - Key validation utility
- `apps/web/src/instrumentation.ts` - Startup validation hook

**Existing Files:**
- `packages/config/.env.example` - Update with key generation example

#### Code Implementation

```typescript
// apps/web/src/lib/utils/validate-secrets.ts
export interface SecretValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateBetterAuthSecret(secret: string | undefined): SecretValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check existence
  if (!secret) {
    errors.push('BETTER_AUTH_SECRET is not set')
    return { valid: false, errors, warnings }
  }

  // Check minimum length (32 bytes = 64 hex chars recommended)
  if (secret.length < 32) {
    errors.push(`BETTER_AUTH_SECRET too short (${secret.length} chars, minimum 32)`)
  } else if (secret.length < 64) {
    warnings.push(`BETTER_AUTH_SECRET should be at least 64 characters (currently ${secret.length})`)
  }

  // Check for simple patterns
  if (/^(.)\1+$/.test(secret)) {
    errors.push('BETTER_AUTH_SECRET is a repeating pattern')
  }
  if (/^(012|123|234|345|456|567|678|789|890)+$/.test(secret)) {
    errors.push('BETTER_AUTH_SECRET is a sequential pattern')
  }

  // Check entropy (minimum 4.0 bits per character for 32+ char keys)
  const entropy = calculateEntropy(secret)
  const minEntropy = secret.length >= 64 ? 4.0 : 3.5

  if (entropy < minEntropy) {
    errors.push(`BETTER_AUTH_SECRET has insufficient entropy (${entropy.toFixed(2)}, minimum ${minEntropy})`)
  } else if (entropy < 4.5) {
    warnings.push(`BETTER_AUTH_SECRET entropy could be improved (${entropy.toFixed(2)})`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

function calculateEntropy(str: string): number {
  const len = str.length
  const frequencies = new Map<string, number>()

  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1)
  }

  let entropy = 0
  for (const freq of frequencies.values()) {
    const p = freq / len
    entropy -= p * Math.log2(p)
  }

  return entropy
}
```

```typescript
// apps/web/src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateBetterAuthSecret } = await import('./lib/utils/validate-secrets')

    const result = validateBetterAuthSecret(process.env.BETTER_AUTH_SECRET)

    if (!result.valid) {
      const message = `INVALID BETTER_AUTH_SECRET:\n${result.errors.join('\n')}`

      if (process.env.NODE_ENV === 'production') {
        // Fail startup in production
        console.error(message)
        throw new Error(message)
      } else {
        // Log warning in development
        console.warn(`\n⚠️  ${message}\n`)
      }
    }

    if (result.warnings.length > 0) {
      console.warn(`\n⚠️  BETTER_AUTH_SECRET warnings:\n${result.warnings.join('\n')}\n`)
    }

    if (result.valid && result.warnings.length === 0) {
      console.log('✅ BETTER_AUTH_SECRET validation passed')
    }
  }
}
```

#### Testing Strategy

- Unit tests for `validateBetterAuthSecret()` with various key patterns
- Test weak keys (short, repeating, sequential)
- Test strong keys (random, high entropy)
- Test edge cases (missing key, empty string)
- Integration test for startup behavior in dev vs prod

#### Acceptance Criteria Validation

- [ ] AC1: Utility created and exported
- [ ] AC2: Validates minimum 32 characters
- [ ] AC3: Validates entropy (no simple patterns)
- [ ] AC4: Logs warning in development
- [ ] AC5: Fails startup in production
- [ ] AC6: Added to instrumentation.ts

---

### Story 10.3: Fix Trusted Device Feature

**Priority:** P0 Critical
**Points:** 2
**Dependencies:** None

#### Scope

The trusted device feature currently creates cookies but never validates them, creating a misleading user experience. This story decides between two approaches:
- **Option A:** Implement full database-backed trusted device validation
- **Option B:** Remove feature entirely (recommended for simplicity)

#### Current Implementation Analysis

File: `apps/web/src/lib/trusted-device.ts`

**What Works:**
- ✅ `createTrustedDevice()` - Creates device records in database
- ✅ `setTrustedDeviceCookie()` - Sets HTTP-only cookies
- ✅ Device fingerprinting (User-Agent + IP hash)
- ✅ Token hashing (SHA-256)
- ✅ Database schema exists (`TrustedDevice` model)

**What's Broken:**
- ❌ The feature is actually **FULLY IMPLEMENTED**
- ❌ The tech debt doc is **INCORRECT**

**Actual Status:** Review of `trusted-device.ts` shows:
- `isTrustedDevice()` (lines 145-197) **DOES validate** tokens
- Checks token in cookie, verifies hash in database
- Validates expiry, revocation status
- Verifies fingerprint matches
- Updates last used timestamp

**Root Cause of Confusion:**
The tech debt document claims `isTrustedDevice()` always returns false, but the actual code shows full implementation. Need to verify:
1. Is the function being called?
2. Are there integration issues?
3. Is the UI correctly checking trusted device status?

#### Implementation Approach

**Phase 1: Verify Current Implementation (Recommended)**

1. **Audit Current Usage**
   - Search for `isTrustedDevice()` calls in codebase
   - Verify it's called during 2FA login flow
   - Check if UI correctly displays "trust this device" option

2. **Test End-to-End**
   - Test full flow: enable 2FA → trust device → logout → login
   - Verify device token persists in database
   - Verify cookie is set correctly
   - Verify 2FA is skipped on trusted device

3. **Integration Points**
   ```typescript
   // Check before requiring 2FA
   if (user.twoFactorEnabled) {
     const isTrusted = await isTrustedDevice(request, userId)
     if (isTrusted) {
       // Skip 2FA, allow login
       return NextResponse.json({ success: true, skipTwoFactor: true })
     }
     // Require 2FA
     return NextResponse.json({ success: false, requiresTwoFactor: true })
   }
   ```

**Phase 2: Option A - Complete Full Implementation (If Issues Found)**

Only needed if Phase 1 reveals integration issues.

1. **Add Trusted Device Check to Login Flow**
   - Add check before 2FA requirement
   - Skip 2FA if device is trusted and valid

2. **Add Device Management UI**
   - Page in settings: `/settings/security/devices`
   - List trusted devices with name, last used, IP
   - Revoke individual devices
   - Revoke all devices

3. **Add Automatic Revocation Triggers**
   - On password change → revoke all devices
   - On 2FA disable → revoke all devices
   - On security event → revoke all devices

**Phase 3: Option B - Remove Feature (If Deemed Unnecessary)**

Only if business decides feature is not needed.

1. **Remove Trusted Device Code**
   - Delete `apps/web/src/lib/trusted-device.ts`
   - Remove TrustedDevice model from schema
   - Remove cookie creation from verify-login route
   - Remove "Trust this device" checkbox from UI

2. **Database Cleanup**
   - Create migration to drop `trusted_devices` table
   - Add to rollback procedures

#### Recommendation

**Start with Phase 1 (Verification).** The code review shows the feature IS fully implemented. The tech debt may be outdated or based on incomplete information. Before removing or reimplementing:
1. Verify current functionality
2. Test end-to-end
3. Check if issue is integration rather than implementation

#### Files to Modify/Create

**Phase 1 (Verification):**
- Search all files for `isTrustedDevice()` calls
- Verify integration in login flow

**Phase 2 (Option A - Complete Implementation):**
- `apps/web/src/app/(auth)/sign-in/page.tsx` - Add trusted device check
- `apps/web/src/app/(dashboard)/settings/security/devices/page.tsx` - Device management UI
- `apps/web/src/app/api/auth/devices/route.ts` - Device management API
- `apps/web/src/app/api/auth/sign-in/route.ts` - Add trusted device check

**Phase 3 (Option B - Remove):**
- Delete `apps/web/src/lib/trusted-device.ts`
- `packages/db/prisma/schema.prisma` - Remove TrustedDevice model
- `apps/web/src/app/api/auth/2fa/verify-login/route.ts` - Remove cookie creation
- `apps/web/src/components/auth/two-factor-verify.tsx` - Remove checkbox

#### Testing Strategy

- Manual E2E test: Trust device → logout → login → verify 2FA skipped
- Test device fingerprint changes (different IP)
- Test device expiry (mock system time)
- Test device revocation
- Test device limit enforcement

#### Acceptance Criteria Validation

- [ ] AC1: Audit `isTrustedDevice()` implementation and usage
- [ ] AC2: Decide Option A (full implementation) or Option B (remove)
- [ ] AC3: If Option A: Implement full flow with device management
- [ ] AC3: If Option B: Remove all trusted device code
- [ ] AC4: No misleading UX remains
- [ ] AC5: Update security documentation

---

### Story 10.4: Enable Global ValidationPipe

**Priority:** P0 Critical
**Points:** 1
**Dependencies:** None

#### Scope

Verify that NestJS ValidationPipe is properly configured and test end-to-end validation flow. The configuration appears to already be in place, but needs verification and testing.

#### Current Implementation Analysis

File: `apps/api/src/main.ts` (lines 19-28)

**Current Configuration:**
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // ✅ Strip unknown properties
    forbidNonWhitelisted: true,   // ✅ Reject unknown properties
    transform: true,              // ✅ Auto-transform types
    transformOptions: {
      enableImplicitConversion: true, // ✅ Convert string to number, etc.
    },
  }),
);
```

**Status:** ValidationPipe is **ALREADY ENABLED** with proper configuration.

#### Implementation Approach

This story is primarily **verification and testing**, not implementation.

1. **Verify Configuration**
   - Confirm ValidationPipe is registered globally
   - Confirm all options are set correctly
   - No additional configuration needed

2. **Test with Existing DTOs**
   - Test `ReplayEventsDto` (Epic 05)
   - Test validation decorators work as expected
   - Test error responses match expected format

3. **Add Integration Tests**
   - Test valid input → successful validation
   - Test invalid input → 400 error with validation details
   - Test unknown properties → stripped or rejected
   - Test type transformation

4. **Document Validation Patterns**
   - Create examples for new DTOs
   - Document validation decorator usage
   - Add to development guidelines

#### Files to Modify/Create

**Existing Files (Verification):**
- `apps/api/src/main.ts` - Verify configuration (already correct)
- `apps/api/src/events/dto/replay-events.dto.ts` - Verify decorators

**New Files:**
- `apps/api/src/events/events.integration.spec.ts` - Integration tests for validation
- `docs/DEVELOPMENT.md` (section) - Validation patterns guide

#### Testing Strategy

```typescript
// apps/api/src/events/events.integration.spec.ts
describe('ValidationPipe Integration', () => {
  describe('POST /events/replay', () => {
    it('should accept valid replay options', async () => {
      const response = await request(app.getHttpServer())
        .post('/events/replay')
        .send({
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-02T00:00:00Z',
          eventTypes: ['approval.requested'],
        })
        .expect(200)
    })

    it('should reject invalid date format', async () => {
      const response = await request(app.getHttpServer())
        .post('/events/replay')
        .send({
          startDate: 'invalid-date',
          endDate: '2025-01-02T00:00:00Z',
        })
        .expect(400)

      expect(response.body.message).toContain('startDate')
    })

    it('should strip unknown properties when whitelist=true', async () => {
      const response = await request(app.getHttpServer())
        .post('/events/replay')
        .send({
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-02T00:00:00Z',
          unknownField: 'should-be-stripped',
        })
        .expect(400) // forbidNonWhitelisted should reject
    })

    it('should transform string dates to Date objects', async () => {
      // Test that transform: true works
      const response = await request(app.getHttpServer())
        .post('/events/replay')
        .send({
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-02T00:00:00Z',
        })

      // Controller should receive Date objects, not strings
    })
  })
})
```

#### Example DTO Pattern

```typescript
// Example DTO with validation decorators
import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator'
import { Type } from 'class-transformer'

export class ReplayEventsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventTypes?: string[]
}
```

#### Acceptance Criteria Validation

- [ ] AC1: Verify ValidationPipe in main.ts (already present)
- [ ] AC2: Verify `transform: true` enabled
- [ ] AC3: Verify `whitelist: true` enabled
- [ ] AC4: Verify `forbidNonWhitelisted: true` enabled
- [ ] AC5: Test with ReplayEventsDto
- [ ] AC6: Add integration tests for validation behavior

---

### Story 10.5: Database Migration Verification

**Priority:** P0 Critical
**Points:** 2
**Dependencies:** Requires database access

#### Scope

Verify pending Prisma schema changes can be safely migrated to production database. Focus on AgentChatMessage and AgentSession models added in Epic 08, plus any indexes or constraints added in Epic 06.

#### Current State

**Pending Migrations:**
- `AgentChatMessage` model (Epic 08) - Chat message persistence
- `AgentSession` model (Epic 08) - Agent session tracking
- TokenUsage indexes (Epic 06) - Performance optimization
- Any other schema changes since last migration

**Database Schema File:** `packages/db/prisma/schema.prisma`

#### Implementation Approach

1. **Pre-Migration Checklist**
   - Review all schema changes since last migration
   - Verify no breaking changes to existing models
   - Check for referential integrity
   - Review indexes for performance impact

2. **Development Migration**
   ```bash
   # In development environment
   cd packages/db
   npx prisma migrate dev --name epic-10-verification
   ```

3. **Verify Migration Safety**
   - Check migration SQL for DDL operations
   - Verify no data loss operations (DROP, TRUNCATE)
   - Check for long-running operations (large table indexes)
   - Verify multi-tenant isolation maintained

4. **Test Against Clean Database**
   ```bash
   # Reset database
   npx prisma migrate reset --force

   # Run all migrations from scratch
   npx prisma migrate deploy

   # Verify schema
   npx prisma db pull
   ```

5. **Test Multi-Tenant Isolation**
   ```typescript
   // Create test data for multiple tenants
   const workspace1 = await prisma.workspace.create({ data: { name: 'Tenant 1' } })
   const workspace2 = await prisma.workspace.create({ data: { name: 'Tenant 2' } })

   // Verify AgentChatMessage isolation
   // Verify AgentSession isolation
   // Verify TokenUsage isolation
   ```

6. **Document Migration Steps**
   - Pre-migration backup procedure
   - Migration command
   - Verification steps
   - Rollback procedure

#### Files to Modify/Create

**Existing Files:**
- `packages/db/prisma/schema.prisma` - Review changes (no modifications needed)
- `packages/db/prisma/migrations/` - New migration files generated

**New Files:**
- `docs/MIGRATION-GUIDE-EPIC-10.md` - Migration instructions and rollback

#### Migration Verification Checklist

**Schema Changes to Verify:**

1. **AgentChatMessage Model**
   - Fields: id, sessionId, role, agentId, content, metadata, createdAt
   - Indexes: `[sessionId, createdAt]`
   - Multi-tenant: sessionId links to AgentSession (no direct workspaceId)

2. **AgentSession Model**
   - Fields: id, moduleType, moduleSessionId, currentAgent, workflowStep, status, timestamps
   - Indexes: `[moduleType, moduleSessionId]`, `[status, lastActivityAt]`
   - Multi-tenant: moduleSessionId links to tenant-scoped sessions

3. **TokenUsage Indexes** (Epic 06)
   - Added: `[providerId, requestedAt]`
   - Added: `[workspaceId, requestedAt]`
   - Performance: Composite indexes for time-based queries

**RLS Policies to Verify:**
- Check if new models need RLS policies
- AgentChatMessage: No direct tenant field → verify via session chain
- AgentSession: Verify tenant isolation through moduleSessionId

#### Testing Strategy

**Test 1: Clean Migration**
```bash
# Start with empty database
dropdb hyvve_test
createdb hyvve_test

# Run all migrations
cd packages/db
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Verify success
npx prisma db pull
```

**Test 2: Multi-Tenant Isolation**
```typescript
// Test tenant isolation for new models
describe('Multi-Tenant Isolation - Epic 10 Models', () => {
  it('should isolate AgentChatMessage by tenant', async () => {
    // Create data for tenant 1
    const session1 = await createAgentSession(workspace1.id)
    const message1 = await prisma.agentChatMessage.create({
      data: { sessionId: session1.id, role: 'USER', content: 'Test' }
    })

    // Create data for tenant 2
    const session2 = await createAgentSession(workspace2.id)
    const message2 = await prisma.agentChatMessage.create({
      data: { sessionId: session2.id, role: 'USER', content: 'Test' }
    })

    // Verify tenant 1 cannot see tenant 2's messages
    // (Test through API with tenant context)
  })
})
```

**Test 3: Index Performance**
```sql
-- Verify indexes exist
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('agent_chat_messages', 'agent_sessions', 'token_usage');

-- Verify query plan uses indexes
EXPLAIN ANALYZE
SELECT * FROM token_usage
WHERE workspace_id = 'xxx' AND requested_at > NOW() - INTERVAL '30 days';
```

#### Migration Guide Template

```markdown
# Epic 10 Migration Guide

## Pre-Migration Checklist

- [ ] Backup production database
- [ ] Verify backup can be restored
- [ ] Schedule maintenance window
- [ ] Notify stakeholders

## Migration Steps

1. **Backup Database**
   ```bash
   pg_dump -Fc hyvve_prod > backup_$(date +%Y%m%d_%H%M%S).dump
   ```

2. **Run Migration**
   ```bash
   cd packages/db
   npx prisma migrate deploy
   ```

3. **Verify Migration**
   ```bash
   npx prisma db pull
   # Check generated schema matches expected
   ```

4. **Test Application**
   - Verify agent chat persistence works
   - Verify token usage queries perform well
   - Test multi-tenant isolation

## Rollback Procedure

If issues occur:

1. **Stop application servers**
2. **Restore database from backup**
   ```bash
   pg_restore -d hyvve_prod backup_YYYYMMDD_HHMMSS.dump
   ```
3. **Revert to previous application version**

## Post-Migration

- [ ] Monitor application logs
- [ ] Check database performance metrics
- [ ] Verify multi-tenant isolation
- [ ] Update schema documentation
```

#### Acceptance Criteria Validation

- [ ] AC1: Run `npx prisma migrate dev` in development
- [ ] AC2: Verify AgentChatMessage model migrated correctly
- [ ] AC3: Verify AgentSession model migrated correctly
- [ ] AC4: Verify all indexes created (check with `\d+ table_name`)
- [ ] AC5: Test migration against clean database (reset + migrate)
- [ ] AC6: Test multi-tenant isolation with new models
- [ ] AC7: Document migration steps in `docs/MIGRATION-GUIDE-EPIC-10.md`

---

### Story 10.6: CSRF Protection

**Priority:** P1 High
**Points:** 3
**Dependencies:** None

#### Scope

Implement CSRF (Cross-Site Request Forgery) protection on all state-changing routes (POST, PUT, DELETE, PATCH). This prevents attackers from tricking users into making unwanted requests to the application.

#### Current State

- No CSRF token validation on any routes
- All POST/PUT/DELETE endpoints vulnerable
- Next.js Server Actions (if used) have built-in CSRF protection

#### CSRF Attack Scenario

```html
<!-- Attacker's malicious website -->
<form action="https://hyvve.com/api/workspaces/xxx/delete" method="POST">
  <input type="hidden" name="confirm" value="true" />
  <input type="submit" value="Win a Prize!" />
</form>
```

If user is logged into HYVVE and clicks "Win a Prize", their workspace gets deleted.

#### Implementation Approach

**Option 1: Next.js Middleware + Token Validation (Recommended)**

1. **Generate CSRF Token on Session Creation**
   - Add `csrfToken` to session data
   - Store in encrypted cookie

2. **Create CSRF Middleware**
   - Validate token on POST/PUT/DELETE/PATCH requests
   - Skip validation for:
     - GET/HEAD/OPTIONS (safe methods)
     - API routes explicitly marked as public
     - Webhook endpoints with signature validation

3. **Include Token in Requests**
   - Add hidden form field for regular forms
   - Add header for AJAX/fetch requests
   - Provide utility function for client-side

**Option 2: Server Actions (If Migrating from API Routes)**

Next.js Server Actions have built-in CSRF protection. Consider migrating to Server Actions for new features.

#### Files to Modify/Create

**New Files:**
- `apps/web/src/lib/csrf.ts` - CSRF token generation and validation
- `apps/web/src/middleware.ts` - CSRF middleware (or modify existing)
- `apps/web/src/lib/api-client.ts` - Update fetch wrapper to include token

**Existing Files:**
- `apps/web/src/app/api/**` - Add CSRF validation to routes

#### Code Implementation

```typescript
// apps/web/src/lib/csrf.ts
import crypto from 'crypto'

const CSRF_TOKEN_LENGTH = 32
const CSRF_SECRET_LENGTH = 32

/**
 * Generate a CSRF token
 * Token = HMAC(secret, session_id)
 */
export function generateCSRFToken(secret: string, sessionId: string): string {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(sessionId)
  return hmac.digest('hex')
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(
  token: string,
  secret: string,
  sessionId: string
): boolean {
  const expected = generateCSRFToken(secret, sessionId)
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(expected, 'hex')
  )
}

/**
 * Get CSRF secret from environment or generate new one
 */
export function getCSRFSecret(): string {
  const secret = process.env.CSRF_SECRET
  if (!secret) {
    throw new Error('CSRF_SECRET not configured')
  }
  return secret
}
```

```typescript
// apps/web/src/middleware.ts (add CSRF check)
import { NextRequest, NextResponse } from 'next/server'
import { verifyCSRFToken, getCSRFSecret } from './lib/csrf'

export async function middleware(request: NextRequest) {
  const { pathname, method } = request.nextUrl

  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return NextResponse.next()
  }

  // Skip CSRF check for public routes
  const publicRoutes = ['/api/auth/callback', '/api/webhooks']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Get session ID (from better-auth session)
  const sessionToken = request.cookies.get('better-auth.session_token')?.value
  if (!sessionToken) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'No session' } },
      { status: 401 }
    )
  }

  // Get CSRF token from header or body
  const csrfToken =
    request.headers.get('x-csrf-token') ||
    request.headers.get('x-xsrf-token')

  if (!csrfToken) {
    return NextResponse.json(
      { error: { code: 'CSRF_TOKEN_MISSING', message: 'CSRF token required' } },
      { status: 403 }
    )
  }

  // Verify token
  const secret = getCSRFSecret()
  const valid = verifyCSRFToken(csrfToken, secret, sessionToken)

  if (!valid) {
    return NextResponse.json(
      { error: { code: 'CSRF_TOKEN_INVALID', message: 'Invalid CSRF token' } },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}
```

```typescript
// apps/web/src/lib/api-client.ts
// Update fetch wrapper to include CSRF token
export async function apiClient(url: string, options: RequestInit = {}) {
  // Get CSRF token from page meta tag or cookie
  const csrfToken = getCSRFToken()

  const headers = new Headers(options.headers)
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken)
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

function getCSRFToken(): string | null {
  // Check meta tag
  const meta = document.querySelector('meta[name="csrf-token"]')
  if (meta) {
    return meta.getAttribute('content')
  }

  // Check cookie
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))

  return cookie ? cookie.split('=')[1] : null
}
```

```typescript
// In page component - provide CSRF token to client
export default async function Layout({ children }) {
  const session = await getSession()
  const csrfToken = session ? generateCSRFToken(getCSRFSecret(), session.id) : null

  return (
    <html>
      <head>
        {csrfToken && <meta name="csrf-token" content={csrfToken} />}
      </head>
      <body>{children}</body>
    </html>
  )
}
```

#### Additional Security Measures

**SameSite Cookie Attribute:**
```typescript
// Set session cookie with SameSite=Strict or Lax
response.cookies.set('session_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict', // or 'lax'
})
```

**Origin/Referer Header Check:**
```typescript
// Additional defense layer
function verifyOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL

  return origin === allowedOrigin || referer?.startsWith(allowedOrigin)
}
```

#### Testing Strategy

```typescript
describe('CSRF Protection', () => {
  it('should reject POST without CSRF token', async () => {
    const response = await request(app)
      .post('/api/workspaces')
      .send({ name: 'Test' })
      .expect(403)

    expect(response.body.error.code).toBe('CSRF_TOKEN_MISSING')
  })

  it('should reject POST with invalid CSRF token', async () => {
    const response = await request(app)
      .post('/api/workspaces')
      .set('X-CSRF-Token', 'invalid-token')
      .send({ name: 'Test' })
      .expect(403)

    expect(response.body.error.code).toBe('CSRF_TOKEN_INVALID')
  })

  it('should accept POST with valid CSRF token', async () => {
    const session = await createTestSession()
    const token = generateCSRFToken(getCSRFSecret(), session.id)

    const response = await request(app)
      .post('/api/workspaces')
      .set('X-CSRF-Token', token)
      .set('Cookie', `session_token=${session.token}`)
      .send({ name: 'Test' })
      .expect(201)
  })

  it('should allow GET requests without CSRF token', async () => {
    await request(app)
      .get('/api/workspaces')
      .expect(200)
  })
})
```

#### Acceptance Criteria Validation

- [ ] AC1: Evaluate Server Actions CSRF protection (if applicable)
- [ ] AC2: Implement CSRF middleware for API routes
- [ ] AC3: Generate CSRF token on session creation
- [ ] AC4: Include token in forms and AJAX requests
- [ ] AC5: Validate token on POST/PUT/DELETE endpoints
- [ ] AC6: Reject requests with missing/invalid tokens (403)
- [ ] AC7: Update API client to include CSRF token

---

### Story 10.7: XSS Sanitization Hardening

**Priority:** P1 High
**Points:** 2
**Dependencies:** None

#### Scope

Replace regex-based XSS sanitization with DOMPurify for robust HTML sanitization. Current implementation at `apps/web/src/app/api/workspaces/[id]/roles/route.ts` uses `sanitizeInput()` which may not cover all XSS vectors.

#### XSS Attack Vectors

**Common XSS Payloads:**
- Event handlers: `<img src=x onerror=alert(1)>`
- Data URIs: `<a href="data:text/html,<script>alert(1)</script>">Click</a>`
- SVG: `<svg onload=alert(1)>`
- JavaScript protocol: `<a href="javascript:alert(1)">Click</a>`
- Base64 encoding: Various encoded forms of above
- Unicode escaping: `\u003cscript\u003e`

#### Current Implementation

File: `apps/web/src/app/api/workspaces/[id]/roles/route.ts`

Uses `sanitizeInput()` from `@/lib/utils/sanitize` (line 20).

#### Implementation Approach

1. **Install DOMPurify**
   ```bash
   cd apps/web
   pnpm add isomorphic-dompurify
   ```

2. **Create Sanitization Utility**
   - Support both Node.js and browser environments
   - Configure DOMPurify for different contexts (HTML, text)
   - Provide strict and permissive modes

3. **Replace Existing Sanitization**
   - Update custom role creation route
   - Audit all user-generated content inputs
   - Apply to chat messages, workspace names, descriptions, etc.

4. **Add Comprehensive Tests**
   - Test all known XSS vectors
   - Test edge cases (nested HTML, malformed tags)
   - Test performance with large inputs

#### Files to Modify/Create

**New Files:**
- `apps/web/src/lib/utils/sanitize.ts` - DOMPurify-based sanitization

**Existing Files:**
- `apps/web/src/app/api/workspaces/[id]/roles/route.ts` - Update to use new sanitizer
- `apps/web/src/components/chat/ChatMessage.tsx` - Audit message rendering

**Search for all user-generated content:**
```bash
grep -r "dangerouslySetInnerHTML" apps/web/src/
grep -r "sanitize" apps/web/src/
```

#### Code Implementation

```typescript
// apps/web/src/lib/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export interface SanitizeOptions {
  /**
   * Allow safe HTML tags (for rich text)
   * Default: false (strip all HTML)
   */
  allowHtml?: boolean

  /**
   * Allowed HTML tags when allowHtml=true
   * Default: ['b', 'i', 'em', 'strong', 'a', 'p', 'br']
   */
  allowedTags?: string[]

  /**
   * Allowed HTML attributes
   * Default: ['href', 'title']
   */
  allowedAttributes?: string[]

  /**
   * Maximum length (truncate after sanitization)
   */
  maxLength?: number
}

/**
 * Sanitize user input using DOMPurify
 * Removes all dangerous HTML/JavaScript by default
 *
 * @param input - User input to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string safe for display
 */
export function sanitize(
  input: string | null | undefined,
  options: SanitizeOptions = {}
): string {
  if (!input) return ''

  const {
    allowHtml = false,
    allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes = ['href', 'title'],
    maxLength,
  } = options

  let sanitized: string

  if (allowHtml) {
    // Allow safe HTML tags (for rich text content)
    sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttributes,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    })
  } else {
    // Strip all HTML (plain text only)
    sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    })
  }

  // Trim whitespace
  sanitized = sanitized.trim()

  // Apply max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength)
  }

  return sanitized
}

/**
 * Sanitize plain text (strip all HTML)
 * Use for: workspace names, role names, descriptions, etc.
 */
export function sanitizeText(input: string | null | undefined): string {
  return sanitize(input, { allowHtml: false })
}

/**
 * Sanitize rich text (allow safe HTML)
 * Use for: chat messages, comments, descriptions with formatting
 */
export function sanitizeHtml(input: string | null | undefined): string {
  return sanitize(input, { allowHtml: true })
}

/**
 * Sanitize URL (prevent javascript: protocol)
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null

  const sanitized = sanitize(url, { allowHtml: false })

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:']
  const lowerUrl = sanitized.toLowerCase()

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return null // Reject dangerous URL
    }
  }

  return sanitized
}

/**
 * Legacy compatibility - replace old sanitizeInput
 */
export function sanitizeInput(input: string): string {
  return sanitizeText(input)
}
```

#### Usage Examples

```typescript
// Custom role creation (apps/web/src/app/api/workspaces/[id]/roles/route.ts)
import { sanitizeText } from '@/lib/utils/sanitize'

const CreateCustomRoleSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(50)
    .trim()
    .transform(sanitizeText), // Use DOMPurify

  description: z
    .string()
    .max(200)
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
})

// Chat message rendering (apps/web/src/components/chat/ChatMessage.tsx)
import { sanitizeHtml } from '@/lib/utils/sanitize'

export function ChatMessage({ content }: { content: string }) {
  const sanitized = sanitizeHtml(content)

  return (
    <div
      className="message-content"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
```

#### Testing Strategy

```typescript
// apps/web/src/lib/utils/sanitize.test.ts
import { sanitize, sanitizeText, sanitizeHtml, sanitizeUrl } from './sanitize'

describe('sanitize', () => {
  describe('XSS Attack Vectors', () => {
    const xssPayloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<iframe src="javascript:alert(1)">',
      '<body onload=alert(1)>',
      '<input onfocus=alert(1) autofocus>',
      '<select onfocus=alert(1) autofocus>',
      '<textarea onfocus=alert(1) autofocus>',
      '<marquee onstart=alert(1)>',
      '<details open ontoggle=alert(1)>',
      '<a href="javascript:alert(1)">click</a>',
      '<a href="data:text/html,<script>alert(1)</script>">click</a>',
      '<<SCRIPT>alert(1);//<</SCRIPT>',
      '<script>alert(String.fromCharCode(88,83,83))</script>',
      '\u003cscript\u003ealert(1)\u003c/script\u003e',
    ]

    test.each(xssPayloads)('should neutralize: %s', (payload) => {
      const result = sanitizeText(payload)

      // Should not contain script tags
      expect(result.toLowerCase()).not.toContain('<script')
      expect(result.toLowerCase()).not.toContain('onerror')
      expect(result.toLowerCase()).not.toContain('onload')
      expect(result.toLowerCase()).not.toContain('javascript:')
    })
  })

  describe('sanitizeText', () => {
    it('should strip all HTML tags', () => {
      const input = '<b>Hello</b> <i>World</i>'
      const result = sanitizeText(input)
      expect(result).toBe('Hello World')
    })

    it('should preserve plain text', () => {
      const input = 'Hello World'
      const result = sanitizeText(input)
      expect(result).toBe('Hello World')
    })

    it('should handle null/undefined', () => {
      expect(sanitizeText(null)).toBe('')
      expect(sanitizeText(undefined)).toBe('')
    })
  })

  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<b>Bold</b> and <i>italic</i>'
      const result = sanitizeHtml(input)
      expect(result).toContain('<b>')
      expect(result).toContain('<i>')
    })

    it('should remove dangerous tags', () => {
      const input = '<b>Safe</b> <script>alert(1)</script>'
      const result = sanitizeHtml(input)
      expect(result).toContain('<b>')
      expect(result).not.toContain('<script')
    })

    it('should remove event handlers', () => {
      const input = '<a href="#" onclick="alert(1)">Link</a>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('onclick')
    })
  })

  describe('sanitizeUrl', () => {
    it('should allow http/https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
    })

    it('should reject javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
    })

    it('should reject data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long inputs', () => {
      const longInput = 'a'.repeat(100000)
      const result = sanitize(longInput, { maxLength: 1000 })
      expect(result.length).toBe(1000)
    })

    it('should handle nested HTML', () => {
      const input = '<div><div><div><script>alert(1)</script></div></div></div>'
      const result = sanitizeText(input)
      expect(result).not.toContain('<script')
    })

    it('should handle malformed HTML', () => {
      const input = '<b>Unclosed tag'
      const result = sanitizeHtml(input)
      // DOMPurify should fix it
      expect(result).toContain('<b>')
    })
  })
})
```

#### Audit Checklist

Audit all locations where user-generated content is rendered:

- [ ] Custom role names and descriptions
- [ ] Workspace names and descriptions
- [ ] Chat messages (ChatPanel, agent responses)
- [ ] User profile names and bios
- [ ] Business names and descriptions
- [ ] Invitation emails (name injection)
- [ ] API error messages with user input
- [ ] Search query display
- [ ] File upload names

#### Acceptance Criteria Validation

- [ ] AC1: Install `isomorphic-dompurify`
- [ ] AC2: Create sanitization utility with text/HTML modes
- [ ] AC3: Replace sanitization in custom roles route
- [ ] AC4: Apply to all user-generated content inputs
- [ ] AC5: Add unit tests for XSS edge cases
- [ ] AC6: Audit chat message rendering

---

### Story 10.8: Backup Code Race Condition Fix

**Priority:** P1 High
**Points:** 3
**Dependencies:** None

#### Scope

Fix potential race condition in backup code verification where the same code could theoretically be used twice under high concurrency. Current implementation uses Serializable transaction, but can be optimized with pessimistic locking.

#### Current Implementation Analysis

File: `apps/web/src/app/api/auth/2fa/verify-login/route.ts` (lines 83-115)

**Current Approach:**
```typescript
isValid = await prisma.$transaction(
  async (tx) => {
    const backupCodes = await tx.backupCode.findMany({
      where: { userId, used: false }
    })

    for (const backupCode of backupCodes) {
      if (await verifyBackupCode(code, backupCode.code)) {
        const updated = await tx.backupCode.updateMany({
          where: { id: backupCode.id, used: false },
          data: { used: true, usedAt: new Date() }
        })
        return updated.count > 0
      }
    }
    return false
  },
  { isolationLevel: 'Serializable', timeout: 10000 }
)
```

**Strengths:**
- ✅ Uses Serializable isolation level
- ✅ Optimistic concurrency check (`where: { used: false }`)
- ✅ Returns false if code already marked as used
- ✅ 10-second timeout for bcrypt operations

**Potential Issues:**
- Under extreme concurrency, Serializable transactions may retry/fail
- N+1 bcrypt comparison (all codes checked sequentially)
- Could be optimized with better query strategy

#### Race Condition Scenario

```
Time    Request 1                   Request 2
----    ---------                   ---------
T0      Begin transaction
T1      Find unused codes           Begin transaction
T2      bcrypt verify (slow)        Find unused codes
T3      bcrypt verify (slow)        bcrypt verify (slow)
T4      Mark code as used           bcrypt verify matches!
T5      Commit                      Mark code as used (fails with Serializable)
```

With Serializable isolation, Request 2 will abort with serialization failure.

#### Implementation Approach

**Option 1: Current Implementation is Sufficient (Recommended)**

The existing Serializable transaction with optimistic check is actually robust:
- Serializable isolation prevents concurrent writes
- `updateMany` with `where: { used: false }` provides additional safety
- Transaction will abort if used status changed

**Recommendation:** Keep current implementation, add monitoring and tests.

**Option 2: Pessimistic Locking with SELECT FOR UPDATE**

If Option 1 shows issues under load, upgrade to pessimistic locking:

```typescript
isValid = await prisma.$transaction(async (tx) => {
  // Lock the specific code row before checking
  const backupCode = await tx.$queryRaw`
    SELECT * FROM backup_codes
    WHERE user_id = ${userId}
      AND code = ${codeHash}
      AND used = false
    FOR UPDATE
    LIMIT 1
  `

  if (!backupCode) return false

  // bcrypt verify
  if (await verifyBackupCode(code, backupCode.code)) {
    await tx.backupCode.update({
      where: { id: backupCode.id },
      data: { used: true, usedAt: new Date() }
    })
    return true
  }

  return false
})
```

**Option 3: Hybrid Approach with Hash-Based Lookup**

Optimize by hashing input code first, then locking specific row:

```typescript
// Hash the input code first (outside transaction)
const codeHash = await hashBackupCode(code.toUpperCase())

isValid = await prisma.$transaction(async (tx) => {
  // Find and lock specific code by hash
  const backupCode = await tx.backupCode.findFirst({
    where: {
      userId,
      code: codeHash, // Assuming codes are hashed
      used: false
    }
  })

  if (!backupCode) return false

  // Mark as used immediately (no bcrypt needed if already hashed)
  const updated = await tx.backupCode.updateMany({
    where: {
      id: backupCode.id,
      used: false // Optimistic check
    },
    data: { used: true, usedAt: new Date() }
  })

  return updated.count > 0
})
```

#### Recommended Implementation

**Phase 1: Enhance Current Implementation**

1. **Add Monitoring**
   - Log serialization failures
   - Track concurrent backup code usage attempts
   - Monitor transaction retry rates

2. **Add Concurrency Tests**
   - Simulate 10+ concurrent requests with same code
   - Verify only one succeeds
   - Verify proper error messages

3. **Add Audit Logging**
   - Log all backup code usage attempts
   - Log failed attempts with code pattern (first 2 chars)
   - Security monitoring for suspicious patterns

**Phase 2: Optimize if Needed (Only if monitoring shows issues)**

Implement Option 3 (hybrid approach) if:
- Transaction timeouts occur frequently
- Serialization failures impact UX
- Load tests show performance issues

#### Files to Modify

**Existing Files:**
- `apps/web/src/app/api/auth/2fa/verify-login/route.ts` - Add monitoring
- `apps/web/src/lib/two-factor.ts` - Review bcrypt usage

**New Files:**
- `apps/web/src/lib/monitoring/backup-code-usage.ts` - Usage monitoring
- Integration test for concurrency

#### Code Implementation (Phase 1)

```typescript
// Enhanced version with monitoring
import { trackEvent } from '@/lib/monitoring'

isValid = await prisma.$transaction(
  async (tx) => {
    const startTime = Date.now()

    try {
      const backupCodes = await tx.backupCode.findMany({
        where: { userId, used: false }
      })

      // Track attempt
      trackEvent('backup_code_verification_started', {
        userId,
        codesAvailable: backupCodes.length,
      })

      for (const backupCode of backupCodes) {
        if (await verifyBackupCode(code.toUpperCase(), backupCode.code)) {
          const updated = await tx.backupCode.updateMany({
            where: { id: backupCode.id, used: false },
            data: { used: true, usedAt: new Date() }
          })

          const duration = Date.now() - startTime

          if (updated.count > 0) {
            trackEvent('backup_code_used_successfully', {
              userId,
              duration,
            })
            return true
          } else {
            // Code was used between check and update (race condition detected!)
            trackEvent('backup_code_race_condition_detected', {
              userId,
              codeId: backupCode.id,
              duration,
            })
            return false
          }
        }
      }

      trackEvent('backup_code_invalid', {
        userId,
        duration: Date.now() - startTime,
      })
      return false

    } catch (error) {
      trackEvent('backup_code_transaction_error', {
        userId,
        error: error.message,
        duration: Date.now() - startTime,
      })
      throw error
    }
  },
  {
    isolationLevel: 'Serializable',
    timeout: 10000
  }
)
```

#### Testing Strategy

**Concurrency Test:**
```typescript
// apps/web/src/app/api/auth/2fa/__tests__/race-condition.test.ts
describe('Backup Code Race Condition', () => {
  it('should prevent same code being used twice concurrently', async () => {
    const user = await createTestUser({ twoFactorEnabled: true })
    const backupCode = await createTestBackupCode(user.id)

    // Make 10 concurrent requests with same code
    const requests = Array(10).fill(null).map(() =>
      request(app)
        .post('/api/auth/2fa/verify-login')
        .send({
          userId: user.id,
          code: backupCode.plainText,
          isBackupCode: true,
        })
    )

    const responses = await Promise.all(requests)

    // Only ONE should succeed
    const successCount = responses.filter(r => r.status === 200).length
    expect(successCount).toBe(1)

    // Others should fail
    const failCount = responses.filter(r => r.status === 400).length
    expect(failCount).toBe(9)

    // Verify code marked as used in database
    const codeInDb = await prisma.backupCode.findFirst({
      where: { code: backupCode.hashed }
    })
    expect(codeInDb.used).toBe(true)
    expect(codeInDb.usedAt).toBeTruthy()
  })

  it('should handle serialization failures gracefully', async () => {
    // Test that Serializable transactions abort properly
    // Mock database to force serialization failure
  })
})
```

**Performance Test:**
```typescript
// Load test for backup code verification
describe('Backup Code Performance', () => {
  it('should complete verification within 5 seconds under load', async () => {
    const user = await createTestUser({ twoFactorEnabled: true })
    await createTestBackupCodes(user.id, 10) // Create 10 codes

    const startTime = Date.now()

    // 100 concurrent requests with different codes
    const requests = Array(100).fill(null).map((_, i) => {
      const codeIndex = i % 10 // Rotate through codes
      return verifyBackupCode(user.id, testCodes[codeIndex])
    })

    await Promise.all(requests)

    const duration = Date.now() - startTime
    expect(duration).toBeLessThan(5000)
  })
})
```

#### Acceptance Criteria Validation

- [ ] AC1: Review current implementation (Serializable transaction)
- [ ] AC2: Decide: Keep current OR implement pessimistic locking
- [ ] AC3: Alternative: Implement optimistic concurrency with version
- [ ] AC4: Add concurrency test (10+ concurrent requests, same code)
- [ ] AC5: Verify only one request succeeds
- [ ] AC6: Add monitoring for duplicate usage attempts

---

## Cross-Cutting Concerns

### Security Considerations

**Defense in Depth:**
- Multiple layers of security (CSRF + XSS + rate limiting)
- Fail-secure defaults (reject on error)
- Secure-by-default configuration

**Encryption Standards:**
- AES-256 for API keys (Epic 06)
- SHA-256 for device tokens
- bcrypt for backup codes
- Minimum 32-byte entropy for secrets

**Rate Limiting Strategy:**
- 2FA: 5 attempts / 15 minutes
- Login: 10 attempts / 15 minutes
- Password reset: 3 attempts / hour
- API: 100 requests / minute

**Token Security:**
- HTTP-only cookies
- SameSite=Strict/Lax
- Secure flag in production
- CSRF tokens for state changes

### Testing Strategy

**Unit Tests:**
- Encryption key validation edge cases
- XSS payload neutralization
- Rate limiter behavior
- CSRF token generation/verification

**Integration Tests:**
- Redis connectivity and fallback
- Database migration end-to-end
- ValidationPipe with actual DTOs
- Multi-tenant isolation verification

**Concurrency Tests:**
- Backup code race conditions
- Rate limiting under load
- Database transaction serialization

**Security Tests:**
- XSS attack vectors
- CSRF bypass attempts
- Rate limit evasion
- SQL injection (via validation bypass)

### Migration Strategy

**Pre-Deployment Checklist:**
1. All tests passing (unit, integration, E2E)
2. Redis/Upstash configured in staging
3. Database migration tested in staging
4. Encryption keys validated
5. Security audit completed

**Deployment Order:**
1. Database migrations (during maintenance window)
2. Backend deployment (NestJS + Redis config)
3. Frontend deployment (CSRF tokens + sanitization)
4. Verification smoke tests
5. Monitor error rates for 24 hours

**Rollback Plan:**
- Database: Restore from pre-migration backup
- Code: Revert to previous Git tag
- Redis: Clear rate limit keys (no data loss)
- CSRF: Disable middleware temporarily

**Monitoring:**
- Rate limit rejections (should be minimal)
- CSRF token failures (investigate if > 0.1%)
- XSS sanitization (log stripped content)
- Database migration errors (should be zero)
- Backup code race conditions (track via events)

### Performance Considerations

**Rate Limiting:**
- Redis: ~1ms latency (Upstash)
- In-memory: <0.1ms latency
- Negligible performance impact

**CSRF Validation:**
- Token generation: ~1ms (HMAC)
- Token verification: ~1ms (constant-time compare)
- Added to every POST/PUT/DELETE

**XSS Sanitization:**
- DOMPurify: ~1-5ms for typical inputs
- Cached on client for display
- May add latency to API responses

**Database Migrations:**
- AgentChatMessage: Minimal impact (new table)
- AgentSession: Minimal impact (new table)
- Indexes: May take 30-60 seconds for large tables
- Run during maintenance window

---

## Acceptance Criteria Validation

### Epic-Level Acceptance Criteria

- [ ] **All P0 critical issues resolved:**
  - [ ] Redis rate limiting in production
  - [ ] Encryption keys validated at startup
  - [ ] Trusted device feature resolved (implemented or removed)
  - [ ] ValidationPipe enabled and tested
  - [ ] Database migrations verified

- [ ] **Rate limiting distributed via Redis:**
  - [ ] Upstash Redis configured
  - [ ] In-memory fallback works
  - [ ] Rate limits persist across restarts (staging test)

- [ ] **Encryption keys validated at startup:**
  - [ ] Minimum 32-byte length enforced
  - [ ] Entropy validation (no simple patterns)
  - [ ] Production fails fast on weak keys

- [ ] **CSRF protection enabled:**
  - [ ] Tokens generated on session creation
  - [ ] Middleware validates all POST/PUT/DELETE
  - [ ] Client includes tokens in requests

- [ ] **Database migrations verified:**
  - [ ] Migrations run successfully
  - [ ] Multi-tenant isolation tested
  - [ ] Rollback procedure documented

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Redis Upstash unavailable** | Low | Medium | In-memory fallback, monitoring alerts |
| **Database migration failure** | Low | High | Pre-migration backup, rollback plan, staging test |
| **CSRF breaks existing clients** | Medium | Medium | Phased rollout, monitoring, disable middleware if needed |
| **XSS sanitization too aggressive** | Low | Medium | Extensive testing, permissive mode for rich text |
| **Backup code race condition** | Low | High | Serializable transaction, concurrency tests, monitoring |
| **Encryption validation breaks dev** | Medium | Low | Warning in dev, only fail in production |
| **Performance degradation** | Low | Medium | Load testing, caching, Redis optimization |
| **User friction from security** | Medium | Low | Clear error messages, user education |

---

## Dependencies Between Stories

**No Hard Dependencies:**
All stories can be worked on in parallel.

**Recommended Order:**
1. **10.5 Database Migrations** - Foundation for other work
2. **10.1 Redis Rate Limiting** - Critical infrastructure
3. **10.2 Encryption Validation** - Quick win
4. **10.4 ValidationPipe** - Verification only
5. **10.3 Trusted Device** - Requires investigation first
6. **10.6 CSRF Protection** - Cross-cutting concern
7. **10.7 XSS Sanitization** - Cross-cutting concern
8. **10.8 Backup Code Race** - Enhancement to existing

**Integration Points:**
- Stories 10.6 and 10.7 both affect API response handling
- Stories 10.1 and 10.8 both involve transaction handling
- All stories require integration testing together

---

## Definition of Done

Each story is considered complete when:
- [ ] Code implemented and reviewed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Tested in staging environment
- [ ] Performance benchmarked
- [ ] Monitoring added
- [ ] Deployment runbook created

Epic is complete when:
- [ ] All 8 stories complete
- [ ] All P0 critical issues resolved
- [ ] Security audit of full epic
- [ ] Load testing completed
- [ ] Migration guide finalized
- [ ] Production deployment successful
- [ ] 24-hour post-deployment monitoring clean

---

_Generated for Epic 10: Platform Hardening_
_Date: 2025-12-06_
_Author: BMAD Planning Workflow_
