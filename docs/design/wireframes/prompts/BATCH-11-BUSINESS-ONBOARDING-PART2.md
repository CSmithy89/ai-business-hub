# Batch 11: Business Onboarding Part 2 - Google Stitch Wireframe Prompts

## Prompts 101-108: Validation Results, Planning Outputs & Branding Assets

**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Date:** 2025-12-02
**Total Prompts:** 8 (Remaining P1/P2 wireframes)

---

## Global Design System (Copy into each prompt)

```
HYVVE Design System Specifications:

COLORS:
- Primary Coral: #FF6B6B (buttons, links, active states)
- Secondary Teal: #20B2AA (secondary actions, accents)
- Background Cream: #FFFBF5 (main background)
- Surface White: #FFFFFF (cards, panels)
- Border Light: #E8E4E0 (dividers, borders)
- Text Primary: #1A1A1A (headings, body)
- Text Secondary: #6B6B6B (labels, captions)
- Text Muted: #9CA3AF (placeholders, disabled)

STATUS COLORS:
- Success Green: #10B981
- Warning Amber: #F59E0B
- Error Red: #EF4444
- Info Blue: #3B82F6

AGENT COLORS (Business Onboarding):
- Vera (Validation Lead): #FF6B6B coral
- Marco (Market Analyst): #20B2AA teal
- Cipher (Competitor Intel): #FF9F43 orange
- Persona (Customer Discovery): #2ECC71 green
- Blake (Planning Lead): #4B7BEC blue
- Finn (Financial Analyst): #9B59B6 purple
- Bella (Brand Lead): #FF6B9D pink
- Sage (Brand Strategist): #1ABC9C emerald
- Iris (Visual Designer): #E74C3C red

TYPOGRAPHY:
- Font Family: 'Inter', -apple-system, sans-serif
- Code Font: 'JetBrains Mono', monospace
- Base Size: 16px
- Scale: 12px, 14px, 16px, 18px, 20px, 24px, 32px, 48px
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Line Heights: 1.2 (headings), 1.5 (body), 1.6 (relaxed)

SPACING (4px base):
- 4px (xs), 8px (sm), 12px (md), 16px (lg), 20px (xl), 24px (2xl), 32px (3xl), 48px (4xl), 64px (5xl)

BORDER RADIUS:
- 4px (sm), 8px (md), 12px (lg), 16px (xl), 9999px (full/pill)

SHADOWS:
- sm: 0 1px 2px rgba(0,0,0,0.05)
- md: 0 4px 6px rgba(0,0,0,0.07)
- lg: 0 10px 15px rgba(0,0,0,0.1)
- xl: 0 20px 25px rgba(0,0,0,0.15)

THREE-PANEL LAYOUT:
- Left Sidebar: 64px collapsed / 256px expanded
- Main Content: Flexible, min 600px
- Right Chat Panel: 320-480px, collapsible
```

---

## VALIDATION PHASE WIREFRAMES (BMV)

---

## Prompt #101: Market Sizing Results (BO-11)

```
Create a Market Sizing Results page wireframe for Hyvve's Business Validation module:

THREE-PANEL LAYOUT:

HEADER:
- Breadcrumb: "[Business Name] / Validation / Market Sizing"
- Title: "Market Sizing Analysis"
- Status badge: "✅ Complete"
- "Back to Validation" link

MAIN CONTENT - MARKET SIZE VISUALIZATION:

TAM/SAM/SOM FUNNEL:
- Large visual funnel diagram showing:
  - TAM (Total Addressable Market): $4.2B - widest part
  - SAM (Serviceable Addressable Market): $840M - medium
  - SOM (Serviceable Obtainable Market): $42M - narrowest
- Each level has:
  - Dollar amount (large, bold)
  - Description (small)
  - Confidence indicator (High/Medium/Low badge)

METHODOLOGY CARD:
- "How we calculated this"
- Collapsible section with:
  - Data sources used (3-4 bullet points)
  - Assumptions made
  - Confidence factors

MARKET GROWTH CHART:
- Line chart showing projected market growth
- X-axis: Years (2024-2029)
- Y-axis: Market size in billions
- Two lines: Conservative vs Optimistic projections
- Legend with both scenarios

KEY METRICS GRID (2x2):
- "CAGR: 12.5%" - Market growth rate
- "Market Maturity: Growing" - with indicator
- "Entry Barriers: Medium" - with risk indicator
- "Timing Score: 8/10" - opportunity rating

SOURCES PANEL:
- "Data Sources" heading
- List of sources with links/references
- Last updated timestamp
- "2+ independent sources" validation badge

CHAT PANEL:
- Agent: Marco (📊 Market Analyst)
- Message: "The TAM of $4.2B is based on industry reports from Gartner and IBISWorld. The growth trajectory suggests strong opportunity. Would you like me to drill into any specific segment?"

ACTION BUTTONS:
- "Export to PDF" secondary
- "Continue to Competitors →" primary

Use teal for positive metrics, charts with coral accent line.
```

