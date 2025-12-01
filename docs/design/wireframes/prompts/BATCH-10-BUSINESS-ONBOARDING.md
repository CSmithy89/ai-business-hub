# Batch 10: Business Onboarding Wireframes

**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Date:** 2025-12-01
**Total Prompts:** 18 (Covering all 3 phases: Validation, Planning, Branding)

---

## Design Context (Use for all prompts)

**Brand Colors:**
- Primary: Coral (#FF6B6B)
- Secondary: Teal (#20B2AA)
- Background Light: Cream (#FFFBF5)
- Background Dark: Near-black (#0a0a0b)
- Text: Dark gray (#1a1a1a)

**Typography:**
- Headings: Inter Semi-Bold/Bold
- Body: Inter Regular
- Monospace: JetBrains Mono

**Layout:**
- Three-panel layout: Sidebar (64-256px), Main (flexible), Chat Panel (320-480px)
- Card-based UI with subtle shadows
- Rounded corners (8px default, 12px for larger cards)

---

## Prompt #91: Portfolio Dashboard with Business Cards (BO-01)

```
Create a portfolio dashboard wireframe for Hyvve platform showing a user's businesses:

LAYOUT:
- Header: Logo (left), notification bell with badge, user avatar dropdown (right)
- Main content: Grid of business cards (3 columns on desktop, 2 on tablet, 1 on mobile)
- No sidebar visible (this is the home/portfolio view)

BUSINESS CARD DESIGN:
Each card (320px wide) shows:
- Business logo placeholder (48px circle)
- Business name (bold, 18px)
- Status badge: "Active" (green), "Draft" (amber), "Paused" (gray)
- Key metric: "Validation Score: 78%" or "Revenue: $12.4K/mo"
- Phase indicator: "Phase: Branding" with progress dots
- Last activity timestamp: "Updated 2 hours ago"
- Hover state: subtle elevation increase

SPECIAL CARD - "Start New Business":
- Dashed border card
- Large "+" icon (40px)
- Text: "Start New Business"
- Subtext: "Create a new business with AI guidance"
- Background: light coral gradient on hover

PAGE HEADER:
- Title: "Your Businesses"
- Subtitle: "Manage your business portfolio"
- Optional filter dropdown: "All" | "Active" | "Draft"

EMPTY STATE (if no businesses):
- Illustration placeholder
- "No businesses yet"
- "Start your first business with AI-powered guidance"
- Large CTA button: "Create Your First Business"

COLOR SCHEME: Light mode with cream background, coral accents, teal for progress indicators

Include both populated state (3-4 business cards) and empty state views.
```

---

## Prompt #92: Onboarding Wizard - Step 1: Document Upload (BO-02)

```
Create a multi-step onboarding wizard wireframe for starting a new business on Hyvve:

WIZARD CONTAINER:
- Centered modal/page (max-width 640px)
- Step indicator at top: 4 circles with labels, step 1 filled (coral)
- Steps: "Documents" → "Details" → "Idea" → "Launch"
- Close button (X) in top-right corner

STEP 1 CONTENT - "Do you have existing documents?":

Two large selection cards side by side:

CARD A - "I have documents":
- Icon: Document stack icon (📄)
- Title: "I have documents"
- Description: "Upload your existing business plan, market research, or brand guidelines. We'll extract key information and identify gaps."
- Subtle file type hints: "PDF, DOCX, MD supported"
- Border color on select: Coral

CARD B - "Start from scratch":
- Icon: Sparkles/magic wand icon (✨)
- Title: "Start from scratch"
- Description: "Our AI team will guide you through complete business validation, planning, and branding. Takes approximately 2-4 hours."
- Border color on select: Teal

BOTTOM ACTIONS:
- "Cancel" text button (left)
- "Continue" primary button (right, coral background)
- "Continue" disabled until selection made

UPLOAD AREA (shown when "I have documents" selected):
- Large dashed upload zone
- Icon: Cloud upload
- Text: "Drag and drop files here, or click to browse"
- Supported formats: "PDF, DOCX, MD • Max 10MB per file"
- File list showing uploaded files with remove (X) button

Include both states: initial selection and file upload expanded view.
```

---

## Prompt #93: Onboarding Wizard - Step 2: Business Details (BO-03)

```
Create Step 2 of the business onboarding wizard for Hyvve:

WIZARD HEADER:
- Step indicator: Circle 2 filled (coral), circles 1 completed (checkmark)
- Current step label: "Business Details"
- Back arrow button (left of title)

FORM CONTENT:

FIELD 1 - Business Name:
- Label: "What's your business called?"
- Input: Text field with placeholder "e.g., Acme Solutions"
- Helper text: "You can change this later"
- Character counter: "0/50"

FIELD 2 - Industry:
- Label: "What industry are you in?"
- Dropdown select with search
- Popular options shown: "Technology", "E-commerce", "Professional Services", "Healthcare", "Education"
- "Other" option with custom text input

FIELD 3 - Business Type:
- Label: "What type of business is this?"
- Radio button group (vertical):
  - "New startup - Just getting started"
  - "Existing business - Already operating"
  - "Side project - Testing an idea"

FIELD 4 - Logo Upload (Optional):
- Label: "Upload a logo (optional)"
- Small upload zone (120px square)
- Placeholder: Camera/image icon
- Text: "PNG or SVG"

VALIDATION:
- Real-time validation checkmarks
- Error states with red border and message

BOTTOM ACTIONS:
- "← Back" text button
- "Continue" primary button (coral)

Light cream background, clean form layout with generous spacing.
```

---

## Prompt #94: Onboarding Wizard - Step 3: Capture Idea (BO-04)

```
Create Step 3 of the business onboarding wizard focused on capturing the business idea:

WIZARD HEADER:
- Step indicator: Circles 1-2 completed, circle 3 active (coral)
- Current step: "Your Idea"

MAIN CONTENT:

INTRO TEXT:
- "Tell us about your business idea"
- Subtext: "Don't worry about perfection - our AI team will help refine this."

TEXTAREA - Business Idea:
- Label: "Describe your business idea"
- Large textarea (6 rows minimum)
- Placeholder: "What problem are you solving? Who are you solving it for? How will you make money?"
- Character limit: 1000 characters with counter
- AI suggestion badge: "💡 Be specific about your target customer"

OPTIONAL FIELDS (collapsible section):

Collapsed state: "Add more details (optional)" with chevron

Expanded state:
- "Target customers" - text input
- "Key competitors" - text input
- "What makes you different?" - text input

AI PREVIEW BOX (shown after text entered):
- Light teal background
- Icon: Sparkles
- "Our AI team will analyze:"
- Bullet list:
  - "Market size and opportunity"
  - "Competitive landscape"
  - "Customer segments"
  - "Feasibility assessment"

BOTTOM ACTIONS:
- "← Back" text button
- "Continue" primary button (coral)

Show both empty state and filled state with AI preview visible.
```

---

## Prompt #95: Onboarding Wizard - Step 4: Launch & Summary (BO-05)

```
Create the final step (Step 4) of the business onboarding wizard:

WIZARD HEADER:
- Step indicator: Circles 1-3 completed (checkmarks), circle 4 active (coral)
- Current step: "Launch"

CELEBRATION ELEMENT:
- Confetti/sparkle decorative element
- Large checkmark or rocket icon

SUMMARY CARD:
- Title: "Ready to launch: [Business Name]"
- Business avatar/logo preview

SUMMARY SECTIONS:

"Your AI Team is ready":
- Row of 3 agent avatars:
  - 🎯 Vera - "Validation Lead"
  - 📋 Blake - "Planning Lead"
  - 🎨 Bella - "Brand Lead"

"What happens next":
- Timeline/checklist style:
  1. "✅ Vera will validate your business idea"
  2. "📊 Blake will create your business plan"
  3. "🎨 Bella will develop your brand identity"
  4. "🚀 Your business will be ready to operate"

ESTIMATED TIME:
- "Estimated time: 2-4 hours with AI assistance"
- "You'll review key decisions along the way"

TERMS CHECKBOX:
- "I agree to the Terms of Service and Privacy Policy"
- Links styled in teal

BOTTOM ACTIONS:
- "← Back" text button
- "🚀 Launch Business" primary button (coral, larger than usual)

ADD CONFETTI/CELEBRATION ANIMATION NOTES in annotations.

Light background with coral and teal accents. Celebratory but professional tone.
```

---

## Prompt #96: Validation Page with Chat Interface (BO-06)

```
Create the Business Validation page wireframe for Hyvve:

THREE-PANEL LAYOUT:

LEFT SIDEBAR (64px collapsed / 256px expanded):
- Business switcher dropdown at top
- Navigation items:
  - Dashboard
  - Validation (active, highlighted)
  - Planning
  - Branding
  - Products
  - Settings
- Agent status indicator at bottom

MAIN CONTENT AREA:

HEADER:
- Breadcrumb: "[Business Name] / Validation"
- Title: "Business Validation"
- Score badge: "Score: 78/100" with progress ring (teal fill)

WORKFLOW PROGRESS BAR:
- Horizontal stepper with 5 steps:
  - "Idea Intake" (✅ complete)
  - "Market Sizing" (✅ complete)
  - "Competitors" (🔄 in progress, highlighted)
  - "Customers" (○ pending)
  - "Synthesis" (○ pending)
- Progress line connecting steps (coral for completed, gray for pending)

KEY FINDINGS PANEL:
- Card with title "Key Findings"
- Metric rows:
  - "TAM: $4.2B" with confidence badge "High"
  - "SAM: $840M" with confidence badge "Medium"
  - "Competitors: 12 identified"
  - "ICPs: 3 defined"
- "View Full Report" link

RIGHT CHAT PANEL (320px):
- Header: "Chat with Vera" + agent avatar (🎯)
- Chat messages:
  - Agent message: "I've identified 5 key competitors. Cipher is analyzing their positioning now. Would you like to see preliminary findings?"
  - Suggested action buttons: "Show Competitors" | "Continue Analysis"
- Chat input at bottom with send button

AGENT ACTIVITY INDICATOR:
- Small card showing: "Cipher analyzing competitors... 65%"
- Animated progress bar

Show dark/light mode toggle in header. Use teal for progress, coral for CTAs.
```

---

## Prompt #97: Planning Page with Workflow Progress (BO-07)

```
Create the Business Planning page wireframe for Hyvve:

THREE-PANEL LAYOUT (same structure as Validation page):

MAIN CONTENT AREA:

HEADER:
- Breadcrumb: "[Business Name] / Planning"
- Title: "Business Planning"
- Status badge: "4/9 workflows complete"

WORKFLOW GRID (3 columns x 3 rows):
Cards for each workflow with status:

Row 1:
- "Business Model Canvas" - ✅ Complete - "View Canvas" link
- "Financial Projections" - ✅ Complete - "View Projections" link
- "Pricing Strategy" - 🔄 In Progress - progress bar 60%

Row 2:
- "Revenue Model" - ✅ Complete
- "Growth Forecast" - ✅ Complete
- "Business Plan" - ⏳ Waiting (depends on pricing)

Row 3:
- "Pitch Deck" - ○ Not Started
- "Multi-Product" - ○ Optional
- "Export" - 🔒 Locked (requires Business Plan)

CARD DESIGN:
- Icon representing workflow
- Title
- Status indicator (checkmark, spinner, lock, circle)
- "View" or "Start" action link
- Dependency indicator if applicable

DOCUMENT PREVIEW PANEL (optional, collapsible):
- Thumbnail previews of generated documents
- "Business Model Canvas" card with preview image
- "Financial Projections" card with chart preview
- Download buttons

RIGHT CHAT PANEL:
- Agent: Blake (📋)
- Message: "Your pricing strategy is 60% complete. I'm waiting for your input on the premium tier pricing. What price point are you considering?"
- User response input

Use teal for completed items, coral for active/in-progress, gray for pending.
```

---

## Prompt #98: Branding Page with Visual Identity Preview (BO-08)

```
Create the Business Branding page wireframe for Hyvve:

THREE-PANEL LAYOUT:

MAIN CONTENT AREA:

HEADER:
- Breadcrumb: "[Business Name] / Branding"
- Title: "Brand Identity"
- Progress: "3/7 workflows complete"

TWO-COLUMN LAYOUT:

LEFT COLUMN - Workflow Progress:
Vertical workflow cards:

1. "Brand Strategy" ✅ Complete
   - "Archetype: The Sage"
   - "View Strategy" link

2. "Brand Voice" ✅ Complete
   - "Tone: Professional yet approachable"
   - "View Guidelines" link

3. "Visual Identity" ✅ Complete
   - Color swatches preview (3 small circles)
   - "View Identity" link

4. "Brand Guidelines" 🔄 In Progress
   - Progress bar 40%
   - "Compiling guidelines..."

5. "Asset Checklist" ○ Not Started
6. "Asset Generation" 🔒 Locked
7. "Brand Audit" ○ Optional

RIGHT COLUMN - Visual Preview Panel:

"Brand Preview" card:

LOGO SECTION:
- "Logo" label
- Placeholder logo area (160x80px)
- "Logo not yet generated" or actual logo preview
- "Generate Logo" button (if not started)

COLOR PALETTE:
- "Colors" label
- 5 color swatches in a row:
  - Primary: #6366F1 (Indigo) - large
  - Secondary: #10B981 (Emerald)
  - Accent: #F59E0B (Amber)
  - Light: #F3F4F6
  - Dark: #1F2937

TYPOGRAPHY:
- "Typography" label
- "Heading: Inter Bold"
- "Body: Inter Regular"
- Sample text preview

DOWNLOAD SECTION:
- "Download Assets" button (disabled if not complete)
- "Brand Guidelines PDF" link (if complete)

RIGHT CHAT PANEL:
- Agent: Bella (🎨)
- Message: "I've created your color palette based on your brand archetype. The indigo conveys wisdom and trust. Would you like to adjust any colors?"
- Color adjustment suggestion buttons

Use the actual brand colors from the preview in the UI accents.
```

---

## Prompt #99: Business Switcher Dropdown (BO-09)

```
Create a Business Switcher dropdown component wireframe for Hyvve:

TRIGGER BUTTON (in sidebar):
- Current business logo (24px circle)
- Business name (truncated if long)
- Chevron down icon
- Subtle border/background on hover

DROPDOWN PANEL (on click):
- Width: 280px
- Shadow: Medium elevation
- Rounded corners: 8px

DROPDOWN SECTIONS:

HEADER:
- "Switch Business"
- Close button (X)

SEARCH:
- Search input with magnifying glass icon
- Placeholder: "Search businesses..."

CURRENT BUSINESS (highlighted):
- Business logo (32px)
- Business name (bold)
- Status badge: "Active"
- Checkmark indicator (right side)

OTHER BUSINESSES LIST (scrollable, max 4 visible):
Each row:
- Business logo (32px)
- Business name
- Status badge
- Quick stats: "Validation: 85%"

Hover state: Light background highlight

DIVIDER LINE

FOOTER ACTIONS:
- "➕ Create New Business" row with plus icon
- "📁 View All Businesses" row with folder icon

Show both collapsed state (just trigger) and expanded dropdown state.

Style: Light mode with subtle shadows, coral highlight on hover for "Create New".
```

---

## Prompt #100: Validation Synthesis Results (BO-10)

```
Create a Validation Synthesis Results modal/page for Hyvve showing the final validation recommendation:

MODAL/PAGE DESIGN (centered, 800px max-width):

HEADER:
- "Validation Complete" with confetti icon
- Close button

SCORE SECTION:
- Large circular score gauge: "78" in center
- Gauge filled to 78% (teal)
- Label: "Validation Score"
- Recommendation badge below: "CONDITIONAL GO" (amber background)

THREE-COLUMN SUMMARY:

Column 1 - Market:
- Icon: 📊
- "Market Opportunity"
- "TAM: $4.2B"
- "SAM: $840M"
- "SOM: $42M (Y1)"
- Confidence: "High" badge

Column 2 - Competition:
- Icon: ⚔️
- "Competitive Landscape"
- "12 competitors identified"
- "3 direct, 9 indirect"
- "Opportunity gaps found"
- Confidence: "Medium" badge

Column 3 - Customers:
- Icon: 👥
- "Target Customers"
- "3 ICPs defined"
- "Primary: SMB Owners"
- "Clear pain points"
- Confidence: "High" badge

RECOMMENDATION CARD:
- Title: "Recommendation"
- Icon: 📋
- "PROCEED WITH CAUTION"
- Body text: "Strong market opportunity with established competition. Differentiation through AI features and SMB focus recommended."

STRENGTHS (green left border):
- ✅ Large and growing market ($4.2B TAM)
- ✅ Clear customer pain points identified
- ✅ Technology differentiation possible

RISKS (amber left border):
- ⚠️ Established competitors (Salesforce, HubSpot)
- ⚠️ High customer acquisition costs expected
- ⚠️ Requires significant initial investment

ACTION BUTTONS:
- "View Full Report" secondary button
- "Continue to Planning →" primary button (coral)

APPROVAL SECTION (if HITL required):
- "This recommendation requires your approval"
- "Approve" button | "Request Changes" button

Use teal for positive metrics, amber for caution items, coral for CTAs.
```

---

## Usage Notes

1. Use these prompts sequentially in Google Stitch
2. Reference the design context at the top for consistency
3. Export both light and dark mode variants for P0 screens
4. Add annotations for interactive states and animations
5. Name exported files using the BO-XX convention

---

## Wireframe IDs Reference

| ID | Name | Priority | Story |
|----|------|----------|-------|
| BO-01 | Portfolio Dashboard | P0 | 08.2 |
| BO-02 | Wizard Step 1 - Documents | P0 | 08.3 |
| BO-03 | Wizard Step 2 - Details | P0 | 08.3 |
| BO-04 | Wizard Step 3 - Idea | P0 | 08.3 |
| BO-05 | Wizard Step 4 - Launch | P0 | 08.3 |
| BO-06 | Validation Page | P0 | 08.6 |
| BO-07 | Planning Page | P1 | 08.13 |
| BO-08 | Branding Page | P2 | 08.18 |
| BO-09 | Business Switcher | P0 | 08.2 |
| BO-10 | Validation Results | P0 | 08.11 |
| BO-11 | Market Sizing Results | P1 | 08.8 |
| BO-12 | Competitor Analysis | P1 | 08.9 |
| BO-13 | Customer Discovery | P1 | 08.10 |
| BO-14 | Business Model Canvas | P1 | 08.14 |
| BO-15 | Financial Projections | P1 | 08.15 |
| BO-16 | Brand Strategy Results | P2 | 08.19 |
| BO-17 | Visual Identity System | P2 | 08.20 |
| BO-18 | Asset Gallery & Download | P2 | 08.21 |

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
```
Inter Bold
ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
1234567890
```

Body font display:
```
Inter Regular
The quick brown fox jumps over the lazy dog.
```

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
- Agent: Aria (🎨 Visual Designer)
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
- Agent: Pixel (🖼️ Asset Generator)
- Message: "All your brand assets are ready! I've created logo variations, social media headers, and document templates. Everything follows your brand guidelines."
- Quick actions: "Request Custom Size" | "Regenerate Asset"

COMPLETION CELEBRATION:
- If all assets complete, show confetti/success banner
- "Your brand is ready to launch! 🎉"

Use coral for download buttons, teal for progress indicators.
```

---

## Extended Wireframe IDs Reference
