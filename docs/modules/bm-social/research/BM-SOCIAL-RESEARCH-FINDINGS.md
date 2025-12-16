# BM-Social Module Research Findings

**Module Code:** `bm-social`
**Research Date:** 2025-12-17
**Reference System:** Postiz (gitroomhq/postiz-app)
**Status:** Research Complete

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Reference Architecture Analysis (Postiz)](#2-reference-architecture-analysis-postiz)
3. [Core Data Models](#3-core-data-models)
4. [Social Media Provider Framework](#4-social-media-provider-framework)
5. [Post Scheduling System](#5-post-scheduling-system)
6. [Worker & Background Processing](#6-worker--background-processing)
7. [Calendar & Content Management UI](#7-calendar--content-management-ui)
8. [AI Capabilities](#8-ai-capabilities)
9. [Analytics System](#9-analytics-system)
10. [Multi-Tenant & Team Management](#10-multi-tenant--team-management)
11. [BM-Social Module Design](#11-bm-social-module-design)
12. [Agent Architecture](#12-agent-architecture)
13. [Workflow Definitions](#13-workflow-definitions)
14. [Integration with Platform](#14-integration-with-platform)
15. [Implementation Recommendations](#15-implementation-recommendations)

---

## 1. Executive Summary

### Purpose

BM-Social is an AI-powered social media management module that enables:
- **Multi-platform scheduling** across Twitter/X, LinkedIn, Facebook, Instagram, TikTok, YouTube, Pinterest, and Threads
- **AI content generation** for social posts, threads, and hooks
- **Content calendar management** with drag-drop scheduling
- **Analytics tracking** for post performance across platforms
- **Team collaboration** with role-based permissions
- **Automation** via auto-posting and AI agents

### Key Patterns from Postiz

| Pattern | Description | Adoption for BM-Social |
|---------|-------------|------------------------|
| **Provider Pattern** | Abstract base class + interface for each social platform | ✅ Adopt fully |
| **BullMQ Workers** | Background job processing for scheduled posts | ✅ Adopt (aligns with platform) |
| **Calendar Views** | Day/Week/Month views with drag-drop | ✅ Adopt UI patterns |
| **OAuth Integration** | Standard OAuth 2.0 flow with token refresh | ✅ Adopt with platform auth |
| **AI Copilot** | LangChain-based agent for content generation | ✅ Adapt for Agno agents |

### Tech Stack Alignment

| Postiz | AI Business Hub | Notes |
|--------|-----------------|-------|
| NestJS | NestJS | ✅ Direct alignment |
| Next.js | Next.js 15 | ✅ Direct alignment |
| Prisma + PostgreSQL | Prisma + PostgreSQL | ✅ Direct alignment |
| BullMQ + Redis | BullMQ + Redis | ✅ Direct alignment |
| OpenAI | BYOAI (multi-provider) | Adapt for user-provided keys |
| Mantine UI | shadcn/ui + Tailwind | Use existing platform components |

---

## 2. Reference Architecture Analysis (Postiz)

### Monorepo Structure

```
postiz-app/
├── apps/
│   ├── backend/          # NestJS API server
│   ├── frontend/         # Next.js web app
│   ├── workers/          # BullMQ job processing
│   ├── cron/             # Scheduled tasks
│   ├── extension/        # Browser extension
│   ├── sdk/              # Node.js SDK
│   └── commands/         # CLI tools
│
└── libraries/
    ├── nestjs-libraries/ # Shared backend (Prisma, integrations)
    └── helpers/          # Utility functions
```

### Key Architectural Decisions

1. **Separation of Concerns**
   - API server handles HTTP requests and business logic
   - Workers process background jobs (posting, webhooks)
   - Cron handles scheduled tasks (queue checks, cleanup)

2. **Provider Abstraction**
   - `SocialAbstract` base class provides common functionality
   - `SocialProvider` interface defines required methods
   - `IntegrationManager` acts as central registry

3. **State Machine for Posts**
   - `DRAFT` → `QUEUE` → `PUBLISHED` (or `ERROR`)
   - Clear transitions with error handling

4. **Multi-Tenancy**
   - Organization-based isolation
   - All resources scoped to `organizationId`

---

## 3. Core Data Models

### Post Model

```prisma
model SocialPost {
  id              String    @id @default(cuid())
  tenantId        String    // Multi-tenant isolation
  organizationId  String?   // Optional workspace scope

  // Content
  content         String    // Post text/HTML
  contentType     String    @default("text") // text, html, markdown
  mediaUrls       Json?     // Array of media attachments
  settings        Json?     // Platform-specific settings

  // Scheduling
  state           SocialPostState @default(DRAFT)
  publishDate     DateTime?
  publishedAt     DateTime?
  releaseUrl      String?   // URL of published post
  releaseId       String?   // Platform's post ID

  // Relationships
  integrationId   String    // FK to SocialIntegration
  integration     SocialIntegration @relation(fields: [integrationId])
  parentPostId    String?   // For threads
  parentPost      SocialPost? @relation("PostThread", fields: [parentPostId])
  childPosts      SocialPost[] @relation("PostThread")

  // Grouping
  group           String?   // UUID for multi-platform posts
  tags            SocialTag[] @relation("PostTags")

  // Recurring
  intervalInDays  Int?      // For recurring posts

  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String?

  @@index([tenantId])
  @@index([integrationId])
  @@index([state, publishDate])
  @@index([group])
}

enum SocialPostState {
  DRAFT
  QUEUE
  PUBLISHED
  ERROR
  CANCELLED
}
```

### Integration Model

```prisma
model SocialIntegration {
  id                String    @id @default(cuid())
  tenantId          String

  // Platform
  provider          SocialProvider
  providerAccountId String    // Platform's user/page ID
  name              String    // Display name
  handle            String?   // @username
  avatarUrl         String?

  // OAuth
  accessToken       String    @db.Text
  refreshToken      String?   @db.Text
  tokenExpiration   DateTime?
  scopes            String[]

  // Configuration
  disabled          Boolean   @default(false)
  refreshNeeded     Boolean   @default(false)
  postingTimes      Json?     // Preferred posting time slots
  additionalSettings Json?    // Platform-specific config

  // Relationships
  posts             SocialPost[]

  // Audit
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([tenantId, provider, providerAccountId])
  @@index([tenantId])
}

enum SocialProvider {
  TWITTER
  LINKEDIN
  LINKEDIN_PAGE
  FACEBOOK
  INSTAGRAM
  TIKTOK
  YOUTUBE
  PINTEREST
  THREADS
  BLUESKY
  MASTODON
}
```

### Content Calendar Model

```prisma
model SocialCalendarSlot {
  id              String    @id @default(cuid())
  tenantId        String
  integrationId   String

  dayOfWeek       Int       // 0-6 (Sunday-Saturday)
  hour            Int       // 0-23
  minute          Int       // 0-59

  isActive        Boolean   @default(true)

  integration     SocialIntegration @relation(fields: [integrationId])

  @@unique([integrationId, dayOfWeek, hour, minute])
  @@index([tenantId])
}
```

### Analytics Model

```prisma
model SocialAnalyticsSnapshot {
  id              String    @id @default(cuid())
  tenantId        String
  integrationId   String
  postId          String?   // Optional - for post-level analytics

  // Metrics
  metricType      String    // impressions, likes, shares, etc.
  value           Float
  date            DateTime  @db.Date

  // Audit
  collectedAt     DateTime  @default(now())

  @@unique([integrationId, postId, metricType, date])
  @@index([tenantId])
  @@index([integrationId, date])
}
```

---

## 4. Social Media Provider Framework

### Provider Interface

```typescript
interface SocialProvider {
  // Identity
  identifier: SocialProviderType;
  name: string;

  // Configuration
  scopes: string[];
  maxLength: () => number;
  maxConcurrentJob: number;
  isBetweenSteps: boolean; // Needs additional setup after OAuth
  editor: 'normal' | 'markdown' | 'html';

  // Optional
  dto?: Type<any>; // Platform-specific settings DTO
  customFields?: () => CustomField[];

  // Authentication
  generateAuthUrl(state: string): Promise<AuthUrlResult>;
  authenticate(code: string, state: string): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<TokenResult>;

  // Posting
  post(integration: Integration, post: Post): Promise<PostResult>;

  // Analytics
  analytics(integration: Integration, days: number): Promise<AnalyticsData[]>;
}
```

### Base Abstract Class

```typescript
abstract class SocialAbstract {
  // HTTP utilities
  protected async fetch(url: string, options: RequestInit): Promise<Response>;

  // Rate limiting
  protected rateLimiter: RateLimiter;

  // Error handling
  protected handleErrors(response: Response): Promise<void>;

  // OAuth helpers
  protected buildOAuthUrl(config: OAuthConfig): string;
  protected exchangeCodeForToken(code: string, config: OAuthConfig): Promise<TokenResult>;

  // Media upload helpers
  protected uploadMedia(file: Buffer, mimeType: string): Promise<string>;
}
```

### Platform-Specific Implementations

| Provider | Max Concurrent | Max Length | Special Features |
|----------|----------------|------------|------------------|
| Twitter/X | 1 | 280/25000 (Premium) | Threads, polls |
| LinkedIn | 2 | 3000 | Documents, carousels |
| LinkedIn Page | 2 | 3000 | Company pages |
| Facebook | 10 | 63206 | Pages, groups |
| Instagram | 10 | 2200 | Reels, stories, carousels |
| TikTok | 1 | 4000 | Video focus, duets |
| YouTube | 1 | 5000 | Video uploads, shorts |
| Pinterest | 5 | 500 | Pins, boards |
| Threads | 5 | 500 | Text posts, images |

### Adding New Providers

1. Create provider class extending `SocialAbstract`
2. Implement `SocialProvider` interface
3. Register in `IntegrationManager`
4. Add environment variables for OAuth credentials
5. Create frontend settings component if needed

---

## 5. Post Scheduling System

### Post States & Transitions

```
                    ┌─────────────────┐
                    │     DRAFT       │
                    │ (User editing)  │
                    └────────┬────────┘
                             │ Schedule/Publish
                             ▼
                    ┌─────────────────┐
                    │     QUEUE       │
                    │ (Waiting)       │
                    └────────┬────────┘
                             │ Worker picks up
                             ▼
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │   PUBLISHED     │          │     ERROR       │
     │   (Success)     │          │   (Failed)      │
     └─────────────────┘          └────────┬────────┘
                                           │ Retry
                                           ▼
                                  ┌─────────────────┐
                                  │     QUEUE       │
                                  │   (Retry)       │
                                  └─────────────────┘
```

### Scheduling Workflow

1. **Post Creation**
   - User creates/edits post content
   - Selects target integrations (platforms)
   - Sets publish date/time or "now"
   - Post saved with `state = DRAFT` or `state = QUEUE`

2. **Queue Emission**
   - If `publishDate` is future, job emitted to BullMQ with delay
   - Delay calculated: `publishDate - now`

3. **Cron Safety Nets**
   - `CheckMissingQueues`: Hourly check for posts not in queue
   - `PostNowPendingQueues`: Every 16 min check for stuck posts

4. **Post Execution**
   - Worker picks up job
   - Validates integration (token valid, not disabled)
   - Calls provider's `post()` method
   - Updates state to `PUBLISHED` or `ERROR`
   - Sends notifications

5. **Recurring Posts**
   - If `intervalInDays` set, new job emitted for next occurrence

### Multi-Platform Posting

- Posts grouped by `group` UUID
- Each platform gets its own `Post` record
- Content can be customized per platform
- Threads supported via `parentPostId`

---

## 6. Worker & Background Processing

### Job Types

| Queue | Purpose | Concurrency |
|-------|---------|-------------|
| `post` | Publish posts to social platforms | 300 |
| `sendDigestEmail` | Send email digests | 10 |
| `webhooks` | Fire webhook notifications | 50 |
| `cron` | Auto-posting triggers | 10 |
| `internal-plugs` | Internal automation | 20 |
| `plugs` | External automation | 20 |

### Worker Configuration

```typescript
const workerConfig = {
  concurrency: 300,
  stalledInterval: 30000,
  maxStalledCount: 10,
  removeOnComplete: { count: 0 },
  removeOnFail: { count: 0 },
};
```

### Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `CheckMissingQueues` | `0 * * * *` (hourly) | Find missing scheduled posts |
| `PostNowPendingQueues` | `*/16 * * * *` | Process stuck pending posts |
| `TokenRefresh` | `0 */6 * * *` | Refresh expiring tokens |
| `AnalyticsCollection` | `0 2 * * *` | Collect daily analytics |

---

## 7. Calendar & Content Management UI

### Calendar Views

| View | Display | Features |
|------|---------|----------|
| **Day** | Single day, hourly slots | Detailed hour-by-hour view |
| **Week** | 7-day grid, hourly slots | Overview of week's content |
| **Month** | 42-day grid (6 weeks) | High-level monthly planning |

### UI Components

```typescript
// Calendar Context - manages global state
interface CalendarContext {
  posts: Post[];
  integrations: Integration[];
  filters: CalendarFilters;
  selectedDate: Date;
  view: 'day' | 'week' | 'month';

  // Actions
  setView: (view: ViewType) => void;
  setFilters: (filters: Partial<CalendarFilters>) => void;
  refreshPosts: () => Promise<void>;
}

// Calendar Item - individual post display
interface CalendarItemProps {
  post: Post;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onViewStats: () => void;
}
```

### Drag-and-Drop Scheduling

- Posts are draggable via `useDrag` hook
- Calendar cells are drop targets via `useDrop`
- On drop: update `publishDate` via API
- Prevent drops in the past

### Time Slots Management

- Integrations have configurable posting times
- Time slots define preferred hours for auto-scheduling
- UI: `TimeTable` component for editing slots

---

## 8. AI Capabilities

### Content Generation

| Feature | Description | API |
|---------|-------------|-----|
| **Post Generation** | Generate social posts from topic/content | OpenAI GPT-4 |
| **Thread Generation** | Break long content into thread | OpenAI GPT-4 |
| **Hook Generation** | Create engaging opening lines | OpenAI GPT-4 |
| **Image Generation** | Create images from prompts | DALL-E 3 |
| **Content Extraction** | Extract article content for social | OpenAI GPT-4 |

### AI Agent Architecture (Postiz)

```typescript
// Copilot Runtime with Mastra Agent
interface CopilotAgent {
  // Research
  performResearch(topic: string): Promise<ResearchResult>;

  // Content
  generateContent(context: ContentContext): Promise<string>;
  findPopularPosts(niche: string): Promise<Post[]>;

  // Scheduling
  schedulePost(post: PostInput): Promise<ScheduleResult>;
}

// Agent Graph (LangChain)
const agentGraph = StateGraph({
  nodes: {
    research: TavilySearchResults,
    classify: ContentClassifier,
    generate: ContentGenerator,
    schedule: PostScheduler,
  },
  edges: {
    research -> classify,
    classify -> generate,
    generate -> schedule,
  }
});
```

### Auto-Posting

- Configurable auto-post rules
- AI generates content + images automatically
- Scheduled via cron jobs
- Requires approval queue integration

---

## 9. Analytics System

### Metrics by Platform

| Platform | Metrics Collected |
|----------|-------------------|
| Twitter/X | impressions, likes, retweets, replies, bookmarks, quotes |
| LinkedIn | page_views, clicks, shares, engagement, comments, followers |
| Facebook | impressions, engagements, follows, video_views |
| Instagram | reach, likes, views, comments, shares, saves |
| YouTube | views, watch_time, avg_duration, subscribers, likes |
| TikTok | views, likes, comments, shares |
| Pinterest | impressions, clicks, saves, engagement |
| Threads | views, likes, replies, reposts, quotes |

### Analytics Data Format

```typescript
interface AnalyticsData {
  label: string;           // Display name (e.g., "Impressions")
  percentageChange?: number; // vs previous period
  average?: boolean;       // Is this an average metric
  data: {
    total: number;
    date: string;          // YYYY-MM-DD
  }[];
}
```

### Analytics Flow

1. Frontend requests `/analytics/:integrationId?days=N`
2. Backend calls provider's `analytics()` method
3. Provider fetches from platform API
4. Data transformed to standard `AnalyticsData` format
5. Returned to frontend for display

### Analytics Storage Strategy

- **Real-time**: Fetch on-demand from platforms
- **Historical**: Store daily snapshots for trends
- **Aggregated**: Pre-compute weekly/monthly rollups

---

## 10. Multi-Tenant & Team Management

### Organization Model

```prisma
model SocialWorkspace {
  id          String    @id @default(cuid())
  tenantId    String    // Platform tenant
  name        String

  // Team
  members     SocialWorkspaceMember[]

  // Resources
  integrations SocialIntegration[]
  posts        SocialPost[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([tenantId])
}

model SocialWorkspaceMember {
  id            String    @id @default(cuid())
  workspaceId   String
  userId        String
  role          SocialWorkspaceRole

  workspace     SocialWorkspace @relation(fields: [workspaceId])

  @@unique([workspaceId, userId])
}

enum SocialWorkspaceRole {
  OWNER       // Full access, billing
  ADMIN       // Manage team, integrations
  EDITOR      // Create/edit posts
  VIEWER      // Read-only
}
```

### Permission Matrix

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| View posts | ✅ | ✅ | ✅ | ✅ |
| Create posts | ✅ | ✅ | ✅ | ❌ |
| Edit own posts | ✅ | ✅ | ✅ | ❌ |
| Edit all posts | ✅ | ✅ | ❌ | ❌ |
| Delete posts | ✅ | ✅ | Own only | ❌ |
| Manage integrations | ✅ | ✅ | ❌ | ❌ |
| Manage team | ✅ | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅ |

---

## 11. BM-Social Module Design

### Module Structure

```
.bmad/bm-social/
├── README.md
├── config.yaml
│
├── agents/                          # 15 Agents (6 Core + 9 Platform Specialists)
│   │
│   │ # Core Agents
│   ├── social-orchestrator-agent.agent.yaml    # Conductor
│   ├── content-strategist-agent.agent.yaml     # Spark
│   ├── scheduler-agent.agent.yaml              # Tempo
│   ├── analytics-agent.agent.yaml              # Pulse
│   ├── engagement-agent.agent.yaml             # Echo
│   ├── trend-scout-agent.agent.yaml            # Scout
│   │
│   │ # Platform Specialists
│   ├── twitter-specialist-agent.agent.yaml     # Chirp
│   ├── linkedin-specialist-agent.agent.yaml    # Link
│   ├── facebook-specialist-agent.agent.yaml    # Meta
│   ├── instagram-specialist-agent.agent.yaml   # Gram
│   ├── tiktok-specialist-agent.agent.yaml      # Tok
│   ├── youtube-specialist-agent.agent.yaml     # Tube
│   ├── pinterest-specialist-agent.agent.yaml   # Pin
│   ├── threads-specialist-agent.agent.yaml     # Thread
│   └── bluesky-specialist-agent.agent.yaml     # Blue
│
├── workflows/                       # 8 Workflows
│   ├── connect-platform/
│   ├── create-post/
│   ├── schedule-content/
│   ├── generate-content/
│   ├── analyze-performance/
│   ├── manage-calendar/
│   ├── bulk-schedule/
│   └── content-repurpose/
│
├── tasks/                           # 5 Tasks
│   ├── validate-post.xml
│   ├── check-optimal-times.xml
│   ├── generate-hashtags.xml
│   ├── resize-media.xml
│   └── extract-analytics.xml
│
├── data/
│   ├── platform-specs.csv           # Character limits, image sizes, etc.
│   ├── optimal-posting-times.csv    # Best times per platform
│   ├── hashtag-categories.csv       # Hashtag research data
│   ├── content-templates.csv        # Platform-specific templates
│   └── platform-strategies.csv      # Optimization strategies per platform
│
└── _module-installer/
    └── install-config.yaml
```

---

## 12. Agent Architecture

### Hybrid Agent Model

BM-Social uses a **hybrid agent architecture** with core operational agents plus platform-specific content specialists. This ensures deep expertise for each platform's unique requirements, optimization strategies, and content formats.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ORCHESTRATION LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Conductor  │  │    Tempo    │  │    Pulse    │  │    Echo     │        │
│  │(Orchestrate)│  │ (Schedule)  │  │ (Analytics) │  │(Engagement) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTENT STRATEGY LAYER                             │
│                    ┌─────────────┐  ┌─────────────┐                         │
│                    │    Spark    │  │    Scout    │                         │
│                    │ (Strategist)│  │  (Trends)   │                         │
│                    └──────┬──────┘  └─────────────┘                         │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │ Delegates to
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PLATFORM SPECIALIST LAYER                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ Chirp  │ │  Link  │ │  Meta  │ │  Gram  │ │  Tok   │ │  Tube  │        │
│  │Twitter │ │LinkedIn│ │Facebook│ │ Insta  │ │ TikTok │ │YouTube │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
│  ┌────────┐ ┌────────┐ ┌────────┐                                          │
│  │  Pin   │ │ Thread │ │  Blue  │                                          │
│  │Pintrest│ │ Threads│ │Bluesky │                                          │
│  └────────┘ └────────┘ └────────┘                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Overview

#### Core Agents (6)

| Agent | Code | Personality | Primary Role |
|-------|------|-------------|--------------|
| **Conductor** | social-orchestrator | Strategic, organized | Coordinates all social activities |
| **Spark** | content-strategist | Creative, brand-focused | Content strategy & delegation |
| **Tempo** | scheduler | Precise, analytical | Manages posting schedules |
| **Pulse** | analytics | Data-driven, insightful | Analyzes performance |
| **Echo** | engagement | Responsive, social | Manages engagement |
| **Scout** | trend-scout | Curious, connected | Identifies trends |

#### Platform Specialists (9)

| Agent | Code | Platform | Specializations |
|-------|------|----------|-----------------|
| **Chirp** | twitter-specialist | Twitter/X | Threads, hooks, viral tactics, engagement bait |
| **Link** | linkedin-specialist | LinkedIn | B2B tone, thought leadership, carousels, articles |
| **Meta** | facebook-specialist | Facebook | Pages, groups, community building, events |
| **Gram** | instagram-specialist | Instagram | Visual-first, Reels, Stories, carousel flow, hashtag sets |
| **Tok** | tiktok-specialist | TikTok | Trend-jacking, hooks, native style, duets, sounds |
| **Tube** | youtube-specialist | YouTube | Titles, thumbnails, descriptions, Shorts, tags |
| **Pin** | pinterest-specialist | Pinterest | Pins, boards, SEO, visual search optimization |
| **Thread** | threads-specialist | Threads | Conversational, cross-posting, engagement |
| **Blue** | bluesky-specialist | Bluesky/Mastodon | Decentralized, community norms, federation |

---

### Core Agent Details

#### 1. Social Orchestrator (Conductor)

**Purpose:** Master coordinator for all social media activities

**Responsibilities:**
- Guide users through social media strategy
- Coordinate content creation and scheduling
- Ensure cross-platform consistency
- Manage approval workflows
- Route requests to appropriate specialists

**Commands:**
- `*status` - Show social media overview
- `*schedule` - Open scheduling workflow
- `*create` - Create new content
- `*analyze` - View analytics
- `*connect` - Connect new platform

---

#### 2. Content Strategist (Spark)

**Purpose:** Creative director for social content strategy

**Responsibilities:**
- Maintain brand voice consistency
- Develop content themes and campaigns
- Delegate to platform specialists
- Review and approve specialist output
- Ensure cross-platform coherence

**Workflow:**
1. Receives content brief or topic
2. Develops strategic angle
3. Delegates to relevant platform specialists
4. Reviews platform-specific versions
5. Approves for scheduling

**AI Integration:**
- Uses BYOAI for creative ideation
- References BM-Brand voice guidelines
- Maintains content library patterns

---

#### 3. Scheduler (Tempo)

**Purpose:** Optimize posting schedules for maximum engagement

**Capabilities:**
- Find optimal posting times per platform
- Manage unified content calendar
- Handle recurring schedules
- Balance posting frequency across platforms
- Prevent posting conflicts and oversaturation

**Intelligence:**
- Learns from past performance data
- Considers audience timezone distribution
- Adapts to platform algorithm changes
- Coordinates multi-platform launches

---

#### 4. Analytics Agent (Pulse)

**Purpose:** Track and analyze social media performance

**Capabilities:**
- Collect metrics from all platforms
- Generate unified performance reports
- Identify top-performing content patterns
- Track follower growth trends
- Benchmark against goals and competitors

**Reports:**
- Daily/weekly/monthly summaries
- Platform comparisons
- Content type analysis
- Engagement trend analysis
- ROI tracking

---

#### 5. Engagement Agent (Echo)

**Purpose:** Monitor and respond to social interactions

**Capabilities:**
- Track mentions and comments across platforms
- Suggest response templates by context
- Flag urgent items for human review
- Identify engagement opportunities
- Monitor brand sentiment

**Automation:**
- Queue responses for approval
- Alert on negative sentiment
- Identify influencer interactions
- Track conversation threads

---

#### 6. Trend Scout (Scout)

**Purpose:** Identify trending topics and opportunities

**Capabilities:**
- Monitor trending hashtags per platform
- Track competitor activity and content
- Identify viral content patterns
- Suggest timely content ideas
- Research industry news and events

**Sources:**
- Platform trend APIs
- News aggregators
- Competitor feeds
- Industry RSS/newsletters

---

### Platform Specialist Details

#### Chirp (Twitter/X Specialist)

**Platform Expertise:**
- Character limits: 280 standard, 25,000 premium
- Thread construction and flow
- Quote tweet strategies
- Engagement timing patterns

**Content Specializations:**
- Hook writing (first line optimization)
- Thread narrative structure
- Viral content patterns
- Engagement bait tactics
- Poll creation
- Space/audio content

**Optimization Strategies:**
- First 7 words critical for engagement
- Thread length sweet spots (5-10 tweets)
- Optimal posting times by audience
- Hashtag usage (1-2 max)
- Reply chain management

---

#### Link (LinkedIn Specialist)

**Platform Expertise:**
- Character limit: 3,000 for posts
- Professional tone requirements
- Algorithm preferences (dwell time, early engagement)
- Document/carousel formats

**Content Specializations:**
- Thought leadership posts
- Professional storytelling
- Carousel/document creation
- Article formatting
- Company page content
- Event promotion

**Optimization Strategies:**
- Hook + whitespace formatting
- "Broetry" style vs. long-form
- Engagement pod awareness
- Best posting times (Tue-Thu mornings)
- Hashtag strategy (3-5 targeted)
- Comment engagement importance

---

#### Meta (Facebook Specialist)

**Platform Expertise:**
- Character limit: 63,206
- Page vs. Group dynamics
- Algorithm changes and reach
- Video and Reels formats

**Content Specializations:**
- Page post optimization
- Group engagement
- Event creation and promotion
- Live video content
- Marketplace integration
- Community building

**Optimization Strategies:**
- Native video preference
- Engagement within first hour
- Group posting etiquette
- Event promotion timing
- Cross-posting considerations

---

#### Gram (Instagram Specialist)

**Platform Expertise:**
- Caption limit: 2,200 characters
- Hashtag limit: 30 (recommend 5-10)
- Visual-first platform
- Multiple content formats

**Content Specializations:**
- Feed post aesthetics
- Carousel storytelling (up to 10 slides)
- Reels creation and trends
- Stories strategy
- IGTV/long-form video
- Highlights curation

**Optimization Strategies:**
- First line hook (before "more")
- Carousel engagement patterns
- Hashtag research and sets
- Posting time optimization
- Alt text for accessibility
- Collab post features

---

#### Tok (TikTok Specialist)

**Platform Expertise:**
- Caption limit: 4,000 characters
- Video-first platform
- Algorithm: For You Page optimization
- Sound and trend integration

**Content Specializations:**
- Trend-jacking and timing
- Hook-first video structure
- Native TikTok style
- Sound selection
- Duet and stitch content
- Live streaming

**Optimization Strategies:**
- First 3 seconds critical
- Trend participation timing
- Hashtag strategy (#fyp myths)
- Posting frequency (1-3/day)
- Engagement patterns
- Cross-platform repurposing

---

#### Tube (YouTube Specialist)

**Platform Expertise:**
- Title limit: 100 characters
- Description limit: 5,000 characters
- Thumbnail importance
- SEO and search optimization

**Content Specializations:**
- Long-form video content
- YouTube Shorts
- Community posts
- Thumbnail design briefs
- Title optimization
- Description and tags

**Optimization Strategies:**
- CTR optimization (title + thumbnail)
- Watch time importance
- First 30 seconds retention
- End screen and cards
- Playlist strategy
- Shorts vs. long-form balance

---

#### Pin (Pinterest Specialist)

**Platform Expertise:**
- Description limit: 500 characters
- Visual search platform
- SEO importance
- Board organization

**Content Specializations:**
- Pin design best practices
- Board curation
- Idea Pins (multi-page)
- Rich pins setup
- Shopping integration

**Optimization Strategies:**
- Vertical image format (2:3)
- Keyword-rich descriptions
- Board SEO
- Seasonal content timing
- Link optimization
- Fresh pin importance

---

#### Thread (Threads Specialist)

**Platform Expertise:**
- Character limit: 500
- Instagram integration
- Conversational nature
- Cross-posting dynamics

**Content Specializations:**
- Conversational content
- Instagram cross-promotion
- Community engagement
- Reply threading

**Optimization Strategies:**
- Authentic voice importance
- Cross-posting from Instagram
- Engagement timing
- Community norms

---

#### Blue (Bluesky/Mastodon Specialist)

**Platform Expertise:**
- Decentralized protocols
- Community-driven norms
- Federation dynamics
- Alt-text expectations

**Content Specializations:**
- Community-appropriate content
- Federation-aware posting
- CW (content warning) usage
- Thread formatting

**Optimization Strategies:**
- Community norms respect
- Anti-engagement bait culture
- Alt-text requirements
- Instance/server awareness
- Hashtag conventions

---

### Agent Collaboration Flow

```
User Request: "Create content about our new product launch"
                              │
                              ▼
                    ┌─────────────────┐
                    │    Conductor    │
                    │  (Orchestrate)  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │      Scout      │          │      Spark      │
     │ (Check trends)  │          │ (Strategy)      │
     └────────┬────────┘          └────────┬────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                             ▼
     ┌───────────────────────────────────────────────┐
     │           Platform Specialists                 │
     │  Chirp │ Link │ Gram │ Tok │ Tube │ etc.     │
     │  (Create platform-optimized versions)         │
     └────────────────────┬──────────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │       Spark         │
              │ (Review & approve)  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │       Tempo         │
              │ (Schedule optimal)  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Approval Queue    │
              │  (If confidence <85)│
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │      Published      │
              │  (Multi-platform)   │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │       Pulse         │
              │ (Track performance) │
              └─────────────────────┘
```

---

### Agent Count Summary

| Layer | Agents | Count |
|-------|--------|-------|
| **Core** | Conductor, Spark, Tempo, Pulse, Echo, Scout | 6 |
| **Platform** | Chirp, Link, Meta, Gram, Tok, Tube, Pin, Thread, Blue | 9 |
| **Total** | | **15** |

---

## 13. Workflow Definitions

### Core Workflows

#### 1. connect-platform

**Purpose:** Connect a new social media account

**Steps:**
1. Select platform (Twitter, LinkedIn, etc.)
2. Initiate OAuth flow
3. Complete authorization
4. Configure posting preferences
5. Set up time slots
6. Test connection

---

#### 2. create-post

**Purpose:** Create and publish/schedule a social post

**Steps:**
1. Select target platforms
2. Enter or generate content
3. Add media (images, video)
4. Configure platform-specific settings
5. Preview on each platform
6. Choose: publish now, schedule, or save draft

---

#### 3. schedule-content

**Purpose:** Schedule a post for future publishing

**Steps:**
1. Select post or create new
2. Choose scheduling method:
   - Specific date/time
   - Next available slot
   - Auto-optimal time
3. Set timezone
4. Add to queue
5. Confirm scheduling

---

#### 4. generate-content

**Purpose:** AI-generate social content from input

**Steps:**
1. Provide topic or source content
2. Select target platforms
3. Choose tone and style
4. Generate variations
5. Edit and refine
6. Approve for scheduling

---

#### 5. analyze-performance

**Purpose:** Review social media analytics

**Steps:**
1. Select date range
2. Choose platforms/accounts
3. View key metrics
4. Identify top performers
5. Generate insights
6. Export report

---

#### 6. manage-calendar

**Purpose:** View and manage content calendar

**Steps:**
1. Open calendar view (day/week/month)
2. Filter by platform/status
3. Drag-drop to reschedule
4. Bulk actions on selected
5. Identify gaps
6. Fill with suggested content

---

#### 7. bulk-schedule

**Purpose:** Schedule multiple posts at once

**Steps:**
1. Import content (CSV, text)
2. Map to platforms
3. Set scheduling rules
4. Preview all posts
5. Confirm bulk schedule
6. Monitor queue

---

#### 8. content-repurpose

**Purpose:** Adapt content across platforms

**Steps:**
1. Select source content
2. Choose target platforms
3. Generate platform-optimized versions
4. Adjust media for dimensions
5. Review variations
6. Schedule across platforms

---

## 14. Integration with Platform

### Event Bus Integration

```typescript
// Events emitted by BM-Social
const socialEvents = {
  // Post lifecycle
  'social.post.created': { postId, platforms, scheduledFor },
  'social.post.scheduled': { postId, integrationId, publishDate },
  'social.post.published': { postId, integrationId, releaseUrl },
  'social.post.failed': { postId, integrationId, error },

  // Integration
  'social.integration.connected': { integrationId, provider },
  'social.integration.disconnected': { integrationId, reason },
  'social.integration.refreshed': { integrationId },

  // Analytics
  'social.analytics.collected': { integrationId, date, metrics },

  // Engagement
  'social.mention.detected': { integrationId, mentionId, sentiment },
  'social.comment.received': { integrationId, postId, commentId },
};

// Events consumed by BM-Social
const consumedEvents = {
  'content.article.published': 'Suggest social posts for new content',
  'brand.guidelines.updated': 'Update content generation prompts',
  'crm.contact.created': 'Tag for social outreach',
};
```

### Approval Queue Integration

```typescript
interface SocialApprovalItem {
  type: 'social.post';
  action: 'publish' | 'schedule' | 'auto-generate';

  data: {
    postId: string;
    content: string;
    platforms: string[];
    scheduledFor?: Date;
    generatedBy?: 'ai' | 'human';
  };

  // Confidence-based routing
  confidence: number; // 0-100
  // >85: Auto-approve
  // 60-85: Quick review
  // <60: Full review
}
```

### Cross-Module Integration

| Module | Integration Point |
|--------|-------------------|
| **BMC (Content)** | Auto-generate social from published articles |
| **BM-Brand** | Apply brand voice to generated content |
| **BM-CRM** | Tag contacts for social outreach |
| **BMT (Analytics)** | Feed social metrics to unified dashboard |
| **BMX (Email)** | Cross-promote newsletter content |

---

## 15. Implementation Recommendations

### Phase 1: MVP (Weeks 1-4)

**Focus:** Core posting and scheduling

1. **Data Layer**
   - Implement Post, Integration, CalendarSlot models
   - Create provider abstraction framework
   - Set up BullMQ workers

2. **Providers (Start with 3)**
   - Twitter/X
   - LinkedIn
   - Facebook

3. **Core UI**
   - Connect account flow
   - Create post form
   - Simple calendar view
   - Post list/grid

4. **Agents (2)**
   - Social Orchestrator
   - Content Creator

---

### Phase 2: Enhanced Features (Weeks 5-8)

**Focus:** AI and calendar management

1. **Additional Providers**
   - Instagram
   - TikTok
   - YouTube

2. **Calendar Enhancements**
   - Drag-drop scheduling
   - Time slot management
   - Week/Month views

3. **AI Features**
   - Content generation
   - Hashtag suggestions
   - Optimal time analysis

4. **Agents (2)**
   - Scheduler
   - Analytics

---

### Phase 3: Advanced (Weeks 9-12)

**Focus:** Analytics and engagement

1. **Remaining Providers**
   - Pinterest
   - Threads
   - Bluesky/Mastodon

2. **Analytics Dashboard**
   - Platform metrics
   - Post performance
   - Trend analysis

3. **Engagement Features**
   - Mention monitoring
   - Comment management
   - Sentiment analysis

4. **Agents (2)**
   - Engagement
   - Trend Scout

---

### Technical Decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| Provider tokens | Encrypted in DB | Security + multi-tenant |
| Worker queue | BullMQ | Platform standard |
| Calendar state | Zustand + SWR | Match Postiz pattern |
| AI provider | BYOAI | User flexibility |
| Analytics storage | Daily snapshots | Balance freshness/cost |

### Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Platform API changes | Abstract provider layer |
| Rate limits | Per-provider concurrency limits |
| Token expiration | Proactive refresh cron |
| Post failures | Retry with backoff, error state |
| AI content quality | Approval queue, confidence scoring |

---

## Appendix A: Platform API References

| Platform | API Documentation |
|----------|-------------------|
| Twitter/X | https://developer.twitter.com/en/docs |
| LinkedIn | https://learn.microsoft.com/en-us/linkedin/ |
| Facebook | https://developers.facebook.com/docs/ |
| Instagram | https://developers.facebook.com/docs/instagram-api/ |
| TikTok | https://developers.tiktok.com/doc/ |
| YouTube | https://developers.google.com/youtube/v3 |
| Pinterest | https://developers.pinterest.com/docs/ |
| Threads | https://developers.facebook.com/docs/threads/ |

---

## Appendix B: Postiz Source References

| Component | Path |
|-----------|------|
| Provider Framework | `libraries/nestjs-libraries/src/integrations/` |
| Post Service | `apps/backend/src/api/routes/posts/` |
| Calendar UI | `apps/frontend/src/components/calendar/` |
| Worker | `apps/workers/src/` |
| Cron | `apps/cron/src/` |
| AI Services | `libraries/nestjs-libraries/src/openai/` |

---

**Research Status:** Complete
**Next Action:** Create BM-Social PRD using `/bmad:bmm:workflows:prd`
**Owner:** AI Business Hub Team
**Last Updated:** 2025-12-17
