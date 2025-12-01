# Section 8: CRM Compliance & Privacy - Research Findings

**Research Date:** 2025-11-30
**Status:** Complete
**Sources:** GDPR Guidelines, FTC CAN-SPAM, Industry Best Practices

---

## Summary

CRM compliance requires addressing GDPR (for EU contacts), CAN-SPAM (for US email), data retention, and granular access controls. Based on research, we need consent tracking, data subject request workflows, suppression lists, and role-based security with field-level permissions.

---

## 1. GDPR Compliance

### 1.1 Data Subject Rights

| Right | Article | CRM Implementation |
|-------|---------|-------------------|
| **Right to Access** | Art. 15 | Export contact's full data |
| **Right to Rectification** | Art. 16 | Edit contact data |
| **Right to Erasure** | Art. 17 | Delete contact (with cascade) |
| **Right to Restrict Processing** | Art. 18 | Flag for no-marketing |
| **Right to Data Portability** | Art. 20 | Export as CSV/JSON |
| **Right to Object** | Art. 21 | Opt-out preferences |

**Reference:** [GDPR Subject Rights](https://dataprivacymanager.net/what-are-data-subject-rights-according-to-the-gdpr/) | [Art. 17 GDPR](https://gdprhub.eu/Article_17_GDPR)

### 1.2 Data Subject Request (DSR) Workflow

```typescript
interface DataSubjectRequest {
  id: string;
  workspaceId: string;

  // Request details
  type: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';

  // Requester
  requesterEmail: string;
  requesterName?: string;
  verificationMethod: 'email' | 'identity_doc' | 'other';
  verifiedAt?: DateTime;

  // Target
  contactId?: string;
  searchCriteria?: {         // If contact not found
    email?: string;
    name?: string;
    phone?: string;
  };

  // Processing
  assigneeId?: string;
  dueDate: DateTime;         // 30 days from request
  extendedDueDate?: DateTime; // Up to 60 more days for complex
  extensionReason?: string;

  // Resolution
  completedAt?: DateTime;
  rejectionReason?: string;
  dataExportUrl?: string;    // For access/portability
  changesApplied?: Json;     // For rectification

  // Audit
  notes: string[];
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### 1.3 Right to Erasure Implementation

```typescript
interface ErasureConfig {
  // Cascade deletion
  cascadeEntities: [
    'activities',            // Email logs, calls, notes
    'dealContacts',          // Remove from deals (keep deal)
    'tasks',                 // Tasks assigned to contact
    'enrichmentHistory',     // Enrichment records
    'scoreHistory',          // Lead score history
    'customFields',          // Custom field values
  ];

  // Entities to anonymize (not delete)
  anonymizeEntities: [
    'deals',                 // Keep deal, remove contact reference
    'invoices',              // Legal requirement to retain
    'auditLogs',             // Keep log, anonymize contact info
  ];

  // Notification
  notifyThirdParties: [
    'enrichment_providers',  // Request deletion from Clearbit, etc.
    'email_providers',       // Remove from email lists
    'integrations',          // Sync deletion to HubSpot, etc.
  ];

  // Verification
  requireVerification: true;
  verificationMethods: ['email_confirmation', 'identity_document'];

  // Timeline
  completionDeadlineDays: 30;
  extensionAllowedDays: 60;
}
```

### 1.4 Data Portability Format

```typescript
// Standard export format for data portability
interface ContactExport {
  exportVersion: '1.0';
  exportedAt: DateTime;
  format: 'json' | 'csv';

  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    jobTitle?: string;
    // ... all contact fields
    customFields: Record<string, any>;
  };

  company?: {
    name: string;
    domain?: string;
    industry?: string;
    // ... company fields
  };

  activities: {
    emails: EmailActivity[];
    calls: CallActivity[];
    meetings: MeetingActivity[];
    notes: NoteActivity[];
  };

  deals: {
    id: string;
    name: string;
    amount: number;
    stage: string;
    // ... deal fields
  }[];

  consentHistory: ConsentRecord[];
}
```

### 1.5 Lawful Basis Tracking

```typescript
enum LawfulBasis {
  CONSENT = 'consent',                    // Explicit consent given
  CONTRACT = 'contract',                  // Necessary for contract
  LEGAL_OBLIGATION = 'legal_obligation',  // Legal requirement
  VITAL_INTERESTS = 'vital_interests',    // Emergency situations
  PUBLIC_TASK = 'public_task',            // Public authority
  LEGITIMATE_INTEREST = 'legitimate_interest', // Balanced interest
}

