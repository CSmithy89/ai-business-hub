# Report Generate Workflow

## Purpose
Create comprehensive stakeholder-ready analytics reports with AI-powered narrative insights.

## Context Variables
- `{{report_type}}` - Type of report to generate
- `{{date_range}}` - Reporting period
- `{{audience}}` - Target audience for report
- `{{platforms}}` - Platforms to include

## Prerequisites
- Analytics data available
- BYOAI configured for narrative generation
- Export templates configured

## Execution Steps

### Step 1: Select Report Type
Choose report focus:

```
REPORT TYPE SELECTION

Standard Reports:
( ) Executive Summary - High-level overview for leadership
(x) Platform Deep-Dive - Detailed single platform analysis
( ) Campaign Report - Specific campaign performance
( ) Competitive Analysis - Market positioning
( ) Content Performance - What's working, what's not
( ) Audience Insights - Who's engaging

Custom Report:
( ) Build custom report from scratch

Selected: Platform Deep-Dive
Platform: [LinkedIn ▼]
```

### Step 2: Configure Date Range
Set reporting period:

```
DATE RANGE CONFIGURATION

Standard Periods:
( ) Last 7 days
(x) Last 30 days (March 2025)
( ) Last 90 days (Q1 2025)
( ) Last 12 months
( ) Year to date

Custom:
From: [___________] To: [___________]

Comparison Period:
[x] Include comparison to previous period
    Compare to: Feb 2025

Trend Analysis:
[x] Show week-over-week trends
[ ] Show month-over-month trends
```

### Step 3: Select Metrics
Choose what to include:

```
METRIC SELECTION

LinkedIn Deep-Dive Report

ENGAGEMENT METRICS
[x] Total reach / impressions
[x] Engagement rate (likes, comments, shares)
[x] Click-through rate
[x] Video views and completion
[x] Post saves

GROWTH METRICS
[x] Follower count and growth
[x] Page views
[x] Unique visitors
[ ] Employee advocacy metrics

CONTENT METRICS
[x] Top performing posts
[x] Content type breakdown
[x] Posting frequency analysis
[x] Best times analysis

AUDIENCE METRICS
[x] Demographic breakdown
[x] Industry distribution
[x] Job function breakdown
[ ] Company size breakdown

[Select All] [Clear All]
```

### Step 4: Define Audience
Tailor report for readers:

```
REPORT AUDIENCE

Who will read this report?

( ) Executive Leadership
    - Focus: ROI, high-level trends, recommendations
    - Length: 2-3 pages max
    - Visuals: Heavy, minimal text

(x) Marketing Team
    - Focus: Tactics, content performance, next steps
    - Length: 5-8 pages
    - Visuals: Balanced with detail

( ) Social Media Manager
    - Focus: Granular metrics, daily performance
    - Length: Full data export
    - Visuals: Light, more tables

( ) External Stakeholders
    - Focus: Results, brand presence
    - Length: 3-5 pages
    - Visuals: Polished, branded

Customize tone:
[Professional ▼] [Detailed ▼]
```

### Step 5: Generate Report Data
Compile metrics and analysis:

```
GENERATING REPORT...

Fetching data...
[=========>         ] LinkedIn API (followers)
[============>      ] LinkedIn API (posts)
[===============>   ] LinkedIn API (analytics)
[==================>] Complete

Processing...
[=========>         ] Calculating metrics
[=============>     ] Generating comparisons
[================>  ] Building visualizations
[==================>] Complete

Generating insights...
[=========>         ] Pulse analyzing data
[=============>     ] Creating narrative
[================>  ] Recommendations
[==================>] Complete

Report ready for review.
[Preview Report]
```

### Step 6: Review Generated Report
Preview and edit:

```
REPORT PREVIEW

===================================
LINKEDIN PERFORMANCE REPORT
March 2025
===================================

EXECUTIVE SUMMARY
-----------------
Your LinkedIn presence grew significantly in March,
with a 23% increase in engagement and 2,340 new
followers. Content featuring AI topics performed
best, averaging 4.2% engagement rate.

KEY METRICS AT A GLANCE
-----------------------
Metric          | March   | Feb     | Change
----------------|---------|---------|--------
Followers       | 12,340  | 10,000  | +23.4%
Reach           | 234,500 | 198,000 | +18.4%
Engagement Rate | 4.2%    | 3.8%    | +10.5%
Link Clicks     | 1,890   | 1,450   | +30.3%

[Chart: Follower Growth Over Time]

TOP PERFORMING CONTENT
----------------------
1. "The Future of AI in Business"
   Impressions: 45,230 | Engagement: 5.8%

2. "5 Leadership Lessons from Tech CEOs"
   Impressions: 38,450 | Engagement: 4.9%

...

[Edit Report] [Add Section] [Continue]
```

