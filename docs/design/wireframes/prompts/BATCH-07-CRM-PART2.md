# Batch 7: CRM Part 2 - Google Stitch Wireframe Prompts

## Prompts 61-70: Companies, Activities, Communications & CRM Tools

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

AGENT COLORS:
- Hub (Orchestrator): #FF6B6B coral
- Maya (Content): #20B2AA teal
- Atlas (Data): #FF9F43 orange
- Sage (Strategy): #2ECC71 green
- Nova (Creative): #FF6B9D pink
- Echo (Support): #4B7BEC blue

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
- xs: 0 1px 2px rgba(0,0,0,0.04)
- sm: 0 2px 4px rgba(0,0,0,0.04)
- md: 0 4px 6px rgba(0,0,0,0.04)
- lg: 0 8px 16px rgba(0,0,0,0.06)
- xl: 0 16px 32px rgba(0,0,0,0.08)

TRANSITIONS:
- fast: 100ms ease
- normal: 150ms ease
- slow: 250ms ease
- slide: 300ms cubic-bezier(0.4, 0, 0.2, 1)

Z-INDEX:
- dropdown: 1000
- sticky: 1020
- modal-backdrop: 1040
- modal: 1050
- popover: 1060
- tooltip: 1070
- toast: 1080
```

---

## Prompt 61: CRM-05 Companies List View

```
Create an HTML/CSS wireframe for a CRM Companies List page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Display all company/organization records with filtering, sorting, search, and bulk actions. Companies have relationships to contacts and deals.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ [🏢] Companies                      [+ Add Company]         │
│ Manage your business accounts                               │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search companies...]  [Industry ▾] [Size ▾] [Status ▾]  │
│                                                             │
│ 248 companies │ ☐ Select all │ [Bulk Actions ▾]            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☐ │ 🏢 │ COMPANY NAME          │ INDUSTRY   │ SIZE     │ │
│ │   │    │ Domain/Website        │ Revenue    │ Contacts │ │
│ ├───┼────┼───────────────────────┼────────────┼──────────┤ │
│ │ ☐ │ 🏢 │ Acme Corporation      │ Technology │ 500-1000 │ │
│ │   │    │ acme.com              │ $50M-100M  │ 12 👤    │ │
│ │   │    │ ⭐ Key Account        │            │ 3 deals  │ │
│ ├───┼────┼───────────────────────┼────────────┼──────────┤ │
│ │ ☐ │ 🏢 │ TechStart Inc         │ SaaS       │ 50-100   │ │
│ │   │    │ techstart.io          │ $5M-10M    │ 5 👤     │ │
│ │   │    │ 🆕 New                │            │ 1 deal   │ │
│ ├───┼────┼───────────────────────┼────────────┼──────────┤ │
│ │ ☐ │ 🏢 │ Global Retail Corp    │ Retail     │ 5000+    │ │
│ │   │    │ globalretail.com      │ $500M+     │ 24 👤    │ │
│ │   │    │ 🔥 Hot Lead           │            │ 5 deals  │ │
│ └───┴────┴───────────────────────┴────────────┴──────────┘ │
│                                                             │
│ [← Previous] Page 1 of 25 [Next →]                         │
└─────────────────────────────────────────────────────────────┘

COMPANY LIST ITEM SPECIFICATIONS:
- Checkbox: 20x20px, border 2px #E8E4E0, rounded 4px
- Company logo/icon placeholder: 48x48px, rounded 8px, bg #F5F5F5
- Company name: 16px semibold #1A1A1A
- Domain: 14px regular #6B6B6B, truncate with ellipsis
- Status badges:
  - Key Account: bg #FFF3CD, text #856404, 12px medium
  - New: bg #D4EDDA, text #155724
  - Hot Lead: bg #FFE8E8, text #991B1B
- Industry tag: 12px medium, bg #F3F4F6, text #374151, rounded 4px, padding 4px 8px
- Contact count: 14px regular #6B6B6B, with icon 👤
- Deal count: 14px regular #6B6B6B

ROW INTERACTIONS:
- Default: bg #FFFFFF
- Hover: bg #FAFAFA, shadow-xs, cursor pointer
- Selected (checkbox): bg #FFF5F5, border-left 3px solid #FF6B6B
- Focus: outline 2px solid #FF6B6B offset 2px

TABLE HEADER:
- Background: #FAFAFA
- Text: 12px semibold uppercase #6B6B6B, letter-spacing 0.5px
- Sortable columns: cursor pointer, hover underline
- Sort indicator: ▲ ascending, ▼ descending, color #FF6B6B

FILTER DROPDOWNS:
- Industry: Technology, SaaS, Retail, Finance, Healthcare, Manufacturing, Other
- Size: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5000+
- Status: All, Key Account, New, Active, Inactive, Churned

BULK ACTIONS MENU:
- Export Selected
- Add to Segment
- Assign Owner
- Change Status
- Delete (with confirmation)

PAGINATION:
- Container: flex justify-between align-center, padding 16px 0
- Page info: 14px regular #6B6B6B
- Buttons: 36px height, padding 0 16px, rounded 8px
- Disabled: opacity 0.5, cursor not-allowed

EMPTY STATE:
- Icon: 64x64px building illustration
- Title: 24px semibold "No companies yet"
- Description: 16px regular #6B6B6B "Add your first company to start building relationships"
- CTA: Primary button "Add Company"

RESPONSIVE (mobile <768px):
- Switch to card layout
- Stack filters vertically
- Full-width search
- Floating action button for add

Include all states: default, loading skeleton, empty, error.
```

---

## Prompt 62: CRM-06 Company Detail View

```
Create an HTML/CSS wireframe for a CRM Company Detail page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Display comprehensive company profile with contacts, deals, activities, and AI-generated insights.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ [← Companies] Acme Corporation                    [⋮ More] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┬───────────────────────────────┐ │
│ │                         │                               │ │
│ │  ┌────┐  Acme Corp      │  QUICK STATS                  │ │
│ │  │ 🏢 │  Technology     │  ┌─────────┐ ┌─────────┐      │ │
│ │  └────┘  acme.com ↗     │  │ $125K   │ │ 12      │      │ │
│ │                         │  │ Revenue │ │ Contacts│      │ │
│ │  ⭐ Key Account         │  └─────────┘ └─────────┘      │ │
│ │  Owner: Sarah Chen      │  ┌─────────┐ ┌─────────┐      │ │
│ │                         │  │ 3       │ │ 85%     │      │ │
│ │  [✏️ Edit] [📧 Email]   │  │ Deals   │ │ Health  │      │ │
│ │                         │  └─────────┘ └─────────┘      │ │
│ └─────────────────────────┴───────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Overview] [Contacts] [Deals] [Activities] [Files]      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌───────────────────────────┬─────────────────────────────┐ │
│ │ COMPANY DETAILS           │ AI INSIGHTS                 │ │
│ │                           │                             │ │
│ │ Industry: Technology      │ ┌─────────────────────────┐ │ │
│ │ Size: 500-1000 employees  │ │ 🤖 Engagement Analysis  │ │ │
│ │ Founded: 2015             │ │                         │ │ │
│ │ Revenue: $50M - $100M     │ │ High activity detected  │ │ │
│ │ Website: acme.com         │ │ in last 30 days. 3 key  │ │ │
│ │ Phone: +1 555-0123        │ │ decision makers engaged.│ │ │
│ │                           │ │                         │ │ │
│ │ ADDRESS                   │ │ Recommended: Schedule   │ │ │
│ │ 123 Tech Street           │ │ quarterly review        │ │ │
│ │ San Francisco, CA 94105   │ └─────────────────────────┘ │ │
│ │                           │                             │ │
│ │ TAGS                      │ ┌─────────────────────────┐ │ │
│ │ [Enterprise] [SaaS] [Q4]  │ │ 📊 Deal Probability    │ │ │
│ │                           │ │ ████████░░ 78%         │ │ │
│ │ CUSTOM FIELDS             │ │ Based on engagement    │ │ │
│ │ Contract Renewal: Dec 2024│ │ patterns & history     │ │ │
│ │ Tier: Platinum            │ └─────────────────────────┘ │ │
│ └───────────────────────────┴─────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ RECENT ACTIVITIES                          [View All →] │ │
│ │                                                         │ │
│ │ ○─── Today                                              │ │
│ │ │ 📧 Email sent to John Smith                          │ │
│ │ │    Re: Q4 Contract Renewal - Sarah Chen, 2h ago      │ │
│ │ │                                                       │ │
│ │ ○─── Yesterday                                          │ │
│ │ │ 📞 Call with Jane Doe                                │ │
│ │ │    Product demo follow-up - 15 min - Sarah Chen      │ │
│ │ │                                                       │ │
│ │ ○─── 3 days ago                                         │ │
│ │ │ 📝 Note added                                        │ │
│ │     "Interested in enterprise features" - Mike Johnson │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