interface ProcessingPurpose {
  id: string;
  name: string;                           // "Email Marketing"
  description: string;
  lawfulBasis: LawfulBasis;
  dataCategories: string[];               // email, name, company
  retentionPeriod: number;                // Days
}
```

---

## 2. CAN-SPAM Compliance (US)

### 2.1 Requirements Checklist

| Requirement | Implementation |
|-------------|---------------|
| **Identify as Ad** | Clear commercial intent in header |
| **Accurate From** | Verified sender identity |
| **Valid Address** | Physical postal address in footer |
| **Unsubscribe Link** | One-click unsubscribe in every email |
| **Honor Opt-outs** | Process within 10 business days |
| **No Purchased Lists** | Consent verification |

**Reference:** [FTC CAN-SPAM Guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)

### 2.2 Suppression List Management

```typescript
interface SuppressionList {
  id: string;
  workspaceId: string;

  // Entry
  email: string;
  reason: 'unsubscribe' | 'bounce' | 'complaint' | 'manual' | 'abuse';
  source: 'user' | 'system' | 'integration';

  // Type
  scope: 'all' | 'marketing' | 'transactional';
  listIds?: string[];        // Specific lists only

  // Tracking
  suppressedAt: DateTime;
  originalContactId?: string;
  suppressedById?: string;

  // Permanent flag
  permanent: boolean;        // Never remove automatically
}

// Suppression list rules
const SUPPRESSION_RULES = {
  // Auto-add triggers
  autoAdd: [
    { trigger: 'unsubscribe_click', scope: 'marketing', permanent: true },
    { trigger: 'hard_bounce', scope: 'all', permanent: true },
    { trigger: 'soft_bounce_3x', scope: 'all', permanent: false },
    { trigger: 'spam_complaint', scope: 'all', permanent: true },
    { trigger: 'abuse_report', scope: 'all', permanent: true },
  ],

  // Never email these
  blockedDomains: ['example.com', 'test.com'],

  // Retention
  retainIndefinitely: true,   // CAN-SPAM requirement
  syncAcrossProviders: true,  // Keep in sync with ESP
};
```

### 2.3 Email Consent Tracking

```typescript
interface EmailConsent {
  contactId: string;

  // Consent status
  marketingConsent: boolean;
  transactionalConsent: boolean;  // Typically implied

  // Granular preferences
  preferences: {
    newsletter: boolean;
    productUpdates: boolean;
    promotions: boolean;
    events: boolean;
  };

  // Audit trail
  consentHistory: {
    action: 'opt_in' | 'opt_out' | 'update';
    timestamp: DateTime;
    source: string;           // Form, preference center, email
    ipAddress?: string;
    userAgent?: string;
    proof?: string;           // Form submission ID, etc.
  }[];

  // Communication
  lastEmailAt?: DateTime;
  emailFrequencyPref?: 'daily' | 'weekly' | 'monthly';

  // Sunset policy
  engagementScore: number;    // Based on opens/clicks
  lastEngagementAt?: DateTime;
  sunsetWarningAt?: DateTime;
}
```

### 2.4 Unsubscribe Handling

```typescript
interface UnsubscribeConfig {
  // Unsubscribe methods
  methods: {
    oneClickLink: true;       // Required
    preferenceCenter: true;   // Recommended
    replyToUnsubscribe: true; // List-Unsubscribe header
  };

  // Processing
  processing: {
    maxHoursToProcess: 240;   // 10 business days max
    targetHoursToProcess: 1;  // Immediate is best
    confirmationEmail: false; // Don't email after unsub
  };

  // Scope options
  unsubscribeOptions: [
    { id: 'all', label: 'All emails', scope: 'all' },
    { id: 'marketing', label: 'Marketing only', scope: 'marketing' },
    { id: 'frequency', label: 'Reduce frequency', scope: 'preference' },
  ];

  // Re-subscribe
  resubscribePolicy: {
    allowResubscribe: true;
    requireDoubleOptIn: true;
    cooldownDays: 30;
  };
}
```

---

## 3. Data Retention Policies

### 3.1 Retention by Data Type

| Data Type | Default Retention | Legal Basis | Notes |
|-----------|-------------------|-------------|-------|
| **Contacts** | Until deletion requested | Consent/Contract | User configurable |
| **Activities** | 7 years | Legitimate interest | Business records |
| **Emails** | 7 years | Legal compliance | SOX/tax records |
| **Deals** | 7 years | Legal compliance | Financial records |
| **Audit Logs** | 7 years | Legal compliance | Immutable |
| **Lead Scores** | 2 years | Legitimate interest | Anonymize after |
| **Enrichment Cache** | 90 days | Performance | Auto-refresh |

**Reference:** [Data Retention Best Practices](https://drata.com/blog/data-retention-policy)

### 3.2 Retention Policy Configuration

```typescript
interface RetentionPolicy {
  id: string;
  workspaceId: string;
  name: string;

