# CRM Module - Batch 3 (Missing Gaps)

> **Batch:** 11
> **Module:** BM-CRM
> **Focus:** Advanced Configuration, Onboarding, and Agent Interaction
> **References:**
> - `/docs/modules/bm-crm/PRD.md` (Scoring logic, Enrichment waterfall, Onboarding flow)
> - `/docs/design/STYLE-GUIDE.md` (Forms, Cards, Feedback states)
> - `/docs/design/BRAND-GUIDELINES.md` (Agent identities, color palette)

---

## Wireframe List

| ID | Wireframe | Description | Priority |
|----|-----------|-------------|----------|
| CRM-15 | `crm-onboarding-team.excalidraw` | "Meet Your Team" onboarding carousel introducing Clara, Scout, Atlas, etc. | P1 |
| CRM-16 | `crm-agent-conflict.excalidraw` | Conflict resolution modal where agents disagree (e.g., Scout vs Echo) | P1 |
| CRM-17 | `crm-scoring-editor.excalidraw` | Configuration UI for Lead Scoring model (weights, factors, thresholds) | P1 |
| CRM-18 | `crm-enrichment-settings.excalidraw` | Enrichment provider waterfall config and budget limits | P1 |
| CRM-19 | `crm-integration-mapping.excalidraw` | Field mapping UI for external CRM sync (HubSpot/Salesforce) | P1 |
| CRM-20 | `crm-daily-briefing.excalidraw` | Clara's "Morning Coffee" briefing card with "Who to Call" list | P1 |

---

## Shared Context