HEADER SECTION:
- Back link: 14px medium #FF6B6B, hover underline
- Company name: 28px bold #1A1A1A
- More menu (⋮): 40x40px, hover bg #F5F5F5, rounded 8px
- Logo placeholder: 80x80px, rounded 12px, bg #F5F5F5, border 1px #E8E4E0

QUICK STATS CARDS:
- Size: 100px x 80px each
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 12px
- Value: 24px bold #1A1A1A
- Label: 12px regular #6B6B6B
- Grid: 2x2 with 12px gap

TAB NAVIGATION:
- Container: border-bottom 1px #E8E4E0
- Tab: padding 12px 20px, 14px medium
- Default: #6B6B6B
- Active: #FF6B6B, border-bottom 2px solid #FF6B6B
- Hover: #1A1A1A

COMPANY DETAILS SECTION:
- Label: 12px medium #6B6B6B, margin-bottom 4px
- Value: 14px regular #1A1A1A
- Row spacing: 16px
- Links (website): #FF6B6B, hover underline

TAGS:
- Background: #F3F4F6
- Text: 12px medium #374151
- Padding: 4px 10px
- Border radius: 9999px (pill)
- Gap between tags: 8px

AI INSIGHTS CARDS:
- Background: linear-gradient(135deg, #FFFBF5 0%, #FFF5F5 100%)
- Border: 1px solid #FFE8E8
- Border radius: 12px
- Padding: 16px
- Icon: 20px, margin-right 8px
- Title: 14px semibold #1A1A1A
- Content: 14px regular #6B6B6B

ACTIVITY TIMELINE:
- Timeline line: 2px solid #E8E4E0, left 12px
- Node: 8px circle, bg #E8E4E0, active bg #FF6B6B
- Date header: 12px semibold #6B6B6B
- Activity icon: 24x24px, rounded 6px, bg varies by type
- Activity text: 14px regular #1A1A1A
- Metadata: 12px regular #9CA3AF

ACTION BUTTONS:
- Edit: ghost button, 36px height
- Email: ghost button, 36px height
- Both: rounded 8px, hover bg #F5F5F5

Include all tab content views and loading states.
```

---

## Prompt 63: CRM-07 Activities List/Timeline

```
Create an HTML/CSS wireframe for a CRM Activities page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Display all CRM activities (calls, emails, meetings, notes, tasks) in chronological timeline with filtering and quick-add capabilities.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ [📋] Activities                                [+ Log Activity]
│ Track all interactions                                      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [All] [Calls] [Emails] [Meetings] [Notes] [Tasks]       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [🔍 Search activities...]          [Date Range ▾] [User ▾] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─── TODAY ─────────────────────────────────────────────────┐
│ │                                                           │
│ │ ●─┬─ 📞 Call with John Smith @ Acme Corp         2:30 PM │
│ │   │  Duration: 15 min │ Outcome: Positive                │
│ │   │  "Discussed Q4 pricing. Very interested in           │
│ │   │  enterprise tier. Will send proposal."               │
│ │   │  [View Contact] [Edit] [Delete]                      │
│ │   │                                                       │
│ │ ●─┼─ 📧 Email to Jane Doe @ TechStart           11:45 AM │
│ │   │  Subject: Follow-up: Product Demo                    │
│ │   │  Status: ✓ Opened │ ✓ Clicked                        │
│ │   │  [View Email] [Reply] [Forward]                      │
│ │   │                                                       │
│ │ ●─┼─ 📅 Meeting: Quarterly Review                9:00 AM │
│ │   │  With: Sarah Chen, Mike Johnson                      │
│ │   │  Location: Zoom │ Duration: 1 hour                   │
│ │   │  [View Notes] [Reschedule]                           │
│ │                                                           │
│ └───────────────────────────────────────────────────────────┘
│                                                             │
│ ┌─── YESTERDAY ─────────────────────────────────────────────┐
│ │                                                           │
│ │ ●─┬─ 📝 Note added to Global Retail Corp         4:15 PM │
│ │   │  "Budget approved for Q1. Ready to proceed           │
│ │   │  with implementation phase."                         │
│ │   │  Added by: Sarah Chen                                │
│ │   │                                                       │
│ │ ●─┼─ ✅ Task completed: Send proposal            2:00 PM │
│ │   │  Related to: Acme Corp Deal                          │
│ │   │  Completed by: Mike Johnson                          │
│ │                                                           │
│ └───────────────────────────────────────────────────────────┘
│                                                             │
│ [Load more activities...]                                   │
└─────────────────────────────────────────────────────────────┘

ACTIVITY TYPE TABS:
- Container: bg #FAFAFA, rounded 12px, padding 4px
- Tab button: padding 8px 16px, rounded 8px
- Default: bg transparent, text #6B6B6B
- Active: bg #FFFFFF, shadow-sm, text #1A1A1A
- Hover (inactive): text #1A1A1A

ACTIVITY TYPE ICONS & COLORS:
- Call 📞: bg #DBEAFE, icon color #3B82F6
- Email 📧: bg #FEF3C7, icon color #F59E0B
- Meeting 📅: bg #D1FAE5, icon color #10B981
- Note 📝: bg #F3E8FF, icon color #8B5CF6
- Task ✅: bg #FEE2E2, icon color #EF4444

TIMELINE STRUCTURE:
- Date separator: 14px semibold #6B6B6B, uppercase, letter-spacing 1px
- Separator line: 1px solid #E8E4E0, flex-grow
- Timeline track: 2px solid #E8E4E0, position left 20px
- Activity node: 12px circle, colored by type
- Active node: ring 3px with type color at 30% opacity

ACTIVITY CARD:
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 12px
- Padding: 16px
- Margin-left: 40px (for timeline)
- Shadow: sm on hover

ACTIVITY CARD CONTENT:
- Icon: 36x36px, rounded 8px, centered icon 20px
- Type label: 12px medium, colored by type
- Title: 16px semibold #1A1A1A
- Time: 14px regular #6B6B6B
- Description: 14px regular #6B6B6B, max 3 lines
- Metadata tags: 12px regular, flex gap 12px
- Action links: 14px medium #FF6B6B, hover underline

EMAIL STATUS BADGES:
- Opened: bg #D1FAE5, text #065F46
- Clicked: bg #DBEAFE, text #1E40AF
- Bounced: bg #FEE2E2, text #991B1B
- Size: padding 2px 8px, rounded 4px, 12px medium

LOG ACTIVITY BUTTON:
- Position: fixed bottom-right on mobile
- Desktop: standard header position
- Dropdown options: Call, Email, Meeting, Note, Task

LOG ACTIVITY MODAL:
┌─────────────────────────────────────────┐
│ Log Activity                        [✕] │
├─────────────────────────────────────────┤
│                                         │
│ Activity Type                           │
│ [📞 Call] [📧 Email] [📅 Meeting]       │
│ [📝 Note] [✅ Task]                     │
│                                         │
│ Related To                              │
│ [🔍 Search contacts or companies...   ] │
│                                         │
│ Subject / Title                         │
│ [                                     ] │
│                                         │
│ Date & Time                             │
│ [Today          ] [2:30 PM          ]   │
│                                         │
│ Notes                                   │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Cancel]                    [Save Activity]
└─────────────────────────────────────────┘

