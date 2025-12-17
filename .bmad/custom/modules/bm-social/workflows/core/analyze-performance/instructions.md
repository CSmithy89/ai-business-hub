# Analyze Performance Workflow

## Purpose
Review social media analytics and generate actionable insights using the Pulse (Analytics) agent.

## Context Variables
- `{{date_range}}` - Analysis period (7d, 30d, 90d, custom)
- `{{platforms}}` - Platforms to analyze
- `{{report_type}}` - Type of analysis (overview, deep_dive, content, audience, competitive)
- `{{comparison_period}}` - Optional comparison range

## Prerequisites
- Connected platforms with analytics access
- Minimum 7 days of data for meaningful analysis
- BYOAI configured for insight generation

## Execution Steps

### Step 1: Date Range Selection
Choose analysis period:

```
Select Date Range:
( ) Last 7 days
(x) Last 30 days
( ) Last 90 days
( ) Year to date
( ) Custom range: [Start] to [End]

Compare to: [Previous period] / [Same period last year] / [None]
```

### Step 2: Platform Selection
Select accounts to analyze:

```
Analyze Performance For:
[x] All connected accounts (5)
    [x] Twitter - @company
    [x] LinkedIn - Company Page
    [x] Instagram - @company
    [x] Facebook - Company Page
    [x] YouTube - Company Channel
```

### Step 3: Report Type
Choose analysis focus:

| Report Type | Description | Key Metrics |
|-------------|-------------|-------------|
| Overview Dashboard | High-level summary | Reach, engagement, growth |
| Platform Deep-Dive | Single platform focus | All platform metrics |
| Content Performance | Post-level analysis | Top/bottom performers |
| Audience Insights | Follower analysis | Demographics, behavior |
| Competitive Benchmark | vs. competitors | Share of voice, sentiment |

### Step 4: Fetch Analytics Data
Query platform APIs for metrics:

```
Fetching analytics...
[=====>          ] Twitter API
[=========>      ] LinkedIn API
[============>   ] Instagram Insights
[==============> ] Facebook Graph
[===============>] YouTube Analytics
```

Aggregate into unified data model.

### Step 5: Display Key Metrics
Show dashboard with visualizations:

```
PERFORMANCE OVERVIEW (Last 30 Days)

Total Reach        Total Engagement      Follower Growth
1.2M (+23%)        45.2K (+15%)          +2,340 (+8%)

    Engagement Rate: 3.8% (Industry avg: 2.1%)

Platform Breakdown:
-------------------
Platform   | Reach   | Eng.   | Posts | Best Post
-----------|---------|--------|-------|------------
Twitter    | 450K    | 12.3K  | 45    | Thread on AI
LinkedIn   | 320K    | 18.4K  | 28    | Leadership tip
Instagram  | 280K    | 8.9K   | 32    | Product carousel
Facebook   | 120K    | 4.1K   | 18    | Company update
YouTube    | 30K     | 1.5K   | 4     | Tutorial video
```

### Step 6: Content Analysis
Identify performance patterns:

```
TOP PERFORMING CONTENT
----------------------
1. "AI in Business" thread - 45K impressions, 12% engagement
   Tags: #AI #Business #Innovation
   Posted: Tuesday 9:15 AM

2. "Leadership Lessons" post - 38K impressions, 8% engagement
   Format: Carousel (10 slides)
   Posted: Wednesday 11:00 AM

CONTENT PATTERNS
----------------
Best performing format: Threads (+340% vs single posts)
Best posting time: Tuesday-Thursday, 9-11 AM
Top hashtags: #Leadership, #Innovation, #AI
Underperforming: Single image posts, weekend publishing
```

### Step 7: AI Insights Generation
Invoke Pulse agent for analysis:

```
Pulse's Analysis:
-----------------
WHAT'S WORKING:
"Your thread content is significantly outperforming other
formats. The AI/tech topics resonate strongly with your
LinkedIn audience, generating 3x the engagement of general
business content."

OPPORTUNITIES:
"Instagram engagement has declined 15% month-over-month.
Consider more Reels content - your competitors are seeing
50% higher reach with video formats."

RECOMMENDED ACTIONS:
1. Increase thread content from 2/week to 4/week
2. Test Reels format on Instagram (aim for 3/week)
3. Shift weekend posts to Monday morning
4. Experiment with polls on Twitter (high engagement, low usage)
```

### Step 8: Export Options
Generate shareable reports:

| Format | Contents | Delivery |
|--------|----------|----------|
| PDF Report | Full analysis + charts | Download/Email |
| CSV Data | Raw metrics export | Download |
| Slide Deck | Executive summary | Google Slides |
| Email Digest | Key highlights | Scheduled email |

```
Export Report:
[x] Include AI insights
[x] Add competitor comparison
[ ] Include raw data appendix
[x] Brand with company logo

Format: [PDF] [CSV] [Slides]
Deliver to: [team@company.com]
```

### Step 9: Automated Reporting
Set up recurring reports:

```
Automated Reports:
[x] Weekly performance digest
    Recipients: marketing@company.com
    Day: Monday 8:00 AM

[ ] Monthly executive summary
    Recipients: leadership@company.com
    Day: 1st of month
```

## Metric Definitions

| Metric | Definition |
|--------|------------|
| Reach | Unique users who saw content |
| Impressions | Total content views |
| Engagement | Likes + comments + shares + saves |
| Engagement Rate | Engagement / Reach * 100 |
| Click-through Rate | Link clicks / Impressions * 100 |
| Follower Growth | Net new followers |

## Error Handling

| Error | Resolution |
|-------|------------|
| API rate limited | Queue and retry |
| Missing permissions | Prompt re-auth |
| Insufficient data | Show available range |
| Platform outage | Use cached data |

## Events Emitted
- `social.analytics.fetched` - Data retrieved
- `social.report.generated` - Report created
- `social.insights.generated` - AI analysis complete

## Related Workflows
- `report-generate` - Custom report builder
- `competitor-analysis` - Competitive insights
- `manage-calendar` - Optimize based on data