  // Scope
  entityType: string;         // contact, activity, deal
  filter?: FilterCriteria;    // Optional subset

  // Retention rules
  retentionDays: number;
  retentionBasis: 'created' | 'updated' | 'last_accessed' | 'last_activity';

  // Action on expiry
  expiryAction: 'delete' | 'anonymize' | 'archive';
  archiveLocation?: string;   // S3 bucket, etc.

  // Exceptions
  exceptions: {
    condition: string;        // e.g., "hasActiveDeals"
    action: 'extend' | 'exempt';
    extensionDays?: number;
  }[];

  // Automation
  automationEnabled: boolean;
  runSchedule: string;        // Cron expression
  requireApproval: boolean;
  notifyBeforeDays: number;   // Warning before deletion

  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### 3.3 Archive vs Delete Decision

```typescript
const RETENTION_DECISIONS = {
  // Always delete (no archive)
  delete: [
    'enrichment_cache',
    'temp_files',
    'session_data',
  ],

  // Anonymize (keep aggregated)
  anonymize: [
    'lead_scores',           // Keep for analytics
    'activity_metrics',      // Keep counts, remove PII
  ],

  // Archive (legal/audit)
  archive: [
    'email_content',         // 7 years
    'deal_history',          // 7 years
    'invoice_data',          // 7 years
    'consent_records',       // 7 years
  ],

  // Configurable (user choice)
  configurable: [
    'contacts',
    'activities',
    'notes',
  ],
};
```

---

## 4. Access Controls

### 4.1 Role-Based Access Control (RBAC)

```typescript
interface SecurityRole {
  id: string;
  name: string;
  description: string;

  // Entity permissions
  permissions: {
    [entityType: string]: {
      create: boolean;
      read: AccessLevel;
      update: AccessLevel;
      delete: AccessLevel;
      share: boolean;
    };
  };

  // Feature permissions
  features: {
    bulkOperations: boolean;
    import: boolean;
    export: boolean;
    reports: boolean;
    settings: boolean;
    integrations: boolean;
    agentConfig: boolean;
  };
}

enum AccessLevel {
  NONE = 'none',              // No access
  OWN = 'own',                // Own records only
  TEAM = 'team',              // Team's records
  TERRITORY = 'territory',    // Territory-based
  ALL = 'all',                // All records
}
```

**Reference:** [Zoho CRM Role-Based Security](https://www.zoho.com/crm/role-based-security.html) | [Dynamics 365 Field Security](https://learn.microsoft.com/en-us/dynamics365/customerengagement/on-premises/admin/field-level-security)

### 4.2 Default Roles

```typescript
const DEFAULT_ROLES = [
  {
    id: 'admin',
    name: 'Administrator',
    permissions: {
      contacts: { create: true, read: 'all', update: 'all', delete: 'all' },
      deals: { create: true, read: 'all', update: 'all', delete: 'all' },
      // ... all entities with full access
    },
    features: { all: true },
  },
  {
    id: 'manager',
    name: 'Sales Manager',
    permissions: {
      contacts: { create: true, read: 'team', update: 'team', delete: 'own' },
      deals: { create: true, read: 'team', update: 'team', delete: 'own' },
      reports: { read: 'team' },
    },
    features: { bulkOperations: true, export: true, reports: true },
  },
  {
    id: 'rep',
    name: 'Sales Rep',
    permissions: {
      contacts: { create: true, read: 'own', update: 'own', delete: false },
      deals: { create: true, read: 'own', update: 'own', delete: false },
    },
    features: { bulkOperations: false, export: false, reports: false },
  },
  {
    id: 'readonly',
    name: 'Read Only',
    permissions: {
      contacts: { create: false, read: 'all', update: false, delete: false },
      deals: { create: false, read: 'all', update: false, delete: false },
    },
    features: { all: false },
  },
];
```

### 4.3 Field-Level Security

```typescript
interface FieldSecurityProfile {
  id: string;
  name: string;
  description: string;

  // Field permissions
  fields: {
    [entityType: string]: {
      [fieldName: string]: {
        read: boolean;
        create: boolean;
        update: boolean;
      };
    };
  };
}

// Example: Hide sensitive fields
const SENSITIVE_FIELD_PROFILE = {
  name: 'Hide Financial',
  fields: {
    deal: {
      amount: { read: true, create: true, update: false },
      discount: { read: false, create: false, update: false },
      margin: { read: false, create: false, update: false },
    },
    contact: {
      salary: { read: false, create: false, update: false },
      ssn: { read: false, create: false, update: false },
    },
  },
};
```

### 4.4 Territory-Based Access

```typescript
interface Territory {
  id: string;
  name: string;
  description?: string;

  // Criteria
  criteria: {
    geographic?: {
      countries?: string[];
      states?: string[];
      postalCodes?: string[];
    };
    account?: {
      industries?: string[];
      segments?: string[];
      sizeRange?: { min?: number; max?: number };
    };
    custom?: FilterCriteria;
  };

  // Assignments
  memberIds: string[];
  managerId?: string;

  // Hierarchy
  parentTerritoryId?: string;
}
```

---

## 5. Audit Trail

### 5.1 Audit Log Schema

```typescript
interface AuditLog {
  id: string;
  workspaceId: string;

  // Actor
  userId: string;
  userEmail: string;
  userRole: string;
  ipAddress: string;
  userAgent: string;

  // Action
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;

  // Details
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  // Context
  source: 'ui' | 'api' | 'integration' | 'system' | 'agent';
  agentId?: string;
  integrationId?: string;
  requestId?: string;

  // Timestamp
  timestamp: DateTime;

  // Immutability
  hash: string;               // SHA256 of log entry
  previousHash: string;       // Chain integrity
}

enum AuditAction {
  // CRUD
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',

  // Access
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',

  // Compliance
  DSR_SUBMITTED = 'dsr_submitted',
  DSR_COMPLETED = 'dsr_completed',
  CONSENT_CHANGED = 'consent_changed',
  DATA_EXPORTED = 'data_exported',
  DATA_DELETED = 'data_deleted',

  // Security
  PERMISSION_CHANGED = 'permission_changed',
  ROLE_ASSIGNED = 'role_assigned',
  SHARE_GRANTED = 'share_granted',
}
```

### 5.2 Audit Requirements

```typescript
const AUDIT_REQUIREMENTS = {
  // What to log
  auditActions: {
    contacts: ['create', 'update', 'delete', 'export', 'share'],
    deals: ['create', 'update', 'delete', 'stage_change'],
    users: ['create', 'update', 'delete', 'role_change', 'login'],
    settings: ['all'],
    integrations: ['all'],
  },

  // Retention
  retentionYears: 7,

  // Access
  viewableBy: ['admin', 'compliance_officer'],
  exportableBy: ['admin'],

  // Immutability
  preventModification: true,
  preventDeletion: true,
  hashChainEnabled: true,

  // Alerting
  alertOn: [
    'bulk_delete',
    'permission_escalation',
    'export_large',
    'login_failed_multiple',
  ],
};
```

---

## 6. Answers to Research Questions

### Q1: What regions/regulations must we comply with?

**Answer: GDPR (EU), CAN-SPAM (US), CCPA (California) minimum.**

| Regulation | Scope | Key Requirements |
|------------|-------|------------------|
| GDPR | EU residents | Consent, DSR rights, DPO |
| CAN-SPAM | US commercial email | Unsubscribe, address |
| CCPA | California residents | Right to know, delete, opt-out |
| CASL | Canada | Express consent |

### Q2: How long to retain contact data by default?

**Answer: Configurable, with sensible defaults.**

- Active contacts: Until deletion request
- Inactive contacts: 3 years (auto-archive prompt)
- Activities: 7 years (legal)
- Audit logs: 7 years (immutable)

### Q3: Do we need a DPO (Data Protection Officer) role?

**Answer: Support the role, don't require.**

```typescript
interface DPOConfig {
  enabled: boolean;
  dpoUserId?: string;
  dpoEmail: string;

  responsibilities: [
    'review_dsr_requests',
    'audit_data_processing',
    'review_integrations',
    'compliance_reporting',
  ];

  notifications: [
    'dsr_submitted',
    'data_breach_detected',
    'consent_rate_low',
    'retention_policy_triggered',
  ];
}
```

### Q4: How do we handle data subject access requests?

**Answer: Automated workflow with manual review.**

1. Request received (email/form)
2. Identity verification (email confirmation)
3. Auto-search for contact data
4. Generate export/deletion preview
5. Manual review (if complex)
6. Execute action
7. Send confirmation
8. Log for audit

---

## 7. Recommended Prisma Schema

```prisma
model ConsentRecord {
  id              String    @id @default(uuid())
  workspaceId     String
  contactId       String

  // Consent type
  purpose         String    // marketing, transactional, third_party
  lawfulBasis     String    // consent, contract, legitimate_interest

  // Status
  consented       Boolean
  consentedAt     DateTime?
  withdrawnAt     DateTime?

  // Proof
  source          String    // form, preference_center, import
  proofReference  String?   // Form submission ID
  ipAddress       String?
  userAgent       String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([workspaceId, contactId])
  @@index([purpose])
}

model SuppressionEntry {
  id              String    @id @default(uuid())
  workspaceId     String
  email           String

  // Reason
  reason          String    // unsubscribe, bounce, complaint, manual
  scope           String    // all, marketing, specific_list
  listId          String?

  // Status
  permanent       Boolean   @default(true)
  suppressedAt    DateTime  @default(now())
  suppressedById  String?

  // Original contact
  originalContactId String?

  @@unique([workspaceId, email])
  @@index([reason])
}

model DataSubjectRequest {
  id              String    @id @default(uuid())
  workspaceId     String

  // Request
  type            String    // access, erasure, rectification, portability
  status          String    @default("pending")

  // Requester
  requesterEmail  String
  requesterName   String?
  verifiedAt      DateTime?

  // Target
  contactId       String?
  searchCriteria  Json?

  // Processing
  assigneeId      String?
  dueDate         DateTime
  completedAt     DateTime?

  // Resolution
  rejectionReason String?
  dataExportUrl   String?
  changesApplied  Json?
  notes           String[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([workspaceId])
  @@index([status])
  @@index([dueDate])
}

model AuditLog {
  id              String    @id @default(uuid())
  workspaceId     String

  // Actor
  userId          String
  userEmail       String
  userRole        String
  ipAddress       String?
  userAgent       String?

  // Action
  action          String
  entityType      String
  entityId        String
  entityName      String?

  // Details
  changes         Json?
  source          String    // ui, api, integration, system

  // Integrity
  hash            String
  previousHash    String?

  timestamp       DateTime  @default(now())

  @@index([workspaceId])
  @@index([entityType, entityId])
  @@index([userId])
  @@index([timestamp])
}

model RetentionPolicy {
  id              String    @id @default(uuid())
  workspaceId     String

  name            String
  entityType      String
  filter          Json?

  retentionDays   Int
  retentionBasis  String    // created, updated, last_accessed
  expiryAction    String    // delete, anonymize, archive

  automationEnabled Boolean @default(false)
  runSchedule     String?
  requireApproval Boolean   @default(true)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([workspaceId, name])
}

model FieldSecurityProfile {
  id              String    @id @default(uuid())
  workspaceId     String

  name            String
  description     String?
  fieldPermissions Json     // { entity: { field: { read, create, update } } }

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([workspaceId, name])
}
```

---

## 8. Implementation Phases

### Phase 1: MVP Compliance (Month 1)
- Basic consent tracking
- Suppression list management
- Manual DSR handling
- Email unsubscribe processing

### Phase 2: GDPR Compliance (Month 2)
- DSR workflow automation
- Data export (portability)
- Automated erasure with cascade
- Consent audit trail

### Phase 3: Access Controls (Month 3)
- Role-based access control
- Field-level security
- Team/territory permissions
- Audit logging

### Phase 4: Advanced (Month 4+)
- Automated retention policies
- Territory-based access
- DPO dashboard
- Compliance reporting

---

## 9. Sources

- [GDPR Data Subject Rights](https://dataprivacymanager.net/what-are-data-subject-rights-according-to-the-gdpr/)
- [GDPR Article 17 - Right to Erasure](https://gdprhub.eu/Article_17_GDPR)
- [GDPR Article 20 - Data Portability](https://gdpr-info.eu/art-20-gdpr/)
- [FTC CAN-SPAM Compliance Guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [Suppression List Management](https://phonexa.com/blog/suppression-list-management/)
- [Data Retention Policy Best Practices](https://drata.com/blog/data-retention-policy)
- [Zoho CRM Role-Based Security](https://www.zoho.com/crm/role-based-security.html)
- [Dynamics 365 Field Level Security](https://learn.microsoft.com/en-us/dynamics365/customerengagement/on-premises/admin/field-level-security)
- [GDPR 2024 Requirements](https://compleye.io/articles/10-gdpr-requirements-you-must-know-in-2024/)

---

**Research Status:** Complete
**Next:** Update main checklist and summarize research completion
