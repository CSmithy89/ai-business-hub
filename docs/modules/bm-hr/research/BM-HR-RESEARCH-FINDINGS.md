# BM-HR Research Findings

## Market Analysis: AI Recruiting Software 2024

### Top Competitors
1.  **Ashby:** The new standard for startups. "All-in-one" (ATS + CRM + Scheduling). Known for speed and analytics.
2.  **Gem:** Focus on "Sourcing" and "CRM". Best-in-class for outreach sequences to passive candidates.
3.  **Paradox (Olivia):** Focus on "High Volume" (hourly workers) using conversational AI (SMS/Chat) to screen and schedule.
4.  **Textio:** Niche focus on "Augmented Writing" to remove bias from job descriptions.

### Key Features "Must Haves" for BM-HR
1.  **Sourcing Copilot (The "Headhunter"):**
    *   *Capability:* "Find me 10 React devs in London who worked at Fintechs."
    *   *Implementation:* Needs access to a data provider (LinkedIn, GitHub) or search capabilities.

2.  **Automated Scheduling (The "Coordinator"):**
    *   *Pain Point:* 50% of recruiting time is scheduling.
    *   *Solution:* Calendar integration that proposes slots and books them automatically.

3.  **Bias-Free Screening (The "Gatekeeper"):**
    *   *Feature:* Blind screening (hiding names/photos) and skill-based ranking.
    *   *AI Value:* LLMs are excellent at extracting structured skills from unstructured PDF resumes.

4.  **Interview Intelligence:**
    *   *Feature:* Recording interviews (Zoom/Meet) and generating a "Scorecard" automatically.
    *   *Note:* Requires A/V processing (AssemblyAI/Deepgram integration).

### Differentiators for AgentOS Implementation
*   **Active Outreach:** Most ATS are passive (wait for applicants). `bm-hr` should be active (Gem-style) by default.
*   **Integrated Onboarding:** Most recruiting tools stop at the "Offer". Because we own `bm-pm` and `bm-brand`, we can seamlessly transition to "Day 1" (sending welcome kits, setting up tasks).

### Technical Complexity
*   **High:** Calendar synchronization (Google/Outlook auth is tricky).
*   **Medium:** Resume parsing (PDF to JSON).
*   **Medium:** LinkedIn scraping/sourcing (Platform Terms of Service risk).

### Conclusion
`bm-hr` is a high-value module that enables the "Agent Team" to hire the "Human Team". It complements the automation focus of the hub by streamlining the inevitable human components.
