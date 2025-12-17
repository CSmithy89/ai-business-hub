# Content Repurpose Workflow

## Purpose
Adapt existing content across multiple platforms with format-specific optimization using platform specialist agents.

## Context Variables
- `{{source_type}}` - Content source (blog, post, document, video)
- `{{source_url}}` - URL or reference to source
- `{{target_platforms}}` - Platforms to create content for
- `{{strategy}}` - Repurposing approach

## Prerequisites
- BYOAI configured for content adaptation
- At least one platform connected
- Source content accessible

## Execution Steps

### Step 1: Select Source Content
Choose content to repurpose:

| Source Type | Description | Example |
|-------------|-------------|---------|
| Blog Post | Article URL | company.com/blog/post |
| Social Post | Existing post | Previous high-performer |
| Document | PDF/Doc file | Whitepaper, guide |
| Video | Video transcript | YouTube, podcast |
| Newsletter | Email content | Past campaign |

```
SOURCE SELECTION

( ) Enter URL: [https://...]
(x) Select from posts: [Show library]
( ) Upload document: [Choose file]
( ) Paste content: [Text area]

Recently high-performing:
1. "10 Tips for Remote Work" - 12K engagements
2. "Product Launch Announcement" - 8.5K engagements
3. "Customer Success Story" - 6.2K engagements
```

### Step 2: Analyze Source
Parse and extract key elements:

```
CONTENT ANALYSIS

Source: "10 Tips for Remote Work" (Blog post)
URL: https://company.com/blog/remote-work-tips
Word Count: 1,850 words
Reading Time: 8 minutes

Key Elements Extracted:
- Main headline
- 10 numbered tips
- 3 key statistics
- 2 quotes
- 1 infographic
- Call-to-action

Repurposing Potential:
- Twitter thread: 10 tips = 10 tweets
- LinkedIn carousel: 10 slides + intro/outro
- Instagram carousel: Visual tips format
- TikTok: Quick tips video script
```

### Step 3: Choose Target Platforms
Select where to publish:

```
TARGET PLATFORMS

Source length: 1,850 words
Recommended formats:

[x] Twitter Thread (10 tweets)
    Each tip becomes one tweet

[x] LinkedIn Carousel (12 slides)
    Visual summary of tips

[x] Instagram Carousel (10 slides)
    Visual tips with design

[ ] TikTok Script (60 seconds)
    Quick top-3 tips

[ ] Facebook Post (condensed)
    Summary with link

[ ] YouTube Short (60 seconds)
    Animated tips
```

### Step 4: Select Repurposing Strategy
Choose adaptation approach:

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| Direct Adaptation | Minimal changes, platform-fit | News, announcements |
| Thread Breakdown | Split into series | Lists, tutorials |
| Quote Extraction | Pull key quotes | Thought leadership |
| Summary | Condense to highlights | Long-form content |
| Visual Transform | Text to graphics | Educational content |
| Angle Shift | New perspective | Evergreen content |

```
REPURPOSING STRATEGY

For each platform:
Twitter: [Thread Breakdown]
LinkedIn: [Visual Transform - Carousel]
Instagram: [Visual Transform - Carousel]

Content variations:
[x] Adapt tone per platform
[x] Customize hashtags
[x] Platform-specific CTAs
[ ] Change publish angle
```

### Step 5: Generate Platform Versions
Invoke platform specialists:

```
GENERATING CONTENT...

Chirp (Twitter): Creating 10-part thread...
Link (LinkedIn): Generating carousel slides...
Gram (Instagram): Adapting for visual format...

Progress: [===============>    ] 78%
```

### Step 6: Review Adaptations
Show side-by-side comparisons:

```
CONTENT PREVIEW

TWITTER THREAD (10 tweets)
--------------------------
1/10: "Remote work changed everything. After 3 years leading
      distributed teams, here are 10 tips that actually work:"

2/10: "Tip 1: Start with structure.
      Block your calendar before others do.
      Morning = deep work. Afternoon = meetings."
...

[Edit Thread] [Regenerate]

LINKEDIN CAROUSEL (12 slides)
-----------------------------
Slide 1: [Cover] "10 Remote Work Tips That Actually Work"
Slide 2: [Intro] "After 3 years leading distributed teams..."
Slide 3: [Tip 1] "Start with Structure" + visual
...
Slide 12: [CTA] "Follow for more productivity tips"

[Edit Slides] [Preview Mockup] [Regenerate]

INSTAGRAM CAROUSEL (10 slides)
------------------------------
...
```

### Step 7: Platform Optimization
Each specialist optimizes:

**Twitter (Chirp):**
- Hook optimization for first tweet
- Thread pacing (2-3 min spacing)
- Strategic hashtag placement (end)
- Reply-to-self formatting

**LinkedIn (Link):**
- Carousel text sizing
- White space for readability
- Dwell-time optimization
- CTA slide design

**Instagram (Gram):**
- Visual consistency
- Caption with first comment
- Hashtag set rotation
- Alt text for accessibility

### Step 8: Schedule Variations
Plan staggered publishing:

```
PUBLISHING SCHEDULE

Recommended stagger: 2-4 hours between platforms
(Allows cross-platform audience discovery)

Platform   | Date     | Time     | Reason
-----------|----------|----------|------------------
Twitter    | Mar 15   | 9:00 AM  | Highest engagement
LinkedIn   | Mar 15   | 11:00 AM | Business hours peak
Instagram  | Mar 15   | 1:00 PM  | Lunch break scroll

[ ] Auto-schedule with optimal times
[ ] Same time, same day
[ ] Custom schedule each

[Schedule All] [Save Drafts] [Edit Schedule]
```

### Step 9: Cross-Reference Tracking
Set up performance comparison:

```
PERFORMANCE TRACKING

Track as campaign: "Remote Work Tips - Repurposed"

Track metrics:
[x] Reach per platform
[x] Engagement rate comparison
[x] Click-through to source
[x] Time-to-peak engagement

Notify when:
[x] Any version reaches 1K engagements
[x] Performance comparison available (72 hours)
```

## Adaptation Templates

| Source Format | Best Adaptations |
|---------------|------------------|
| Long blog post | Thread, carousel, video script |
| List article | Thread, carousel, story series |
| Interview | Quote graphics, highlight clips |
| Case study | Testimonial posts, stats graphics |
| Tutorial | Step-by-step thread, how-to video |

## Quality Checks

- [ ] Source attribution maintained
- [ ] Key message preserved
- [ ] Platform limits respected
- [ ] Visuals appropriately sized
- [ ] CTAs platform-appropriate
- [ ] Hashtags researched per platform

## Error Handling

| Error | Resolution |
|-------|------------|
| URL not accessible | Manual content paste |
| Content too short | Suggest expansion |
| No visual content | Offer template graphics |
| Platform mismatch | Skip incompatible |

## Events Emitted
- `social.content.analyzing` - Source analysis started
- `social.content.repurposed` - Adaptations created
- `social.content.optimized` - Platform optimization done

## Related Workflows
- `generate-content` - Original content creation
- `bulk-schedule` - Schedule all variations
- `analyze-performance` - Compare performance