**Brand Colors:**
- **Primary:** Coral (#FF6B6B)
- **Secondary:** Teal (#20B2AA)
- **Background:** Cream (#FFFBF5)
- **Text:** Dark Charcoal (#2D3436)

**Agent Identities:**
- **Clara (Team Lead):** Professional, organized, warm. (Coral/Gold)
- **Scout (Scorer):** Analytical, precise, data-driven. (Blue/Indigo)
- **Atlas (Enricher):** Resourceful, connected. (Orange)
- **Echo (Tracker):** Observant, detail-oriented. (Purple)

---

## CRM-15: "Meet Your Team" Onboarding

**Goal:** Introduce the user to the 8-agent CRM team in a delightful, humanizing way during initial setup.

**Key Elements:**
1.  **Carousel Layout:** Large central card for the current agent, partially visible next/prev cards.
2.  **Agent Card Content:**
    *   **Avatar:** Large, friendly icon/illustration.
    *   **Name & Title:** e.g., "Scout - Lead Intelligence".
    *   **"My Job":** Simple, conversational explanation (e.g., "I analyze your leads so you can focus on closing.").
    *   **"I Can":** Bullet list of capabilities (Score leads, Detect churn, etc.).
    *   **Sample Output:** A mini-preview of what this agent produces (e.g., a Lead Score badge for Scout).
3.  **Navigation:** "Next Agent" button and dot indicators (8 dots).
4.  **Quick Preferences:** A toggle or slider below the card (e.g., "Proactivity Level: Quiet / Helpful / Proactive").
5.  **Final Step:** "All set! Let's get to work." button.

**Style Notes:**
- Use a "Stage" metaphor with a spotlight effect on the active agent.
- Use the specific agent colors defined in `BRAND-GUIDELINES.md`.

---

## CRM-16: Agent Conflict Resolution

**Goal:** Elegant UI for resolving disagreements between agents (e.g., Scout says "High Score", Echo says "Low Engagement").

**Key Elements:**
1.  **Modal Header:** "⚠️ Agent Perspectives Differ" (Yellow warning style).
2.  **Conflict Context:** Brief summary of the entity in question (e.g., "Contact: John Doe").
3.  **Agent Perspectives (Side-by-Side):**
    *   **Left Card (Scout):** "Recommendation: SALES_READY (Score 92)". Rationale: "High firmographic fit, decision maker role."
    *   **Right Card (Echo):** "Caution: Engagement Dropping". Rationale: "No email opens in 14 days. Last login 3 weeks ago."
4.  **Clara's Synthesis:** A central, connecting block where Clara summarizes: "While the fit is perfect, the silence is concerning. I recommend a check-in before upgrading."
5.  **Action Buttons:**
    *   "[Accept Scout] Mark as Ready"
    *   "[Accept Echo] Keep as Warm"
    *   "[Ask for Details]"
6.  **Learning Loop:** "Remember this decision?" checkbox to train the agents.

**Style Notes:**
- Use a split-view layout.
- Use distinct background tints for the conflicting agents to separate their "voices."

---

## CRM-17: Scoring Model Editor

**Goal:** Allow admins to configure the 40/35/25 scoring algorithm and tier thresholds.

**Key Elements:**
1.  **Weight Distribution Bar:** A segmented control or multi-slider showing the 100% split:
    *   Firmographic (40%)
    *   Behavioral (35%)
    *   Intent (25%)
    *   *Interaction:* Drag handles to adjust weights.
2.  **Factor Configuration (Accordion/Tabs):**
    *   **Firmographic Tab:** List of rules (e.g., "Industry = Tech (+20 pts)", "Employee Count > 100 (+15 pts)"). Add/Edit/Delete rules.
    *   **Behavioral Tab:** Activity points (e.g., "Email Open (+2)", "Click (+5)").
3.  **Tier Thresholds:** A vertical gauge or slider bar showing the cutoffs:
    *   SALES_READY (>90)
    *   HOT (>70)
    *   WARM (>50)
    *   COLD (<50)
    *   *Interaction:* Drag lines to change thresholds.
4.  **Preview/Simulator:** A "Test Contact" panel on the right. Select a contact to see how the current rules would affect their score *in real-time*.

**Style Notes:**
- Use data visualization controls (sliders, gauges) for the math parts.
- Keep it clean; this is complex math made simple.

---

## CRM-18: Enrichment Settings

**Goal:** Configure data providers (Waterfall) and manage the enrichment budget.

**Key Elements:**
1.  **Provider Waterfall:** A sortable list (drag-and-drop) of providers:
    *   1. Apollo (Primary)
    *   2. Clearbit (Fallback)
    *   3. Hunter (Email only)
    *   *Toggle:* Enable/Disable each.
2.  **Budget Control:**
    *   **Monthly Budget:** Input field ($50.00).
    *   **Usage Bar:** Progress bar showing current spend vs limit (e.g., "$32.45 / $50.00").
    *   **Cost Per Provider:** Breakdown table showing avg cost per lookup.
3.  **Alert Thresholds:** Checkboxes for "Notify me at 50%", "75%", "90%", "Auto-pause at 100%".
4.  **Auto-Enrichment Rules:** Toggles for "Enrich new contacts automatically", "Enrich companies automatically".

**Style Notes:**
- Use the drag-and-drop list pattern from `DC-02`.
- Use the "Settings" page layout from `ST-01`.

---

## CRM-19: Integration Field Mapping

**Goal:** Map fields between BM-CRM and external systems (HubSpot/Salesforce).

**Key Elements:**
1.  **Header:** "HubSpot ↔ BM-CRM Mapping" with Sync Status indicator.
2.  **Object Selector:** Tabs for "Contacts", "Companies", "Deals".
3.  **Mapping Table:**
    *   **Left Column (HubSpot):** Dropdown of available HubSpot fields.
    *   **Center Column (Direction):** Arrow icons (↔ Two-way, → Import only, ← Export only). Click to toggle.
    *   **Right Column (BM-CRM):** Dropdown of BM-CRM fields.
4.  **Conflict Strategy:** Radio buttons for "If data differs...":
    *   "Most Recent Wins" (Default)
    *   "HubSpot Wins"
    *   "BM-CRM Wins"
5.  **Sample Preview:** A row showing "Example Data: John Doe" transforming through the current mapping.

**Style Notes:**
- Use a clean table layout.
- Use distinct icons for the external service (HubSpot orange / Salesforce blue).

---

## CRM-20: Clara's Daily Briefing

**Goal:** A "Morning Coffee" view summarizing the day's priorities.

**Key Elements:**
1.  **Greeting:** "Good Morning, Chris! Here's your briefing for Dec 15." (Warm, large typography).
2.  **"Who to Call" List (Top Priority):**
    *   List of 3-5 contacts.
    *   Each row has: Avatar, Name, Score Change (e.g., "Warm → Hot"), and "Why" (e.g., "Visited pricing page yesterday").
    *   Action: "Call Now" or "Email" button.
3.  **Pipeline Snapshot:** Mini-chart showing deals moving stages.
4.  **Alerts Section:** "3 Stale Deals", "Enrichment Budget 90%".
5.  **Agent Insights:** One key insight from a specialist (e.g., Echo says: "Mondays are the best day to reach Tech leads.").
6.  **Dismiss/Action:** "Mark as Read" or "Start Working" button.

**Style Notes:**
- This should feel like a "Card" or a "Digest".
- Use a distinct background (maybe a soft gradient) to separate it from the normal dashboard.
- High focus on typography and hierarchy.
