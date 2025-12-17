# Schedule Content Workflow

## Purpose
Schedule a post for future publishing with flexible timing options.

## Context Variables
- `{{post_id}}` - Post to schedule (draft or new)
- `{{schedule_type}}` - Scheduling method (specific, next_slot, optimal, recurring)
- `{{timezone}}` - User timezone for display
- `{{platforms}}` - Target platforms

## Prerequisites
- Post exists as draft or is being created
- Connected platform accounts
- Time slots configured (for queue-based scheduling)

## Execution Steps

### Step 1: Post Selection
If no post provided, show options:

```
Select content to schedule:
[ ] Create new post
[ ] Choose from drafts (12 available)
[ ] Re-schedule published post
[ ] Duplicate existing post
```

Load post details if selected.

### Step 2: Scheduling Method
Present scheduling options:

| Method | Description | Best For |
|--------|-------------|----------|
| Specific Time | Pick exact date and time | Time-sensitive content |
| Next Available | First open slot | Quick scheduling |
| Optimal Time | Tempo AI picks best | Maximum engagement |
| Recurring | Repeat on schedule | Evergreen content |

### Step 3A: Specific Time Scheduling
If `schedule_type === 'specific'`:

1. Show calendar picker
2. Display existing posts on selected day
3. Warn if time conflicts with other posts
4. Validate platform not rate-limited
5. Set exact publish time

```
Schedule for:
Date: [March 15, 2025]
Time: [9:00 AM] [EST]

Other posts that day:
- 12:00 PM: Product announcement (LinkedIn)
- 3:00 PM: Customer story (Twitter, Instagram)
```

### Step 3B: Next Available Slot
If `schedule_type === 'next_slot'`:

1. Query configured time slots from account settings
2. Find first empty slot per platform
3. Show suggested times:

```
Next Available Slots:
Twitter: Today 6:00 PM (in 4 hours)
LinkedIn: Tomorrow 9:00 AM (in 19 hours)
Instagram: Today 8:00 PM (in 6 hours)
```

### Step 3C: Optimal Time (AI)
If `schedule_type === 'optimal'`:

1. Invoke Tempo agent
2. Analyze:
   - Historical engagement data
   - Audience active hours
   - Content type patterns
   - Competitor posting times
3. Suggest optimal window:

```
Tempo's Recommendation:
"Based on your audience engagement patterns, posting on
Tuesday at 9:15 AM typically gets 34% higher engagement.
Your last 5 posts at this time averaged 1,240 impressions."

Suggested: Tuesday, March 18, 2025 at 9:15 AM
[Accept] [Pick Different Time] [View Analysis]
```

### Step 3D: Recurring Schedule
If `schedule_type === 'recurring'`:

1. Configure recurrence:
   - Daily / Weekly / Monthly
   - Days of week (for weekly)
   - Day of month (for monthly)
2. Set end condition:
   - Never (until cancelled)
   - After X occurrences
   - Until specific date
3. Configure variations:
   - Same content each time
   - Rotate variations
   - AI refresh each time

```
Recurring Schedule:
Frequency: [Weekly]
Days: [x] Mon [ ] Tue [x] Wed [ ] Thu [x] Fri
Time: [9:00 AM]
Ends: [After 12 occurrences]
Content: [Rotate 3 variations]
```

### Step 4: Timezone Handling
1. Display times in user's timezone
2. Show platform timezone if different
3. Account for DST changes
4. Store in UTC internally

```
Showing times in: Eastern Time (UTC-5)
Note: Your LinkedIn page is set to Pacific Time
```

### Step 5: Queue Management
Add to publishing queue:

1. Validate no conflicts
2. Reserve slot in queue
3. Set status to `scheduled`
4. Create calendar entry
5. Set up reminder notifications

### Step 6: Confirmation
Display scheduling confirmation:

```
Scheduled Successfully

Platform | Date | Time | Status
---------|------|------|-------
Twitter  | Mar 15 | 9:00 AM | Queued
LinkedIn | Mar 15 | 9:00 AM | Queued

[View in Calendar] [Schedule Another] [Edit Post]

Reminder set for 1 hour before publishing.
```

Emit event: `social.post.scheduled`

### Step 7: Related Posts (Optional)
Offer to schedule related content:

```
Want to schedule related posts?
[ ] Thread continuation (Twitter)
[ ] First comment (Instagram)
[ ] Follow-up reminder (LinkedIn)
[ ] Cross-platform version
```

## Queue Priority Rules

| Priority | Criteria |
|----------|----------|
| High | Campaign-related, time-sensitive |
| Normal | Standard scheduled content |
| Low | Evergreen, flexible timing |
| Fill | Use any available gap |

## Error Handling

| Error | Resolution |
|-------|------------|
| Time slot taken | Suggest next available |
| Past time selected | Show warning, block submit |
| Platform maintenance | Auto-adjust window |
| Rate limit approaching | Spread across day |

## Events Emitted
- `social.post.scheduled` - Post added to queue
- `social.post.rescheduled` - Time changed
- `social.queue.updated` - Queue modified

## Related Workflows
- `create-post` - Create content first
- `manage-calendar` - View all scheduled
- `bulk-schedule` - Schedule many at once
