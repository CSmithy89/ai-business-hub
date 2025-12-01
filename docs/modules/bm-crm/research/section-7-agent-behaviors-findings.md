# Section 7: CRM Agent Behaviors - Research Findings

**Research Date:** 2025-11-30
**Status:** Complete
**Sources:** Industry Best Practices, Microsoft Design, Agentic AI Research

---

## Summary

CRM agent behaviors must balance helpfulness with user autonomy. Based on research, we recommend a hybrid proactive-reactive model with layered notification urgency, user-configurable proactiveness, and clear feedback mechanisms.

---

## 1. Agent Behavior Models

### 1.1 Proactive vs Reactive Spectrum

| Mode | Description | When to Use | Risk |
|------|-------------|-------------|------|
| **Fully Reactive** | Wait for user to ask | Complex analysis, research | May miss opportunities |
| **Suggestion-Based** | Offer options, user decides | Most CRM actions | Notification fatigue |
| **Semi-Autonomous** | Act with approval prompt | Routine automations | User feels watched |
| **Fully Autonomous** | Act without prompt, log action | Low-risk background tasks | Loss of control |

**Reference:** [Reactive vs Proactive AI](https://www.fullstory.com/blog/the-two-sides-of-ai/) | [Proactive AI Chat](https://www.rezolve.ai/blog/proactive-ai-chat-assistants-vs-reactive-support)

### 1.2 Recommended Behavior Model

```typescript
interface AgentBehaviorConfig {
  agentId: string;

  // Behavior mode
  defaultMode: 'reactive' | 'suggestive' | 'semi_autonomous' | 'autonomous';

  // Action-specific overrides
  actionModes: {
    [actionType: string]: {
      mode: 'reactive' | 'suggestive' | 'semi_autonomous' | 'autonomous';
      approvalRequired: boolean;
      notificationLevel: NotificationLevel;
    };
  };

  // User preferences
  proactivenessLevel: number;      // 0-100 slider
  quietHoursEnabled: boolean;
  quietHoursStart: string;         // "18:00"
  quietHoursEnd: string;           // "09:00"

  // Learning
  learnFromFeedback: boolean;
  adjustProactivenessAutomatically: boolean;
}
```

### 1.3 Per-Agent Default Modes

| Agent | Default Mode | Rationale |
|-------|--------------|-----------|
| **Scout (LeadScorer)** | Autonomous | Background scoring, low-risk |
| **Atlas (DataEnricher)** | Reactive | Cost implications, user-triggered |
| **Flow (Pipeline)** | Suggestive | Important decisions, user confirms |
| **Sentinel (Approval)** | Reactive | Only acts when triggered |

---

## 2. Scout Agent (Lead Scorer) Behaviors

### 2.1 Automatic Scoring Triggers

```typescript
const SCOUT_TRIGGERS = {
  // Automatic (no prompt)
  automatic: [
    { event: 'contact.created', action: 'calculate_initial_score' },
    { event: 'contact.enriched', action: 'recalculate_score' },
    { event: 'activity.logged', action: 'update_behavioral_score' },
    { event: 'email.opened', action: 'increment_engagement' },
    { event: 'website.visited', action: 'update_intent_signals' },
  ],

  // User-requested
  manual: [
    { command: '/score', action: 'explain_current_score' },
    { command: '/rescore', action: 'force_recalculation' },
    { button: 'score_breakdown', action: 'show_score_factors' },
  ],
};
```

### 2.2 Score Explanation UI

```typescript
interface ScoreExplanation {
  contactId: string;
  totalScore: number;
  tier: 'COLD' | 'WARM' | 'HOT' | 'SALES_READY';

  // Factor breakdown
  factors: {
    firmographic: {
      score: number;
      weight: number;
      details: {
        companySize: { value: string; points: number; };
        industry: { value: string; points: number; };
        revenue: { value: string; points: number; };
      };
    };
    behavioral: {
      score: number;
      weight: number;
      details: {
        emailEngagement: { value: string; points: number; };
        websiteActivity: { value: string; points: number; };
        contentDownloads: { value: string; points: number; };
      };
    };
    intent: {
      score: number;
      weight: number;
      details: {
        demoRequest: { value: boolean; points: number; };
        pricingVisit: { value: boolean; points: number; };
        trialSignup: { value: boolean; points: number; };
      };
    };
  };

  // Natural language summary
  summary: string;           // "Strong firmographic fit, moderate engagement"
  recommendedAction: string; // "Schedule discovery call"

  // Comparison
  percentile: number;        // "Better than 75% of leads"
  trendDirection: 'up' | 'down' | 'stable';

  calculatedAt: DateTime;
}
```

### 2.3 Score Override Handling

```typescript
interface ScoreOverride {
  contactId: string;
  originalScore: number;
  overrideScore: number;
  reason: string;
  overriddenById: string;
  overriddenAt: DateTime;

  // Override persistence
  permanent: boolean;        // Don't recalculate
  expiresAt?: DateTime;      // Re-enable auto-scoring after
}

// When user overrides
async function handleScoreOverride(override: ScoreOverride) {
  // Log the override
  await logAgentEvent({
    type: 'score_override',
    agentId: 'scout',
    details: override,
  });

  // Learn from feedback (if enabled)
  if (config.learnFromFeedback) {
    await recordFeedbackSignal({
      type: 'score_correction',
      contactId: override.contactId,
      aiScore: override.originalScore,
      humanScore: override.overrideScore,
      reason: override.reason,
    });
  }
}
```

---

## 3. Atlas Agent (Data Enricher) Behaviors

### 3.1 Enrichment Triggers

```typescript
const ATLAS_TRIGGERS = {
  // User-initiated only (default)
  manual: [
    { button: 'enrich_contact', action: 'enrich_single' },
    { button: 'bulk_enrich', action: 'enrich_selected' },
    { command: '/enrich', action: 'enrich_current' },
  ],

  // Auto-enrich (when enabled)
  automatic: [
    { event: 'contact.created', condition: 'has_email', action: 'auto_enrich' },
    { event: 'deal.created', condition: 'contact_incomplete', action: 'suggest_enrich' },
  ],

  // Scheduled
  scheduled: [
    { schedule: 'daily', condition: 'stale_data_90_days', action: 'refresh_batch' },
    { schedule: 'weekly', condition: 'high_score_incomplete', action: 'prioritized_enrich' },
  ],
};
```

### 3.2 Enrichment Result Reporting

```typescript
interface EnrichmentReport {
  contactId: string;
  provider: string;

  // Results
  fieldsFound: string[];
  fieldsUpdated: string[];
  fieldsSkipped: string[];   // Existing data preserved

  // Changes preview (for confirmation)
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
    action: 'update' | 'skip' | 'add';
    confidence: number;
  }[];

  // Cost
  creditsUsed: number;

  // Status
  status: 'success' | 'partial' | 'not_found' | 'error';
  message?: string;
}
```

### 3.3 Rate Limit & Quota Handling

```typescript
interface QuotaAlert {
  type: 'warning' | 'limit_reached';
  provider: string;
  currentUsage: number;
  limit: number;
  percentUsed: number;

  // Suggested actions
  suggestions: string[];     // "Upgrade plan", "Wait until reset"
  resetDate?: DateTime;
}

// Atlas behavior when approaching limits
async function handleQuotaWarning(alert: QuotaAlert) {
  if (alert.percentUsed >= 80) {
    // Notify user (ambient awareness)
    await notify({
      level: 'ambient',
      message: `Enrichment credits at ${alert.percentUsed}% - ${alert.limit - alert.currentUsage} remaining`,
      action: { label: 'Manage Quota', href: '/settings/enrichment' },
    });
  }

  if (alert.percentUsed >= 95) {
    // Disable auto-enrich, alert admin
    await disableAutoEnrich();
    await notifyAdmin('Enrichment quota nearly exhausted');
  }
}
```

---

## 4. Flow Agent (Pipeline) Behaviors

### 4.1 Automation Suggestions

```typescript
const FLOW_SUGGESTIONS: Record<string, StageSuggestion[]> = {
  'LEAD → QUALIFIED': [
    {
      id: 'followup_email',
      title: 'Send personalized follow-up email',
      description: 'Template: Qualification follow-up',
      effort: 'low',
      impact: 'high',
      autoExecutable: true,
    },
    {
      id: 'schedule_discovery',
      title: 'Schedule discovery call',
      description: 'Create calendar event for next week',
      effort: 'medium',
      impact: 'high',
      autoExecutable: false,   // Requires calendar check
    },
    {
      id: 'notify_sdr',
      title: 'Notify SDR manager',
      description: 'Alert about qualified lead',
      effort: 'low',
      impact: 'medium',
      autoExecutable: true,
    },
  ],

  'QUALIFIED → DISCOVERY': [
    {
      id: 'research_company',
      title: 'Research company background',
      description: 'Pull latest news and insights',
      effort: 'low',
      impact: 'high',
      autoExecutable: true,
    },
    {
      id: 'prep_questions',
      title: 'Generate discovery questions',
      description: 'AI-generated questions based on profile',
      effort: 'low',
      impact: 'high',
      autoExecutable: true,
    },
  ],

  '* → CLOSED_WON': [
    {
      id: 'celebrate',
      title: 'Celebrate the win!',
      description: 'Notify team in Slack',
      effort: 'low',
      impact: 'high',
      autoExecutable: true,
    },
    {
      id: 'onboarding_handoff',
      title: 'Initiate customer onboarding',
      description: 'Create onboarding tasks and notify CS',
      effort: 'medium',
      impact: 'critical',
      autoExecutable: false,   // Requires approval
    },
  ],

  '* → CLOSED_LOST': [
    {
      id: 'loss_review',
      title: 'Request loss review',
      description: 'Send survey to understand why',
      effort: 'low',
      impact: 'high',
      autoExecutable: true,
    },
    {
      id: 'nurture_add',
      title: 'Add to re-engagement nurture',
      description: 'Queue for future outreach',
      effort: 'low',
      impact: 'medium',
      autoExecutable: true,
    },
  ],
};
```

### 4.2 Stuck Deal Detection

```typescript
interface StuckDealAlert {
  dealId: string;
  dealName: string;
  stage: string;
  daysInStage: number;
  threshold: number;

  // Context
  lastActivityAt: DateTime;
  daysSinceActivity: number;
  owner: string;

  // Suggestions
  suggestions: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

const STUCK_DETECTION_RULES = {
  thresholds: {
    LEAD: 7,
    QUALIFIED: 14,
    DISCOVERY: 21,
    PROPOSAL: 14,
    NEGOTIATION: 30,
  },

  // Escalation
  escalation: {
    '1x_threshold': { action: 'notify_owner', urgency: 'medium' },
    '2x_threshold': { action: 'notify_manager', urgency: 'high' },
    '3x_threshold': { action: 'flag_at_risk', urgency: 'critical' },
  },

  // Detection frequency
  checkFrequency: 'daily',
  quietHoursRespect: true,
};
```

### 4.3 Cross-Agent Coordination

```typescript
// Flow triggers Scout for score update
async function onDealStageChange(event: DealStageChangeEvent) {
  // 1. Flow suggests automations
  const suggestions = await flowAgent.suggestAutomations(event);

  // 2. If deal won, trigger Scout to mark contact as "customer"
  if (event.toStage === 'CLOSED_WON') {
    await scoutAgent.updateLifecycle({
      contactId: event.deal.contactId,
      lifecycle: 'customer',
      reason: `Deal ${event.deal.name} closed won`,
    });
  }

  // 3. If deal lost, trigger Atlas for competitive intel
  if (event.toStage === 'CLOSED_LOST' && event.deal.lostReason === 'competitor') {
    await atlasAgent.researchCompetitor({
      competitorName: event.deal.competitorLostTo,
      dealId: event.deal.id,
    });
  }
}
```

---

## 5. Notification UX Design

### 5.1 Notification Levels

Based on Microsoft Design guidelines for agentic AI:

| Level | UI Pattern | Use Case | Duration |
|-------|------------|----------|----------|
| **Silent** | Activity log only | Routine background tasks | N/A |
| **Ambient** | Badge/dot indicator | Score updates, enrichment complete | Until viewed |
| **Gentle** | Toast notification | Suggestions, non-urgent | 5-8 seconds |
| **Attention** | Sidebar card | Stuck deal alerts, recommendations | Until dismissed |
| **Blocking** | Modal dialog | Approval required, high-stakes | Until action |

**Reference:** [Microsoft UX Design for Agents](https://microsoft.design/articles/ux-design-for-agents/) | [Agentic AI Design Patterns](https://www.aufaitux.com/blog/agentic-ai-design-patterns-enterprise-guide/)

### 5.2 Notification Configuration

```typescript
interface NotificationConfig {
  userId: string;

  // Global settings
  enabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;           // "18:00"
    end: string;             // "09:00"
    timezone: string;
  };

  // Per-agent settings
  agents: {
    [agentId: string]: {
      enabled: boolean;
      channels: ('in_app' | 'email' | 'slack' | 'mobile')[];
      minUrgency: NotificationLevel;
    };
  };

  // Aggregation
  digestEnabled: boolean;
  digestFrequency: 'hourly' | 'daily' | 'weekly';
}
```

### 5.3 Notification Templates

```typescript
const NOTIFICATION_TEMPLATES = {
  // Scout
  'score_changed_significantly': {
    level: 'ambient',
    title: 'Lead score updated',
    body: '{{contact.name}} score changed from {{oldScore}} to {{newScore}}',
    action: { label: 'View Contact', href: '/contacts/{{contact.id}}' },
  },
  'lead_became_sales_ready': {
    level: 'attention',
    title: 'Hot lead alert!',
    body: '{{contact.name}} reached Sales Ready status ({{score}}/100)',
    action: { label: 'Take Action', href: '/contacts/{{contact.id}}' },
  },

  // Atlas
  'enrichment_complete': {
    level: 'gentle',
    title: 'Contact enriched',
    body: '{{fieldsUpdated.length}} fields updated for {{contact.name}}',
    action: { label: 'Review', href: '/contacts/{{contact.id}}' },
  },
  'enrichment_quota_warning': {
    level: 'attention',
    title: 'Enrichment credits low',
    body: '{{percentUsed}}% of monthly quota used',
    action: { label: 'Manage', href: '/settings/enrichment' },
  },

  // Flow
  'automation_suggested': {
    level: 'gentle',
    title: 'Automation available',
    body: 'Deal "{{deal.name}}" moved to {{stage}}. {{suggestionCount}} actions suggested.',
    action: { label: 'Review', href: '/deals/{{deal.id}}' },
  },
  'deal_stuck_warning': {
    level: 'attention',
    title: 'Deal may be stuck',
    body: '"{{deal.name}}" has been in {{stage}} for {{daysInStage}} days',
    action: { label: 'Take Action', href: '/deals/{{deal.id}}' },
  },
};
```

---

## 6. User Feedback Mechanisms

### 6.1 Feedback Types

```typescript
interface AgentFeedback {
  id: string;
  userId: string;
  agentId: string;

  // Context
  actionId: string;          // What action was taken
  actionType: string;        // score, enrich, suggest

  // Feedback
  feedbackType: 'helpful' | 'not_helpful' | 'wrong' | 'spam';
  rating?: number;           // 1-5 stars
  comment?: string;

  // Correction (if applicable)
  correction?: {
    field: string;
    agentValue: any;
    correctValue: any;
  };

  createdAt: DateTime;
}
```

### 6.2 Feedback Collection UI

```typescript
const FEEDBACK_PROMPTS = {
  // After automation execution
  postAction: {
    trigger: 'automation_executed',
    delay: '5_minutes',       // Wait for user to see result
    prompt: 'Was this automation helpful?',
    options: ['Yes', 'No', 'Partially'],
  },

  // After score display
  scoreReview: {
    trigger: 'score_viewed_for_30s',
    prompt: 'Does this score seem accurate?',
    options: ['Accurate', 'Too High', 'Too Low'],
    followUp: 'What would you rate this lead?',
  },

  // After suggestion dismissal
  suggestionDismissed: {
    trigger: 'suggestion_dismissed',
    prompt: 'Why did you dismiss this?',
    options: ['Not relevant', 'Already done', 'Will do later', 'Wrong suggestion'],
  },
};
```

### 6.3 Muting Agent Behaviors

```typescript
interface AgentMuteConfig {
  userId: string;
  agentId: string;

  // Mute options
  muteType: 'all' | 'suggestions' | 'notifications';
  duration: 'session' | 'today' | 'week' | 'permanent';

  // Scope
  scope: 'global' | 'entity';
  entityId?: string;         // Mute for specific contact/deal

  // Reason (for learning)
  reason?: string;

  createdAt: DateTime;
  expiresAt?: DateTime;
}

// Quick mute patterns
const MUTE_SHORTCUTS = [
  { label: 'Mute for this contact', scope: 'entity', duration: 'permanent' },
  { label: 'Mute for today', scope: 'global', duration: 'today' },
  { label: 'Disable suggestions', muteType: 'suggestions', duration: 'permanent' },
];
```

---

## 7. Answers to Research Questions

### Q1: Should agents be proactive or reactive by default?

**Answer: Suggestive (hybrid) by default, user-configurable.**

- Scout: Autonomous for scoring (low-risk, valuable)
- Atlas: Reactive (cost implications)
- Flow: Suggestive (important decisions need user input)

Users can adjust proactiveness level (0-100) in settings.

### Q2: What's the agent notification style?

**Answer: Layered system based on urgency.**

| Agent | Default Channel | Escalation |
|-------|-----------------|------------|
| Scout | Ambient (badge) | Attention for hot leads |
| Atlas | Gentle (toast) | Attention for quota |
| Flow | Gentle (toast) | Blocking for approvals |

### Q3: How do users give feedback on agent suggestions?

**Answer: Inline feedback + detailed correction option.**

```typescript
// Inline
const inlineFeedback = ['helpful', 'not_helpful', 'wrong'];

// Detailed
const detailedFeedback = {
  rating: 1-5,
  comment: 'Free text',
  correction: { field, correctValue },
};
```

### Q4: Can users "mute" certain agent behaviors?

**Answer: Yes, with granular controls.**

- Mute all notifications from an agent
- Mute suggestions only (keep background work)
- Mute for specific entity (contact/deal)
- Mute temporarily (today, this week)
- Adjust proactiveness slider

---

## 8. Recommended Schema Additions

```prisma
model AgentAction {
  id              String    @id @default(uuid())
  workspaceId     String
  userId          String?

  // Agent
  agentId         String    // scout, atlas, flow
  actionType      String    // score, enrich, suggest, execute

  // Target
  entityType      String    // contact, deal, account
  entityId        String

  // Result
  status          String    // pending, executed, dismissed, failed
  result          Json?
  explanation     String?   // Natural language explanation

  // Approval
  requiresApproval Boolean  @default(false)
  approvedById    String?
  approvedAt      DateTime?

  // Feedback
  feedback        AgentFeedback?

  createdAt       DateTime  @default(now())
  completedAt     DateTime?

  @@index([workspaceId])
  @@index([agentId])
  @@index([entityType, entityId])
}

model AgentFeedback {
  id              String    @id @default(uuid())
  actionId        String    @unique
  action          AgentAction @relation(fields: [actionId], references: [id])

  userId          String
  feedbackType    String    // helpful, not_helpful, wrong, spam
  rating          Int?
  comment         String?
  correction      Json?     // { field, agentValue, correctValue }

  createdAt       DateTime  @default(now())

  @@index([userId])
}

model AgentConfig {
  id              String    @id @default(uuid())
  workspaceId     String
  userId          String    @unique

  // Global settings
  notificationsEnabled Boolean @default(true)
  quietHoursEnabled    Boolean @default(false)
  quietHoursStart      String?
  quietHoursEnd        String?
  proactivenessLevel   Int     @default(50)

  // Per-agent configs
  agentConfigs    Json      // { [agentId]: AgentBehaviorConfig }

  // Mutes
  mutes           Json?     // AgentMuteConfig[]

  updatedAt       DateTime  @updatedAt

  @@unique([workspaceId, userId])
}

model AgentNotification {
  id              String    @id @default(uuid())
  workspaceId     String
  userId          String

  // Notification
  agentId         String
  level           String    // silent, ambient, gentle, attention, blocking
  title           String
  body            String
  actionUrl       String?
  actionLabel     String?

  // Context
  entityType      String?
  entityId        String?
  actionId        String?   // Related agent action

  // Status
  status          String    @default("unread") // unread, read, dismissed, acted
  readAt          DateTime?
  dismissedAt     DateTime?
  actedAt         DateTime?

  createdAt       DateTime  @default(now())
  expiresAt       DateTime?

  @@index([workspaceId, userId])
  @@index([status])
  @@index([createdAt])
}
```

---

## 9. Sources

- [Microsoft UX Design for Agents](https://microsoft.design/articles/ux-design-for-agents/)
- [Agentic AI UX Design Patterns](https://manialabs.substack.com/p/agentic-ux-and-design-patterns)
- [Top 10 Agentic AI Design Patterns](https://www.aufaitux.com/blog/agentic-ai-design-patterns-enterprise-guide/)
- [Reactive vs Proactive AI](https://www.fullstory.com/blog/the-two-sides-of-ai/)
- [Proactive AI Chat Assistants](https://www.rezolve.ai/blog/proactive-ai-chat-assistants-vs-reactive-support)
- [AI Sales Agent Patterns](https://monday.com/blog/crm-and-sales/ai-sales-agent/)
- [Conversational AI for Sales](https://research.aimultiple.com/conversational-ai-for-sales/)
- [Toast Notifications UX](https://blog.logrocket.com/ux-design/toast-notifications/)
- [AI in CRM Guide](https://www.lindy.ai/blog/ai-in-crm)

---

**Research Status:** Complete
**Next:** Update checklist and proceed to Section 6 (CRM User Interface)