---

## Prompt #102: Competitor Analysis Dashboard (BO-12)

```
Create a Competitor Analysis dashboard wireframe for Hyvve's Business Validation:

THREE-PANEL LAYOUT:

HEADER:
- Breadcrumb: "[Business Name] / Validation / Competitors"
- Title: "Competitive Landscape"
- Filter dropdown: "All" | "Direct" | "Indirect"

MAIN CONTENT:

COMPETITOR MATRIX (feature comparison table):
- Columns: Your Business | Competitor 1 | Competitor 2 | Competitor 3
- Rows with checkmarks/X for features:
  - AI-Powered Automation ✅ | ❌ | ✅ | ❌
  - SMB Focus ✅ | ❌ | ❌ | ✅
  - No-Code Setup ✅ | ✅ | ❌ | ✅
  - 24/7 Support ✅ | ✅ | ✅ | ❌
- Cell colors: Green for advantage, red for disadvantage

POSITIONING MAP:
- 2D scatter plot visualization
- X-axis: Price (Low → High)
- Y-axis: Features (Basic → Advanced)
- Competitor dots with labels
- "Your Position" highlighted with coral circle
- Quadrant labels: "Budget", "Enterprise", "Feature-Rich", "Premium"

COMPETITOR CARDS (horizontal scroll):
Each card (280px wide):
- Company logo placeholder
- Company name
- Type badge: "Direct" (red) or "Indirect" (amber)
- Key stats:
  - "Founded: 2019"
  - "Funding: $50M"
  - "Employees: 200"
- Strengths (2 bullets, green)
- Weaknesses (2 bullets, amber)
- "View Details" link

OPPORTUNITY GAPS PANEL:
- "Market Gaps Identified" heading
- 3 opportunity cards:
  - "Gap 1: AI for SMBs" - "No competitor offers AI specifically for small businesses"
  - "Gap 2: Unified Platform" - "Most require multiple tools"
  - "Gap 3: Affordable Pricing" - "Enterprise pricing excludes SMBs"
- Each with "Capitalize" rating (High/Medium/Low)

CHAT PANEL:
- Agent: Cipher (🔍 Competitive Intelligence)
- Message: "I've identified 12 competitors total. The biggest opportunity is in the SMB AI automation space - only 2 competitors are actively targeting this segment."

Use teal for opportunities, coral for your positioning highlight.
```

---

## Prompt #103: Customer Discovery Results (BO-13)

