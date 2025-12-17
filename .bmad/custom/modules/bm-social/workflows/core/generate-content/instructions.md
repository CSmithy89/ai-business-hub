# Generate Content Workflow

## Purpose
AI-generate social media content using the Spark (Content Strategist) agent with platform-specific adaptation.

## Context Variables
- `{{source_type}}` - Input type (topic, url, content, brand)
- `{{source_content}}` - The input content or URL
- `{{platforms}}` - Target platforms for generation
- `{{tone}}` - Desired content tone
- `{{brand_voice}}` - Brand voice guidelines

## Prerequisites
- BYOAI configured with content generation model
- Brand voice defined (optional but recommended)
- At least one platform connected

## Execution Steps

### Step 1: Content Source
Select input for content generation:

| Source Type | Description | Example |
|-------------|-------------|---------|
| Topic/Idea | Brief description | "New product launch tips" |
| URL | Article to summarize | "https://blog.example.com/post" |
| Existing Content | Adapt/improve | Previous post or document |
| Brand Prompt | Template-based | "Weekly tip format" |

For URL source:
1. Fetch and parse article
2. Extract key points
3. Identify quotable sections
4. Note author for attribution

### Step 2: Platform Selection
Choose target platforms with format hints:

```
Generate content for:
[x] Twitter - Short, punchy, 280 chars
[x] LinkedIn - Professional, 1000-1500 chars
[ ] Instagram - Visual-first, caption-style
[ ] Facebook - Conversational, longer form
[ ] TikTok - Script format, hook-first
```

### Step 3: Tone and Style
Select content characteristics:

**Tone Options:**
| Tone | Description | Best For |
|------|-------------|----------|
| Professional | Polished, authoritative | B2B, LinkedIn |
| Casual | Friendly, conversational | Twitter, Facebook |
| Educational | Informative, helpful | How-to content |
| Promotional | Sales-focused, CTA-heavy | Launches, offers |
| Thought Leadership | Opinionated, insightful | Personal brand |
| Entertaining | Humorous, engaging | Viral potential |

**Style Modifiers:**
- [ ] Include emojis
- [ ] Use bullet points
- [ ] Add questions for engagement
- [ ] Include statistics/data
- [ ] Personal storytelling

### Step 4: Additional Parameters
Configure generation settings:

```
Content Parameters:
Hashtags: [x] Include [3-5] relevant hashtags
CTA: [x] Include call-to-action
Length: [Medium - optimal for each platform]
Variations: [3] versions to generate
Language: [English]
```

### Step 5: AI Generation
Invoke Spark agent with parameters:

```javascript
{
  source: sourceContent,
  platforms: selectedPlatforms,
  tone: selectedTone,
  style: styleModifiers,
  brandVoice: brandGuidelines,
  variations: variationCount
}
```

Display generation progress:
```
Generating content...
[=====>          ] Analyzing source
[==========>     ] Creating variations
[===============>] Adapting for platforms
```

### Step 6: Review Variations
Present generated options:

```
VARIATION 1 (Recommended - 87% brand match)
-------------------------------------------
Twitter (276 chars):
"Just discovered the secret to 10x productivity.
Hint: it's not working harder.

Here's what top performers do differently:
(Thread)"

LinkedIn (1,247 chars):
"After interviewing 50+ executives, I noticed something
surprising about the most productive leaders...

[Full content preview]"

[Select] [Edit] [Regenerate]

VARIATION 2 (82% brand match)
-------------------------------------------
...
```

Show brand voice alignment score for each.

### Step 7: Edit and Refine
For selected variation:

1. Open in content editor
2. Enable inline editing
3. Show character counts
4. Offer refinement prompts:
   - "Make it shorter"
   - "Add more urgency"
   - "Include a question"
   - "Make it more casual"

### Step 8: Platform Adaptation
Auto-invoke platform specialists:

```
Platform Optimization:
- Chirp (Twitter): Added thread hooks, optimized hashtags
- Link (LinkedIn): Formatted for dwell time, added spacing
- Gram (Instagram): Moved hashtags to first comment
```

Show side-by-side comparisons.

### Step 9: Approval Submission
AI-generated content requires approval:

```
Content Review Required

This AI-generated content needs approval before publishing.

Brand Voice Score: 87%
Sensitivity Check: Passed
Originality Score: 94%

[Submit for Approval] [Save as Draft] [Cancel]
```

Create approval request with:
- Generated content
- Source attribution
- AI confidence scores
- Platform variations

## Brand Voice Guidelines

Check content against configured brand voice:
- Vocabulary alignment
- Tone consistency
- Avoided words/phrases
- Required elements

Flag deviations:
```
Brand Voice Alert:
- "Amazing" is on your avoided words list
- Suggested replacement: "Remarkable" or "Outstanding"
```

## Error Handling

| Error | Resolution |
|-------|------------|
| BYOAI not configured | Prompt to add API key |
| URL not accessible | Manual content input |
| Generation failed | Retry with simpler prompt |
| Low brand score | Offer manual refinement |

## Events Emitted
- `social.content.generating` - AI generation started
- `social.content.generated` - Content created
- `social.content.approved` - Ready for publishing

## Related Workflows
- `create-post` - Use generated content
- `content-repurpose` - Adapt existing content
- `bulk-schedule` - Schedule multiple variations
