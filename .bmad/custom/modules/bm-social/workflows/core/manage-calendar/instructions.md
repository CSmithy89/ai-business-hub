# Manage Calendar Workflow

## Purpose
View, organize, and manage the social media content calendar with drag-drop scheduling and gap analysis.

## Context Variables
- `{{view_mode}}` - Calendar view (day, week, month)
- `{{filters}}` - Active filters (platform, status, campaign)
- `{{timezone}}` - Display timezone
- `{{date_focus}}` - Current focused date

## Prerequisites
- At least one platform connected
- Posts exist (scheduled, draft, or published)

## Execution Steps

### Step 1: Open Calendar View
Display calendar with default view (week):

```
CONTENT CALENDAR - Week of March 10-16, 2025
[< Prev] [Today] [Next >]  View: [Day] [Week] [Month]

          Mon 10    Tue 11    Wed 12    Thu 13    Fri 14
--------+----------+---------+---------+---------+---------
 9:00   | [Twitter]|         | [LI]    | [Insta] |
        | Launch   |         | Tips    | Product |
--------+---------+---------+---------+---------+---------
12:00   |         | [FB]    |         | [Twit]  | [LI]
        |         | Update  |         | Thread  | Article
--------+---------+---------+---------+---------+---------
 3:00   | [Insta] |         | [All]   |         | [Twit]
        | Story   |         | Promo   |         | Engage
--------+---------+---------+---------+---------+---------
 6:00   |         | [TikTok]|         | [FB]    |
        |         | Video   |         | Live    |
```

Color-code by platform and status.

### Step 2: Apply Filters
Filter calendar content:

```
Filters:
Platform: [All] [Twitter] [LinkedIn] [Instagram] [Facebook]
Status:   [All] [Draft] [Scheduled] [Published] [Failed]
Campaign: [All] [Q1 Launch] [Evergreen] [Promotional]
Creator:  [All team members]
```

Show filter badges and clear option.

### Step 3: View Scheduled Content
Click item for details:

```
POST DETAILS
------------
Platform: Twitter (@company)
Status: Scheduled
Time: March 12, 2025 at 9:00 AM EST

Content:
"Excited to announce our new AI features!

Here's what's coming:
- Smart scheduling
- Content suggestions
- Analytics insights

#ProductLaunch #AI"

Media: 1 image attached
Campaign: Q1 Launch

[Edit] [Reschedule] [Cancel] [Duplicate]
```

### Step 4: Drag-Drop Rescheduling
Enable drag-drop functionality:

1. Click and hold any post
2. Drag to new time slot
3. Drop to reschedule
4. Show confirmation:

```
Reschedule Post?
From: Tuesday 12:00 PM
To:   Wednesday 9:00 AM

[Confirm] [Cancel]
```

Update queue and notify collaborators.

### Step 5: Bulk Actions
Select multiple posts:

```
Selected: 3 posts
[Reschedule All] [Cancel All] [Edit Tags] [Delete]

Bulk Reschedule:
Move all by: [+1 day] [-1 day] [Specific date]
Time adjustment: [Keep times] [Shift by 2 hours]
```

### Step 6: Identify Content Gaps
Analyze calendar for gaps:

```
CONTENT GAP ANALYSIS

Recommended posting frequency:
- Twitter: 3-5 posts/day (You have: 2/day avg)
- LinkedIn: 1-2 posts/day (You have: 1/day avg)
- Instagram: 1-2 posts/day (You have: 0.5/day avg)

Gaps Identified:
! No content scheduled for Saturday/Sunday
! Monday 10th has no Twitter posts
! Instagram needs 3 more posts this week

[Auto-fill with suggestions] [Schedule evergreen] [Ignore]
```

### Step 7: Fill Content Gaps
Options to address gaps:

| Option | Description |
|--------|-------------|
| Quick Post | Create simple post for slot |
| AI Suggestion | Generate content for gap |
| Evergreen Content | Schedule from content library |
| Copy Existing | Duplicate and adapt |
| Leave Empty | Mark as intentional |

For AI suggestion:
```
Suggested content for Monday 9:00 AM:
"Start your week with this productivity tip:
Block your first hour for deep work.
No emails, no meetings, just focus."

[Use This] [Regenerate] [Edit First] [Skip]
```

### Step 8: Calendar Export/Import
Share or backup calendar:

```
Calendar Actions:
[Export to ICS] - Sync with external calendar
[Export to CSV] - Spreadsheet format
[Share Link] - View-only link for stakeholders
[Import] - Bulk add from file
```

### Step 9: Save View State
Persist user preferences:

- Current view mode
- Applied filters
- Zoom level
- Column visibility
- Default date range

## Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| Blue dot | Scheduled |
| Green check | Published |
| Yellow warning | Needs attention |
| Red X | Failed |
| Gray | Draft |
| Purple star | High priority |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Arrow keys | Navigate dates |
| Enter | Open selected post |
| N | New post |
| Delete | Cancel selected |
| Ctrl+Z | Undo last action |
| T | Jump to today |

## Error Handling

| Error | Resolution |
|-------|------------|
| Conflict detected | Show warning, offer resolution |
| Past date drop | Prevent with visual feedback |
| Unsaved changes | Prompt before navigation |
| Rate limit | Queue changes, apply later |

## Events Emitted
- `social.calendar.viewed` - Calendar opened
- `social.post.rescheduled` - Post time changed
- `social.calendar.gap_detected` - Gap analysis complete

## Related Workflows
- `schedule-content` - Add to calendar
- `bulk-schedule` - Add many at once
- `analyze-performance` - Optimize timing
