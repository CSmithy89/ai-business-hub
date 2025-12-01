# Section 5: CRM External Integrations - Research Findings

**Research Date:** 2025-11-30
**Status:** Complete
**Sources:** HubSpot, Salesforce, Industry Best Practices

---

## Summary

External integrations are critical for CRM adoption. Based on research, we recommend starting with CSV import/export, Gmail/Outlook email logging, and preparing infrastructure for HubSpot/Salesforce two-way sync. Calendar sync should be prioritized for meeting tracking.

---

## 1. Two-Way CRM Sync

### 1.1 Sync Architecture Options

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Real-Time Webhooks** | Instant updates | Complex to maintain | High-value data |
| **Polling** | Simple to implement | Delayed, API-heavy | Low-frequency data |
| **Event-Driven** | Scalable, reliable | Requires message queue | Enterprise |
| **Third-Party ETL** | No-code, fast setup | Cost, dependency | MVP |

**Reference:** [HubSpot Two-Way Sync Guide](https://www.stacksync.com/blog/hubspot-two-way-sync-the-complete-guide-to-bidirectional-integration)

### 1.2 HubSpot Integration

**API Version:** CRM v3 API (current)

```typescript
// HubSpot CRM v3 Objects
const HUBSPOT_OBJECTS = {
  contacts: 'crm/v3/objects/contacts',
  companies: 'crm/v3/objects/companies',
  deals: 'crm/v3/objects/deals',
  notes: 'crm/v3/objects/notes',
  tasks: 'crm/v3/objects/tasks',
  meetings: 'crm/v3/objects/meetings',
  calls: 'crm/v3/objects/calls',
  emails: 'crm/v3/objects/emails',
};

// Rate limits
const HUBSPOT_LIMITS = {
  dailyCalls: 250000,           // Per app
  burstLimit: 100,              // Per 10 seconds
  searchLimit: 4,               // Per second per app
};
```

**Field Mapping:**
```typescript
const HUBSPOT_CONTACT_MAPPING = {
  // HubSpot → Our Schema
  'firstname': 'firstName',
  'lastname': 'lastName',
  'email': 'email',
  'phone': 'phone',
  'jobtitle': 'jobTitle',
  'company': 'account.name',
  'lifecyclestage': 'lifecycle',
  'hs_lead_status': 'scoreTier',
  'hubspot_owner_id': 'ownerId',

  // Custom properties
  'hs_analytics_source': 'source',
  'hs_analytics_source_data_1': 'sourceDetail',
};

const HUBSPOT_DEAL_MAPPING = {
  'dealname': 'name',
  'amount': 'amount',
  'dealstage': 'stage',
  'closedate': 'closeDate',
  'pipeline': 'pipelineId',
  'hs_deal_stage_probability': 'probability',
};
```

**Reference:** [HubSpot API Guide](https://www.smartbugmedia.com/blog/hubspot-api-integrations-guide)

### 1.3 Salesforce Integration

**API Type:** REST API + Bulk API

```typescript
// Salesforce object mapping
const SALESFORCE_OBJECTS = {
  contacts: '/services/data/v59.0/sobjects/Contact',
  accounts: '/services/data/v59.0/sobjects/Account',
  opportunities: '/services/data/v59.0/sobjects/Opportunity',
  leads: '/services/data/v59.0/sobjects/Lead',
  tasks: '/services/data/v59.0/sobjects/Task',
  events: '/services/data/v59.0/sobjects/Event',
};

// Rate limits
const SALESFORCE_LIMITS = {
  dailyApiCalls: 15000,         // Per org (varies by edition)
  concurrentCalls: 25,
  bulkJobLimit: 10000,          // Records per batch
};
```

**Conflict Resolution Strategy:**

```typescript
interface SyncConflict {
  recordId: string;
  field: string;
  ourValue: any;
  theirValue: any;
  ourTimestamp: DateTime;
  theirTimestamp: DateTime;
}

enum ConflictResolution {
  OURS_WINS = 'ours_wins',           // Our system is source of truth
  THEIRS_WINS = 'theirs_wins',       // External CRM wins
  LAST_WRITE_WINS = 'last_write',    // Most recent timestamp
  FIELD_PRIORITY = 'field_priority', // Per-field rules
  MANUAL = 'manual',                 // Queue for review
}

const CONFLICT_RULES: Record<string, ConflictResolution> = {
  // Identity - preserve our data
  'email': 'ours_wins',
  'firstName': 'last_write_wins',
  'lastName': 'last_write_wins',

  // CRM fields - external CRM wins
  'lifecycle': 'theirs_wins',
  'dealStage': 'theirs_wins',

  // Scoring - our system wins
  'leadScore': 'ours_wins',
  'scoreTier': 'ours_wins',
};
```

**Reference:** [Salesforce REST API Guide](https://www.integrate.io/blog/salesforce-rest-api-integration/)

### 1.4 Sync State Management

```typescript
interface SyncState {
  integrationId: string;
  objectType: string;           // contact, deal, account
  lastSyncAt: DateTime;
  lastSyncCursor?: string;      // For incremental sync
  recordsSynced: number;
  errorCount: number;
  status: 'idle' | 'syncing' | 'error';
}

interface SyncRecord {
  id: string;
  internalId: string;
  externalId: string;           // HubSpot/Salesforce ID
  provider: string;             // hubspot, salesforce
  objectType: string;
  lastSyncAt: DateTime;
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
  version: number;              // For optimistic locking
}
```

---

## 2. Import/Export System

### 2.1 CSV Import Architecture

```typescript
interface ImportJob {
  id: string;
  workspaceId: string;

  // Source
  fileName: string;
  fileSize: number;
  totalRows: number;

  // Configuration
  objectType: 'contact' | 'account' | 'deal';
  fieldMapping: FieldMapping[];
  duplicateStrategy: DuplicateStrategy;
  updateExisting: boolean;

  // Progress
  status: 'pending' | 'validating' | 'importing' | 'completed' | 'failed';
  rowsProcessed: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsSkipped: number;
  rowsFailed: number;

  // Errors
  errors: ImportError[];

  // Metadata
  createdById: string;
  createdAt: DateTime;
  completedAt?: DateTime;
}

interface FieldMapping {
  csvColumn: string;
  crmField: string;
  transform?: string;           // date_parse, phone_format, etc.
  required: boolean;
}

enum DuplicateStrategy {
  SKIP = 'skip',                // Ignore duplicates
  UPDATE = 'update',            // Update existing record
  CREATE_NEW = 'create_new',    // Create duplicate
  MERGE = 'merge',              // Merge fields
}
```

**Reference:** [Salesforce Data Import Best Practices](https://trailhead.salesforce.com/content/learn/modules/lex_implementation_data_management/lex_implementation_data_import)

### 2.2 Import Validation Rules

```typescript
const IMPORT_VALIDATIONS = {
  // Required fields
  contact: ['firstName', 'lastName'],  // At least one identifier
  account: ['name'],
  deal: ['name', 'pipelineId'],

  // Format validations
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  url: /^https?:\/\/.+/,

  // Picklist validations (auto-validate against enum values)
  lifecycle: ['lead', 'mql', 'sql', 'opportunity', 'customer'],
  dealStage: [], // Dynamic based on pipeline
};

interface ImportError {
  row: number;
  column: string;
  value: any;
  errorType: 'required' | 'format' | 'picklist' | 'duplicate' | 'reference';
  message: string;
}
```

### 2.3 Import Best Practices

| Practice | Description |
|----------|-------------|
| **UTF-8 Encoding** | Save CSV as UTF-8 for special characters |
| **Test Import** | Run 50-100 records first |
| **Field Templates** | Save mappings for repeated imports |
| **Duplicate Detection** | Check email before creating new |
| **Rollback Support** | Track import batch for undo |
| **Progress Feedback** | Show real-time row progress |

**Reference:** [Flatfile CSV Import Guide](https://flatfile.com/blog/optimizing-csv-import-experiences-flatfile-portal/)

### 2.4 Export Functionality

```typescript
interface ExportJob {
  id: string;
  workspaceId: string;

  // Configuration
  objectType: string;
  filter: FilterCriteria;
  fields: string[];             // Which fields to export
  format: 'csv' | 'xlsx' | 'json';

  // Output
  status: 'pending' | 'processing' | 'completed' | 'expired';
  fileUrl?: string;
  recordCount: number;

  // Limits
  maxRecords: number;           // 50,000 default
  expiresAt: DateTime;          // File auto-delete

  createdAt: DateTime;
}
```

---

## 3. Email Integration

### 3.1 Gmail Integration

**API:** Gmail API (v1)

```typescript
interface GmailIntegration {
  // OAuth scopes needed
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ];

  // Features
  features: {
    readEmails: boolean;        // Pull emails to timeline
    sendEmails: boolean;        // Send from CRM
    trackOpens: boolean;        // Tracking pixel
    trackClicks: boolean;       // Link wrapping
    bccLogging: boolean;        // Log via BCC address
  };
}
```

**Email Logging Methods:**

| Method | Pros | Cons |
|--------|------|------|
| **Gmail API Sync** | Full history, bidirectional | OAuth required, complex |
| **BCC Logging** | Simple, no OAuth | Manual, one-way |
| **Chrome Extension** | Real-time, tracking | Requires installation |
| **Forwarding Rule** | Automatic | One-way, setup required |

**Reference:** [Streak CRM for Gmail](https://www.streak.com/)

### 3.2 Outlook Integration

**API:** Microsoft Graph API

```typescript
interface OutlookIntegration {
  // OAuth scopes
  scopes: [
    'Mail.Read',
    'Mail.Send',
    'Calendars.ReadWrite',
    'User.Read',
  ];

  // Endpoints
  endpoints: {
    messages: '/me/messages',
    sendMail: '/me/sendMail',
    calendars: '/me/calendars',
    events: '/me/events',
  };
}
```

### 3.3 Email Tracking

```typescript
interface EmailTracking {
  emailId: string;
  contactId: string;

  // Tracking events
  sent: boolean;
  sentAt: DateTime;
  delivered: boolean;
  deliveredAt?: DateTime;
  opened: boolean;
  openedAt?: DateTime;
  openCount: number;
  clicked: boolean;
  clickedAt?: DateTime;
  clickedLinks: ClickedLink[];
  replied: boolean;
  repliedAt?: DateTime;
  bounced: boolean;
  bouncedAt?: DateTime;
  bounceType?: 'hard' | 'soft';
  unsubscribed: boolean;
}

interface ClickedLink {
  url: string;
  clickedAt: DateTime;
  clickCount: number;
}
```

**Tracking Limitations:**
- Gmail caches images (tracking pixels) on Google servers
- Some email clients block images by default
- Privacy extensions can block tracking
- Apple Mail Privacy Protection hides opens

**Reference:** [Email Meter Tracking Guide](https://www.emailmeter.com/blog/what-you-need-to-know-about-email-tracking-software)

---

## 4. Calendar Integration

### 4.1 Calendar Sync Architecture

```typescript
interface CalendarSync {
  userId: string;
  provider: 'google' | 'outlook' | 'apple';

  // OAuth tokens
  accessToken: string;
  refreshToken: string;
  expiresAt: DateTime;

  // Sync settings
  syncDirection: 'one_way_in' | 'one_way_out' | 'bidirectional';
  calendarIds: string[];        // Which calendars to sync
  syncMeetingsOnly: boolean;    // Only meetings with contacts

  lastSyncAt: DateTime;
  syncInterval: number;         // Minutes between syncs
}
```

**Reference:** [Unipile Calendar API](https://www.unipile.com/calendar-sync-api-for-saas-real-time-google-outlook-integration/)

### 4.2 Meeting Logging

```typescript
interface MeetingActivity {
  id: string;
  contactId: string;
  dealId?: string;

  // Event details
  title: string;
  description?: string;
  startTime: DateTime;
  endTime: DateTime;
  location?: string;
  meetingUrl?: string;          // Zoom, Meet, Teams link

  // Attendees
  attendees: MeetingAttendee[];

  // Tracking
  source: 'google' | 'outlook' | 'manual';
  externalEventId?: string;     // Calendar event ID
  outcome?: 'completed' | 'no_show' | 'rescheduled' | 'cancelled';
  notes?: string;

  createdAt: DateTime;
  updatedAt: DateTime;
}

interface MeetingAttendee {
  email: string;
  name?: string;
  response: 'accepted' | 'declined' | 'tentative' | 'pending';
  isOrganizer: boolean;
  contactId?: string;           // Linked to CRM contact
}
```

### 4.3 Calendar API Comparison

| Provider | API | Real-Time | Webhooks |
|----------|-----|-----------|----------|
| **Google Calendar** | Calendar API v3 | Push notifications | Yes |
| **Outlook** | Microsoft Graph | Subscriptions | Yes |
| **Apple Calendar** | CalDAV | Polling only | No |

---

## 5. Answers to Research Questions

### Q1: Which CRM integrations are must-have vs nice-to-have?

**Must-Have (MVP):**
- CSV Import/Export (universal)
- Gmail/Outlook email logging (basic)
- HubSpot sync (most common target)

**Nice-to-Have (Phase 2):**
- Salesforce sync
- Pipedrive sync
- Calendar sync
- Zapier connector

### Q2: Real-time sync or scheduled batch sync?

**Answer: Hybrid based on data type.**

| Data Type | Sync Strategy | Frequency |
|-----------|---------------|-----------|
| Contact creation | Real-time webhook | Immediate |
| Contact updates | Near-real-time | 5-15 min polling |
| Deal stage changes | Real-time webhook | Immediate |
| Activity logging | Batch | Hourly |
| Full sync | Batch | Nightly |

### Q3: How do we handle record ownership across systems?

**Answer: Mapping table with ownership precedence.**

```typescript
interface OwnershipMapping {
  internalUserId: string;
  externalUserId: string;       // HubSpot/Salesforce user ID
  provider: string;
  isActive: boolean;
}

// Ownership rules
const OWNERSHIP_RULES = {
  newFromExternal: 'use_external_owner',  // Map to internal user
  newFromInternal: 'use_internal_owner',  // Map to external user
  conflict: 'keep_current_owner',         // Don't overwrite
  unmappedUser: 'assign_to_admin',        // Fallback
};
```

### Q4: What's the dedup strategy for imported data?

**Answer: Multi-field matching with user confirmation.**

```typescript
interface DuplicateDetection {
  // Match criteria (in priority order)
  criteria: [
    { fields: ['email'], confidence: 100 },
    { fields: ['firstName', 'lastName', 'accountId'], confidence: 90 },
    { fields: ['phone'], confidence: 85 },
    { fields: ['linkedinUrl'], confidence: 95 },
  ];

  // Action thresholds
  autoMergeThreshold: 100;      // Auto-merge if perfect match
  reviewThreshold: 85;          // Queue for review
  createNewThreshold: 50;       // Create new if low match
}
```

---

## 6. Recommended Prisma Schema

```prisma
model Integration {
  id              String    @id @default(uuid())
  workspaceId     String

  // Configuration
  provider        String    // hubspot, salesforce, gmail, etc.
  type            String    // crm_sync, email, calendar
  name            String
  isActive        Boolean   @default(true)

  // Authentication
  authType        String    // oauth, api_key
  credentials     Json      // Encrypted tokens

  // Sync settings
  syncDirection   String    @default("bidirectional")
  syncInterval    Int?      // Minutes
  lastSyncAt      DateTime?

  // Status
  status          String    @default("connected")
  errorMessage    String?
  errorCount      Int       @default(0)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  syncRecords     SyncRecord[]
  importJobs      ImportJob[]

  @@unique([workspaceId, provider, type])
  @@index([workspaceId])
}

model SyncRecord {
  id              String    @id @default(uuid())
  integrationId   String
  integration     Integration @relation(fields: [integrationId], references: [id])

  // Record mapping
  internalId      String
  externalId      String
  objectType      String    // contact, deal, account

  // Sync state
  lastSyncAt      DateTime
  syncHash        String?   // For change detection
  version         Int       @default(1)
  conflictStatus  String?   // none, resolved, pending

  @@unique([integrationId, internalId])
  @@unique([integrationId, externalId])
  @@index([objectType])
}

model ImportJob {
  id              String    @id @default(uuid())
  workspaceId     String
  integrationId   String?
  integration     Integration? @relation(fields: [integrationId], references: [id])

  // Source
  fileName        String
  fileSize        Int
  totalRows       Int

  // Config
  objectType      String
  fieldMapping    Json
  duplicateStrategy String @default("skip")

  // Progress
  status          String    @default("pending")
  rowsProcessed   Int       @default(0)
  rowsCreated     Int       @default(0)
  rowsUpdated     Int       @default(0)
  rowsSkipped     Int       @default(0)
  rowsFailed      Int       @default(0)

  // Errors
  errors          Json?     // ImportError[]

  // Tracking
  createdById     String
  createdAt       DateTime  @default(now())
  completedAt     DateTime?

  @@index([workspaceId])
  @@index([status])
}

model ExportJob {
  id              String    @id @default(uuid())
  workspaceId     String

  // Config
  objectType      String
  filter          Json?
  fields          String[]
  format          String    @default("csv")

  // Output
  status          String    @default("pending")
  fileUrl         String?
  recordCount     Int       @default(0)

  // Limits
  expiresAt       DateTime

  createdById     String
  createdAt       DateTime  @default(now())

  @@index([workspaceId])
  @@index([status])
}

model EmailActivity {
  id              String    @id @default(uuid())
  workspaceId     String
  contactId       String
  dealId          String?

  // Email details
  subject         String
  body            String?
  direction       String    // inbound, outbound
  from            String
  to              String[]
  cc              String[]

  // Provider
  provider        String    // gmail, outlook, manual
  externalId      String?   // Email message ID
  threadId        String?

  // Tracking
  sentAt          DateTime?
  deliveredAt     DateTime?
  openedAt        DateTime?
  openCount       Int       @default(0)
  clickedAt       DateTime?
  clickedLinks    Json?
  repliedAt       DateTime?
  bouncedAt       DateTime?
  bounceType      String?

  createdAt       DateTime  @default(now())

  @@index([workspaceId])
  @@index([contactId])
  @@index([dealId])
}

model CalendarSync {
  id              String    @id @default(uuid())
  userId          String
  workspaceId     String

  // Provider
  provider        String    // google, outlook
  calendarIds     String[]

  // Auth
  accessToken     String
  refreshToken    String
  tokenExpiresAt  DateTime

  // Settings
  syncDirection   String    @default("bidirectional")
  syncMeetingsOnly Boolean  @default(true)

  // State
  lastSyncAt      DateTime?
  isActive        Boolean   @default(true)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([userId, provider])
  @@index([workspaceId])
}

model MeetingActivity {
  id              String    @id @default(uuid())
  workspaceId     String
  contactId       String
  dealId          String?

  // Event
  title           String
  description     String?
  startTime       DateTime
  endTime         DateTime
  location        String?
  meetingUrl      String?

  // Attendees
  attendees       Json      // MeetingAttendee[]

  // Source
  source          String    // google, outlook, manual
  externalEventId String?

  // Outcome
  outcome         String?   // completed, no_show, rescheduled, cancelled
  notes           String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([workspaceId])
  @@index([contactId])
  @@index([startTime])
}
```

---

## 7. Implementation Phases

### Phase 1: MVP (Month 1)
- CSV import with field mapping UI
- CSV export (contacts, deals)
- Basic duplicate detection
- Import history and rollback

### Phase 2: Email Integration (Month 2)
- Gmail OAuth connection
- Email logging to timeline
- BCC address for logging
- Basic open tracking

### Phase 3: CRM Sync (Month 3-4)
- HubSpot OAuth connection
- Contact two-way sync
- Deal sync
- Conflict resolution UI

### Phase 4: Advanced (Month 5+)
- Salesforce integration
- Calendar sync (Google, Outlook)
- Zapier/Make connector
- Webhook subscriptions

---

## 8. Sources

- [HubSpot Two-Way Sync Guide](https://www.stacksync.com/blog/hubspot-two-way-sync-the-complete-guide-to-bidirectional-integration)
- [HubSpot Data Sync](https://knowledge.hubspot.com/integrations/connect-and-use-hubspot-data-sync)
- [Salesforce REST API Guide](https://www.integrate.io/blog/salesforce-rest-api-integration/)
- [Salesforce Data Import Best Practices](https://trailhead.salesforce.com/content/learn/modules/lex_implementation_data_management/lex_implementation_data_import)
- [Flatfile CSV Import Guide](https://flatfile.com/blog/optimizing-csv-import-experiences-flatfile-portal/)
- [HubSpot Calendar Sync](https://knowledge.hubspot.com/integrations/use-hubspots-integration-with-google-calendar-or-outlook-calendar)
- [Unipile Calendar API](https://www.unipile.com/calendar-sync-api-for-saas-real-time-google-outlook-integration/)
- [Streak CRM for Gmail](https://www.streak.com/)

---

**Research Status:** Complete
**Next:** Update checklist and proceed to Section 7 (CRM Agent Behaviors)
