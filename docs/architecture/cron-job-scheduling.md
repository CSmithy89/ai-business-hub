# Cron Job Scheduling Strategy

## Overview

HYVVE uses `@nestjs/schedule` with `node-cron` for scheduled tasks. All cron jobs use Redis-based distributed locking to prevent duplicate execution across multiple API instances.

## Active Cron Jobs

| Job | Schedule | Lock TTL | Purpose |
|-----|----------|----------|---------|
| Health Checks | Every 15 minutes | 14 min | Run project health assessments |
| Scheduled Reports | Daily at midnight | 23 hours | Generate scheduled reports |
| Checkpoint Reminders | Daily at 8 AM | 23 hours | Send phase checkpoint reminders |
| Briefing Generation | Daily at 8 AM | 23 hours | Generate daily briefings |
| Conversation Cleanup | Daily at 3 AM | 23 hours | Remove old agent conversations |

## Distributed Locking

All cron jobs use Redis-based locking via `DistributedLockService` to ensure only one instance executes the job in a multi-instance deployment.

### Lock Pattern

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async runScheduledReports(): Promise<void> {
  const lock = await this.lockService.acquireLock(this.LOCK_KEY, {
    ttl: this.LOCK_TTL_MS,
  });

  if (!lock.acquired) {
    this.logger.debug('Already running on another instance, skipping');
    return;
  }

  try {
    // Job logic here
  } finally {
    await lock.release();
  }
}
```

### Lock Key Naming

- Format: `cron:{job-name}`
- Examples:
  - `cron:health-check`
  - `cron:scheduled-report`
  - `cron:checkpoint-reminder`

### Lock TTL Strategy

Lock TTL should be slightly less than the job interval:
- 15-minute job → 14-minute lock
- Daily job → 23-hour lock

This prevents lock starvation if a job fails to release properly.

## Concurrency Control

For jobs that process multiple items (e.g., health checks for many projects), use `p-limit` for parallel processing with concurrency limits:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(CRON_SETTINGS.HEALTH_CHECK_CONCURRENCY); // Default: 5

const results = await Promise.allSettled(
  projects.map((project) =>
    limit(() => this.healthService.runHealthCheck(project))
  )
);
```

## Batch Processing

Large datasets are processed in batches to prevent memory issues:

| Constant | Value | Purpose |
|----------|-------|---------|
| `HEALTH_CHECK_BATCH_SIZE` | 100 | Max projects per health check run |
| `REPORT_GENERATION_BATCH_SIZE` | 50 | Max reports per scheduled run |
| `HEALTH_CHECK_CONCURRENCY` | 5 | Max concurrent health checks |
| `REPORT_GENERATION_CONCURRENCY` | 3 | Max concurrent report generations |

## Retry Logic

Transient failures use exponential backoff:

```typescript
async function withRetry<T>(fn: () => Promise<T>, logger: Logger, context: string): Promise<T> {
  for (let attempt = 0; attempt <= RETRY_SETTINGS.MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < RETRY_SETTINGS.MAX_RETRIES) {
        const delay = Math.min(
          RETRY_SETTINGS.BASE_DELAY_MS * Math.pow(RETRY_SETTINGS.BACKOFF_MULTIPLIER, attempt),
          RETRY_SETTINGS.MAX_DELAY_MS
        );
        logger.warn(`${context}: Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
```

Default retry settings:
- `MAX_RETRIES`: 3
- `BASE_DELAY_MS`: 1000
- `BACKOFF_MULTIPLIER`: 2
- `MAX_DELAY_MS`: 10000

## Stale Data Filtering

Health checks skip recently-checked projects:

```typescript
const staleThreshold = new Date(Date.now() - CRON_SETTINGS.HEALTH_CHECK_STALE_MINUTES * 60 * 1000);

const projects = await this.prisma.project.findMany({
  where: {
    status: 'ACTIVE',
    OR: [
      { lastHealthCheck: null },
      { lastHealthCheck: { lt: staleThreshold } },
    ],
  },
  orderBy: { lastHealthCheck: 'asc' }, // Oldest first
  take: CRON_SETTINGS.HEALTH_CHECK_BATCH_SIZE,
});
```

Default: 10-minute stale threshold for 15-minute cron interval.

## Configuration

Constants are centralized in `apps/api/src/pm/agents/constants.ts`:

```typescript
export const CRON_SETTINGS = {
  HEALTH_CHECK_BATCH_SIZE: 100,
  HEALTH_CHECK_CONCURRENCY: 5,
  HEALTH_CHECK_STALE_MINUTES: 10,
  REPORT_GENERATION_BATCH_SIZE: 50,
  REPORT_GENERATION_CONCURRENCY: 3,
};

export const RETRY_SETTINGS = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
  MAX_DELAY_MS: 10000,
};
```

## Monitoring

Each cron job logs:
- Job start with timestamp
- Number of items to process
- Success/failure counts
- Total duration

Example log output:
```
[HealthCheckCron] Starting scheduled health checks
[HealthCheckCron] Found 25 active projects needing health checks
[HealthCheckCron] Scheduled health checks completed: 24 succeeded, 1 failed, duration=4523ms
```

## File Locations

| File | Purpose |
|------|---------|
| `apps/api/src/pm/agents/health.cron.ts` | Health check cron |
| `apps/api/src/pm/agents/scheduled-report.cron.ts` | Scheduled report cron |
| `apps/api/src/pm/agents/checkpoint.cron.ts` | Checkpoint reminder cron |
| `apps/api/src/pm/agents/constants.ts` | Shared constants |
| `apps/api/src/common/services/distributed-lock.service.ts` | Redis lock service |

## References

- NestJS Schedule: https://docs.nestjs.com/techniques/task-scheduling
- Redis Distributed Locks: Redlock algorithm implementation