FILTER CONTROLS:
- Date range picker: last 7 days, 30 days, 90 days, custom
- User filter: team member multi-select
- Clear filters link

EMPTY STATE:
- Icon: 64px calendar/activity illustration
- Title: "No activities recorded"
- Description: "Start logging calls, emails, and meetings"
- CTA: "Log First Activity"

Include infinite scroll loading state and all activity type variations.
```

---

## Prompt 64: CRM-08 Email Templates

```
Create an HTML/CSS wireframe for CRM Email Templates management page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Manage reusable email templates with variable placeholders, categorization, and AI-assisted template generation.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ [📧] Email Templates                    [+ Create Template] │
│ Reusable templates for outreach                             │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search templates...]     [Category ▾] [Created by ▾]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─── SALES OUTREACH ────────────────────────────────────────┐
│ │                                                           │
│ │ ┌─────────────────────────────────────────────────────┐   │
│ │ │ Initial Outreach                              [⋮]   │   │
│ │ │                                                     │   │
│ │ │ "Hi {{first_name}}, I noticed that {{company}}..."  │   │
│ │ │                                                     │   │
│ │ │ Variables: first_name, company, pain_point          │   │
│ │ │ Used: 156 times │ Open rate: 42%                    │   │
│ │ │                                                     │   │
│ │ │ [Preview] [Use Template] [Edit]                     │   │
│ │ └─────────────────────────────────────────────────────┘   │
│ │                                                           │
│ │ ┌─────────────────────────────────────────────────────┐   │
│ │ │ Follow-up After Demo                          [⋮]   │   │
│ │ │                                                     │   │
│ │ │ "Hi {{first_name}}, Thank you for taking time..."   │   │
│ │ │                                                     │   │
│ │ │ Variables: first_name, demo_date, next_steps        │   │
│ │ │ Used: 89 times │ Open rate: 58%                     │   │
│ │ │                                                     │   │
│ │ │ [Preview] [Use Template] [Edit]                     │   │
│ │ └─────────────────────────────────────────────────────┘   │
│ │                                                           │
│ └───────────────────────────────────────────────────────────┘
│                                                             │
│ ┌─── CUSTOMER SUCCESS ──────────────────────────────────────┐
│ │                                                           │
│ │ ┌─────────────────────────────────────────────────────┐   │
│ │ │ 🤖 AI Suggested                                     │   │
│ │ │ Onboarding Welcome                            [⋮]   │   │
│ │ │                                                     │   │
│ │ │ "Welcome to {{product}}, {{first_name}}! We're..."  │   │
│ │ │                                                     │   │
│ │ │ Variables: first_name, product, account_manager     │   │
│ │ │ AI Confidence: ████████░░ 85%                       │   │
│ │ │                                                     │   │
│ │ │ [Preview] [Approve & Save] [Edit First]             │   │
│ │ └─────────────────────────────────────────────────────┘   │
│ │                                                           │
│ └───────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘

CATEGORY SECTIONS:
- Header: 12px semibold uppercase #6B6B6B, letter-spacing 1px
- Divider: 1px solid #E8E4E0
- Collapsible: chevron icon rotates
- Padding: 16px 0

TEMPLATE CARD:
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 12px
- Padding: 20px
- Margin: 12px 0
- Hover: shadow-md, border-color #FF6B6B

TEMPLATE CARD CONTENT:
- Title: 18px semibold #1A1A1A
- Preview text: 14px regular #6B6B6B, italic, max 2 lines
- Variables: 12px, bg #F3F4F6, padding 2px 8px, rounded 4px
- Stats: 14px regular #6B6B6B, flex gap 16px
- More menu: 32x32px button

AI SUGGESTED BADGE:
- Container: flex align-center gap 8px
- Icon: 🤖 16px
- Text: "AI Suggested" 12px medium #8B5CF6
- Background: #F3E8FF
- Padding: 4px 10px
- Border radius: 4px

TEMPLATE STATISTICS:
- Used count: number + "times" label
- Open rate: percentage with color coding
  - >50%: #10B981 green
  - 30-50%: #F59E0B amber
  - <30%: #EF4444 red

ACTION BUTTONS:
- Preview: ghost button
- Use Template: primary button
- Edit: ghost button
- All: 32px height, rounded 8px

CREATE TEMPLATE MODAL:
┌─────────────────────────────────────────────────────────────┐
│ Create Email Template                                   [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Manual] [🤖 AI Assisted]                                   │
│                                                             │
│ Template Name *                                             │
│ [                                                         ] │
│                                                             │
│ Category *                                                  │
│ [Select category...                                    ▾]   │
│                                                             │
│ Subject Line                                                │
│ [Re: {{topic}} - Quick question                           ] │
│                                                             │
│ Email Body                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [B] [I] [U] │ [🔗] [📷] │ [{{}} Insert Variable]       │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                         │ │
│ │ Hi {{first_name}},                                      │ │
│ │                                                         │ │
│ │ I hope this message finds you well...                   │ │
│ │                                                         │ │
│ │                                                         │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Available Variables:                                        │
│ [first_name] [last_name] [company] [title] [custom...]     │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [Cancel]                              [Save Template]      │
└─────────────────────────────────────────────────────────────┘

AI ASSISTED MODE:
- Prompt input: "Describe the email you want to create..."
- Generate button with loading state
- Edit generated content
- Regenerate option

VARIABLE INSERT DROPDOWN:
- Standard variables: first_name, last_name, company, title, email
- Custom fields: from CRM settings
- Recently used: quick access
- Insert at cursor position

TEMPLATE PREVIEW MODAL:
- Full email render with sample data
- Desktop/mobile preview toggle
- Variable highlighting
- Send test email option

