# Customer Relationship Management (BM-CRM)

AI-first CRM module with an 8-agent team that proactively manages customer relationships, scores leads, enriches data, and automates pipeline operations.

## Overview

Unlike traditional CRMs, BM-CRM is built around an agent team:
- **Clara:** Your CRM Team Lead
- **Scout:** Lead Scoring Specialist
- **Atlas:** Data Enrichment Specialist
- **Flow:** Pipeline Manager
- **Echo:** Activity Tracker

## Installation

```bash
bmad install bm-crm
```

## Components

### Agents (8)

| Agent | Role | Status |
|-------|------|--------|
| **Clara** | Team Orchestrator | MVP |
| **Scout** | Lead Scorer (40/35/25) | MVP |
| **Atlas** | Data Enricher | MVP |
| **Flow** | Pipeline Manager | MVP |
| **Echo** | Activity Tracker | MVP |
| **Sync** | Integration Specialist | Phase 2 |
| **Guardian** | Compliance Officer | Phase 2 |
| **Cadence** | Outreach Specialist | Phase 3 |

### Workflows

- `lead-scoring`: Automatic scoring on contact creation
- `enrichment-flow`: User-initiated data enrichment
- `pipeline-automation`: Stage transition automation
- `daily-briefing`: Morning summary from Clara

## Quick Start

1.  **Meet the Team:**
    ```
    agent Clara
    > "Who should I call today?"
    ```

2.  **Score a Lead:**
    ```
    workflow lead-scoring
    ```

3.  **View Pipeline:**
    Navigate to `/dashboard/crm/pipeline`

## Configuration

Configuration is stored in `.bmad/bm-crm/config.yaml`:

- `enrichment_budget`: Monthly limit (USD)
- `proactivity_level`: Quiet / Helpful / Proactive
- `scoring_thresholds`: Custom tier definitions

## Architecture

BM-CRM uses a "Team Leader + Specialists" topology. All user requests should route through **Clara**.
High-impact actions (bulk enrichment, deletion) are routed to **Sentinel** for approval.