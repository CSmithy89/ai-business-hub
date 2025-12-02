# HYVVE Platform Foundation - UX Design Document

**Author:** chris
**Date:** 2025-11-30
**Version:** 1.0
**Status:** Complete (Documentation Phase)

---

## Executive Summary

This document consolidates the UX design decisions for the HYVVE Platform Foundation. The design system embraces a **warm, light-first aesthetic** inspired by premium SaaS products (Linear, Notion, Superhuman, Stripe, Attio) while maintaining a unique identity through character-driven AI agents and a conversation-first interaction paradigm.

---

## Design System Overview

### Design Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Speed as Feature** | 100ms interactions, optimistic updates, skeleton screens |
| **Keyboard-First** | Cmd+K palette, comprehensive shortcuts |
| **Conversation-First** | Chat-driven workflows, AI agent interactions |
| **Progressive Disclosure** | Show only what's needed, contextual expansion |
| **Purposeful Restraint** | Minimal design, generous whitespace |
| **Micro-Delight** | Celebration moments, smooth animations |
| **Character-Driven** | Named AI agents with distinct personalities and colors |

### Visual Aesthetic

- **Foundation:** Light, warm, friendly, human, premium
- **Background:** Warm cream (#FFFBF5) instead of pure white
- **Primary Action:** Coral (#FF6B6B) - Hub's signature color
- **Secondary Accent:** Teal (#20B2AA) - Maya's signature color
- **Dark Mode:** Near-black (#0a0a0b) with elevated surfaces

---

## Design Artifacts

### 1. Brand Guidelines
**Location:** `/docs/design/BRAND-GUIDELINES.md`

Comprehensive brand identity including:
- Color palette (primary, secondary, semantic)
- Typography (Inter + JetBrains Mono)
- Logo usage guidelines
- AI Team character definitions and personalities
- Voice and tone guidelines

### 2. Style Guide
**Location:** `/docs/design/STYLE-GUIDE.md`

Complete design system including:
- Design tokens (CSS variables)
- Layout system (12-column grid, responsive breakpoints)
- Component library specifications
- Chat interface patterns
- Data components (tables, kanban, filters)
- Navigation and command palette
- Forms and inputs
- Feedback and states
- Animation and motion guidelines
- Accessibility standards (WCAG 2.1 AA)
- Performance standards

### 3. Brand Assets
**Location:** `/docs/design/brand-assets/`

Production-ready assets including:
- Primary logo (light/dark, @2x/@3x)
- Stacked logo (light/dark, SVG/PNG)
- Wordmark variations
- Logomark (16px-1024px)
- Monochrome versions
- Favicons (all required sizes)
- App icons (iOS, Android, macOS)

### 4. Wireframe Index
**Location:** `/docs/design/wireframes/WIREFRAME-INDEX.md`

**109 wireframes completed** with HTML and PNG assets:

| Category | Status | Count |
|----------|--------|-------|
| Core Shell & Navigation | ✅ Complete | 6/6 |
| Chat Interface | ✅ Complete | 7/7 |
| Dashboard & Overview | 🟡 Partial | 1/5 |
| Approval Queue | ✅ Complete | 7/7 |
| AI Team Panel | ✅ Complete | 5/5 |
| Settings Pages | ✅ Complete | 8/8 |
| CRM Module | ✅ Complete | 14/14 |
| PM Module | ✅ Complete | 20/16 (+4 bonus) |
| Data Components | ✅ Complete | 6/6 |
| Forms & Inputs | ✅ Complete | 5/5 |
| Feedback & States | ✅ Complete | 5/5 |
| Authentication | ✅ Complete | 6/6 |
| **Business Onboarding** | ✅ Complete | **18/18** |
| Workflow Builder | 🔴 Future | 0/6 |
| Content Module | 🔴 Future | 0/5 |
| Email Module | 🔴 Future | 0/5 |
| Video Module | 🔴 Future | 0/4 |

**Assets Location:** `/docs/design/wireframes/Finished wireframes and html files/`

---

## Core User Flows

### Flow 1: First-Time User Onboarding

```
Sign Up → Email Verification → Create Workspace → Add AI Provider Key → Dashboard
```

Key screens: AU-01, AU-02, AU-03, ST-02

### Flow 2: Daily Workflow (90/5 Promise)

```
Open Dashboard → Review Approval Queue → Quick Approve (1-click) → 
Check AI Activity → Chat with Hub → Done
```

Key screens: DB-01, AP-01, AP-02, CH-01, AI-01

### Flow 3: Approval Review

```
Notification Badge → Open Queue → Filter/Sort → 
View Item → See AI Reasoning → Approve/Reject → Next Item
```

Key screens: AP-01, AP-02, AP-03, AP-04

### Flow 4: AI Team Configuration

```
Settings → API Keys → Add Provider → Test Key →
Agent Model Preferences → Set Limits
```

**Sub-flow: Agent Model Preferences**
```
Select Agent Type → Choose Provider → Select Model →
Configure Fallback → Save Preferences
```

Features:
- Per-agent provider/model assignment (Approval Agent uses Claude, Research Agent uses OpenRouter/Llama, etc.)
- OpenRouter model browser (100+ models searchable by category, cost)
- Fallback provider/model for reliability
- Cost indicator per model choice (💰 Low/Med/High)

Key screens: ST-01, ST-02, ST-03, ST-04

### Flow 5: Business Onboarding (First Business)

```
Sign Up → Portfolio Dashboard (empty) → "Add Business" →
Wizard Step 1 (Documents) → Wizard Step 2 (Details) →
Wizard Step 3 (Idea) → Wizard Step 4 (Summary) →
Business Dashboard → Validation Tab (chat with Vera)
```

Key screens: BO-01, BO-02, BO-03, BO-04, BO-05, BO-06

### Flow 6: Validation Module (BMV)

```
Business Dashboard → Validation Tab → Chat with Vera →
"Run Market Sizing" → Marco analyzes → Results displayed →
"Run Competitor Analysis" → Cipher analyzes → Results displayed →
"Run Customer Discovery" → Persona analyzes → Results displayed →
"Generate Synthesis" → Vera synthesizes → Go/No-Go Score
```

Key screens: BO-06, BO-10, BO-11, BO-12, BO-13

### Flow 7: Planning Module (BMP)

```
Validation Complete → Planning Tab → Chat with Blake →
"Generate Business Model Canvas" → Model creates → Canvas displayed →
"Run Financial Projections" → Finn analyzes → Projections displayed →
"Create Business Plan" → Blake synthesizes → Plan document ready
```

Key screens: BO-07, BO-14, BO-15

### Flow 8: Branding Module (BM-Brand)

```
Planning Complete → Branding Tab → Chat with Bella →
"Define Brand Strategy" → Sage develops → Strategy displayed →
"Design Visual Identity" → Iris creates → Palette/Typography shown →
"Generate Assets" → Artisan produces → Assets available for download
```

Key screens: BO-08, BO-16, BO-17, BO-18

---

## Two-Level Dashboard Architecture

HYVVE uses a **two-level dashboard** to support multi-business users:

### Level 1: Portfolio Dashboard (`/dashboard`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] HYVVE                                     🔔(2)  [User ▼]  [?]  [⚙]  │
├─────────┬───────────────────────────────────────────────────────────────────┤
│         │                                                                    │
│  📊     │  Your Businesses                                   [+ Add Business]│
│ Portfolo│  ───────────────────────────────────────────────────────────────  │
│         │                                                                    │
│  ✅     │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│ Apprvls │  │ 🏢 TechStartup  │  │ 🏪 LocalBakery │  │ ➕ New Business │   │
│         │  │ ────────────────│  │ ────────────────│  │ ────────────────│   │
│  🤖     │  │ Stage: MVP      │  │ Stage: Idea     │  │                 │   │
│ Agents  │  │ Progress: 85%   │  │ Progress: 20%   │  │ Click to create │   │
│         │  │ [Validation ✓]  │  │ [Validation...] │  │ your next       │   │
│  ⚙️     │  │ [Planning ✓]    │  │ [Planning -]    │  │ business        │   │
│ Settings│  │ [Branding...]   │  │ [Branding -]    │  │                 │   │
│         │  │                 │  │                 │  │                 │   │
│         │  │ [Open →]        │  │ [Continue →]    │  │                 │   │
│         │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│         │                                                                    │
└─────────┴───────────────────────────────────────────────────────────────────┘
```

### Level 2: Business Dashboard (`/dashboard/[businessId]`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] HYVVE        [🏢 TechStartup ▼]           🔔(2)  [User ▼]  [?]  [⚙]  │
├─────────┬───────────────────────────────────────────────────────────────────┤
│         │                                                                    │
│  📊     │  TechStartup                                        Stage: MVP    │
│ Overview│  ───────────────────────────────────────────────────────────────  │
│         │                                                                    │
│  🔍     │  ┌─────────────────────────────────────────────────────────────┐  │
│Validatn │  │  Module Progress                                            │  │
│  ✓      │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐              │  │
│         │  │  │ Validation│  │  Planning │  │  Branding │              │  │
│  📋     │  │  │    ✓      │  │    ✓      │  │   65%    │              │  │
│ Planning│  │  │ Complete  │  │ Complete  │  │ In Progress│              │  │
│  ✓      │  │  │ Score: 82 │  │ BMC Done  │  │ Visual ID │              │  │
│         │  │  └───────────┘  └───────────┘  └───────────┘              │  │
│  🎨     │  └─────────────────────────────────────────────────────────────┘  │
│ Branding│                                                                    │
│  ⬤      │  Next Steps                                                       │
│         │  • Complete brand strategy with Bella                             │
│  ⚙️     │  • Generate logo options                                          │
│ Settings│  • Download brand assets                                          │
│         │                                                                    │
│─────────│────────────────────────────────────────────────────────────────────│
│[← Back] │                                                                    │
└─────────┴───────────────────────────────────────────────────────────────────┘
```

### Business Context Navigation

The **Business Switcher** (BO-09) allows quick context switching:

```
┌─────────────────────────┐
│ 🏢 TechStartup     ▼    │
├─────────────────────────┤
│ 🏢 TechStartup      ✓  │
│ 🏪 LocalBakery         │
│ ─────────────────────   │
│ ➕ Add New Business     │
│ 📊 View Portfolio       │
└─────────────────────────┘
```

---

## UI Layout System

### Three-Panel Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Logo]  HYVVE                        🔔(3)  [User ▼]  [?] [⚙]        │
├────────┬───────────────────────────────────────────────────────────────┤
│        │                                                    │         │
│  📊    │  [Main Content Area]                               │ 💬 Chat │
│ Dashbd │                                                    │         │
│        │  • Module-specific UI                              │ Agent   │
│  ✅    │  • Data tables                                     │ Panel   │
│Apprvls │  • Forms                                           │         │
│  (5)   │  • Visualizations                                  │         │
│        │                                                    │         │
│  🤖    │                                                    │         │
│ Agents │                                                    │         │
│        │                                                    │         │
│  ⚙️    │                                                    │         │
│Settngs │                                                    │         │
│        │                                                    │         │
│────────│────────────────────────────────────────────────────│─────────│
│ [ws ▼] │                                                    │ [─][□]  │
└────────┴───────────────────────────────────────────────────────────────┘
```

**Panel Behavior:**
- **Sidebar:** Collapsible (64px collapsed, 256px expanded)
- **Main:** Flexible, minimum 600px
- **Chat Panel:** 320px-480px, collapsible to icon

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single panel, bottom nav |
| Tablet | 640-1024px | Two panels, collapsible chat |
| Desktop | 1024-1440px | Three panels |
| Wide | > 1440px | Three panels, wider main |

---

## Component Patterns

### Approval Card (Confidence-Based)

**High Confidence (>85%):**
```
┌────────────────────────────────────────────────┐
│ 🟢 Email Campaign: "Summer Sale"        [95%]  │
│ Auto-approved · Marketing · 2 min ago          │
│                                    [View] [↩]  │
└────────────────────────────────────────────────┘
```

**Medium Confidence (60-85%):**
```
┌────────────────────────────────────────────────┐
│ 🟡 Blog Post: "AI Trends 2025"          [72%]  │
│ Quick review · Content · 15 min ago            │
│ ┌────────────────────────────────────────────┐ │
│ │ Preview excerpt here...                    │ │
│ └────────────────────────────────────────────┘ │
│                          [Reject] [✓ Approve]  │
└────────────────────────────────────────────────┘
```

**Low Confidence (<60%):**
```
┌────────────────────────────────────────────────┐
│ 🔴 Contract: "Enterprise Deal"          [45%]  │
│ Full review required · Sales · 1 hour ago      │
│ ┌─ AI Reasoning ────────────────────────────┐  │
│ │ Unusual terms detected in section 4.2     │  │
│ │ • Non-standard liability clause           │  │
│ │ • Payment terms differ from template      │  │
│ │ Confidence factors: ...                   │  │
│ └───────────────────────────────────────────┘  │
│ [View Full] [Edit] [Reject] [✓ Approve]        │
└────────────────────────────────────────────────┘
```

### Chat Message Types

**User Message:**
```
┌────────────────────────────────────────────────┐
│                                    You         │
│ Create a follow-up email for the Johnson deal  │
│                                     2:34 PM    │
└────────────────────────────────────────────────┘
```

**Agent Message (Maya - CRM):**
```
┌────────────────────────────────────────────────┐
│ 🐚 Maya                                        │
│ I've drafted a follow-up email for the        │
│ Johnson deal. The tone matches your previous  │
│ communications with them.                     │
│                                               │
│ [📧 View Draft] [✏️ Edit] [📤 Queue to Send]  │
│                                     2:34 PM   │
└────────────────────────────────────────────────┘
```

### AI Team Indicators

Each agent has a consistent visual identity:

**Platform Agents:**

| Agent | Icon | Color | Role |
|-------|------|-------|------|
| Hub | 🎯 | Coral #FF6B6B | Orchestrator |
| Maya | 🐚 | Teal #20B2AA | CRM Agent |
| Atlas | 🗺️ | Orange #FF9F43 | PM Agent |
| Sage | 🌿 | Green #2ECC71 | Finance Agent |
| Nova | ✨ | Pink #FF6B9D | Marketing Agent |
| Echo | 📊 | Blue #4B7BEC | Analytics Agent |

**Foundation Module Agents (Business Onboarding):**

| Team | Agent | Icon | Color | Role |
|------|-------|------|-------|------|
| **BMV** | Vera | 🔍 | Deep Teal #008B8B | Validation Team Leader |
| BMV | Marco | 📊 | Steel Blue #4682B4 | Market Researcher |
| BMV | Cipher | 🎯 | Slate Gray #708090 | Competitor Analyst |
| BMV | Persona | 👥 | Warm Purple #9370DB | Customer Profiler |
| BMV | Risk | ⚖️ | Amber #FFB300 | Feasibility Assessor |
| **BMP** | Blake | 📋 | Navy Blue #001F5C | Planning Team Leader |
| BMP | Model | 🧩 | Royal Blue #4169E1 | Business Model Architect |
| BMP | Finn | 💰 | Gold #DAA520 | Financial Analyst |
| BMP | Revenue | 📈 | Forest Green #228B22 | Monetization Strategist |
| BMP | Forecast | 🔮 | Purple #800080 | Growth Forecaster |
| **BM-Brand** | Bella | 🎨 | Rose Gold #B76E79 | Branding Team Leader |
| BM-Brand | Sage | 🌟 | Emerald #50C878 | Brand Strategist |
| BM-Brand | Vox | 💬 | Coral #FF7F50 | Voice Architect |
| BM-Brand | Iris | 👁️ | Violet #8B5CF6 | Visual Identity Designer |
| BM-Brand | Artisan | ✏️ | Bronze #CD7F32 | Asset Generator |
| BM-Brand | Audit | ✅ | Charcoal #36454F | Brand Auditor |

---

## Accessibility Standards

### Requirements (WCAG 2.1 AA)

- **Color Contrast:** Minimum 4.5:1 for text, 3:1 for large text
- **Focus Indicators:** Visible on all interactive elements
- **Keyboard Navigation:** Full functionality without mouse
- **Screen Reader:** Semantic HTML, ARIA labels
- **Motion:** Respect reduced-motion preference

### Implementation

```css
/* Focus ring */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance Standards

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Interaction Response | < 100ms |
| Bundle Size (initial) | < 100KB JS |

---

## Implementation Notes

### Technology Stack

- **UI Framework:** React 19 with Next.js 15 App Router
- **Component Library:** shadcn/ui (customized to brand)
- **Styling:** Tailwind CSS 4 with design tokens
- **Icons:** Lucide React
- **State Management:** Zustand + React Query
- **Real-time:** Socket.io for live updates

### Design Token Integration

All design tokens are defined in the Style Guide and should be implemented as CSS custom properties:

```css
:root {
  --color-primary: #FF6B6B;
  --color-accent: #20B2AA;
  --bg-cream: #FFFBF5;
  /* ... see STYLE-GUIDE.md for complete list */
}
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `/docs/design/BRAND-GUIDELINES.md` | Complete brand identity |
| `/docs/design/STYLE-GUIDE.md` | Design system and tokens |
| `/docs/design/wireframes/WIREFRAME-INDEX.md` | Wireframe catalog |
| `/docs/prd.md` | Product requirements |
| `/docs/architecture.md` | Technical architecture |

---

## Next Steps

### Phase 1: Core Shell Implementation
All P0 wireframes are complete. Begin implementation using:

| Component | Wireframe | Assets |
|-----------|-----------|--------|
| Shell Layout | SH-01 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/sh-01_shell_layout_(three-panel)/) |
| Chat Panel | CH-01 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/ch-01_chat_panel/) |
| Dashboard | DB-01 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/db-01_dashboard_overview/) |
| Approval Queue | AP-01 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/ap-01_approval_queue_main/) |
| AI Team | AI-01 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/ai-01_ai_team_overview/) |
| Settings | ST-01 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/st-01_settings_layout/) |
| Login | AU-01 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/au-01_login_page/) |
| Register | AU-02 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/au-02_register/) |

### Phase 2: Data Components & Modules
All module wireframes are complete. Implement in order:
1. Data Tables (DC-01) → CRM Lists → PM Lists
2. Kanban Boards (DC-02) → Deals Pipeline → Task Board
3. Forms & Inputs (FI-*) → Entity Creation/Editing

### Phase 3: Business Onboarding (EPIC-08)
All 18 wireframes complete. Begin implementation using:

| Component | Wireframe | Assets |
|-----------|-----------|--------|
| Portfolio Dashboard | BO-01 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-01_portfolio_dashboard_with_business_cards/) |
| Wizard Step 1 | BO-02 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-02_onboarding_wizard_-_step_1__documents/) |
| Wizard Step 2 | BO-03 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-03_onboarding_wizard_-_step_2__business_details/) |
| Wizard Step 3 | BO-04 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-04_onboarding_wizard_-_step_3__capture_idea/) |
| Wizard Step 4 | BO-05 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-05_onboarding_wizard_-_step_4__launch_%26_summary/) |
| Validation Page | BO-06 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-06_validation_page_with_chat_interface/) |
| Planning Page | BO-07 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-07_planning_page_with_workflow_progress/) |
| Branding Page | BO-08 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-08_branding_page_with_visual_identity_preview/) |
| Business Switcher | BO-09 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-09_business_switcher_dropdown/) |
| Validation Results | BO-10 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-10_validation_synthesis_results/) |
| Market Sizing | BO-11 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-11_market_sizing_results/) |
| Competitor Analysis | BO-12 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-12_competitor_analysis_dashboard/) |
| Customer Discovery | BO-13 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-13_customer_discovery_results/) |
| Business Model Canvas | BO-14 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-14_business_model_canvas_view/) |
| Financial Projections | BO-15 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-15_financial_projections_dashboard/) |
| Brand Strategy | BO-16 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-16_brand_strategy_results/) |
| Visual Identity | BO-17 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-17_visual_identity_system/) |
| Asset Gallery | BO-18 | [View](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-18_asset_gallery_%26_download/) |

**Full wireframe index:** [WIREFRAME-INDEX.md](design/wireframes/WIREFRAME-INDEX.md)

---

_Generated by BMAD UX Design Workflow v1.0_
_Date: 2025-11-30_
_Updated: 2025-12-02_
_For: chris_