Include template duplication, deletion confirmation, and export functionality.
```

---

## Prompt 65: CRM-09 Import/Export

```
Create an HTML/CSS wireframe for CRM Import/Export page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Import contacts/companies from CSV/Excel files and export CRM data for backups or external use.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ [📥] Import & Export                                        │
│ Manage your CRM data                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────────────────┐ ┌───────────────────────────────┐ │
│ │                       │ │                               │ │
│ │    📥                 │ │    📤                         │ │
│ │                       │ │                               │ │
│ │  Import Data          │ │  Export Data                  │ │
│ │                       │ │                               │ │
│ │  Upload CSV or Excel  │ │  Download your CRM data       │ │
│ │  files to add new     │ │  in various formats           │ │
│ │  contacts & companies │ │                               │ │
│ │                       │ │                               │ │
│ │  [Start Import]       │ │  [Start Export]               │ │
│ │                       │ │                               │ │
│ └───────────────────────┴───────────────────────────────────┘
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ RECENT IMPORTS & EXPORTS                                │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                         │ │
│ │ ┌───┬────────────────────────┬─────────┬──────┬───────┐ │ │
│ │ │ 📥│ contacts_nov_2024.csv  │ Import  │ 248  │ ✓ Done│ │ │
│ │ │   │ Nov 15, 2024 at 2:30pm │ Contacts│records│      │ │ │
│ │ ├───┼────────────────────────┼─────────┼──────┼───────┤ │ │
│ │ │ 📤│ all_contacts_export    │ Export  │ 1,234│ ✓ Done│ │ │
│ │ │   │ Nov 14, 2024 at 9:00am │ Full    │records│      │ │ │
│ │ ├───┼────────────────────────┼─────────┼──────┼───────┤ │ │
│ │ │ 📥│ companies_q4.xlsx      │ Import  │ 12   │⚠ Warn │ │ │
│ │ │   │ Nov 10, 2024 at 4:15pm │ Company │records│3 skip│ │ │
│ │ └───┴────────────────────────┴─────────┴──────┴───────┘ │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

MAIN ACTION CARDS:
- Size: equal width, min-height 200px
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 16px
- Padding: 32px
- Text align: center
- Hover: shadow-lg, border-color #FF6B6B

CARD ICONS:
- Size: 64x64px
- Background: #FFF5F5 (import), #F0FDF9 (export)
- Border radius: 16px
- Icon: 32px, #FF6B6B (import), #20B2AA (export)

HISTORY TABLE:
- Header: bg #FAFAFA, 12px semibold uppercase #6B6B6B
- Row: padding 16px, border-bottom 1px #E8E4E0
- Type icon: 24px, colored by import/export
- File name: 14px semibold #1A1A1A
- Date: 12px regular #6B6B6B
- Status badges:
  - Done ✓: bg #D1FAE5, text #065F46
  - Processing: bg #DBEAFE, text #1E40AF, animated pulse
  - Warning ⚠: bg #FEF3C7, text #92400E
  - Failed ✕: bg #FEE2E2, text #991B1B

IMPORT WIZARD (Multi-step):

STEP 1 - Upload:
┌─────────────────────────────────────────────────────────────┐
│ Import Data                                             [✕] │
├─────────────────────────────────────────────────────────────┤
│ Step 1 of 4: Upload File                                    │
│ [●━━━○━━━○━━━○]                                             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │              📄                                         │ │
│ │                                                         │ │
│ │     Drag & drop your file here                          │ │
│ │     or                                                  │ │
│ │     [Browse Files]                                      │ │
│ │                                                         │ │
│ │     Supported: CSV, XLSX, XLS (max 10MB)               │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Download Template: Contacts] [Download Template: Companies]│
│                                                             │
│ ────────────────────────────────────────────────────────── │
│                                           [Next: Configure] │
└─────────────────────────────────────────────────────────────┘

STEP 2 - Configure:
┌─────────────────────────────────────────────────────────────┐
│ Import Data                                             [✕] │
├─────────────────────────────────────────────────────────────┤
│ Step 2 of 4: Map Fields                                     │
│ [●━━━●━━━○━━━○]                                             │
│                                                             │
│ We detected 248 records. Map your columns to CRM fields.    │
│                                                             │
│ ┌──────────────────┬──────────────────┬────────────────┐   │
│ │ YOUR COLUMN      │ MAPS TO          │ PREVIEW        │   │
│ ├──────────────────┼──────────────────┼────────────────┤   │
│ │ Name             │ [Full Name    ▾] │ John Smith     │   │
│ │ Email Address    │ [Email        ▾] │ john@acme.com  │   │
│ │ Company          │ [Company Name ▾] │ Acme Corp      │   │
│ │ Phone            │ [Phone        ▾] │ +1 555-0123    │   │
│ │ Notes            │ [Notes        ▾] │ Met at conf... │   │
│ │ custom_1         │ [Skip Column  ▾] │ —              │   │
│ └──────────────────┴──────────────────┴────────────────┘   │
│                                                             │
│ ☐ First row is header                                       │
│ ☐ Update existing records (match by email)                  │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [← Back]                              [Next: Review]        │
└─────────────────────────────────────────────────────────────┘

STEP 3 - Review:
- Show first 5 records preview
- Highlight validation issues (missing required, invalid format)
- Count: valid, warnings, errors
- Option to fix or skip problem records

STEP 4 - Import:
- Progress bar with percentage
- Live counter: "Importing 156 of 248..."
- Success/error summary
- Download error report link

