# Bulk Schedule Workflow

## Purpose
Schedule multiple posts at once via CSV import, content library selection, or AI bulk generation.

## Context Variables
- `{{import_method}}` - Source type (csv, paste, library, ai_generate)
- `{{scheduling_rules}}` - How to distribute posts
- `{{validation_mode}}` - Strict or lenient validation
- `{{platforms}}` - Default platforms for import

## Prerequisites
- At least one platform connected
- Import file or content ready
- Time slots configured for auto-distribution

## Execution Steps

### Step 1: Choose Import Method
Select how to add content:

| Method | Description | Best For |
|--------|-------------|----------|
| CSV Upload | Structured file import | Pre-planned content |
| Copy/Paste | Text block input | Quick bulk entry |
| Content Library | Select existing content | Evergreen reposts |
| AI Generation | Bulk create with AI | Content series |

### Step 2A: CSV Upload
For `import_method === 'csv'`:

```
CSV IMPORT

Template columns:
- content (required): Post text
- platform (required): twitter, linkedin, instagram, etc.
- scheduled_time (optional): ISO datetime or relative
- media_url (optional): Image/video URL
- hashtags (optional): Comma-separated
- campaign (optional): Campaign tag

[Download Template] [Upload CSV]
```

Parse and validate file:
```
Parsing CSV...
Found: 45 rows
Valid: 42 posts
Errors: 3 rows with issues

Row 12: Content exceeds Twitter limit (320/280)
Row 28: Invalid platform "insta" (use "instagram")
Row 31: Missing required content field

[View Errors] [Skip Errors] [Cancel]
```

### Step 2B: Copy/Paste Import
For `import_method === 'paste'`:

```
PASTE CONTENT

Enter posts separated by blank lines:
---
Post 1 content here
#hashtag1 #hashtag2
---
Post 2 content here with longer text
that spans multiple lines
---

Default Platform: [Twitter ▼]
Default Time: [Use auto-scheduler]

[Parse Content]
```

### Step 2C: Content Library Selection
For `import_method === 'library'`:

```
SELECT FROM LIBRARY

Categories:
[x] Evergreen tips (24 items)
[ ] Product announcements (12 items)
[x] Testimonials (18 items)
[ ] Blog promotions (8 items)

Filter by:
- Last scheduled: [Over 30 days ago]
- Performance: [Top 25%]
- Platform: [Twitter compatible]

Selected: 12 items
[Add to Bulk Queue]
```

### Step 2D: AI Bulk Generation
For `import_method === 'ai_generate'`:

```
AI BULK GENERATION

Generate a series of posts:
Topic: [Weekly productivity tips]
Platform: [LinkedIn]
Quantity: [12 posts]
Tone: [Professional]
Include: [x] Numbered series [x] Hashtags [ ] CTAs

Content variation:
( ) All unique
(x) Variations on theme
( ) Follow template

[Generate Series]
```

### Step 3: Field Mapping
Map imported data to post structure:

```
FIELD MAPPING

CSV Column        → Post Field
--------------    -----------
"post_text"       → Content
"network"         → Platform
"publish_date"    → Scheduled Time
"image_link"      → Media
"tags"            → Hashtags
(unmapped)        → Campaign

[Auto-detect] [Reset] [Continue]
```

### Step 4: Scheduling Rules
Configure how posts are distributed:

```
SCHEDULING OPTIONS

Method:
( ) Use times from import file
(x) Auto-distribute over period
( ) Fill available time slots
( ) Custom schedule per post

Distribution Settings:
Start date: [March 15, 2025]
End date: [April 15, 2025]
Posts per day: [2-4]
Time slots: [Use account defaults]
Spacing: [Minimum 4 hours apart]

Platform limits:
- Max 5 tweets per day
- Max 2 LinkedIn posts per day
- Max 3 Instagram posts per day
```

### Step 5: Preview All Posts
Show queue preview:

```
BULK QUEUE PREVIEW (42 posts)

#  | Date      | Time  | Platform  | Content Preview        | Status
---|-----------|-------|-----------|------------------------|--------
1  | Mar 15    | 9:00  | Twitter   | "Productivity tip #1..." | Ready
2  | Mar 15    | 12:00 | LinkedIn  | "This week's insight..." | Ready
3  | Mar 15    | 3:00  | Twitter   | "Did you know that..."   | Ready
4  | Mar 16    | 9:00  | Instagram | "Monday motivation..."   | Warning
...

Filters: [Ready] [Warnings] [Errors]
[Edit Selected] [Remove Selected] [Reschedule Selected]
```

### Step 6: Validation
Check all content against rules:

```
VALIDATION RESULTS

Passed: 38 posts
Warnings: 3 posts
Errors: 1 post

WARNINGS:
- Post #4: Instagram caption has 2,450 chars (limit 2,200)
- Post #18: No media attached (Instagram prefers visual)
- Post #29: Scheduling conflict at 3:00 PM

ERRORS:
- Post #12: Contains blocked word "guarantee"

[Auto-fix Warnings] [Review Each] [Skip Validation]
```

Auto-fix options:
- Truncate long content
- Adjust conflicting times
- Add placeholder media

### Step 7: Handle Errors
Resolution workflow:

```
ERROR RESOLUTION

Post #12 - Blocked Content
--------------------------
Original: "We guarantee you'll see results..."
Issue: "guarantee" is a blocked word

Resolution:
( ) Remove blocked word
(x) Replace with: "We're confident you'll see..."
( ) Skip this post
( ) Allow anyway (admin override)

[Apply] [Apply to All Similar]
```

### Step 8: Confirmation
Final review before scheduling:

```
CONFIRM BULK SCHEDULE

Summary:
- Total posts: 42
- Platforms: Twitter (20), LinkedIn (12), Instagram (10)
- Date range: Mar 15 - Apr 15, 2025
- Approval required: 8 posts (AI-generated)

Estimated reach: 125K - 180K impressions
Cost: 0 (organic posts)

[ ] Send notification when each post publishes
[ ] Generate performance report after completion

[Schedule All] [Save as Draft] [Cancel]
```

### Step 9: Queue Monitoring
Post-scheduling management:

```
BULK QUEUE STATUS

Campaign: Q1 Content Series
Progress: 12/42 published (28%)
Next post: In 2 hours

[Pause All] [Resume] [View Calendar] [Export Report]

Recent Activity:
- Mar 15 9:00: Twitter post published - 1.2K impressions
- Mar 15 12:00: LinkedIn post published - 890 impressions
- Mar 15 3:00: Twitter post published - 2.1K impressions
```

## CSV Template Format

```csv
content,platform,scheduled_time,media_url,hashtags,campaign
"Post text here",twitter,2025-03-15T09:00:00,https://...,tag1;tag2,Q1 Launch
"LinkedIn article",linkedin,2025-03-15T12:00:00,,business;tips,Q1 Launch
```

## Error Handling

| Error | Resolution |
|-------|------------|
| File parse error | Show line number, offer fix |
| Rate limit | Distribute over more days |
| Duplicate content | Warn, offer skip |
| Invalid media | Queue for manual fix |

## Events Emitted
- `social.bulk.imported` - Content parsed
- `social.bulk.validated` - Validation complete
- `social.bulk.scheduled` - All posts queued
- `social.bulk.progress` - Periodic status

## Related Workflows
- `create-post` - Single post creation
- `manage-calendar` - View scheduled posts
- `content-repurpose` - Generate variations
