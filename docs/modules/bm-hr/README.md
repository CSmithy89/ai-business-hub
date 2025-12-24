# BM-HR - Human Resources Management

> **Status:** Planning | **Type:** Standalone Module | **Priority:** P3

## Overview

BM-HR is a **standalone module** providing comprehensive human resources management capabilities including talent sourcing, resume screening, interview scheduling, hiring workflows, and people operations.

**Standalone with Built-in Analytics:** Includes its own HR analytics dashboard (time-to-hire, pipeline velocity, retention). Works independently with full functionality.

## Agent Team (5)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-hr.hunter` | Hunter | Talent Sourcing - finds candidates across platforms | Planned |
| `@bm-hr.gatekeeper` | Gatekeeper | Resume Screening - evaluates applicant qualifications | Planned |
| `@bm-hr.scheduler` | Scheduler | HR Scheduling - coordinates interviews and meetings | Planned |
| `@bm-hr.interviewer` | Interviewer | Hiring Assistant - supports interview process | Planned |
| `@bm-hr.culture` | Culture | People Operations - employee experience and culture | Planned |

## Key Integrations

**Standalone Module** - Works independently with full functionality.

**Enhanced When Installed With:**
- Core-PM (hiring pipeline projects, onboarding projects)
- BM-Finance (payroll, compensation data)
- BM-Analytics (AI-powered hiring recommendations)

**Event Patterns:**
- `hr.candidate.sourced` - New candidate identified
- `hr.candidate.screened` - Resume evaluated
- `hr.interview.scheduled` - Interview booked
- `hr.interview.completed` - Interview finished
- `hr.candidate.hired` - Offer accepted
- `hr.candidate.rejected` - Candidate declined
- `hr.employee.onboarded` - New hire started

## Data Model (Planned)

- **Candidate** - Applicant profile and history
- **JobPosting** - Open positions and requirements
- **Interview** - Scheduled interviews with feedback
- **HiringPipeline** - Recruitment workflow stages
- **Employee** - Active employee records
- **OnboardingTask** - New hire checklist items

## Documentation

- **Module Brief:** See [BM-HR-MODULE-BRIEF.md](./BM-HR-MODULE-BRIEF.md)
- **Research:** See [research/](./research/) directory
- **Architecture:** See [Cross-Module Architecture](/docs/architecture/cross-module-architecture.md)
- **Agent Registry:** `@bm-hr.*` handles defined in architecture doc

---

*Module Status: Standalone module - works independently, enhanced with other modules*
