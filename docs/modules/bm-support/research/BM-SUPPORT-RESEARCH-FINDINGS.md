# BM-Support Module Research Findings

**Module Code:** `bm-support`
**Research Date:** 2025-12-17
**Reference System:** Chatwoot (chatwoot/chatwoot)
**Status:** Research Complete

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Reference Architecture Analysis (Chatwoot)](#2-reference-architecture-analysis-chatwoot)
3. [Core Data Models](#3-core-data-models)
4. [Channel & Inbox Architecture](#4-channel--inbox-architecture)
5. [Conversation & Message System](#5-conversation--message-system)
6. [Real-Time Communication](#6-real-time-communication)
7. [Agent Assignment & Routing](#7-agent-assignment--routing)
8. [Automation & Bot System](#8-automation--bot-system)
9. [Contact Management](#9-contact-management)
10. [Widget SDK](#10-widget-sdk)
11. [Reporting & Analytics](#11-reporting--analytics)
12. [BM-Support Module Design](#12-bm-support-module-design)
13. [Agent Architecture](#13-agent-architecture)
14. [Workflow Definitions](#14-workflow-definitions)
15. [Integration with Platform](#15-integration-with-platform)
16. [Social Channel Integration (BM-Social)](#16-social-channel-integration-bm-social)
17. [Implementation Recommendations](#17-implementation-recommendations)

---

## 1. Executive Summary

### Purpose

BM-Support is the **unified inbox and AI-powered customer support module** that consolidates all customer communication channels into a single interface. It serves as THE place for customer conversations across:
- Live chat widget
- Email
- Social media (via BM-Social integration)
- WhatsApp, SMS, Telegram
- API-based custom channels

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Unified Inbox** | All conversations from all channels in one place |
| **Multi-Channel Support** | Email, chat, social, messaging apps |
| **Agent Assignment** | Round-robin, balanced, team-based routing |
| **Automation Rules** | Event-driven triggers, conditions, and actions |
| **AI Assistant** | Captain AI for intelligent responses |
| **Canned Responses** | Pre-written quick replies |
| **Macros** | Multi-step action sequences |
| **CSAT Tracking** | Customer satisfaction measurement |
| **Real-Time Updates** | WebSocket-based live communication |
| **Widget SDK** | Embeddable chat widget for websites |

### Key Patterns from Chatwoot

| Pattern | Description | Adoption for BM-Support |
|---------|-------------|-------------------------|
| **Polymorphic Channels** | Each inbox links to a channel type | ✅ Adopt fully |
| **Sidekiq Jobs** | Background job processing | ✅ Adapt for BullMQ |
| **Action Cable** | WebSocket real-time updates | ✅ Adapt for Socket.io |
| **Wisper Events** | Pub/sub event dispatching | ✅ Use platform event bus |
| **Captain AI** | AI assistant with knowledge base | ✅ Adapt for BYOAI |

### Tech Stack Alignment

| Chatwoot | AI Business Hub | Notes |
|----------|-----------------|-------|
| Ruby on Rails 7.1 | NestJS | Different framework, same patterns |
| Vue 3 + Vuex | Next.js + React | Adapt UI patterns |
| PostgreSQL + pgvector | PostgreSQL + pgvector | ✅ Direct alignment |
| Redis + Sidekiq | Redis + BullMQ | ✅ Equivalent job processing |
| Action Cable | Socket.io | ✅ WebSocket equivalent |
| DeviseTokenAuth | Platform Auth | Use existing auth |

---

## 2. Reference Architecture Analysis (Chatwoot)

### Application Structure

```
chatwoot/
├── app/
│   ├── models/           # ActiveRecord models
│   ├── controllers/      # API controllers
│   ├── services/         # Business logic services
│   ├── jobs/             # Sidekiq background jobs
│   ├── listeners/        # Event listeners (Wisper)
│   ├── mailers/          # Email templates
│   └── javascript/
│       ├── dashboard/    # Agent dashboard (Vue 3)
│       ├── widget/       # Chat widget (Vue 3 SPA)
│       └── sdk/          # Embeddable SDK
│
├── config/
│   ├── routes.rb         # API routing
│   └── initializers/     # Configuration
│
├── enterprise/           # Premium features overlay
│
└── deployment/           # Installation scripts
```

### Key Architectural Decisions

1. **Multi-Tenant Architecture**
   - `Account` model is root tenant
   - All entities scoped by `account_id`
   - Feature flags per account

2. **Polymorphic Channels**
   - `Inbox` has polymorphic `belongs_to :channel`
   - Each channel type has its own model and logic
   - Unified message handling across channels

3. **Event-Driven Architecture**
   - Wisper for pub/sub events
   - Model callbacks trigger domain events
   - Listeners handle webhooks, notifications, automation

4. **Layered Configuration**
   - Environment variables → Installation config → Database → Account/User settings
   - `GlobalConfig` service provides unified access

---

## 3. Core Data Models

### Account Model

```prisma
model SupportAccount {
  id              String    @id @default(cuid())
  tenantId        String    // Platform tenant
  name            String
  locale          String    @default("en")

  // Settings
  supportEmail    String?
  autoResolveDuration Int?  // Hours before auto-resolve
  features        Json?     // Feature flags
  settings        Json?     // Account settings

  // Relationships
  inboxes         SupportInbox[]
  conversations   SupportConversation[]
  contacts        SupportContact[]
  teams           SupportTeam[]
  agents          SupportAgent[]
  automationRules SupportAutomationRule[]
  cannedResponses SupportCannedResponse[]
  macros          SupportMacro[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([tenantId])
}
```

### Inbox Model (Polymorphic Channel)

```prisma
model SupportInbox {
  id              String    @id @default(cuid())
  accountId       String
  name            String

  // Polymorphic channel
  channelType     SupportChannelType
  channelId       String    // FK to specific channel table

  // Configuration
  greetingEnabled Boolean   @default(false)
  greetingMessage String?
  enableAutoAssignment Boolean @default(true)
  autoAssignmentConfig Json? // Round-robin, balanced, etc.

  // Widget settings (for web widget)
  widgetColor     String?
  welcomeTitle    String?
  welcomeTagline  String?
  preChatFormEnabled Boolean @default(false)
  preChatFormOptions Json?

  // Working hours
  workingHoursEnabled Boolean @default(false)
  workingHours    Json?
  timezone        String?
  outOfOfficeMessage String?

  // CSAT
  csatSurveyEnabled Boolean @default(false)

  // Relationships
  account         SupportAccount @relation(fields: [accountId])
  conversations   SupportConversation[]
  contactInboxes  SupportContactInbox[]
  inboxMembers    SupportInboxMember[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([accountId])
  @@index([channelType, channelId])
}

enum SupportChannelType {
  WEB_WIDGET
  EMAIL
  WHATSAPP
  FACEBOOK
  INSTAGRAM
  TWITTER
  TELEGRAM
  LINE
  SMS
  API
  // Social channels from BM-Social
  SOCIAL_TWITTER
  SOCIAL_LINKEDIN
  SOCIAL_FACEBOOK
  SOCIAL_INSTAGRAM
}
```

### Conversation Model

```prisma
model SupportConversation {
  id              String    @id @default(cuid())
  accountId       String
  inboxId         String
  contactId       String

  // Assignment
  assigneeId      String?   // Agent assigned
  teamId          String?   // Team assigned

  // Status
  status          ConversationStatus @default(OPEN)
  priority        ConversationPriority @default(NONE)
  snoozedUntil    DateTime?

  // Metadata
  additionalAttributes Json?
  customAttributes Json?

  // Metrics
  firstReplyCreatedAt DateTime?
  waitingSince    DateTime?
  lastActivityAt  DateTime?

  // Labels
  labels          String[]

  // Relationships
  account         SupportAccount @relation(fields: [accountId])
  inbox           SupportInbox @relation(fields: [inboxId])
  contact         SupportContact @relation(fields: [contactId])
  assignee        SupportAgent? @relation(fields: [assigneeId])
  team            SupportTeam? @relation(fields: [teamId])
  messages        SupportMessage[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([accountId])
  @@index([inboxId])
  @@index([contactId])
  @@index([assigneeId])
  @@index([status])
}

enum ConversationStatus {
  OPEN
  RESOLVED
  PENDING
  SNOOZED
}

enum ConversationPriority {
  NONE
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### Message Model

```prisma
model SupportMessage {
  id              String    @id @default(cuid())
  accountId       String
  conversationId  String
  inboxId         String

  // Content
  content         String?   @db.Text
  contentType     MessageContentType @default(TEXT)
  messageType     MessageType

  // Sender (polymorphic)
  senderType      SenderType
  senderId        String?

  // Status
  status          MessageStatus @default(SENT)
  private         Boolean   @default(false)

  // External reference
  externalSourceIds Json?   // Platform-specific message IDs
  sourceId        String?   // Original message ID from channel

  // Rich content
  contentAttributes Json?   // Cards, forms, buttons, etc.

  // Relationships
  conversation    SupportConversation @relation(fields: [conversationId])
  attachments     SupportAttachment[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([conversationId])
  @@index([accountId])
}

enum MessageType {
  INCOMING       // From customer
  OUTGOING       // From agent
  ACTIVITY       // System message
  TEMPLATE       // Template message
}

enum MessageContentType {
  TEXT
  INPUT_SELECT
  CARDS
  FORM
  INPUT_CSAT
  ARTICLE        // Knowledge base article
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
  FAILED
}

enum SenderType {
  USER           // Agent
  CONTACT        // Customer
  AGENT_BOT      // Bot
}
```

### Contact Model

```prisma
model SupportContact {
  id              String    @id @default(cuid())
  accountId       String

  // Identity
  name            String?
  email           String?
  phoneNumber     String?
  identifier      String?   // External identifier

  // Type
  contactType     ContactType @default(VISITOR)

  // Status
  blocked         Boolean   @default(false)

  // Metadata
  additionalAttributes Json? // Browser, location, etc.
  customAttributes Json?     // User-defined fields

  // Activity
  lastActivityAt  DateTime?

  // Avatar
  avatarUrl       String?

  // Relationships
  account         SupportAccount @relation(fields: [accountId])
  conversations   SupportConversation[]
  contactInboxes  SupportContactInbox[]
  notes           SupportNote[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([accountId, email])
  @@unique([accountId, phoneNumber])
  @@unique([accountId, identifier])
  @@index([accountId])
}

enum ContactType {
  VISITOR
  LEAD
  CUSTOMER
}
```

### Team Model

```prisma
model SupportTeam {
  id              String    @id @default(cuid())
  accountId       String
  name            String
  description     String?

  // Settings
  allowAutoAssign Boolean   @default(true)

  // Relationships
  account         SupportAccount @relation(fields: [accountId])
  members         SupportTeamMember[]
  conversations   SupportConversation[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([accountId, name])
  @@index([accountId])
}
```

---

## 4. Channel & Inbox Architecture

### Polymorphic Channel Pattern

```typescript
// Base channel interface
interface SupportChannel {
  type: SupportChannelType;

  // Inbound
  processIncomingMessage(payload: any): Promise<SupportMessage>;

  // Outbound
  sendMessage(message: SupportMessage): Promise<void>;

  // Configuration
  getConfiguration(): ChannelConfig;
  validateConfiguration(config: any): boolean;
}

// Channel implementations
class WebWidgetChannel implements SupportChannel { ... }
class EmailChannel implements SupportChannel { ... }
class WhatsAppChannel implements SupportChannel { ... }
class FacebookChannel implements SupportChannel { ... }
class TwitterChannel implements SupportChannel { ... }
class SocialChannel implements SupportChannel { ... } // BM-Social bridge
```

### Supported Channels

| Channel | Type | Provider | Features |
|---------|------|----------|----------|
| **Web Widget** | WEB_WIDGET | Built-in | Live chat, pre-chat forms, file upload |
| **Email** | EMAIL | IMAP/SMTP, Gmail, Microsoft | Threading, attachments |
| **WhatsApp** | WHATSAPP | Cloud API, Twilio, 360Dialog | Templates, media |
| **Facebook** | FACEBOOK | Meta Graph API | Messenger, comments |
| **Instagram** | INSTAGRAM | Meta Graph API | DMs, story replies |
| **Twitter** | TWITTER | Twitter API | DMs, mentions |
| **Telegram** | TELEGRAM | Bot API | Messages, groups |
| **SMS** | SMS | Twilio, Bandwidth | Text messages |
| **API** | API | Custom webhook | Any integration |
| **Social** | SOCIAL_* | BM-Social Bridge | Social media comments/DMs |

### Channel Integration Flow

```
External Channel (WhatsApp, Email, etc.)
         │
         ▼
┌─────────────────────────────────────┐
│     Channel-Specific Webhook        │
│     (Validates, transforms)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   IncomingMessageService            │
│   • Find/create Contact             │
│   • Find/create Conversation        │
│   • Create Message                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        Event Dispatch               │
│   MESSAGE_CREATED event             │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
   Automation     Real-time
   Rules          Broadcast
```

---

## 5. Conversation & Message System

### Conversation States

```
                    ┌─────────────────┐
                    │      OPEN       │
                    │ (Active support)│
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │   RESOLVED   │  │   PENDING    │  │   SNOOZED    │
   │  (Closed)    │  │ (Awaiting)   │  │ (Remind)     │
   └──────┬───────┘  └──────────────┘  └──────┬───────┘
          │                                    │
          │ New message                        │ Snooze expires
          │ (if reopen enabled)                │
          └────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │      OPEN       │
                    │   (Reopened)    │
                    └─────────────────┘
```

### Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `INCOMING` | Customer → Agent | Customer messages |
| `OUTGOING` | Agent → Customer | Agent replies |
| `ACTIVITY` | System | Status changes, assignments |
| `TEMPLATE` | Agent → Customer | Pre-approved templates |

### Content Types

| Type | Description | Use Case |
|------|-------------|----------|
| `TEXT` | Plain text message | Standard communication |
| `INPUT_SELECT` | Quick reply buttons | Guided choices |
| `CARDS` | Rich cards with images | Product recommendations |
| `FORM` | Input form | Data collection |
| `INPUT_CSAT` | Satisfaction survey | CSAT collection |
| `ARTICLE` | Knowledge base article | Self-service |

---

## 6. Real-Time Communication

### WebSocket Architecture

```typescript
// Socket.io implementation for BM-Support
interface SupportSocket {
  // Namespaces
  dashboard: Namespace;  // Agent dashboard
  widget: Namespace;     // Customer widget

  // Rooms
  // account:{accountId} - All agents in account
  // inbox:{inboxId} - Agents in specific inbox
  // conversation:{conversationId} - Conversation participants
  // user:{userId} - Individual agent
  // contact:{contactId} - Individual contact
}

// Events
const SUPPORT_EVENTS = {
  // Conversation events
  'conversation.created': ConversationPayload,
  'conversation.updated': ConversationPayload,
  'conversation.status_changed': StatusChangePayload,
  'conversation.assignee_changed': AssigneePayload,

  // Message events
  'message.created': MessagePayload,
  'message.updated': MessagePayload,

  // Typing events
  'conversation.typing_on': TypingPayload,
  'conversation.typing_off': TypingPayload,

  // Presence events
  'presence.update': PresencePayload,
};
```

### Presence Tracking

```typescript
interface PresenceService {
  // Agent presence
  setAgentOnline(agentId: string): void;
  setAgentOffline(agentId: string): void;
  setAgentBusy(agentId: string): void;
  getOnlineAgents(accountId: string): Agent[];

  // Contact presence (widget)
  setContactOnline(contactId: string, inboxId: string): void;
  setContactOffline(contactId: string): void;
  isContactOnline(contactId: string): boolean;
}
```

### Typing Indicators

```
Agent starts typing
       │
       ▼
┌─────────────────────┐
│ Frontend: typingOn  │
│ event emitted       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ API: toggle_typing  │
│ endpoint called     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ WebSocket broadcast │
│ to conversation     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Widget: shows       │
│ "Agent is typing"   │
└─────────────────────┘
```

---

## 7. Agent Assignment & Routing

### Assignment Policies

| Policy | Description | Use Case |
|--------|-------------|----------|
| **Round Robin** | Equal distribution to available agents | Fair workload |
| **Balanced** | Based on agent capacity | Skill-based routing |
| **Manual** | No auto-assignment | VIP handling |

### Assignment Priority

| Priority | Description |
|----------|-------------|
| **Earliest Created** | Oldest conversation first |
| **Longest Waiting** | Most wait time first |

### Fair Distribution

```typescript
interface AgentCapacityConfig {
  maxConversationsPerHour: number;  // Default: 100
  maxActiveConversations: number;   // Concurrent limit
  workingHours: WorkingHours;
}
```

### Assignment Flow

```
New Conversation Created
         │
         ▼
┌─────────────────────────────────────┐
│   Check Inbox Auto-Assignment       │
│   Enabled?                          │
└──────────────┬──────────────────────┘
               │ Yes
               ▼
┌─────────────────────────────────────┐
│   Get Available Agents              │
│   • In inbox                        │
│   • Online/Available                │
│   • Under capacity limit            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Apply Assignment Policy           │
│   (Round Robin / Balanced)          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Assign Agent                      │
│   • Update conversation             │
│   • Notify agent                    │
│   • Broadcast event                 │
└─────────────────────────────────────┘
```

### Team-Based Routing

```prisma
model SupportTeam {
  // Conversations can be assigned to teams
  // Then to individual team members
}

model SupportTeamMember {
  teamId    String
  agentId   String
  role      TeamRole  // LEADER, MEMBER
}
```

---

## 8. Automation & Bot System

### Automation Rules

```prisma
model SupportAutomationRule {
  id              String    @id @default(cuid())
  accountId       String
  name            String
  description     String?

  // Trigger
  eventName       AutomationEvent

  // Conditions (AND logic)
  conditions      Json      // Array of condition objects

  // Actions (executed in order)
  actions         Json      // Array of action objects

  active          Boolean   @default(true)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([accountId, eventName])
}

enum AutomationEvent {
  MESSAGE_CREATED
  CONVERSATION_CREATED
  CONVERSATION_UPDATED
  CONVERSATION_OPENED
  CONVERSATION_RESOLVED
}
```

### Condition Types

| Condition | Attributes |
|-----------|------------|
| **Message** | type, content, contains |
| **Conversation** | status, assignee, team, labels, priority |
| **Contact** | email, phone, custom attributes |
| **Inbox** | inbox_id |
| **Time** | business hours, created_at |

### Action Types

| Action | Description |
|--------|-------------|
| `assign_agent` | Assign to specific agent |
| `assign_team` | Assign to team |
| `add_label` | Add labels |
| `remove_label` | Remove labels |
| `send_message` | Send automated message |
| `send_email_to_team` | Notify team via email |
| `send_email_transcript` | Send conversation transcript |
| `resolve_conversation` | Close conversation |
| `mute_conversation` | Mute notifications |
| `snooze_conversation` | Snooze until time |
| `send_webhook` | Trigger webhook |
| `send_attachment` | Send file |

### Automation Rule Example

```json
{
  "name": "VIP Customer Routing",
  "eventName": "CONVERSATION_CREATED",
  "conditions": [
    {
      "attribute": "contact.custom_attributes.tier",
      "operator": "equals",
      "value": "enterprise"
    }
  ],
  "actions": [
    {
      "action": "assign_team",
      "team_id": "vip-support-team"
    },
    {
      "action": "add_label",
      "labels": ["vip", "priority"]
    },
    {
      "action": "send_message",
      "message": "Thank you for contacting us. A VIP support specialist will be with you shortly."
    }
  ]
}
```

### Captain AI Assistant

```typescript
interface CaptainAI {
  // Configuration
  assistant: {
    name: string;
    responseGuidelines: string;
    guardrails: string[];
  };

  // Knowledge base
  documents: Document[];        // Ingested documentation
  responses: AssistantResponse[]; // Semantic search with pgvector

  // Custom tools
  tools: CustomTool[];          // HTTP API integrations

  // Features
  features: {
    copilot: boolean;           // Agent assistance
    autoReply: boolean;         // Automated responses
    handoff: boolean;           // Human handoff
  };
}
```

### Canned Responses

```prisma
model SupportCannedResponse {
  id              String    @id @default(cuid())
  accountId       String

  shortCode       String    // Quick access code
  content         String    @db.Text

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([accountId, shortCode])
  @@index([accountId])
}
```

### Macros

```prisma
model SupportMacro {
  id              String    @id @default(cuid())
  accountId       String

  name            String
  actions         Json      // Same format as automation actions
  visibility      MacroVisibility @default(PERSONAL)
  createdById     String

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([accountId])
}

enum MacroVisibility {
  PERSONAL        // Only creator
  GLOBAL          // All agents
}
```

---

## 9. Contact Management

### Contact Identification

```
Incoming Message
       │
       ▼
┌─────────────────────────────────────┐
│   Extract Identifiers               │
│   • Email                           │
│   • Phone number                    │
│   • External identifier             │
│   • Channel-specific source_id      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Search Existing Contacts          │
│   Priority: identifier > email >    │
│   phone > source_id                 │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
   Found           Not Found
       │               │
       ▼               ▼
   Update          Create New
   Contact         Contact
```

### ContactInbox Bridge

```prisma
model SupportContactInbox {
  id              String    @id @default(cuid())
  contactId       String
  inboxId         String

  // Channel-specific identifier
  sourceId        String    // e.g., phone for WhatsApp, email for Email

  // Verification
  hmacVerified    Boolean   @default(false)

  contact         SupportContact @relation(fields: [contactId])
  inbox           SupportInbox @relation(fields: [inboxId])

  @@unique([inboxId, sourceId])
  @@index([contactId])
}
```

### Contact Merging

```typescript
interface ContactMergeService {
  merge(baseContact: Contact, mergeeContact: Contact): Promise<Contact>;

  // Process:
  // 1. Validate same account
  // 2. Merge attributes (base takes precedence)
  // 3. Reassign conversations
  // 4. Reassign messages
  // 5. Reassign contact_inboxes
  // 6. Delete mergee
}
```

### Custom Attributes

```prisma
model SupportCustomAttributeDefinition {
  id              String    @id @default(cuid())
  accountId       String

  attributeKey    String
  attributeDisplayName String
  attributeDisplayType AttributeType
  attributeModel  String    // 'contact_attribute' or 'conversation_attribute'

  defaultValue    String?
  attributeValues Json?     // For list type

  @@unique([accountId, attributeKey, attributeModel])
}

enum AttributeType {
  TEXT
  NUMBER
  LINK
  DATE
  LIST
  CHECKBOX
}
```

---

## 10. Widget SDK

### SDK Architecture

```
Host Website
     │
     ▼
┌─────────────────────────────────────┐
│   window.$chatwoot SDK              │
│   • Creates iframe                  │
│   • Manages postMessage             │
│   • Exposes public API              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Widget Iframe (Vue 3 SPA)         │
│   • Chat interface                  │
│   • Message history                 │
│   • File uploads                    │
│   • Pre-chat forms                  │
└─────────────────────────────────────┘
```

### SDK Public API

```typescript
interface ChatwootSDK {
  // Lifecycle
  run(config: WidgetConfig): void;

  // Visibility
  toggle(): void;
  open(): void;
  close(): void;

  // User identification
  setUser(identifier: string, user: UserData): void;
  resetUser(): void;

  // Custom attributes
  setCustomAttributes(attributes: Record<string, any>): void;
  deleteCustomAttribute(key: string): void;

  // Locale
  setLocale(locale: string): void;

  // Labels
  setLabel(label: string): void;
  removeLabel(label: string): void;

  // Conversation
  setConversationCustomAttributes(attributes: Record<string, any>): void;
}
```

### Widget Configuration

```typescript
interface WidgetConfig {
  // Required
  websiteToken: string;
  baseUrl: string;

  // Optional
  hideMessageBubble?: boolean;
  position?: 'left' | 'right';
  locale?: string;
  type?: 'standard' | 'expanded_bubble';
  widgetStyle?: 'standard' | 'flat';
  darkMode?: 'auto' | 'light' | 'dark';

  // Custom text
  launcherTitle?: string;

  // Feature flags
  showPopoutButton?: boolean;
}
```

### Pre-Chat Forms

```typescript
interface PreChatFormConfig {
  enabled: boolean;
  message: string;
  fields: PreChatField[];
}

interface PreChatField {
  name: string;           // email, name, phone_number, or custom
  type: 'email' | 'text' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];     // For select type
}
```

---

## 11. Reporting & Analytics

### Report Types

| Report | Description | Key Metrics |
|--------|-------------|-------------|
| **Conversation** | Overall activity | Total, incoming, outgoing, resolution time |
| **Agent** | Individual performance | Conversations, response time, resolutions |
| **Inbox** | Per-channel metrics | Volume, response time |
| **Team** | Team performance | Workload distribution |
| **Label** | By topic/category | Volume per label |
| **CSAT** | Satisfaction scores | Score, response rate |

### Key Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| **First Response Time** | First agent reply - Conversation created | Speed to first response |
| **Resolution Time** | Resolved - Created | Total handling time |
| **CSAT Score** | (Positive / Total) × 100 | Customer satisfaction |
| **Response Rate** | Responses / Surveys sent × 100 | Survey engagement |

### Conversation Metrics

```typescript
interface ConversationMetrics {
  // Volume
  conversationsCount: number;
  incomingMessagesCount: number;
  outgoingMessagesCount: number;

  // Time
  avgFirstResponseTime: number;  // seconds
  avgResolutionTime: number;     // seconds

  // Resolution
  resolutionsCount: number;
  botResolutionsCount: number;
  botHandoffsCount: number;

  // By status
  openConversations: number;
  unattendedConversations: number;
  unassignedConversations: number;
  pendingConversations: number;
}
```

### CSAT Tracking

```prisma
model SupportCSATResponse {
  id              String    @id @default(cuid())
  accountId       String
  conversationId  String
  messageId       String    // The CSAT survey message

  rating          Int       // 1-5
  feedbackText    String?

  contactId       String
  assignedAgentId String?

  createdAt       DateTime  @default(now())

  @@index([accountId])
  @@index([conversationId])
}
```

---

## 12. BM-Support Module Design

### Module Structure

```
.bmad/bm-support/
├── README.md
├── config.yaml
│
├── agents/                          # 8 Agents
│   │
│   │ # Core Agents
│   ├── support-orchestrator-agent.agent.yaml    # Hub
│   ├── conversation-manager-agent.agent.yaml   # Triage
│   ├── response-agent.agent.yaml               # Reply
│   ├── automation-agent.agent.yaml             # Automate
│   ├── quality-agent.agent.yaml                # Quality
│   │
│   │ # AI Assistants
│   ├── captain-agent.agent.yaml                # Captain (AI)
│   ├── knowledge-agent.agent.yaml              # Docs
│   └── escalation-agent.agent.yaml             # Escalate
│
├── workflows/                       # 10 Workflows
│   ├── setup-inbox/
│   ├── handle-conversation/
│   ├── route-conversation/
│   ├── respond-to-customer/
│   ├── create-automation/
│   ├── manage-canned-responses/
│   ├── configure-widget/
│   ├── run-csat-survey/
│   ├── generate-reports/
│   └── escalate-issue/
│
├── tasks/
│   ├── assign-conversation.xml
│   ├── merge-contacts.xml
│   ├── calculate-metrics.xml
│   ├── send-csat-survey.xml
│   └── apply-macro.xml
│
├── data/
│   ├── canned-response-templates.csv
│   ├── automation-rule-templates.csv
│   ├── sla-definitions.csv
│   └── escalation-paths.csv
│
└── _module-installer/
    └── install-config.yaml
```

---

## 13. Agent Architecture

### Agent Overview

| Agent | Code | Personality | Primary Role |
|-------|------|-------------|--------------|
| **Hub** | support-orchestrator | Organized, efficient | Coordinates all support activities |
| **Triage** | conversation-manager | Analytical, fair | Routes and assigns conversations |
| **Reply** | response-agent | Helpful, empathetic | Drafts and sends responses |
| **Automate** | automation-agent | Systematic, precise | Manages automation rules |
| **Quality** | quality-agent | Detail-oriented | Monitors quality and CSAT |
| **Captain** | captain-agent | Intelligent, helpful | AI-powered assistance |
| **Docs** | knowledge-agent | Knowledgeable | Manages knowledge base |
| **Escalate** | escalation-agent | Calm, decisive | Handles escalations |

### Agent Details

#### 1. Support Orchestrator (Hub)

**Purpose:** Master coordinator for all support activities

**Responsibilities:**
- Guide users through support setup
- Coordinate inbox creation and configuration
- Manage team and agent assignments
- Monitor overall support health

**Commands:**
- `*status` - Show support overview
- `*inbox` - Manage inboxes
- `*team` - Manage teams
- `*reports` - View reports
- `*settings` - Configure settings

---

#### 2. Conversation Manager (Triage)

**Purpose:** Routes and assigns conversations

**Capabilities:**
- Apply assignment policies
- Route to appropriate teams
- Prioritize conversations
- Handle transfers
- Balance workloads

---

#### 3. Response Agent (Reply)

**Purpose:** Drafts and sends customer responses

**Capabilities:**
- Draft responses using AI
- Apply canned responses
- Insert knowledge articles
- Format messages appropriately
- Handle multilingual responses

---

#### 4. Automation Agent (Automate)

**Purpose:** Manages automation rules and macros

**Capabilities:**
- Create automation rules
- Configure triggers and conditions
- Define action sequences
- Manage macros
- Monitor automation effectiveness

---

#### 5. Quality Agent (Quality)

**Purpose:** Monitors support quality and satisfaction

**Capabilities:**
- Send CSAT surveys
- Analyze satisfaction trends
- Identify improvement areas
- Track SLA compliance
- Generate quality reports

---

#### 6. Captain Agent (Captain)

**Purpose:** AI-powered assistant for agents and customers

**Capabilities:**
- Suggest responses
- Search knowledge base
- Summarize conversations
- Auto-categorize issues
- Provide next-action recommendations

**Integration:**
- Uses BYOAI for intelligence
- Integrates with knowledge base
- Supports copilot mode (agent assist)

---

#### 7. Knowledge Agent (Docs)

**Purpose:** Manages knowledge base content

**Capabilities:**
- Organize documentation
- Surface relevant articles
- Track article effectiveness
- Suggest content updates
- Enable self-service

---

#### 8. Escalation Agent (Escalate)

**Purpose:** Handles escalations and complex issues

**Capabilities:**
- Detect escalation triggers
- Route to senior agents
- Notify stakeholders
- Track escalation resolution
- Generate escalation reports

---

## 14. Workflow Definitions

### Core Workflows

#### 1. setup-inbox

**Purpose:** Create and configure a new inbox

**Steps:**
1. Select channel type
2. Configure channel credentials
3. Set greeting messages
4. Configure auto-assignment
5. Set up pre-chat form (if web widget)
6. Configure working hours
7. Enable CSAT if needed
8. Test connection

---

#### 2. handle-conversation

**Purpose:** Process a customer conversation

**Steps:**
1. Receive incoming message
2. Identify/create contact
3. Find/create conversation
4. Apply automation rules
5. Route to agent/team
6. Notify assigned agent
7. Track metrics

---

#### 3. route-conversation

**Purpose:** Assign conversation to appropriate agent

**Steps:**
1. Analyze conversation content
2. Check routing rules
3. Apply assignment policy
4. Find available agents
5. Assign conversation
6. Notify agent
7. Update status

---

#### 4. respond-to-customer

**Purpose:** Send response to customer

**Steps:**
1. Draft response
2. Apply canned responses
3. Attach files if needed
4. Review (if required)
5. Send message
6. Update conversation status

---

#### 5. create-automation

**Purpose:** Create automation rule

**Steps:**
1. Define trigger event
2. Set conditions
3. Define actions
4. Test rule
5. Activate rule
6. Monitor effectiveness

---

## 15. Integration with Platform

### Event Bus Integration

```typescript
// Events emitted by BM-Support
const supportEvents = {
  // Conversation lifecycle
  'support.conversation.created': { conversationId, inboxId, contactId },
  'support.conversation.assigned': { conversationId, assigneeId, teamId },
  'support.conversation.resolved': { conversationId, resolutionTime },

  // Message events
  'support.message.received': { messageId, conversationId, content },
  'support.message.sent': { messageId, conversationId, agentId },

  // CSAT events
  'support.csat.received': { conversationId, rating, feedback },

  // Contact events
  'support.contact.created': { contactId, email, phone },
  'support.contact.merged': { baseId, mergedId },
};

// Events consumed by BM-Support
const consumedEvents = {
  // From BM-Social
  'social.mention.detected': 'Create conversation from mention',
  'social.comment.received': 'Create conversation from comment',

  // From BM-CRM
  'crm.contact.updated': 'Sync contact data',

  // From platform
  'user.created': 'Create support agent',
};
```

### Cross-Module Integration

| Module | Integration Point |
|--------|-------------------|
| **BM-Social** | Social comments/DMs → Support conversations |
| **BM-CRM** | Contact sync, customer context |
| **BMX (Email)** | Email channel ingestion |
| **BMT** | Support metrics to unified analytics |

---

## 16. Social Channel Integration (BM-Social)

### Integration Architecture

```
BM-Social (Publishing & Engagement)
         │
         │ Echo agent detects:
         │ • @mentions
         │ • DM replies
         │ • Comments needing support
         │
         ▼
┌─────────────────────────────────────┐
│     Event: social.mention.detected  │
│     Event: social.comment.received  │
└──────────────┬──────────────────────┘
               │
               ▼
BM-Support (Unified Inbox)
         │
         │ • Creates conversation
         │ • Links to social post
         │ • Routes to agent
         │
         ▼
┌─────────────────────────────────────┐
│     Agent responds in BM-Support    │
│     Reply sent via BM-Social        │
└─────────────────────────────────────┘
```

### Social Channel Types

```prisma
// Social channels appear as inboxes in BM-Support
enum SupportChannelType {
  // ... existing channels

  // Social channels (bridged from BM-Social)
  SOCIAL_TWITTER
  SOCIAL_LINKEDIN
  SOCIAL_FACEBOOK
  SOCIAL_INSTAGRAM
  SOCIAL_THREADS
}
```

### Reply Flow

```
Agent replies in BM-Support
         │
         ▼
┌─────────────────────────────────────┐
│   BM-Support sends reply            │
│   via SocialChannel                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   BM-Social provider posts reply    │
│   to original platform              │
└─────────────────────────────────────┘
```

---

## 17. Implementation Recommendations

### Phase 1: MVP (Weeks 1-4)

**Focus:** Core inbox and web widget

1. **Data Layer**
   - Implement Account, Inbox, Conversation, Message, Contact models
   - Set up PostgreSQL with proper indexes

2. **Web Widget**
   - Build embeddable widget (React)
   - Implement SDK for embedding
   - Pre-chat forms
   - Real-time messaging

3. **Agent Dashboard**
   - Conversation list
   - Message thread view
   - Basic assignment

4. **Real-Time**
   - Socket.io integration
   - Typing indicators
   - Presence tracking

---

### Phase 2: Channels & Routing (Weeks 5-8)

**Focus:** Multi-channel and assignment

1. **Additional Channels**
   - Email (IMAP/SMTP)
   - WhatsApp (Cloud API)
   - SMS (Twilio)

2. **Routing & Assignment**
   - Round-robin assignment
   - Team-based routing
   - Agent capacity

3. **Automation**
   - Basic automation rules
   - Canned responses
   - Macros

---

### Phase 3: AI & Analytics (Weeks 9-12)

**Focus:** Intelligence and reporting

1. **Captain AI**
   - Response suggestions
   - Knowledge base search
   - Conversation summarization

2. **Reporting**
   - Conversation reports
   - Agent performance
   - CSAT tracking

3. **BM-Social Integration**
   - Social channel bridge
   - Unified social inbox

---

### Technical Decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| Channel architecture | Polymorphic pattern | Chatwoot proven approach |
| Real-time | Socket.io | Platform standard |
| Job queue | BullMQ | Platform standard |
| AI integration | BYOAI | User flexibility |
| Widget | React + iframe | Platform alignment |

---

## Appendix A: Chatwoot Source References

| Component | Path |
|-----------|------|
| Models | `app/models/` |
| Controllers | `app/controllers/api/v1/` |
| Channels | `app/models/channel/` |
| Jobs | `app/jobs/` |
| Widget | `app/javascript/widget/` |
| Dashboard | `app/javascript/dashboard/` |
| SDK | `app/javascript/sdk/` |

---

**Research Status:** Complete
**Next Action:** Create BM-Support PRD using `/bmad:bmm:workflows:prd`
**Owner:** AI Business Hub Team
**Last Updated:** 2025-12-17