```
Create a Customer Discovery results page wireframe for Hyvve's Business Validation:

THREE-PANEL LAYOUT:

HEADER:
- Breadcrumb: "[Business Name] / Validation / Customers"
- Title: "Customer Discovery"
- Status: "3 ICPs Defined"

MAIN CONTENT:

ICP CARDS (Ideal Customer Profiles):
Three large cards in a row:

ICP CARD 1 - PRIMARY:
- Badge: "Primary ICP" (coral background)
- Persona avatar placeholder
- Name: "Small Business Sarah"
- Demographics:
  - "SMB Owner, 5-20 employees"
  - "Revenue: $500K-$2M"
  - "Industry: Professional Services"
- Pain Points (bullet list):
  - "Overwhelmed by operational tasks"
  - "Can't afford full-time staff"
  - "Needs automation but lacks tech skills"
- Willingness to Pay: "$99-299/mo"
- Confidence: "High" badge

ICP CARD 2 - SECONDARY:
- Badge: "Secondary ICP" (teal background)
- Similar structure with different persona

ICP CARD 3 - TERTIARY:
- Badge: "Tertiary ICP" (gray background)
- Similar structure

PAIN POINT ANALYSIS:
- "Top Pain Points Across All ICPs"
- Horizontal bar chart showing:
  - "Time spent on manual tasks" - 85% bar
  - "Lack of AI expertise" - 72% bar
  - "Budget constraints" - 68% bar
  - "Tool fragmentation" - 61% bar
- Each bar in teal gradient

INTERVIEW INSIGHTS PANEL:
- "Customer Interview Highlights"
- Quote cards (3):
  - Quote icon
  - Actual quote text in italics
  - Attribution: "— SMB Owner, Consulting"
- "Based on synthesized research" disclaimer

JOBS-TO-BE-DONE SECTION:
- "What customers are trying to accomplish"
- 3 JTBD cards:
  - "Reduce time spent on repetitive tasks by 50%"
  - "Make data-driven decisions without analysts"
  - "Scale operations without scaling headcount"

CHAT PANEL:
- Agent: Persona (👤 Customer Discovery)
- Message: "I've synthesized research from 50+ similar businesses. The primary ICP shows strong product-market fit signals. Should I generate customer interview scripts?"
- Action buttons: "Generate Scripts" | "View Full Research"

Use coral for primary ICP, teal for secondary, muted for tertiary.
```

---

## PLANNING PHASE WIREFRAMES (BMP)

---

## Prompt #104: Business Model Canvas View (BO-14)

```
Create a Business Model Canvas page wireframe for Hyvve's Business Planning module:

FULL-WIDTH LAYOUT (no chat panel, maximized canvas):

HEADER:
- Breadcrumb: "[Business Name] / Planning / Business Model"
- Title: "Business Model Canvas"
- Action buttons: "Edit" | "Export PDF" | "Present Mode"

CANVAS LAYOUT (9-block grid):

Standard Business Model Canvas structure:

TOP ROW (3 blocks):
┌─────────────────┬─────────────────┬─────────────────┐
│ Key Partners    │ Key Activities  │ Value           │
│                 │                 │ Propositions    │
│ • AI Providers  │ • Platform Dev  │ • 90% automation│
│ • Cloud (AWS)   │ • Customer Sup  │ • AI team 24/7  │
│ • Payment (Str) │ • AI Training   │ • 5hr/wk human  │
└─────────────────┴─────────────────┴─────────────────┘

MIDDLE ROW (4 blocks):
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Key Resources   │                 │ Customer        │ Customer        │
│                 │ (Value Props    │ Relationships   │ Segments        │
│ • AI Models     │  spans both     │ • Self-service  │ • SMB Owners    │
│ • Engineering   │  rows)          │ • AI Chat 24/7  │ • Solopreneurs  │
│ • Data Platform │                 │ • Email Support │ • Agencies      │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

BOTTOM ROW (2 blocks):
┌─────────────────────────────────┬─────────────────────────────────────┐
│ Cost Structure                  │ Revenue Streams                     │
│                                 │                                     │
│ • Cloud Infrastructure (40%)   │ • Subscription: $99-499/mo          │
│ • AI API Costs (25%)           │ • Usage: Token overages             │
│ • Engineering (20%)            │ • Enterprise: Custom pricing        │
│ • Support (15%)                │                                     │
└─────────────────────────────────┴─────────────────────────────────────┘

CANVAS INTERACTION:
- Each block is clickable/editable
- Hover state shows "Edit" icon
- Click expands to edit mode with textarea
- AI suggestion button in each block: "✨ Suggest"

CONFIDENCE INDICATORS:
- Each block has small confidence badge (High/Med/Low)
- Color coded: Green/Amber/Gray

SIDEBAR (collapsible, right edge):
- "Canvas Health" score: 82/100
- Completion checklist:
  - ✅ Value Propositions defined
  - ✅ Customer Segments identified
  - 🔄 Revenue Streams needs review
  - ○ Key Partners incomplete
- "AI Suggestions" panel with recommendations

ZOOM CONTROLS (bottom right):
- Zoom in/out buttons
- "Fit to Screen" button
- Current zoom level indicator

Export includes: PDF, PNG, PowerPoint slide

Use light canvas background with coral accents for interactive elements.
```

