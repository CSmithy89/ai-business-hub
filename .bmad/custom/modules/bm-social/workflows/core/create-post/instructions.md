# Create Post Workflow

## Purpose
Create and publish or schedule a social media post across one or more platforms.

## Context Variables
- `{{platforms}}` - Selected target platforms (array)
- `{{content}}` - Post content text
- `{{media}}` - Attached media files (array)
- `{{schedule_time}}` - Optional scheduled publish time
- `{{campaign_id}}` - Optional campaign association

## Prerequisites
- At least one platform connected
- User has posting permissions
- BYOAI configured for AI features

## Execution Steps

### Step 1: Platform Selection
Display connected platforms with multi-select:

```
Select Platforms:
[x] Twitter (@company) - 280 chars
[x] LinkedIn (Company Page) - 3000 chars
[ ] Instagram (Business) - 2200 chars
[ ] Facebook (Page) - 63,206 chars
```

Show character limits and media requirements for each.

### Step 2: Content Source
Choose how to create content:

| Option | Description |
|--------|-------------|
| Write from scratch | Open text editor |
| Use template | Select from saved templates |
| Repurpose existing | Adapt previous content |
| AI generate | Use Spark agent |

### Step 3: Content Editor
Open rich text editor with:
- Character counter per platform
- Emoji picker
- Mention autocomplete
- Hashtag suggestions
- Link shortener

Validate content against each platform's limits.

### Step 4: Media Attachment
Handle media uploads:

1. Accept images, videos, documents
2. Validate format per platform:
   - Twitter: 4 images or 1 video
   - LinkedIn: 9 images or 1 video
   - Instagram: 10 carousel or 1 reel
3. Auto-resize using `resize-media` task
4. Generate alt text suggestions (AI)

### Step 5: Platform-Specific Settings
For each platform, configure:

**Twitter:**
- Thread continuation
- Quote tweet reference
- Poll options

**LinkedIn:**
- First comment text
- Document title
- Article mode

**Instagram:**
- Cover frame selection
- Collab accounts
- Location tag

**General:**
- Hashtag placement
- Link in bio reminder
- Cross-post settings

### Step 6: Preview
Show native-looking preview for each platform:
- Render with actual formatting
- Show how links will appear
- Display media layout
- Highlight any warnings

### Step 7: Publishing Options
Select publish method:

| Method | Description |
|--------|-------------|
| Publish Now | Immediate posting |
| Schedule | Pick specific date/time |
| Optimal Queue | Tempo picks best time |
| Save Draft | Store for later |

For scheduling, validate against existing calendar.

### Step 8: Approval Routing
Calculate confidence score:
- Check brand voice alignment
- Verify hashtag appropriateness
- Scan for sensitive content
- Review media compliance

Route based on confidence:
- `>85%`: Auto-approve option
- `60-85%`: Quick approval
- `<60%`: Full review required

Submit to approval queue if needed.

### Step 9: Confirmation
On success:
```
Post Scheduled:
- Twitter: March 15, 2025 at 9:00 AM
- LinkedIn: March 15, 2025 at 9:00 AM

[View in Calendar] [Create Another] [Share Preview Link]
```

Emit event: `social.post.created`

## Validation Rules

| Rule | Platforms | Action |
|------|-----------|--------|
| Character limit | All | Block if exceeded |
| Media format | All | Convert or reject |
| Hashtag count | Instagram | Warn if >15 |
| Link in caption | Instagram | Warn (not clickable) |
| Video length | TikTok | Must be 15s-10min |

## Error Handling

| Error | Resolution |
|-------|------------|
| Media too large | Compress or reject |
| Platform offline | Queue for retry |
| Duplicate content | Warn user |
| Blocked hashtag | Remove and notify |

## Events Emitted
- `social.post.draft_created` - Draft saved
- `social.post.scheduled` - Post scheduled
- `social.post.published` - Post went live
- `social.post.failed` - Publishing failed

## Related Workflows
- `schedule-content` - Advanced scheduling options
- `generate-content` - AI content creation
- `content-repurpose` - Adapt existing content
