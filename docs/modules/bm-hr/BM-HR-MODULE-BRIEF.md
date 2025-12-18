# BM-HR Module Brief

**Module Code:** `bm-hr`
**Version:** 0.1.0
**Layer:** Operations (OPERATE Phase)
**Status:** Brief
**Dependencies:** `bm-pm` (for onboarding tasks), `bm-crm` (candidate database structure)

---

## Executive Summary

The Human Resources Module (`bm-hr`) brings "Fortune 500" recruiting and people operations to growing businesses. It automates the entire talent lifecycle: sourcing, screening, interviewing, and onboarding.

It effectively replaces tools like Ashby, Gem, and Rippling by using AgentOS to actively recruit and manage talent.

### Core Value Proposition
- **Active Sourcing:** Agents that hunt for candidates on LinkedIn/GitHub based on job descriptions.
- **Unbiased Screening:** AI parsing of resumes that focuses on skills, not demographics.
- **Automated Scheduling:** Eliminating the "when are you free?" email ping-pong.
- **Structured Interviewing:** Generating interview guides and summarizing feedback to reduce bad hires.

---

## Module Architecture

### Agent Team (5 Agents)

| Agent | Code Name | Role | Key Capabilities |
|-------|-----------|------|------------------|
| **Headhunter** | `talent-sourcer` | Sourcing | Scans external databases, personalized outreach, builds pipeline. |
| **Gatekeeper** | `resume-screener` | Screening | Parses resumes, ranks candidates, identifies gaps. |
| **Coordinator** | `hr-scheduler` | Operations | Schedule coordination, email communication, ATS updates. |
| **Interviewer** | `hiring-assistant` | Evaluation | Generates questions, records notes (via transcript), summarizes feedback. |
| **Culture Keep** | `people-ops` | Onboarding | Manages offer letters, equipment provisioning, and 30-60-90 plans. |

### Core Workflows

1.  **`open-role`**
    *   Input: "We need a Senior React Dev".
    *   Process: `Headhunter` drafts JD (using Textio-style bias check) -> Posts to job boards -> Starts sourcing.

2.  **`screen-candidates`**
    *   Input: Incoming resumes.
    *   Process: `Gatekeeper` extracts skills -> Scores against JD -> Flags "Must Haves" vs "Nice to Haves".

3.  **`conduct-interview`**
    *   Input: Candidate + Interviewer.
    *   Process: `Coordinator` schedules time -> `Interviewer` preps human with questions -> Collects feedback score.

4.  **`onboard-hire`**
    *   Input: Accepted Offer.
    *   Process: `Culture Keep` triggers `bm-pm` project -> Sends welcome email -> Provisions accounts.

---

## Integration Points

| Module | Integration |
|--------|-------------|
| **BM-PM** | Onboarding is treated as a "Project" with tasks (e.g., "Ship Laptop"). |
| **BM-CRM** | Candidates are a special type of `Contact`; Hiring Managers are `Users`. |
| **BM-Brand** | Ensures job descriptions and offer letters match the company voice. |

## Data Models (Draft)

- **JobRequisition:** Title, Department, Budget, Status (Open/Closed).
- **Candidate:** Resume Data, Source, Stage (Applied, Interview, Offer).
- **Interview:** Scheduled Time, Scorecard, Feedback.
- **Offer:** Salary, Equity, Start Date.

---

## Recommendation
This module fills a critical gap for "Growth" phase companies. While `bm-social` gets customers, `bm-hr` gets the team to serve them.