---

## Prompt #105: Financial Projections Dashboard (BO-15)

```
Create a Financial Projections dashboard wireframe for Hyvve's Business Planning:

THREE-PANEL LAYOUT:

HEADER:
- Breadcrumb: "[Business Name] / Planning / Financials"
- Title: "Financial Projections"
- Toggle: "Conservative" | "Moderate" | "Optimistic"
- Time range selector: "Year 1" | "Year 3" | "Year 5"

MAIN CONTENT:

KEY METRICS ROW (4 cards):
- "Year 1 Revenue": "$240,000" with trend arrow ↑
- "Monthly Burn": "$18,000"
- "Runway": "14 months"
- "Break-even": "Month 18"

REVENUE CHART (large):
- Area chart showing monthly revenue projection
- X-axis: Months 1-36
- Y-axis: Revenue ($0-$50K)
- Stacked areas:
  - Subscription revenue (teal)
  - Usage revenue (coral)
  - Enterprise revenue (purple)
- Break-even line marked with vertical dashed line
- Hover tooltips with monthly details

EXPENSE BREAKDOWN:
- Horizontal stacked bar or donut chart
- Categories:
  - Infrastructure (40%) - teal
  - Personnel (30%) - coral
  - Marketing (15%) - purple
  - Operations (10%) - gray
  - Other (5%) - light gray
- Legend with dollar amounts

CASH FLOW TABLE:
- Monthly/quarterly table view
- Columns: Period | Revenue | Expenses | Net | Cumulative
- Color coding: Green for positive, red for negative
- Scrollable with sticky header

ASSUMPTIONS PANEL (collapsible):
- "Key Assumptions"
- Editable fields:
  - "Customer Acquisition Cost: $150"
  - "Monthly Churn Rate: 3%"
  - "Average Revenue Per User: $199"
  - "Conversion Rate: 2.5%"
- "Recalculate" button when changed

SCENARIO COMPARISON (tab or toggle):
- Side-by-side mini charts
- Conservative | Moderate | Optimistic
- Key metric comparison table

CHAT PANEL:
- Agent: Finn (💰 Financial Analyst)
- Message: "Based on your assumptions, you'll reach profitability in Month 18. I recommend building 6 months runway buffer. Want me to model different CAC scenarios?"
- Action buttons: "Model CAC Scenarios" | "Export Financials"

Use teal for revenue, coral for expenses, purple for projections.
```

---

## BRANDING PHASE WIREFRAMES (BM-Brand)

---

## Prompt #106: Brand Strategy Results (BO-16)

```
Create a Brand Strategy Results page wireframe for Hyvve's Branding module:

THREE-PANEL LAYOUT:

HEADER:
- Breadcrumb: "[Business Name] / Branding / Strategy"
- Title: "Brand Strategy"
- Status: "✅ Complete"

MAIN CONTENT:

BRAND ARCHETYPE CARD (hero section):
- Large card with archetype illustration placeholder
- Archetype name: "The Sage" (large, bold)
- Tagline: "Wisdom through Intelligence"
- Description: "Your brand seeks to understand the world through analysis and expertise. You help customers find truth and solutions through knowledge."

ARCHETYPE WHEEL (visual):
- Circular diagram showing all 12 archetypes
- "The Sage" highlighted/selected
- Adjacent archetypes slightly visible
- Interactive: hover shows archetype details

BRAND ATTRIBUTES SECTION:

"Core Values" card:
- Icon badges for 4-5 values:
  - 🎯 "Intelligence"
  - 💡 "Innovation"
  - 🤝 "Trust"
  - 📈 "Growth"
  - 🔒 "Security"

"Brand Personality" card:
- Slider scales showing personality traits:
  - Modern ←————●———→ Traditional (leaning modern)
  - Playful ←———●————→ Serious (leaning serious)
  - Accessible ←————●——→ Exclusive (middle)
  - Bold ←——●—————→ Reserved (leaning bold)

"Brand Promise" card:
- Quote-style display:
- "We promise to give you back your time by automating 90% of your business operations with AI that works 24/7."

COMPETITIVE POSITIONING:
- "How you'll stand out"
- 3 differentiation points with icons:
  - "AI-First Approach" - Unlike traditional tools
  - "SMB Focus" - Not enterprise complexity
  - "Human-AI Balance" - Not full automation

MESSAGING PILLARS:
- "Key Messages" section
- 3 message cards:
  - Primary: "Automate 90% of your business"
  - Secondary: "AI team that never sleeps"
  - Tertiary: "Focus on what matters"

CHAT PANEL:
- Agent: Sage (📖 Brand Strategist)
- Message: "The Sage archetype perfectly aligns with your AI-powered positioning. This will guide all brand communications. Ready to define your brand voice?"
- Action: "Continue to Brand Voice →"

Use teal for archetype highlight, coral for key CTAs, purple accents for premium feel.
```

