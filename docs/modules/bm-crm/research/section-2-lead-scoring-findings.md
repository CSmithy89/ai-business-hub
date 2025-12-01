# Section 2: Lead Scoring System - Research Findings

**Research Date:** 2025-11-30
**Status:** Complete
**Sources:** Gartner, Cognism, MadKudu, Industry Best Practices

---

## Summary

We've defined our scoring algorithm as 40% Firmographic, 35% Behavioral, 25% Intent. This document provides detailed implementation guidance including specific signals, weights, decay mechanisms, and ML considerations.

---

## 1. Scoring Architecture

### 1.1 Three-Category Model

| Category | Weight | Description |
|----------|--------|-------------|
| **Firmographic** | 40% | Company fit (size, industry, location) |
| **Behavioral** | 35% | Engagement signals (emails, visits, downloads) |
| **Intent** | 25% | Buying signals (pricing, demo, trial) |

**Reference:** [Gartner Lead Scoring](https://www.gartner.com/en/digital-markets/insights/lead-scoring-intent-signals)

### 1.2 Final Score Calculation

```typescript
function calculateLeadScore(contact: Contact): LeadScoreResult {
  const firmographicScore = calculateFirmographic(contact.account);  // 0-100
  const behavioralScore = calculateBehavioral(contact.activities);   // 0-100
  const intentScore = calculateIntent(contact.activities);           // 0-100

  const totalScore = Math.round(
    (firmographicScore * 0.40) +
    (behavioralScore * 0.35) +
    (intentScore * 0.25)
  );

  return {
    totalScore,
    breakdown: {
      firmographic: firmographicScore,
      behavioral: behavioralScore,
      intent: intentScore,
    },
    tier: getTierFromScore(totalScore),
    calculatedAt: new Date(),
  };
}
```

---

## 2. Firmographic Scoring (40%)

### 2.1 Company Size Scoring

| Employee Range | Points | Notes |
|----------------|--------|-------|
| 1-10 | 5 | Very small / startup |
| 11-50 | 15 | Small business |
| 51-200 | 25 | Growing company |
| 201-500 | 30 | Mid-market (ideal) |
| 501-1000 | 25 | Large company |
| 1000+ | 20 | Enterprise (longer cycles) |

*Note: Points configurable per tenant's ICP*

### 2.2 Industry Fit Scoring

| Category | Points | Example Industries |
|----------|--------|-------------------|
| **Ideal** | 30 | SaaS, Tech, Professional Services |
| **Good** | 20 | Finance, Healthcare, Manufacturing |
| **Neutral** | 10 | Retail, Education |
| **Poor** | 0 | Government, Non-profit |

### 2.3 Revenue Scoring

| Revenue Range | Points |
|---------------|--------|
| < $1M | 5 |
| $1M - $10M | 15 |
| $10M - $50M | 25 |
| $50M - $100M | 30 |
| $100M+ | 25 |

### 2.4 Geographic Scoring

| Region | Points |
|--------|--------|
| Primary market | 25 |
| Secondary market | 15 |
| Emerging market | 10 |
| Non-target | 0 |

### 2.5 Technology Stack (Optional)

| Criteria | Points |
|----------|--------|
| Uses complementary tech | +10 |
| Uses competitor | +5 (might switch) |
| Uses our integration partners | +10 |

### 2.6 Firmographic Score Formula

```typescript
function calculateFirmographic(account: Account): number {
  let score = 0;

  // Company size (max 30)
  score += getCompanySizeScore(account.employeeCount);

  // Industry fit (max 30)
  score += getIndustryScore(account.industry);

  // Revenue (max 30)
  score += getRevenueScore(account.annualRevenue);

  // Geography (max 10)
  score += getGeoScore(account.address?.country);

  // Normalize to 0-100
  return Math.min(100, score);
}
```

---

## 3. Behavioral Scoring (35%)

### 3.1 Email Engagement

| Action | Points | Decay |
|--------|--------|-------|
| Email opened | +2 | 7 days |
| Email clicked | +5 | 14 days |
| Email replied | +15 | 30 days |
| Unsubscribed | -20 | None |
| Bounced | -10 | None |

### 3.2 Website Activity

| Action | Points | Decay |
|--------|--------|-------|
| Page view | +1 | 7 days |
| Blog view | +2 | 7 days |
| Case study view | +5 | 14 days |
| Product page view | +5 | 14 days |
| Multiple pages (5+) in session | +10 | 7 days |
| Returning visitor | +5 | 7 days |

### 3.3 Content Engagement

| Action | Points | Decay |
|--------|--------|-------|
| Whitepaper download | +10 | 30 days |
| Ebook download | +10 | 30 days |
| Webinar registration | +15 | 30 days |
| Webinar attended | +25 | 60 days |
| Video watched (50%+) | +5 | 14 days |

### 3.4 Social Engagement

| Action | Points | Decay |
|--------|--------|-------|
| Followed company | +5 | 90 days |
| Shared content | +10 | 30 days |
| Commented | +15 | 30 days |
| Connected with rep | +10 | 90 days |

### 3.5 Behavioral Score Formula

```typescript
function calculateBehavioral(activities: Activity[]): number {
  const now = new Date();
  let score = 0;

  for (const activity of activities) {
    const daysSince = daysBetween(activity.happenedAt, now);
    const config = BEHAVIORAL_SCORES[activity.type];

    if (config) {
      // Apply decay
      const decayFactor = calculateDecay(daysSince, config.decayDays);
      score += config.points * decayFactor;
    }
  }

  // Cap at 100
  return Math.min(100, Math.round(score));
}

function calculateDecay(daysSince: number, decayDays: number): number {
  if (decayDays === 0) return 1; // No decay
  if (daysSince > decayDays * 2) return 0; // Fully decayed

  // Linear decay over 2x period
  return Math.max(0, 1 - (daysSince / (decayDays * 2)));
}
```

---

## 4. Intent Scoring (25%)

### 4.1 High-Intent Actions

| Action | Points | Decay |
|--------|--------|-------|
| Demo request | +40 | 60 days |
| Pricing page view | +15 | 14 days |
| Pricing page (3+ visits) | +25 | 14 days |
| Trial signup | +50 | 90 days |
| Contact sales form | +35 | 60 days |
| ROI calculator used | +20 | 30 days |
| Comparison page viewed | +15 | 14 days |

### 4.2 Product Usage (if trial)

| Action | Points | Decay |
|--------|--------|-------|
| First login | +10 | None |
| Daily active | +5/day | 7 days |
| Feature used (key feature) | +15 | 30 days |
| Invited team members | +30 | None |
| Integration connected | +25 | None |
| Data imported | +20 | None |

### 4.3 Third-Party Intent Signals

| Signal | Points | Notes |
|--------|--------|-------|
| Searching for category keywords | +20 | Via Bombora, G2 |
| Visiting competitor sites | +15 | Intent data provider |
| Reading industry reviews | +10 | G2, Capterra |

### 4.4 Intent Score Formula

```typescript
function calculateIntent(activities: Activity[]): number {
  const now = new Date();
  let score = 0;

  // Filter to intent activities
  const intentActivities = activities.filter(a =>
    INTENT_ACTIVITIES.includes(a.type)
  );

  for (const activity of intentActivities) {
    const daysSince = daysBetween(activity.happenedAt, now);
    const config = INTENT_SCORES[activity.type];

    if (config) {
      const decayFactor = calculateDecay(daysSince, config.decayDays);
      score += config.points * decayFactor;
    }
  }

  return Math.min(100, Math.round(score));
}
```

---

## 5. Tier Classification

### 5.1 Tier Definitions

| Tier | Score Range | SLA | Action |
|------|-------------|-----|--------|
| **SALES_READY** | 90-100 | < 4 hours | Immediate sales contact |
| **HOT** | 70-89 | < 24 hours | Priority sales outreach |
| **WARM** | 50-69 | < 48 hours | Sales development follow-up |
| **COLD** | 0-49 | Nurture | Marketing automation |

### 5.2 Tier Change Alerts

```typescript
interface TierChangeAlert {
  contactId: string;
  previousTier: string;
  newTier: string;
  scoreChange: number;
  triggeringActivity?: Activity;
  alertType: 'upgrade' | 'downgrade';
  assignedTo?: string;
}

// Alert rules
const TIER_ALERTS = {
  'COLD → WARM': { notify: ['owner'], priority: 'normal' },
  'WARM → HOT': { notify: ['owner', 'manager'], priority: 'high' },
  'HOT → SALES_READY': { notify: ['owner', 'manager', 'sales_team'], priority: 'urgent' },
  '* → COLD': { notify: ['owner'], priority: 'low' },
};
```

### 5.3 Configurable Thresholds

```typescript
// Allow tenants to customize thresholds
interface ScoringConfig {
  thresholds: {
    salesReady: number;  // Default: 90
    hot: number;         // Default: 70
    warm: number;        // Default: 50
  };
  weights: {
    firmographic: number; // Default: 0.40
    behavioral: number;   // Default: 0.35
    intent: number;       // Default: 0.25
  };
}
```

---

## 6. Score Decay & Recalculation

### 6.1 Decay Strategy

**Decision:** Use activity-specific decay with periodic recalculation.

```typescript
// Decay configuration per activity type
const DECAY_CONFIG = {
  email_opened: { halfLife: 7, maxAge: 30 },
  demo_request: { halfLife: 30, maxAge: 90 },
  pricing_page: { halfLife: 14, maxAge: 45 },
  trial_signup: { halfLife: 60, maxAge: 180 },
};

// Exponential decay formula
function exponentialDecay(daysSince: number, halfLife: number): number {
  return Math.pow(0.5, daysSince / halfLife);
}
```

### 6.2 Recalculation Triggers

| Trigger | Action |
|---------|--------|
| New activity logged | Recalculate immediately |
| Daily batch job | Recalculate all scores (decay) |
| Manual refresh | Recalculate specific contact |
| Scoring config change | Recalculate all contacts |

### 6.3 Score History

```typescript
model LeadScoreHistory {
  id            String   @id @default(uuid())
  contactId     String
  contact       Contact  @relation(fields: [contactId], references: [id])

  totalScore    Int
  firmographic  Int
  behavioral    Int
  intent        Int
  tier          String

  triggerType   String   // activity, decay, manual, config_change
  triggerId     String?  // Activity ID if applicable

  calculatedAt  DateTime @default(now())

  @@index([contactId])
  @@index([calculatedAt])
}
```

---

## 7. Negative Scoring

### 7.1 Negative Signals

| Signal | Points | Notes |
|--------|--------|-------|
| Email unsubscribe | -20 | Immediate |
| Email bounce (hard) | -15 | Immediate |
| Email bounce (soft, 3x) | -10 | After 3 soft bounces |
| Inactive 30+ days | -5 | Decay effect |
| Inactive 60+ days | -10 | Decay effect |
| Marked as spam | -30 | Immediate |
| Bad fit marked by sales | -50 | Manual |
| Competitor employee | -40 | Firmographic |

### 7.2 Handling Missing Data

```typescript
function handleMissingData(contact: Contact): ScoreAdjustment {
  const penalties = [];

  // Missing firmographic data
  if (!contact.accountId) {
    penalties.push({ reason: 'no_company', factor: 0.7 });
  }
  if (!contact.email) {
    penalties.push({ reason: 'no_email', factor: 0.5 });
  }

  // Apply lowest penalty factor
  const worstFactor = Math.min(...penalties.map(p => p.factor), 1);
  return { factor: worstFactor, penalties };
}
```

---

## 8. Answers to Research Questions

### Q1: Should scoring be real-time or batch?

**Answer: Hybrid approach.**

- **Real-time:** New high-value activities (demo request, pricing view)
- **Batch (daily):** Decay recalculation, bulk updates
- **Event-driven:** Recalculate when activity logged

### Q2: How do we handle missing data in scoring?

**Answer: Apply penalty factors + flag for enrichment.**

- Missing company: 70% of potential firmographic score
- Missing email: 50% of potential behavioral score
- Flag for Atlas (enrichment agent) to fill gaps

### Q3: Should tenants customize scoring weights?

**Answer: Yes, with guardrails.**

- Allow custom thresholds (tiers)
- Allow weight adjustments (within 20-50% range)
- Don't allow individual signal customization (too complex)
- Provide "industry templates" (SaaS, Professional Services, etc.)

### Q4: Do we need score explanations for sales reps?

**Answer: Yes, critical for adoption.**

```typescript
interface ScoreExplanation {
  totalScore: number;
  tier: string;

  // Top positive factors
  strengths: Array<{
    factor: string;
    contribution: number;
    description: string;
  }>;

  // Areas to improve
  gaps: Array<{
    factor: string;
    potential: number;
    description: string;
  }>;

  // Recent activity that changed score
  recentChanges: Array<{
    activity: string;
    impact: number;
    date: DateTime;
  }>;
}
```

---

## 9. ML/Predictive Scoring (Future)

### 9.1 Training Data Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Historical leads | 1,000 | 5,000+ |
| Conversion events | 100 | 500+ |
| Time period | 6 months | 12 months |
| Data quality | 80% complete | 95% complete |

### 9.2 Features for ML Model

```typescript
const ML_FEATURES = {
  // Firmographic
  company_size_bucket: 'categorical',
  industry: 'categorical',
  revenue_bucket: 'categorical',
  geo_region: 'categorical',

  // Behavioral (aggregated)
  email_opens_30d: 'numeric',
  page_views_30d: 'numeric',
  content_downloads_30d: 'numeric',
  days_since_last_activity: 'numeric',

  // Intent (aggregated)
  pricing_views_30d: 'numeric',
  demo_requests_90d: 'numeric',
  trial_signup: 'boolean',

  // Derived
  engagement_velocity: 'numeric', // Change in activity over time
  profile_completeness: 'numeric',
  days_as_lead: 'numeric',
};
```

### 9.3 MVP vs ML Approach

| Phase | Approach | When |
|-------|----------|------|
| **MVP** | Rule-based scoring | Day 1 |
| **Phase 2** | Rule-based + manual tuning | Month 3+ |
| **Phase 3** | ML-assisted (suggest weights) | Month 6+ |
| **Phase 4** | Full predictive scoring | Month 12+ |

**Reference:** [MadKudu AI Lead Scoring Guide](https://www.madkudu.com/blog/ai-lead-scoring-guide)

---

## 10. Recommended Prisma Schema

```prisma
model LeadScore {
  id              String   @id @default(uuid())
  contactId       String   @unique
  contact         Contact  @relation(fields: [contactId], references: [id])

  // Current scores
  totalScore      Int      @default(0)
  firmographic    Int      @default(0)
  behavioral      Int      @default(0)
  intent          Int      @default(0)
  tier            String   @default("COLD")

  // Breakdown (JSON for flexibility)
  breakdown       Json?    // Detailed score breakdown

  // Metadata
  calculatedAt    DateTime @default(now())
  triggerType     String?  // activity, decay, manual, config
  triggerId       String?  // Reference to triggering event

  // History tracking
  previousScore   Int?
  previousTier    String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tier])
  @@index([totalScore])
  @@index([calculatedAt])
}

model LeadScoreHistory {
  id            String   @id @default(uuid())
  contactId     String

  totalScore    Int
  tier          String
  breakdown     Json?

  triggerType   String
  triggerId     String?

  calculatedAt  DateTime @default(now())

  @@index([contactId])
  @@index([calculatedAt])
}

model ScoringConfig {
  id            String   @id @default(uuid())
  workspaceId   String   @unique

  // Tier thresholds
  thresholds    Json     // { salesReady: 90, hot: 70, warm: 50 }

  // Category weights
  weights       Json     // { firmographic: 0.40, behavioral: 0.35, intent: 0.25 }

  // Signal weights (optional customization)
  signals       Json?    // Custom signal point values

  // Template
  template      String?  // "saas", "professional_services", etc.

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 11. Sources

- [Gartner: Lead Scoring Using Intent Signals](https://www.gartner.com/en/digital-markets/insights/lead-scoring-intent-signals)
- [Cognism: What Is Lead Scoring](https://www.cognism.com/blog/lead-scoring)
- [Clearbit: Lead Scoring Examples](https://clearbit.com/resources/books/lead-qualification/lead-scoring-examples)
- [MadKudu: AI Lead Scoring Guide](https://www.madkudu.com/blog/ai-lead-scoring-guide)
- [B2B Lead Scoring Best Practices](https://42dm.net/enhancing-b2b-sales-lead-scoring-best-practices/)
- [Predictive Lead Scoring with AI](https://www.factors.ai/blog/predictive-lead-scoring)

---

**Research Status:** ✅ Complete
**Next:** Update checklist and proceed to Section 4 (Data Enrichment)
