# BM-Analytics - AI-Powered Analytics

> **Status:** Planning | **Type:** Horizontal Service | **Priority:** P2

## Overview

BM-Analytics is a **horizontal service** that enhances all installed HYVVE modules with AI-powered analytics, recommendations, and automated optimizations. Unlike other modules, BM-Analytics doesn't manage its own data domain - instead, it aggregates metrics from all installed modules via A2A and provides cross-module intelligence.

**Key Distinction:** Every HYVVE module includes its own built-in analytics dashboard. BM-Analytics adds an AI layer on top that detects patterns, generates recommendations, and can automatically execute optimizations.

## Agent Team (4)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-analytics.cortex` | Cortex | Team Lead / Orchestrator - coordinates analytics agents | Planned |
| `@bm-analytics.insight` | Insight | Pattern Detector - identifies trends and anomalies | Planned |
| `@bm-analytics.recommend` | Recommend | Recommendation Engine - generates actionable suggestions | Planned |
| `@bm-analytics.automate` | Automate | Automated Optimizer - executes approved optimizations | Planned |

## Key Capabilities

### 1. Cross-Module Metrics Aggregation
- Pulls analytics from all installed modules via A2A
- Creates unified dashboards spanning CRM, Marketing, Sales, etc.
- Correlates events across module boundaries

### 2. AI-Powered Insights
- Detects patterns humans might miss
- Identifies anomalies and alerts proactively
- Predicts trends based on historical data

### 3. Actionable Recommendations
- "Your email open rate drops 40% on Mondays - consider shifting to Tuesday"
- "Customer X shows churn signals - recommend personal outreach"
- "Ad spend on Campaign Y has diminishing returns - suggest reallocation"

### 4. Automated Optimizations
- With approval, can automatically execute recommendations
- Follows confidence-based routing (Sentinel)
- Maintains audit trail of all automated actions

## Key Integrations

**Consumes (via A2A):**
- BM-CRM (customer health, pipeline velocity)
- BM-Sales (revenue metrics, conversion rates)
- BM-Email (open/click rates, deliverability)
- BM-Social (engagement, reach, sentiment)
- BM-SEO (rankings, traffic, indexing)
- BM-Ads (ROAS, CPA, attribution)
- BM-Support (ticket volume, resolution time)
- BM-Marketing (campaign performance, attribution)
- Core-PM (project health, team velocity)
- Any installed module with analytics data

**Outputs To:**
- All modules (via A2A recommendations)
- Core-PM (creates tasks from recommendations)
- Sentinel (routes optimization actions for approval)

**Event Patterns:**
- `analytics.insight.detected` - New pattern or anomaly found
- `analytics.recommendation.created` - Actionable suggestion generated
- `analytics.recommendation.approved` - User approved optimization
- `analytics.optimization.executed` - Automated action completed
- `analytics.alert.triggered` - Threshold or anomaly alert

## Data Model (Planned)

BM-Analytics doesn't own domain data - it creates derived analytics:

- **Insight** - Detected pattern, trend, or anomaly
- **Recommendation** - Actionable suggestion with impact estimate
- **Optimization** - Automated action (pending or executed)
- **Alert** - Threshold breach or anomaly notification
- **Dashboard** - Saved cross-module dashboard configuration
- **Goal** - User-defined KPI targets for tracking

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    Installed HYVVE Modules                       │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│  BM-CRM  │ BM-Email │ BM-Social│ BM-Ads   │ BM-SEO   │  ...     │
│(built-in)│(built-in)│(built-in)│(built-in)│(built-in)│          │
│analytics │analytics │analytics │analytics │analytics │          │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────────┘
     │          │          │          │          │
     │          ▼          ▼          ▼          │
     │     ┌────────────────────────────────────┐│
     └────▶│         BM-Analytics (A2A)         │◀┘
           │  ┌─────────────────────────────┐   │
           │  │  Cortex (Orchestrator)      │   │
           │  │    ├── Insight (Patterns)   │   │
           │  │    ├── Recommend (Actions)  │   │
           │  │    └── Automate (Execute)   │   │
           │  └─────────────────────────────┘   │
           └─────────────────┬──────────────────┘
                             │
                             ▼
           ┌─────────────────────────────────────┐
           │  Unified AI Insights Dashboard      │
           │  + Recommendations + Automations    │
           └─────────────────────────────────────┘
```

## Without vs. With BM-Analytics

| Capability | Without BM-Analytics | With BM-Analytics |
|------------|---------------------|-------------------|
| Module dashboards | Full analytics per module | Same + unified view |
| Pattern detection | Manual analysis | AI-detected patterns |
| Recommendations | None | AI-generated suggestions |
| Cross-module correlation | Manual | Automatic |
| Automated optimization | None | AI-powered with approval |

## Documentation

- **Architecture:** See [Cross-Module Architecture](/docs/architecture/cross-module-architecture.md)
- **A2A Protocol:** See [Dynamic Module System](/docs/architecture/dynamic-module-system.md)
- **Agent Registry:** `@bm-analytics.*` handles defined in architecture doc

---

*Module Status: Horizontal service enhancing all other modules*