EXPORT WIZARD:
┌─────────────────────────────────────────────────────────────┐
│ Export Data                                             [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ What to Export                                              │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ ☑ Contacts     │ │ ☑ Companies    │ │ ☐ Deals        │ │
│ │ 1,234 records  │ │ 248 records    │ │ 89 records     │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                             │
│ Select Fields                                               │
│ ☑ All fields │ ○ Custom selection                          │
│                                                             │
│ Filter (Optional)                                           │
│ [Created in last...           ▾] [Any status...          ▾]│
│                                                             │
│ Format                                                      │
│ ○ CSV (Recommended)  ○ Excel (.xlsx)  ○ JSON              │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [Cancel]                             [Export 1,482 records] │
└─────────────────────────────────────────────────────────────┘

Include file validation errors, duplicate detection, and partial import recovery.
```

---

## Prompt 66: CRM-10 Reports & Analytics

```
Create an HTML/CSS wireframe for CRM Reports & Analytics dashboard for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Visualize CRM performance metrics, sales pipeline analytics, team activity reports, and AI-generated insights.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ [📊] Reports & Analytics            [Date: Last 30 Days ▾] │
│ Track your sales performance                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │ $425K   │ │ 89      │ │ 32%     │ │ 18 days │            │
│ │ Revenue │ │ New     │ │ Win     │ │ Avg Deal│            │
│ │ ↑ 12%   │ │ Deals   │ │ Rate    │ │ Cycle   │            │
│ │         │ │ ↑ 8     │ │ ↑ 5%    │ │ ↓ 3 days│            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PIPELINE OVERVIEW                              [⋮]      │ │
│ │                                                         │ │
│ │  Lead      │ Qualified  │ Proposal   │ Negotiation│ Won │ │
│ │  $180K     │ $240K      │ $320K      │ $150K      │$85K │ │
│ │  ████████  │ ██████████ │ ████████████│ ██████    │████ │ │
│ │  24 deals  │ 18 deals   │ 12 deals   │ 6 deals   │8    │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│ │ REVENUE TREND           │ │ DEALS BY SOURCE             │ │
│ │                         │ │                             │ │
│ │     ╭───╮               │ │    ┌────┐                   │ │
│ │    ╱    ╲    ╭──        │ │    │████│ Website  45%     │ │
│ │   ╱      ╲──╯           │ │    │░░░░│ Referral 28%     │ │
│ │  ╱                      │ │    │    │ Outbound 18%     │ │
│ │ ╱                       │ │    │    │ Events   9%      │ │
│ │ Sep Oct Nov Dec         │ │    └────┘                   │ │
│ │                         │ │                             │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI INSIGHTS                                          │ │
│ │                                                         │ │
│ │ • Deal velocity increased 15% this month. Top          │ │
│ │   performer: Sarah Chen with 8 closed deals.           │ │
│ │                                                         │ │
│ │ • 3 deals at risk of stalling: Acme Corp, TechStart,   │ │
│ │   GlobalRetail. Consider immediate follow-up.          │ │
│ │                                                         │ │
│ │ • Best performing lead source: Website forms (45%      │ │
│ │   of pipeline). Recommend increasing ad spend.         │ │
│ │                                                         │ │
│ │ [View Detailed Analysis]                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ TEAM LEADERBOARD                           [View All →] │ │
│ │                                                         │ │
│ │ 1. 👤 Sarah Chen      $125,000  │████████████│ 12 deals │ │
│ │ 2. 👤 Mike Johnson    $98,000   │█████████  │ 9 deals  │ │
│ │ 3. 👤 Jane Doe        $85,000   │████████   │ 8 deals  │ │
│ │ 4. 👤 Alex Kim        $72,000   │██████     │ 7 deals  │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

KPI CARDS:
- Size: 160px x 100px
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 12px
- Padding: 16px
- Value: 28px bold #1A1A1A
- Label: 14px regular #6B6B6B
- Change indicator:
  - Positive: #10B981 with ↑ arrow
  - Negative: #EF4444 with ↓ arrow
  - Neutral: #6B6B6B

PIPELINE FUNNEL:
- Container: bg #FFFFFF, rounded 16px, padding 24px
- Stage boxes: min-width 120px, flex-grow based on value
- Stage bar: height 40px, rounded 8px
- Colors by stage:
  - Lead: #E8E4E0
  - Qualified: #DBEAFE
  - Proposal: #FEF3C7
  - Negotiation: #D1FAE5
  - Won: #10B981
- Value: 18px semibold #1A1A1A
- Deal count: 14px regular #6B6B6B

LINE CHART (Revenue Trend):
- Container: bg #FFFFFF, rounded 16px, padding 24px
- Line: 2px stroke #FF6B6B
- Fill: gradient #FF6B6B 20% to transparent
- Grid lines: 1px #E8E4E0
- Axis labels: 12px regular #6B6B6B
- Data points: 6px circles, fill #FF6B6B
- Hover: show tooltip with exact value

PIE/DONUT CHART (Deals by Source):
- Container: bg #FFFFFF, rounded 16px, padding 24px
- Donut: 120px diameter, 20px stroke
- Colors: #FF6B6B, #20B2AA, #FF9F43, #2ECC71
- Legend: right side, 14px with color indicator

AI INSIGHTS CARD:
- Background: linear-gradient(135deg, #FFFBF5 0%, #FFF5F5 100%)
- Border: 1px solid #FFE8E8
- Border radius: 16px
- Padding: 24px
- Robot icon: 24px, margin-right 8px
- Title: 18px semibold #1A1A1A
- Bullet points: 14px regular #6B6B6B
- Bullet marker: 6px circle #FF6B6B

TEAM LEADERBOARD:
- Row: padding 16px, border-bottom 1px #E8E4E0
- Rank: 24px bold #FF6B6B (gold for 1st)
- Avatar: 40px circle
- Name: 16px semibold #1A1A1A
- Revenue: 16px medium #1A1A1A
- Progress bar: height 8px, rounded 4px, bg #E8E4E0, fill #FF6B6B
- Deal count: 14px regular #6B6B6B

DATE RANGE PICKER:
- Presets: Today, Last 7 days, Last 30 days, Last quarter, Custom
- Custom: date range picker with calendar

REPORT TYPES TABS:
- Overview (shown above)
- Pipeline
- Activities
- Team Performance
- Forecasting

Include loading skeletons for all charts and export report functionality.
```

---

## Prompt 67: CRM-11 Settings

```
Create an HTML/CSS wireframe for CRM Settings page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Configure CRM-specific settings including pipeline stages, custom fields, lead scoring rules, and integration settings.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ [⚙️] CRM Settings                                           │
│ Configure your sales workflow                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│ │                 │ │                                     │ │
│ │ Pipeline Stages │ │ PIPELINE STAGES                     │ │
│ │ Custom Fields   │ │                                     │ │
│ │ Lead Scoring    │ │ Configure the stages in your sales  │ │
│ │ Deal Settings   │ │ pipeline.                           │ │
│ │ Activity Types  │ │                                     │ │
│ │ Automations     │ │ ┌─────────────────────────────────┐ │ │
│ │ Integrations    │ │ │ ≡  Lead                    [✏️] │ │ │
│ │                 │ │ │    Probability: 10%             │ │ │
│ │                 │ │ │    Color: ░░░ Gray              │ │ │
│ │                 │ │ ├─────────────────────────────────┤ │ │
│ │                 │ │ │ ≡  Qualified              [✏️] │ │ │
│ │                 │ │ │    Probability: 25%             │ │ │
│ │                 │ │ │    Color: 🔵 Blue               │ │ │
│ │                 │ │ ├─────────────────────────────────┤ │ │
│ │                 │ │ │ ≡  Proposal Sent          [✏️] │ │ │
│ │                 │ │ │    Probability: 50%             │ │ │
│ │                 │ │ │    Color: 🟡 Yellow             │ │ │
│ │                 │ │ ├─────────────────────────────────┤ │ │
│ │                 │ │ │ ≡  Negotiation            [✏️] │ │ │
│ │                 │ │ │    Probability: 75%             │ │ │
│ │                 │ │ │    Color: 🟢 Green              │ │ │
│ │                 │ │ ├─────────────────────────────────┤ │ │
│ │                 │ │ │ ≡  Closed Won             [✏️] │ │ │
│ │                 │ │ │    Probability: 100% (Final)    │ │ │
│ │                 │ │ │    Color: 🟢 Green              │ │ │
│ │                 │ │ ├─────────────────────────────────┤ │ │
│ │                 │ │ │ ≡  Closed Lost            [✏️] │ │ │
│ │                 │ │ │    Probability: 0% (Final)      │ │ │
│ │                 │ │ │    Color: 🔴 Red                │ │ │
│ │                 │ │ └─────────────────────────────────┘ │ │
│ │                 │ │                                     │ │
│ │                 │ │ [+ Add Stage]                       │ │
│ │                 │ │                                     │ │
│ │                 │ │ ⚠️ Changing stages may affect       │ │
│ │                 │ │ existing deals and reports.        │ │
│ │                 │ │                                     │ │
│ └─────────────────┘ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

SIDEBAR NAVIGATION:
- Width: 200px
- Background: #FAFAFA
- Border-right: 1px solid #E8E4E0
- Item: padding 12px 16px, 14px medium
- Default: #6B6B6B
- Active: bg #FFFFFF, #1A1A1A, border-left 3px #FF6B6B
- Hover: bg #FFFFFF

MAIN CONTENT AREA:
- Padding: 32px
- Max-width: 800px

SECTION HEADER:
- Title: 24px semibold #1A1A1A
- Description: 14px regular #6B6B6B
- Margin-bottom: 24px

PIPELINE STAGES LIST:
- Container: bg #FFFFFF, border 1px #E8E4E0, rounded 12px
- Stage item: padding 16px, border-bottom 1px #E8E4E0
- Drag handle (≡): 20px, color #9CA3AF, cursor grab
- Stage name: 16px semibold #1A1A1A
- Probability: 14px regular #6B6B6B
- Color indicator: 12px circle
- Edit button: 32x32px ghost, opacity 0 → 1 on row hover

EDIT STAGE MODAL:
┌─────────────────────────────────────────┐
│ Edit Pipeline Stage                 [✕] │
├─────────────────────────────────────────┤
│                                         │
│ Stage Name *                            │
│ [Qualified                            ] │
│                                         │
│ Win Probability                         │
│ [25] %                                  │
│ Used for forecasting calculations       │
│                                         │
│ Stage Color                             │
│ [🔴][🟠][🟡][🟢][🔵][🟣][⚪][⚫]         │
│                                         │
│ Stage Type                              │
│ ○ Active (deal in progress)            │
│ ○ Won (deal closed successfully)        │
│ ○ Lost (deal closed unsuccessfully)     │
│                                         │
│ ────────────────────────────────────── │
│ [Delete Stage]      [Cancel] [Save]     │
└─────────────────────────────────────────┘

CUSTOM FIELDS SECTION:
┌─────────────────────────────────────────────────────────────┐
│ CUSTOM FIELDS                                               │
│                                                             │
│ Add custom fields to contacts, companies, and deals.        │
│                                                             │
│ ┌─ CONTACTS ────────────────────────────────────────────┐   │
│ │                                                       │   │
│ │ LinkedIn URL        Text       Required  [✏️] [🗑️]   │   │
│ │ Lead Source         Dropdown   Optional  [✏️] [🗑️]   │   │
│ │ Annual Revenue      Number     Optional  [✏️] [🗑️]   │   │
│ │                                                       │   │
│ │ [+ Add Contact Field]                                 │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ COMPANIES ───────────────────────────────────────────┐   │
│ │                                                       │   │
│ │ Contract Value      Currency   Required  [✏️] [🗑️]   │   │
│ │ Industry Vertical   Dropdown   Optional  [✏️] [🗑️]   │   │
│ │                                                       │   │
│ │ [+ Add Company Field]                                 │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ DEALS ───────────────────────────────────────────────┐   │
│ │                                                       │   │
│ │ Competitor          Text       Optional  [✏️] [🗑️]   │   │
│ │ Decision Date       Date       Optional  [✏️] [🗑️]   │   │
│ │                                                       │   │
│ │ [+ Add Deal Field]                                    │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

FIELD TYPES:
- Text, Number, Currency, Date, Dropdown, Multi-select, Checkbox, URL, Email, Phone

ADD FIELD MODAL:
- Field name input
- Field type dropdown
- Options (for dropdown/multi-select)
- Required checkbox
- Default value (optional)
- Help text (optional)

LEAD SCORING SECTION:
- Rule builder interface
- Conditions: field + operator + value
- Points: positive or negative
- Total score thresholds for qualification

WARNING NOTICES:
- Background: #FEF3C7
- Border-left: 4px solid #F59E0B
- Icon: ⚠️ 20px
- Text: 14px regular #92400E

Include drag-and-drop reordering for stages and confirmation dialogs for deletions.
```

---

## Prompt 68: CRM-12 Lead Scoring

```
Create an HTML/CSS wireframe for CRM Lead Scoring configuration page for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Configure AI-assisted and rule-based lead scoring to automatically qualify and prioritize leads based on behavior and attributes.

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ [🎯] Lead Scoring                        [💡 How it works] │
│ Automatically prioritize your best leads                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SCORING METHOD                                          │ │
│ │                                                         │ │
│ │ ○ Rules-Based Only                                      │ │
│ │   Define explicit scoring rules                         │ │
│ │                                                         │ │
│ │ ● AI-Assisted (Recommended)                             │ │
│ │   AI learns from your successful deals + rules          │ │
│ │                                                         │ │
│ │ ○ AI Only                                               │ │
│ │   Fully automated based on historical patterns          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SCORE THRESHOLDS                                        │ │
│ │                                                         │ │
│ │ Hot Lead        ████████████████████░░░░ 80+           │ │
│ │ Warm Lead       ████████████░░░░░░░░░░░░ 50-79         │ │
│ │ Cold Lead       ████░░░░░░░░░░░░░░░░░░░░ 0-49          │ │
│ │                                                         │ │
│ │ [Adjust Thresholds]                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ATTRIBUTE SCORING RULES                    [+ Add Rule] │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📊 Company Size                                     │ │ │
│ │ │                                                     │ │ │
│ │ │ IF Company Size IS 1000+ employees THEN +25 pts     │ │ │
│ │ │ IF Company Size IS 200-999 employees THEN +15 pts   │ │ │
│ │ │ IF Company Size IS 50-199 employees THEN +10 pts    │ │ │
│ │ │ IF Company Size IS <50 employees THEN +5 pts        │ │ │
│ │ │                                                     │ │ │
│ │ │ [Edit Rules] [Disable]                              │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 🏢 Industry Match                                   │ │ │
│ │ │                                                     │ │ │
│ │ │ IF Industry IS Technology THEN +20 pts              │ │ │
│ │ │ IF Industry IS Finance THEN +20 pts                 │ │ │
│ │ │ IF Industry IS Healthcare THEN +15 pts              │ │ │
│ │ │                                                     │ │ │
│ │ │ [Edit Rules] [Disable]                              │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 👤 Job Title                                        │ │ │
│ │ │                                                     │ │ │
│ │ │ IF Title CONTAINS "CEO" OR "CTO" THEN +30 pts       │ │ │
│ │ │ IF Title CONTAINS "VP" OR "Director" THEN +20 pts   │ │ │
│ │ │ IF Title CONTAINS "Manager" THEN +10 pts            │ │ │
│ │ │                                                     │ │ │
│ │ │ [Edit Rules] [Disable]                              │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ BEHAVIOR SCORING RULES                     [+ Add Rule] │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📧 Email Engagement                                 │ │ │
│ │ │                                                     │ │ │
│ │ │ IF Email opened THEN +5 pts (per email)             │ │ │
│ │ │ IF Link clicked THEN +10 pts (per click)            │ │ │
│ │ │ IF Replied THEN +25 pts                             │ │ │
│ │ │                                                     │ │ │
│ │ │ [Edit Rules] [Disable]                              │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📞 Meeting Activity                                 │ │ │
│ │ │                                                     │ │ │
│ │ │ IF Demo scheduled THEN +30 pts                      │ │ │
│ │ │ IF Demo completed THEN +40 pts                      │ │ │
│ │ │ IF No-show THEN -20 pts                             │ │ │
│ │ │                                                     │ │ │
│ │ │ [Edit Rules] [Disable]                              │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI INSIGHTS                                          │ │
│ │                                                         │ │
│ │ Based on your closed-won deals, the AI has identified: │ │
│ │                                                         │ │
│ │ • Leads from Technology sector convert 3x more often    │ │
│ │ • Decision makers (VP+) close 45% faster                │ │
│ │ • Leads who attend demos have 72% win rate              │ │
│ │                                                         │ │
│ │ [Apply AI Recommendations]                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

SCORING METHOD RADIO:
- Container: bg #FFFFFF, rounded 12px, padding 20px
- Option: flex, gap 12px, padding 16px
- Radio: 20px, border 2px #E8E4E0, active border #FF6B6B, fill #FF6B6B
- Label: 16px semibold #1A1A1A
- Description: 14px regular #6B6B6B
- Recommended badge: bg #D1FAE5, text #065F46, 12px medium

THRESHOLD SLIDER:
- Track: height 12px, rounded 6px
- Hot section: bg #10B981
- Warm section: bg #F59E0B
- Cold section: bg #E8E4E0
- Thumb: 24px circle, bg #FFFFFF, shadow-md, border 2px #FF6B6B
- Labels: 14px medium, aligned to sections

RULE CARD:
- Background: #FFFFFF
- Border: 1px solid #E8E4E0
- Border radius: 12px
- Padding: 20px
- Margin: 12px 0

RULE CARD HEADER:
- Icon: 24px, colored by category
- Title: 16px semibold #1A1A1A
- Flex justify-between

RULE CONDITIONS:
- Format: "IF [field] [operator] [value] THEN [points]"
- Font: 14px, monospace-inspired styling
- Points positive: #10B981
- Points negative: #EF4444
- Each condition on separate line

RULE BUILDER MODAL:
┌─────────────────────────────────────────────────────────────┐
│ Edit Scoring Rule                                       [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Rule Name                                                   │
│ [Company Size Score                                       ] │
│                                                             │
│ CONDITIONS                                                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ IF [Company Size    ▾] [is              ▾]              │ │
│ │    [1000+ employees                                  ▾] │ │
│ │    THEN [+] [25] points                                 │ │
│ │                                                    [🗑️] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ IF [Company Size    ▾] [is              ▾]              │ │
│ │    [200-999 employees                                ▾] │ │
│ │    THEN [+] [15] points                                 │ │
│ │                                                    [🗑️] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [+ Add Condition]                                           │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [Delete Rule]                     [Cancel] [Save Rule]      │
└─────────────────────────────────────────────────────────────┘

OPERATORS:
- is, is not, contains, does not contain, is greater than, is less than, is empty, is not empty

AI INSIGHTS CARD:
- Background: linear-gradient(135deg, #F0FDF9 0%, #DBEAFE 100%)
- Border: 1px solid #A7F3D0
- Icon: 🤖 20px
- Content: bullet points with insights

Include score preview/simulation and recalculate scores functionality.
```

---

## Prompt 69: CRM-13 Contact Quick View

```
Create an HTML/CSS wireframe for CRM Contact Quick View panel for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Slide-out panel showing contact details without leaving the current context (list view, deal view, etc.).

LAYOUT STRUCTURE:
┌──────────────────────────────────────────┐
│                                      [✕] │
├──────────────────────────────────────────┤
│                                          │
│     ┌────────┐                           │
│     │        │                           │
│     │  👤    │     John Smith            │
│     │        │     VP of Engineering     │
│     └────────┘     Acme Corporation      │
│                                          │
│     📧 john@acme.com                     │
│     📞 +1 555-0123                       │
│     🔗 linkedin.com/in/johnsmith         │
│                                          │
│     [✏️ Edit] [📧 Email] [📞 Call]       │
│                                          │
├──────────────────────────────────────────┤
│ LEAD SCORE                               │
│                                          │
│ ████████████████░░░░ 78 / 100            │
│ 🔥 Hot Lead                              │
│                                          │
│ Top factors:                             │
│ • VP-level title (+20)                   │
│ • Attended demo (+40)                    │
│ • Email engaged (+10)                    │
│                                          │
├──────────────────────────────────────────┤
│ ASSOCIATED RECORDS                       │
│                                          │
│ 🏢 Company                               │
│ ┌──────────────────────────────────────┐ │
│ │ Acme Corporation              [→]    │ │
│ │ Technology • Key Account             │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ 💰 Deals (2)                             │
│ ┌──────────────────────────────────────┐ │
│ │ Enterprise License            [→]    │ │
│ │ $50,000 • Proposal Sent              │ │
│ ├──────────────────────────────────────┤ │
│ │ Support Package               [→]    │ │
│ │ $12,000 • Negotiation                │ │
│ └──────────────────────────────────────┘ │
│                                          │
├──────────────────────────────────────────┤
│ RECENT ACTIVITY                          │
│                                          │
│ ○ 📧 Email opened          2 hours ago  │
│ │  Re: Product Demo Follow-up           │
│ │                                        │
│ ○ 📞 Call logged           Yesterday    │
│ │  15 min • Discussed pricing           │
│ │                                        │
│ ○ 📅 Demo attended         Nov 10       │
│   Product walkthrough completed         │
│                                          │
│ [View All Activity →]                    │
│                                          │
├──────────────────────────────────────────┤
│ QUICK ACTIONS                            │
│                                          │
│ [+ Log Activity] [+ Create Deal]         │
│ [📋 Add Note] [📅 Schedule Meeting]      │
│                                          │
└──────────────────────────────────────────┘

PANEL CONTAINER:
- Width: 400px (desktop), 100% (mobile)
- Height: 100vh
- Position: fixed right 0, top 0
- Background: #FFFFFF
- Shadow: -8px 0 24px rgba(0,0,0,0.08)
- Z-index: 1050
- Animation: slide-in from right, 300ms ease

CLOSE BUTTON:
- Position: absolute top 16px, right 16px
- Size: 40x40px
- Background: transparent, hover #F5F5F5
- Border radius: 8px

PROFILE SECTION:
- Avatar: 80x80px, rounded full, bg #F5F5F5
- Name: 24px semibold #1A1A1A
- Title: 16px regular #6B6B6B
- Company: 16px medium #FF6B6B, hover underline
- Contact info: 14px regular, icon 16px #6B6B6B

ACTION BUTTONS:
- Container: flex gap 8px
- Buttons: 36px height, rounded 8px
- Edit: ghost style
- Email: secondary style (#20B2AA)
- Call: secondary style (#10B981)

LEAD SCORE SECTION:
- Progress bar: height 12px, rounded 6px
- Fill color by score:
  - Hot (70+): #10B981
  - Warm (40-69): #F59E0B
  - Cold (<40): #EF4444
- Badge: appropriate Hot/Warm/Cold with color
- Factors: 14px regular, bullet points

ASSOCIATED RECORDS:
- Section header: 12px semibold uppercase #6B6B6B
- Card: bg #FAFAFA, rounded 8px, padding 12px
- Arrow link: 20px, opacity 0 → 1 on hover
- Title: 14px semibold #1A1A1A
- Metadata: 12px regular #6B6B6B

DEAL STATUS COLORS:
- Lead: #E8E4E0
- Qualified: #DBEAFE
- Proposal: #FEF3C7
- Negotiation: #D1FAE5
- Won: #10B981
- Lost: #EF4444

ACTIVITY TIMELINE (compact):
- Timeline line: 1px #E8E4E0
- Node: 8px circle
- Icon: 16px in node, colored by type
- Title: 14px medium #1A1A1A
- Time: 12px regular #9CA3AF
- Detail: 12px regular #6B6B6B

QUICK ACTIONS:
- Grid: 2 columns
- Button: ghost style, 40px height, full width
- Icon: 16px, left
- Text: 14px medium

BACKDROP (optional):
- Background: rgba(0,0,0,0.3)
- Click to close
- Opacity transition: 200ms

Include loading skeleton, empty states for deals/activity, and keyboard navigation (Esc to close).
```

---

## Prompt 70: CRM-14 Bulk Actions

```
Create an HTML/CSS wireframe for CRM Bulk Actions interface for HYVVE platform.

[INSERT GLOBAL DESIGN SYSTEM]

PAGE PURPOSE:
Enable bulk operations on multiple selected CRM records including editing, assigning, tagging, exporting, and deleting.

LAYOUT STRUCTURE:

SELECTION BAR (appears when items selected):
┌─────────────────────────────────────────────────────────────┐
│ ☑ 24 contacts selected            [Select All 248] [Clear] │
│                                                             │
│ [📝 Edit] [👤 Assign] [🏷️ Tag] [📤 Export] [🗑️ Delete]     │
└─────────────────────────────────────────────────────────────┘

SELECTION BAR SPECIFICATIONS:
- Position: sticky top (below header)
- Background: #1A1A1A
- Text: #FFFFFF
- Height: 56px
- Padding: 0 24px
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
- Z-index: 100
- Animation: slide down 200ms

CHECKBOX STATES:
- Unchecked: 20x20px, border 2px #E8E4E0, bg #FFFFFF
- Checked: bg #FF6B6B, border #FF6B6B, white checkmark
- Indeterminate: bg #FF6B6B, white dash (partial selection)
- Hover: border #FF6B6B

ACTION BUTTONS:
- Style: ghost on dark background
- Padding: 8px 16px
- Border radius: 8px
- Text: 14px medium #FFFFFF
- Icon: 16px, margin-right 6px
- Hover: bg rgba(255,255,255,0.1)
- Active/pressed: bg rgba(255,255,255,0.2)

BULK EDIT MODAL:
┌─────────────────────────────────────────────────────────────┐
│ Edit 24 Contacts                                        [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Select fields to update. Empty fields will not be changed.  │
│                                                             │
│ ┌─ ASSIGN OWNER ────────────────────────────────────────┐   │
│ │ ☐ Update owner                                        │   │
│ │ [Select team member...                            ▾]  │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ STATUS ──────────────────────────────────────────────┐   │
│ │ ☐ Update status                                       │   │
│ │ [Select status...                                 ▾]  │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ LEAD SOURCE ─────────────────────────────────────────┐   │
│ │ ☐ Update lead source                                  │   │
│ │ [Select source...                                 ▾]  │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ CUSTOM FIELDS ───────────────────────────────────────┐   │
│ │ ☐ Industry Vertical                                   │   │
│ │ [Select...                                        ▾]  │   │
│ │                                                       │   │
│ │ ☐ Contract Tier                                       │   │
│ │ [Select...                                        ▾]  │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ⚠️ This action will update 24 records and cannot be undone. │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [Cancel]                              [Update 24 Contacts]  │
└─────────────────────────────────────────────────────────────┘

FIELD UPDATE CHECKBOX:
- When unchecked: field input disabled, opacity 0.5
- When checked: field input enabled
- Prevents accidental overwrites

BULK ASSIGN MODAL:
┌─────────────────────────────────────────────────────────────┐
│ Assign 24 Contacts                                      [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Select team member to assign                                │
│                                                             │
│ 🔍 [Search team members...]                                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ○ 👤 Sarah Chen                                         │ │
│ │     Sales Lead • 45 contacts assigned                   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ○ 👤 Mike Johnson                                       │ │
│ │     Account Executive • 38 contacts assigned            │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ○ 👤 Jane Doe                                           │ │
│ │     Sales Rep • 52 contacts assigned                    │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ○ 👤 Alex Kim                                           │ │
│ │     BDR • 28 contacts assigned                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Distribution method:                                        │
│ ● Assign all to selected  ○ Distribute evenly               │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [Cancel]                              [Assign 24 Contacts]  │
└─────────────────────────────────────────────────────────────┘

BULK TAG MODAL:
┌─────────────────────────────────────────────────────────────┐
│ Tag 24 Contacts                                         [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ ADD TAGS ────────────────────────────────────────────┐   │
│ │                                                       │   │
│ │ [Enterprise] [Q4-2024] [× ]                           │   │
│ │                                                       │   │
│ │ [🔍 Search or create tag...                         ] │   │
│ │                                                       │   │
│ │ Recent: [Hot Lead] [Follow-up] [Priority]             │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ REMOVE TAGS ─────────────────────────────────────────┐   │
│ │                                                       │   │
│ │ Tags on selected contacts:                            │   │
│ │ [Cold Lead ×] [Old Data ×]                            │   │
│ │                                                       │   │
│ │ Check to remove from all selected                     │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [Cancel]                                     [Apply Tags]   │
└─────────────────────────────────────────────────────────────┘

TAG INPUT:
- Multi-select with chips
- Type to search/filter
- Create new tag inline
- Colors: auto-assigned or selectable

BULK DELETE CONFIRMATION:
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Delete 24 Contacts                                   [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Are you sure you want to delete 24 contacts?                │
│                                                             │
│ This will also remove:                                      │
│ • 156 associated activities                                 │
│ • 12 deals (moved to unassigned)                            │
│ • 89 email history records                                  │
│                                                             │
│ This action cannot be undone.                               │
│                                                             │
│ Type "DELETE" to confirm:                                   │
│ [                                                         ] │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [Cancel]                        [Delete 24 Contacts]        │
└─────────────────────────────────────────────────────────────┘

DELETE BUTTON:
- Disabled until "DELETE" typed
- Background: #EF4444
- Hover: #DC2626
- Text: #FFFFFF

PROGRESS MODAL (during bulk operation):
┌─────────────────────────────────────────────────────────────┐
│ Updating Contacts...                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ████████████████████████░░░░░░░░░░░░░ 18 of 24              │
│                                                             │
│ ✓ John Smith updated                                        │
│ ✓ Jane Doe updated                                          │
│ ✓ Mike Johnson updated                                      │
│ → Processing: Sarah Chen...                                 │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│                                          [Cancel]           │
└─────────────────────────────────────────────────────────────┘

SUCCESS/ERROR SUMMARY:
┌─────────────────────────────────────────────────────────────┐
│ ✓ Bulk Update Complete                                  [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✓ 22 contacts updated successfully                          │
│ ⚠ 2 contacts failed                                         │
│                                                             │
│ Failed records:                                             │
│ • John Smith - Permission denied                            │
│ • Jane Doe - Record locked by another user                  │
│                                                             │
│ [Download Error Report]                                     │
│                                                             │
│ ────────────────────────────────────────────────────────── │
│ [Close]                                    [Retry Failed]   │
└─────────────────────────────────────────────────────────────┘

Include keyboard shortcuts (Ctrl+A select all, Delete key), undo functionality where possible, and operation queueing for large batches.
```

---

## Summary: Batch 7 Complete

**Prompts 61-70 created covering:**
- CRM-05: Companies List View
- CRM-06: Company Detail View
- CRM-07: Activities List/Timeline
- CRM-08: Email Templates
- CRM-09: Import/Export
- CRM-10: Reports & Analytics
- CRM-11: CRM Settings
- CRM-12: Lead Scoring
- CRM-13: Contact Quick View
- CRM-14: Bulk Actions

**Progress: 70/90+ prompts complete (7 batches done)**

Ready for **Batch 8: PM Module Part 1 (10 prompts)**?