---

## Prompt #107: Visual Identity System (BO-17)

```
Create a Visual Identity System page wireframe for Hyvve's Branding module:

WIDE LAYOUT (reduced chat panel):

HEADER:
- Breadcrumb: "[Business Name] / Branding / Visual Identity"
- Title: "Visual Identity System"
- Actions: "Download Brand Kit" | "Edit"

MAIN CONTENT:

LOGO SECTION:
- "Logo" heading
- Large logo display area (centered, 200x100px)
- Logo variations row:
  - Primary (full color)
  - Reversed (white on dark)
  - Monochrome (black)
  - Icon only (symbol mark)
- Clear space guidelines diagram
- Minimum size specifications

COLOR PALETTE SECTION:
- "Color Palette" heading

Primary Colors (large swatches):
┌────────────────┐ ┌────────────────┐
│                │ │                │
│   Primary      │ │   Secondary    │
│   #6366F1      │ │   #10B981      │
│   Indigo       │ │   Emerald      │
└────────────────┘ └────────────────┘

Secondary Colors (smaller swatches):
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Accent│ │Light │ │ Dark │ │Neutral│
│#F59E0B│#F3F4F6│#1F2937│ #6B7280│
└──────┘ └──────┘ └──────┘ └──────┘

Each swatch shows:
- Color block
- Name
- Hex code
- "Copy" button on hover

Color usage guidelines:
- "Primary: CTAs, links, highlights"
- "Secondary: Success states, positive"
- "Accent: Warnings, attention"

TYPOGRAPHY SECTION:
- "Typography" heading

Heading font display:
Inter Bold
ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
1234567890

Body font display:
Inter Regular
The quick brown fox jumps over the lazy dog.

Type scale:
- H1: 48px / Bold
- H2: 36px / Semi-Bold
- H3: 24px / Semi-Bold
- Body: 16px / Regular
- Small: 14px / Regular

ICONOGRAPHY SECTION:
- "Icons" heading
- Icon style: "Outlined, rounded corners"
- Sample icons grid (12 icons)
- Icon color: "Use primary or neutral only"

IMAGERY GUIDELINES:
- "Photography Style" heading
- 3 sample image placeholders
- Guidelines: "Bright, professional, diverse, authentic"

CHAT PANEL (narrow):
- Agent: Iris (🎨 Visual Designer)
- Message: "Your visual identity is ready! The indigo primary color conveys trust and innovation. Download your brand kit to start using these assets."

Bottom actions: "Download Brand Kit (ZIP)" | "Continue to Assets →"
```

---

## Prompt #108: Asset Gallery & Download (BO-18)

