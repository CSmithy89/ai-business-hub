# Story PM-11.3: Webhook Configuration

**Epic:** PM-11 - External API & Governance
**Status:** done
**Points:** 8

---

## User Story

As an **integration developer**,
I want **webhook subscriptions**,
So that **I can receive real-time updates**.

---

## Acceptance Criteria

### AC1: Webhook CRUD
**Given** I have a valid API key with webhook:write scope
**When** I manage webhook subscriptions
**Then** I can:
- Create webhooks with target URL, events, and secret
- List all webhooks for my workspace
- Update webhook configuration
- Delete webhook subscriptions

### AC2: Event Types
**Given** a webhook is configured
**When** events occur in the system
**Then** webhooks can subscribe to:
- `task.created`, `task.updated`, `task.deleted`
- `project.created`, `project.updated`, `project.deleted`
- `phase.created`, `phase.updated`, `phase.completed`

### AC3: Webhook Delivery
**Given** a subscribed event occurs
**When** the webhook is delivered
**Then** the delivery includes:
- POST request with JSON payload
- `X-Webhook-Signature` header with HMAC-SHA256 signature
- `X-Webhook-Event` header with event type
- `X-Webhook-ID` header with delivery ID
- 3 retry attempts with exponential backoff (2, 4, 8 minutes)

### AC4: Webhook Management UI
**Given** I am a workspace admin
**When** I navigate to Settings > Webhooks
**Then** I can:
- View all configured webhooks
- Create new webhooks with event selection
- Enable/disable webhooks
- View delivery statistics
- Delete webhooks

---

## Technical Implementation

### Database Models
- `Webhook` - Stores webhook configuration (URL, secret, events, enabled status)
- `WebhookDelivery` - Tracks delivery attempts and status

### Backend Services
- `WebhooksService` - CRUD operations, event filtering
- `WebhookDeliveryService` - HMAC signing, retry logic, delivery queue

### API Endpoints
- `GET /api/v1/webhooks` - List webhooks (webhook:read)
- `POST /api/v1/webhooks` - Create webhook (webhook:write)
- `DELETE /api/v1/webhooks/:id` - Delete webhook (webhook:write)

### Frontend Components
- Webhooks settings page at `/settings/webhooks`
- Create webhook dialog with event selection
- Webhook list with statistics and controls

---

## Definition of Done
- [x] Webhook CRUD API implemented
- [x] HMAC-SHA256 signature generation
- [x] Retry logic with exponential backoff
- [x] Frontend webhooks management UI
- [x] TypeScript compiles without errors
- [x] ESLint passes without errors
