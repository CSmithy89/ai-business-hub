# BM-PR Research Findings

## Market Analysis: PR Software 2024

### Top Competitors
1.  **Cision / PR Newswire:** The enterprise standard. Huge database, expensive, wire distribution is their moat.
2.  **Muck Rack:** The modern favorite. Best-in-class "CRM for Journalists", automatically updates contact info based on bylines.
3.  **Meltwater:** "Media Intelligence" focus. Strong on listening and analytics.
4.  **Prowly:** (Owned by Semrush) "All-in-one" for SMBs. Strong "Brand Newsroom" feature and visual pitch builder.

### Key Features "Must Haves" for BM-PR
1.  **Media Database (The "Rolodex"):**
    *   Need capability to search journalists by "Beat" (topic), Location, and Outlet.
    *   *Implementation:* Likely requires integration with a data provider or a scraping agent (`Rolodex` agent) that verifies emails.

2.  **Smart Pitching (The "Workflow"):**
    *   Not just "blast email". Needs individual personalization.
    *   *AI Opportunity:* Use LLMs to read the journalist's last 5 articles and generate a custom hook for the pitch.

3.  **Online Newsroom:**
    *   A static page hosted at `press.business.com`.
    *   Contains: Press Releases, Media Kit (Logos), Exec Bios, Contact Info.

4.  **Wire Distribution:**
    *   Connection to networks like AP, BusinessWire, etc.
    *   *MVP:* Email distribution to own lists.
    *   *Post-MVP:* API integration with a wire service.

### Differentiators for AgentOS Implementation
*   **"Active" Pitching:** Unlike Muck Rack (tool), our agents can *do* the pitching.
*   **Context Awareness:** Because it lives with `bm-brand` and `bm-planning`, the PR agent knows *why* we are launching a product and can write better context.
*   **Unified Listening:** Combining `bm-social` listening with `bm-pr` news monitoring gives a 360-degree view of brand reputation.

### Technical Complexity
*   **High:** Email deliverability for pitching (risk of spam flagging).
*   **Medium:** Newsroom hosting (Next.js pages).
*   **Low:** Press release generation (LLM strength).

### Conclusion
Building `bm-pr` is a logical extension. It captures the "earned media" channel which is critical for the "Validation" and "Growth" phases of the Business Onboarding flow.