```
Create an Asset Gallery page wireframe for Hyvve's Branding module:

THREE-PANEL LAYOUT:

HEADER:
- Breadcrumb: "[Business Name] / Branding / Assets"
- Title: "Brand Assets"
- Bulk action: "Download All (ZIP)" button
- Filter: "All" | "Logos" | "Social" | "Documents"

MAIN CONTENT - ASSET GRID:

SECTION: "Logo Package"
Grid of asset cards (4 columns):
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ [Preview]   │ │ [Preview]   │ │ [Preview]   │ │ [Preview]   │
│             │ │             │ │             │ │             │
│ Logo Full   │ │ Logo Icon   │ │ Logo White  │ │ Logo Black  │
│ PNG, SVG    │ │ PNG, SVG    │ │ PNG, SVG    │ │ PNG, SVG    │
│ [Download ↓]│ │ [Download ↓]│ │ [Download ↓]│ │ [Download ↓]│
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

SECTION: "Social Media Kit"
Grid of social media assets:
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ [Preview]   │ │ [Preview]   │ │ [Preview]   │ │ [Preview]   │
│             │ │             │ │             │ │             │
│ LinkedIn    │ │ Twitter/X   │ │ Facebook    │ │ Instagram   │
│ Banner      │ │ Header      │ │ Cover       │ │ Profile     │
│ 1584x396    │ │ 1500x500    │ │ 820x312     │ │ 1080x1080   │
│ [Download ↓]│ │ [Download ↓]│ │ [Download ↓]│ │ [Download ↓]│
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

SECTION: "Documents"
Document cards (larger):
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ [PDF Icon]                    │ │ [PDF Icon]                    │
│ Brand Guidelines              │ │ One-Page Brand Summary        │
│ Comprehensive brand manual    │ │ Quick reference sheet         │
│ 24 pages • PDF • 4.2 MB       │ │ 1 page • PDF • 1.1 MB         │
│ [Preview] [Download ↓]        │ │ [Preview] [Download ↓]        │
└──────────────────────────────┘ └──────────────────────────────┘

SECTION: "Templates"
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ Email Signature               │ │ Presentation Template         │
│ HTML template for email       │ │ PowerPoint/Google Slides      │
│ [Download ↓]                  │ │ [Download ↓]                  │
└──────────────────────────────┘ └──────────────────────────────┘

ASSET CARD HOVER STATE:
- Slight elevation
- "Preview" overlay button
- Checkbox for bulk selection

BULK ACTIONS BAR (shown when items selected):
- "3 items selected"
- "Download Selected" button
- "Clear Selection" link

GENERATION STATUS (if assets still generating):
- Progress card: "Generating social media assets... 75%"
- Estimated time remaining
- "Generating 4 of 12 assets"

CHAT PANEL:
- Agent: Artisan (🖼️ Asset Generator)
- Message: "All your brand assets are ready! I've created logo variations, social media headers, and document templates. Everything follows your brand guidelines."
- Quick actions: "Request Custom Size" | "Regenerate Asset"

COMPLETION CELEBRATION:
- If all assets complete, show confetti/success banner
- "Your brand is ready to launch! 🎉"

Use coral for download buttons, teal for progress indicators.
```

---

## Wireframe IDs Reference

| Prompt # | ID | Name | Priority | Phase |
|----------|-----|------|----------|-------|
| #101 | BO-11 | Market Sizing Results | P1 | Validation (BMV) |
| #102 | BO-12 | Competitor Analysis | P1 | Validation (BMV) |
| #103 | BO-13 | Customer Discovery | P1 | Validation (BMV) |
| #104 | BO-14 | Business Model Canvas | P1 | Planning (BMP) |
| #105 | BO-15 | Financial Projections | P1 | Planning (BMP) |
| #106 | BO-16 | Brand Strategy | P2 | Branding (BMB) |
| #107 | BO-17 | Visual Identity | P2 | Branding (BMB) |
| #108 | BO-18 | Asset Gallery | P2 | Branding (BMB) |

---

## Usage Notes

1. Use these prompts sequentially in Google Stitch
2. Copy the Global Design System into each prompt for consistency
3. Export both light and dark mode variants if possible
4. Add annotations for interactive states and animations
5. Name exported files using the BO-XX convention (e.g., `bo-11_market_sizing_results`)
6. Save to: `/docs/design/wireframes/Finished wireframes and html files/`

---

## File Naming Convention

When exporting from Google Stitch, use this naming pattern:
```
bo-11_market_sizing_results/
├── code.html
└── screen.png

bo-12_competitor_analysis/
├── code.html
└── screen.png
```

---

_Created: 2025-12-02_
_Part of: EPIC-08 Business Onboarding_
_Continues from: BATCH-10-BUSINESS-ONBOARDING.md_