### Step 7: Add AI Narrative
Enhance with insights:

```
AI-GENERATED INSIGHTS

Pulse's Analysis:
-----------------
WHAT WORKED THIS MONTH:

"Your LinkedIn audience responded exceptionally well
to thought leadership content, particularly posts
about AI and future of work topics. The carousel
format outperformed single-image posts by 2.3x,
suggesting your audience prefers educational,
swipeable content.

Posting timing analysis shows your highest engagement
occurred between 8-10 AM EST on Tuesdays and Thursdays,
aligning with when LinkedIn professionals typically
check their feeds during morning coffee."

KEY OPPORTUNITIES:

"Based on content performance patterns, consider:
1. Increasing carousel posts from 3/week to 5/week
2. Publishing more consistently on Thursdays (gap day)
3. Testing video content - competitors seeing 40% lift
4. Engaging more in comments - response rate low at 23%"

RISKS TO MONITOR:

"Engagement rate, while strong, has plateaued over
the last 3 weeks. Recommend testing new content
formats or topics to maintain momentum."

[Include in Report] [Regenerate] [Edit]
```

### Step 8: Add Recommendations
Include action items:

```
RECOMMENDATIONS SECTION

Based on March 2025 performance:

IMMEDIATE ACTIONS (This Week)
-----------------------------
1. Schedule 2 additional carousel posts
   Impact: +15% expected engagement
   Owner: Content team

2. Respond to pending comments (47 unanswered)
   Impact: +8% engagement rate
   Owner: Community manager

SHORT-TERM (This Month)
-----------------------
3. Launch video content test
   Impact: Potential 40% reach increase
   Owner: Creative team

4. Optimize Thursday posting
   Impact: Fill engagement gap
   Owner: Social manager

STRATEGIC (This Quarter)
------------------------
5. Develop thought leadership series
   Impact: Brand authority building
   Owner: Content strategy

[Add Custom Recommendation] [Prioritize]
```

### Step 9: Format and Export
Finalize report:

```
EXPORT OPTIONS

Report: LinkedIn Performance - March 2025
Pages: 6

FORMAT
------
(x) PDF Document
    Professional layout, charts embedded

( ) PowerPoint/Slides
    Presentation-ready format

( ) HTML Dashboard
    Interactive, shareable link

( ) CSV Data
    Raw numbers for analysis

BRANDING
--------
[x] Include company logo
[x] Use brand colors
[x] Add footer with date/confidential

DELIVERY
--------
[x] Download immediately
[x] Email to: [marketing@company.com     ]
[ ] Schedule recurring delivery

[Generate Report]
```

### Step 10: Schedule Recurring
Set up automated reports:

```
RECURRING REPORT SETUP

Report: LinkedIn Performance
Frequency: [Monthly ▼]

Schedule:
Day: [1st of month ▼]
Time: [8:00 AM ▼]
Timezone: [EST ▼]

Recipients:
+ marketing@company.com
+ leadership@company.com
+ [Add recipient...]

Format: PDF

Include:
[x] AI-generated insights
[x] Comparison to previous period
[x] Recommendations section
[ ] Raw data attachment

[Save Schedule] [Send Test Report]
```

## Report Types

| Type | Focus | Audience | Frequency |
|------|-------|----------|-----------|
| Executive Summary | High-level KPIs | Leadership | Monthly |
| Platform Deep-Dive | Single platform detail | Marketing | Monthly |
| Campaign Report | Specific campaign | Project team | Post-campaign |
| Competitive Analysis | Market position | Strategy | Quarterly |
| Content Performance | What works | Content team | Weekly |
| Audience Insights | Demographics | Marketing | Quarterly |

## Report Sections

| Section | Contents |
|---------|----------|
| Executive Summary | Key metrics, trends, highlights |
| Performance Metrics | Detailed numbers with charts |
| Content Analysis | Top/bottom performers |
| Audience Insights | Demographics, behavior |
| Competitive Context | Market positioning |
| Recommendations | Action items |
| Appendix | Raw data, methodology |

## Error Handling

| Error | Resolution |
|-------|------------|
| Data incomplete | Note gaps, proceed with available |
| API rate limit | Queue generation, retry |
| Export failed | Retry, offer alternative format |
| AI insights failed | Provide data without narrative |

## Events Emitted
- `social.report.generating` - Report started
- `social.report.generated` - Report complete
- `social.report.delivered` - Report sent
- `social.report.scheduled` - Recurring set up

## Related Workflows
- `analyze-performance` - Data source
- `competitor-analysis` - Competitive data
- `campaign-launch` - Campaign reporting
