# BM-HR - Human Resources Management

> **Status:** Planning | **Priority:** P3

## Overview

BM-HR provides comprehensive human resources management capabilities including talent sourcing, resume screening, interview scheduling, hiring workflows, and people operations. It helps businesses automate HR processes while maintaining the human touch for strategic decisions.

## Agent Team (5)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-hr.hunter` | Hunter | Talent Sourcing - finds candidates across platforms | Planned |
| `@bm-hr.gatekeeper` | Gatekeeper | Resume Screening - evaluates applicant qualifications | Planned |
| `@bm-hr.scheduler` | Scheduler | HR Scheduling - coordinates interviews and meetings | Planned |
| `@bm-hr.interviewer` | Interviewer | Hiring Assistant - supports interview process | Planned |
| `@bm-hr.culture` | Culture | People Operations - employee experience and culture | Planned |

## Key Integrations

**Requires:**
- Core-PM (project management for hiring pipelines)

**Consumed By:**
- Core-PM (onboarding projects when candidates hired)
- BM-Finance (payroll, compensation data)

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

*Module Status: Awaiting prioritization after core modules*
