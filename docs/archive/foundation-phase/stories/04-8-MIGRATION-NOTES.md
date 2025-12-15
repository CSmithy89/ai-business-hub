# Migration Notes - Story 04-8: Approval Escalation

## Database Migration Required

### Schema Changes

1. **ApprovalItem** - Added `escalatedAt` field:
   ```sql
   ALTER TABLE approval_items ADD COLUMN escalated_at TIMESTAMP;
   ```

2. **WorkspaceSettings** - Added escalation config fields:
   ```sql
   ALTER TABLE workspace_settings ADD COLUMN enable_escalation BOOLEAN DEFAULT true NOT NULL;
   ALTER TABLE workspace_settings ADD COLUMN escalation_check_interval_minutes INTEGER DEFAULT 15 NOT NULL;
   ALTER TABLE workspace_settings ADD COLUMN escalation_target_user_id TEXT;
   ALTER TABLE workspace_settings ADD COLUMN enable_escalation_notifications BOOLEAN DEFAULT true NOT NULL;
   ```

### Running Migration

```bash
# Navigate to db package
cd packages/db

# Generate migration
npx prisma migrate dev --name add-escalation-fields

# Apply migration
npx prisma migrate deploy
```

## Dependencies Installation

### Install BullMQ and Redis Client

```bash
# Navigate to API package
cd apps/api

# Install dependencies
npm install @nestjs/bullmq bullmq ioredis
```

Or add to `apps/api/package.json`:

```json
{
  "dependencies": {
    "@nestjs/bullmq": "^10.0.0",
    "bullmq": "^5.0.0",
    "ioredis": "^5.3.0"
  }
}
```

Then run:
```bash
npm install
```

## Environment Variables

Add to `.env` or `.env.local`:

```env
# Redis Configuration (required for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Optional, leave empty if no password
```

## Redis Setup

### Local Development (Docker)

If Redis is not already running, start it via Docker:

```bash
# Start Redis container
docker run -d \
  --name hyvve-redis \
  -p 6379:6379 \
  redis:7-alpine

# Verify Redis is running
docker ps | grep hyvve-redis
```

Or add to existing `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: hyvve-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

### Production

Ensure Redis is configured and accessible. Update environment variables accordingly.

## Workspace Settings Initialization

Existing workspaces need default escalation settings. Run this script or add to a migration:

```typescript
// scripts/init-escalation-settings.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initEscalationSettings() {
  const workspaces = await prisma.workspace.findMany({
    include: { settings: true },
  });

  for (const workspace of workspaces) {
    if (!workspace.settings) {
      // Create settings if they don't exist
      await prisma.workspaceSettings.create({
        data: {
          workspaceId: workspace.id,
          enableEscalation: true,
          escalationCheckIntervalMinutes: 15,
          enableEscalationNotifications: true,
          // ... other default settings
        },
      });
    } else {
      // Update existing settings with escalation defaults
      await prisma.workspaceSettings.update({
        where: { workspaceId: workspace.id },
        data: {
          enableEscalation: true,
          escalationCheckIntervalMinutes: 15,
          enableEscalationNotifications: true,
        },
      });
    }
  }

  console.log(`Initialized escalation settings for ${workspaces.length} workspaces`);
}

initEscalationSettings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Testing the Implementation

### 1. Verify Redis Connection

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

### 2. Start the API

```bash
cd apps/api
npm run dev
```

Check logs for:
```
[EscalationSchedulerService] Escalation recurring job registered
```

### 3. Test Escalation Config API

```bash
# Get escalation config
curl http://localhost:3001/api/approvals/escalation-config \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Workspace-Id: YOUR_WORKSPACE_ID"

# Update escalation config
curl -X PUT http://localhost:3001/api/approvals/escalation-config \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Workspace-Id: YOUR_WORKSPACE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "enableEscalation": true,
    "escalationCheckIntervalMinutes": 30,
    "escalationTargetUserId": "user-id-here",
    "enableEscalationNotifications": true
  }'
```

### 4. Test Manual Escalation Trigger

Create a test endpoint or use the service directly:

```typescript
import { EscalationSchedulerService } from './approvals/services/escalation-scheduler.service';

// In a test controller or script
const result = await escalationScheduler.triggerManually();
console.log(result);
// { jobId: '...', status: 'queued', message: '...' }
```

### 5. Monitor BullMQ Queue

Check queue status:

```typescript
const status = await escalationScheduler.getQueueStatus();
console.log(status);
// {
//   queueName: 'approval-escalation',
//   counts: { waiting: 0, active: 0, completed: 1, failed: 0, delayed: 0 },
//   timestamp: '...'
// }
```

## Rollback Plan

If escalation needs to be disabled:

1. **Disable via API**:
   ```bash
   curl -X PUT http://localhost:3001/api/approvals/escalation-config \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-Workspace-Id: YOUR_WORKSPACE_ID" \
     -H "Content-Type: application/json" \
     -d '{ "enableEscalation": false }'
   ```

2. **Disable in Database**:
   ```sql
   UPDATE workspace_settings SET enable_escalation = false;
   ```

3. **Stop BullMQ Queue** (code change):
   Comment out `EscalationSchedulerService` registration in `approvals.module.ts`

## Known Limitations

1. **Single-level escalation**: Only escalates once (no re-escalation or multi-level chains)
2. **Stub notifications**: Notifications are logged only, not sent via email/SMS
3. **Stub events**: Events emitted to stub service, not actual event bus (Epic 05)
4. **Fixed schedule**: 15-minute interval is workspace-configurable but job runs for all workspaces on same schedule

## Next Steps

- **Story 04-9**: Implement Approval Audit Trail (will use escalation events)
- **Epic 05**: Implement Event Bus (real event emission)
- **Future**: Multi-level escalation chains, real notifications, custom rules

## Support

For issues or questions:
- Check logs: `docker logs -f hyvve-api`
- Verify Redis: `redis-cli monitor`
- Check queue: Use BullMQ Board or implement admin endpoint
- Review story: `docs/stories/04-8-implement-approval-escalation.md`
